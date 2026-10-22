# -*- coding: utf-8 -*-
"""Tests de la phase 4 : matchs, transitions de statut, fuseaux horaires, API, recherche."""
import datetime

from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.db import IntegrityError, connection, transaction
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
from django.utils import timezone
from rest_framework import status as http
from rest_framework.test import APITestCase

from apps.sports.models import Competition, Sport, Team
from apps.users.models import CustomUser

from .models import Match, MatchEvent, MatchExternalId, MatchStatus

UTC = datetime.timezone.utc


def make_match(competition_slug="ligue-1", home="paris-saint-germain", away="olympique-de-marseille",
               kickoff=None, **extra):
    competition = Competition.objects.get(slug=competition_slug)
    season = competition.seasons.get(is_current=True)
    kickoff = kickoff or datetime.datetime(2026, 11, 1, 19, 0, tzinfo=UTC)
    return Match.objects.create(
        competition=competition,
        season=season,
        home_team=Team.objects.get(slug=home),
        away_team=Team.objects.get(slug=away),
        kickoff_at=kickoff,
        **extra,
    )


class MatchModelTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_teams", verbosity=0)

    def test_default_status_is_scheduled(self):
        match = make_match()
        self.assertEqual(match.status, MatchStatus.SCHEDULED)
        self.assertIsNone(match.score_home)

    def test_valid_transitions_are_accepted(self):
        match = make_match()
        for new_status, scores in (
            (MatchStatus.LIVE, (0, 0)),
            (MatchStatus.SUSPENDED, (1, 0)),
            (MatchStatus.LIVE, (1, 0)),
            (MatchStatus.FINISHED, (2, 1)),
        ):
            match.status = new_status
            match.score_home, match.score_away = scores
            match.save()
            match.refresh_from_db()
            self.assertEqual(match.status, new_status)

    def test_postponed_match_can_be_rescheduled(self):
        match = make_match()
        match.status = MatchStatus.POSTPONED
        match.save()
        match.refresh_from_db()
        match.status = MatchStatus.SCHEDULED
        match.save()

    def test_finished_match_cannot_go_back_to_live(self):
        match = make_match(status=MatchStatus.FINISHED, score_home=1, score_away=0)
        match = Match.objects.get(pk=match.pk)  # recharge depuis la base
        match.status = MatchStatus.LIVE
        with self.assertRaises(ValidationError) as ctx:
            match.save()
        self.assertIn("status", ctx.exception.message_dict)

    def test_cancelled_is_terminal(self):
        match = make_match(status=MatchStatus.CANCELLED)
        match = Match.objects.get(pk=match.pk)
        match.status = MatchStatus.SCHEDULED
        with self.assertRaises(ValidationError):
            match.save()

    def test_scheduled_cannot_jump_to_suspended(self):
        match = make_match()
        match = Match.objects.get(pk=match.pk)
        match.status = MatchStatus.SUSPENDED
        with self.assertRaises(ValidationError):
            match.save()

    def test_invalid_transition_is_rejected_even_when_saving_other_fields(self):
        match = make_match(status=MatchStatus.FINISHED, score_home=2, score_away=2)
        match = Match.objects.get(pk=match.pk)
        match.score_home = 3  # corriger le score d'un match termine reste permis
        match.save()
        self.assertEqual(Match.objects.get(pk=match.pk).score_home, 3)

    def test_scheduled_match_cannot_have_a_score(self):
        with self.assertRaises(ValidationError):
            make_match(score_home=1, score_away=0)

    def test_finished_match_needs_a_score(self):
        with self.assertRaises(ValidationError):
            make_match(status=MatchStatus.FINISHED)

    def test_both_scores_or_none(self):
        with self.assertRaises(ValidationError):
            make_match(status=MatchStatus.LIVE, score_home=1)

    def test_team_cannot_play_itself(self):
        with self.assertRaises(ValidationError):
            make_match(away="paris-saint-germain")

    def test_database_also_rejects_a_team_playing_itself(self):
        # bulk_create contourne save() : c'est la contrainte SQL qui protege.
        competition = Competition.objects.get(slug="ligue-1")
        psg = Team.objects.get(slug="paris-saint-germain")
        with self.assertRaises(IntegrityError), transaction.atomic():
            Match.objects.bulk_create([Match(
                competition=competition, season=competition.seasons.get(is_current=True),
                home_team=psg, away_team=psg,
                kickoff_at=datetime.datetime(2026, 11, 1, 19, tzinfo=UTC),
            )])

    def test_season_must_belong_to_the_competition(self):
        other = Competition.objects.get(slug="la-liga").seasons.get(is_current=True)
        competition = Competition.objects.get(slug="ligue-1")
        with self.assertRaises(ValidationError):
            Match.objects.create(
                competition=competition, season=other,
                home_team=Team.objects.get(slug="paris-saint-germain"),
                away_team=Team.objects.get(slug="olympique-de-marseille"),
                kickoff_at=datetime.datetime(2026, 11, 1, 19, tzinfo=UTC),
            )

    def test_teams_must_belong_to_the_competition_sport(self):
        basketball = Sport.objects.get(slug="basketball")
        stranger = Team.objects.create(sport=basketball, name="Lakers", slug="lakers")
        with self.assertRaises(ValidationError):
            make_match(away=stranger.slug)

    def test_naive_datetime_is_rejected(self):
        with self.assertRaises(ValidationError):
            make_match(kickoff=datetime.datetime(2026, 11, 1, 19, 0))

    def test_kickoff_is_stored_in_utc(self):
        paris = datetime.timezone(datetime.timedelta(hours=2))
        match = make_match(kickoff=datetime.datetime(2026, 11, 1, 21, 0, tzinfo=paris))
        match.refresh_from_db()
        self.assertEqual(match.kickoff_at.utcoffset(), datetime.timedelta(0))
        self.assertEqual(match.kickoff_at, datetime.datetime(2026, 11, 1, 19, 0, tzinfo=UTC))

    def test_same_fixture_cannot_be_created_twice(self):
        make_match()
        with self.assertRaises(IntegrityError), transaction.atomic():
            make_match()

    def test_external_id_is_unique_per_provider(self):
        first = make_match()
        second = make_match(away="as-monaco")
        MatchExternalId.objects.create(match=first, provider="API-Football", external_id=7)
        with self.assertRaises(IntegrityError), transaction.atomic():
            MatchExternalId.objects.create(match=second, provider="api-football", external_id="7")
        MatchExternalId.objects.create(match=second, provider="football-data", external_id="7")

    def test_event_team_must_play_the_match(self):
        match = make_match()
        event = MatchEvent(match=match, team=Team.objects.get(slug="arsenal"), minute=10, type="GOAL")
        with self.assertRaises(ValidationError):
            event.full_clean()


class MatchSeedTests(APITestCase):
    def test_seed_is_idempotent_and_covers_every_competition(self):
        call_command("seed_matches", verbosity=0)
        self.assertEqual(Match.objects.count(), 68)
        call_command("seed_matches", verbosity=0)
        self.assertEqual(Match.objects.count(), 68)
        for competition in Competition.objects.all():
            self.assertGreater(competition.matches.count(), 0, competition.name)

    def test_seed_has_matches_today_and_goal_events_match_scores(self):
        call_command("seed_matches", verbosity=0)
        today = timezone.now().astimezone(UTC).date()
        start = datetime.datetime.combine(today, datetime.time.min, tzinfo=UTC)
        self.assertGreater(
            Match.objects.filter(
                kickoff_at__gte=start, kickoff_at__lt=start + datetime.timedelta(days=1)
            ).count(), 0)
        finished = Match.objects.filter(status=MatchStatus.FINISHED).first()
        self.assertEqual(
            finished.events.filter(type="GOAL").count(), finished.score_home + finished.score_away
        )


class MatchApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_matches", verbosity=0)
        cls.user = CustomUser.objects.create_user(
            "m@x.com", "S3cure-pass-2026!", username="match-user", is_verified=True
        )

    def setUp(self):
        cache.clear()
        self.client.force_authenticate(self.user)
        self.url = reverse("match-list")

    # -- acces et pagination ---------------------------------------------------
    def test_requires_authentication(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get(self.url).status_code, http.HTTP_401_UNAUTHORIZED)

    def test_list_is_paginated_and_sorted_by_kickoff(self):
        r = self.client.get(self.url)
        self.assertEqual(r.data["count"], 68)
        self.assertEqual(len(r.data["results"]), 25)
        dates = [m["kickoff_at"] for m in r.data["results"]]
        self.assertEqual(dates, sorted(dates))

    def test_kickoff_is_serialised_in_utc(self):
        r = self.client.get(self.url)
        self.assertTrue(r.data["results"][0]["kickoff_at"].endswith("Z"))

    def test_ordering_descending(self):
        r = self.client.get(self.url, {"ordering": "-kickoff_at"})
        dates = [m["kickoff_at"] for m in r.data["results"]]
        self.assertEqual(dates, sorted(dates, reverse=True))

    # -- filtres -----------------------------------------------------------------
    def test_filter_by_competition_and_team_and_season(self):
        ligue1 = Competition.objects.get(slug="ligue-1")
        r = self.client.get(self.url, {"competition": str(ligue1.id)})
        self.assertEqual(r.data["count"], 12)
        psg = Team.objects.get(slug="paris-saint-germain")
        r = self.client.get(self.url, {"team": str(psg.id)})
        self.assertGreaterEqual(r.data["count"], 3)
        for m in r.data["results"]:
            self.assertIn(str(psg.id), (m["home_team"]["id"], m["away_team"]["id"]))
        season = ligue1.seasons.get(is_current=True)
        self.assertEqual(self.client.get(self.url, {"season": str(season.id)}).data["count"], 12)

    def test_filter_by_status_accepts_several_values(self):
        r = self.client.get(self.url, {"status": "finished,live"})
        self.assertTrue(all(m["status"] in ("FINISHED", "LIVE") for m in r.data["results"]))
        self.assertEqual(
            r.data["count"],
            Match.objects.filter(status__in=["FINISHED", "LIVE"]).count(),
        )

    def test_date_filter_uses_the_requested_timezone(self):
        # 23:30 UTC le 22/10 = 00:30 le 23/10 a Douala (UTC+1).
        competition = Competition.objects.get(slug="ligue-1")
        Match.objects.filter(competition=competition).delete()
        match = make_match(kickoff=datetime.datetime(2026, 10, 22, 23, 30, tzinfo=UTC))
        ids = lambda **p: [m["id"] for m in self.client.get(self.url, p).data["results"]]  # noqa: E731
        self.assertIn(str(match.id), ids(date="2026-10-22", tz="UTC"))
        self.assertNotIn(str(match.id), ids(date="2026-10-22", tz="Africa/Douala"))
        self.assertIn(str(match.id), ids(date="2026-10-23", tz="Africa/Douala"))

    def test_date_filter_defaults_to_the_profile_timezone(self):
        competition = Competition.objects.get(slug="ligue-1")
        Match.objects.filter(competition=competition).delete()
        match = make_match(kickoff=datetime.datetime(2026, 10, 22, 23, 30, tzinfo=UTC))
        self.user.timezone = "Africa/Douala"
        self.client.force_authenticate(self.user)
        got = [m["id"] for m in self.client.get(self.url, {"date": "2026-10-23"}).data["results"]]
        self.assertIn(str(match.id), got)

    def test_today_returns_seeded_matches(self):
        today = timezone.now().astimezone(UTC).date().isoformat()
        r = self.client.get(self.url, {"date": today, "tz": "UTC"})
        self.assertGreaterEqual(r.data["count"], 20)

    def test_invalid_parameters_return_400(self):
        for params in (
            {"date": "22/10/2026"}, {"date": "2026-10-22", "tz": "Mars/Olympus"},
            {"status": "UNKNOWN"}, {"competition": "nope"}, {"team": "nope"},
            {"season": "nope"}, {"ordering": "score"},
        ):
            r = self.client.get(self.url, params)
            self.assertEqual(r.status_code, http.HTTP_400_BAD_REQUEST, params)

    def test_inactive_sport_hides_matches(self):
        Sport.objects.filter(slug="football").update(is_active=False)
        self.assertEqual(self.client.get(self.url).data["count"], 0)

    # -- detail -----------------------------------------------------------------
    def test_detail_has_events_venue_and_teams(self):
        match = Match.objects.filter(status=MatchStatus.FINISHED, score_home__gt=0).first()
        r = self.client.get(reverse("match-detail", args=[match.id]))
        self.assertEqual(r.status_code, http.HTTP_200_OK)
        self.assertEqual(r.data["id"], str(match.id))
        self.assertEqual(len(r.data["events"]), match.events.count())
        self.assertIn("name", r.data["venue"])
        self.assertIn("referee", r.data)
        minutes = [e["minute"] for e in r.data["events"]]
        self.assertEqual(minutes, sorted(minutes))

    def test_detail_404_for_unknown_or_invalid_id(self):
        self.assertEqual(
            self.client.get(reverse("match-detail", args=["00000000-0000-0000-0000-000000000000"])).status_code, 404)
        self.assertEqual(self.client.get(self.url + "abc/").status_code, 404)

    def test_list_does_not_run_one_query_per_match(self):
        with CaptureQueriesContext(connection) as ctx:
            self.client.get(self.url)
        self.assertLessEqual(len(ctx.captured_queries), 6)

    # -- recherche -----------------------------------------------------------------
    def test_search_requires_two_characters(self):
        r = self.client.get(reverse("search"), {"q": "a"})
        self.assertEqual(r.status_code, http.HTTP_400_BAD_REQUEST)

    def test_search_finds_teams_competitions_and_matches(self):
        r = self.client.get(reverse("search"), {"q": "paris"})
        self.assertEqual(r.status_code, http.HTTP_200_OK)
        self.assertEqual([t["name"] for t in r.data["teams"]], ["Paris Saint-Germain"])
        self.assertGreaterEqual(len(r.data["matches"]), 1)
        r = self.client.get(reverse("search"), {"q": "ligue"})
        self.assertGreaterEqual(len(r.data["competitions"]), 2)
        self.assertLessEqual(len(r.data["matches"]), 5)

    def test_search_requires_authentication(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get(reverse("search"), {"q": "paris"}).status_code, 401)

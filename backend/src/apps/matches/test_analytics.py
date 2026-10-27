# -*- coding: utf-8 -*-
"""Tests de la phase 6 : statistiques de match, forme sur 5/10/20 matchs et H2H."""
import datetime

from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.db import IntegrityError, connection, transaction
from django.test import TestCase
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
from django.utils import timezone
from rest_framework import status as http
from rest_framework.test import APITestCase

from apps.providers import jobs
from apps.providers import tests as ptests
from apps.providers.data_providers.api_football import normalize_statistics
from apps.sports.models import Competition, Team
from apps.users.models import CustomUser

from .form import compute_form, team_form
from .h2h import compute_h2h, head_to_head
from .models import Match, MatchExternalId, MatchStat, MatchStatus
from .stat_schemas import validate_stats
from .tasks import update_form_cache

UTC = datetime.timezone.utc
BASE = datetime.datetime(2026, 3, 1, 19, 0, tzinfo=UTC)


class Dataset:
    """Huit matchs termines de l'equipe X (PSG) dont le resultat est connu a l'avance."""

    # (jour, X joue a domicile ?, adversaire, buts X, buts adversaire)
    ROWS = [
        (1, True, "Y", 2, 0), (2, False, "Z", 1, 1), (3, True, "Z", 0, 1), (4, False, "Y", 3, 1),
        (5, True, "Y", 2, 2), (6, False, "Z", 0, 0), (7, True, "Z", 4, 0), (8, False, "Y", 1, 2),
    ]

    @classmethod
    def build(cls):
        call_command("seed_teams", verbosity=0)
        cls.x = Team.objects.get(slug="paris-saint-germain")
        cls.y = Team.objects.get(slug="olympique-de-marseille")
        cls.z = Team.objects.get(slug="as-monaco")
        cls.ligue1 = Competition.objects.get(slug="ligue-1")
        cls.season = cls.ligue1.seasons.get(is_current=True)
        cls.matches = {}
        for day, home, opponent, gx, go in cls.ROWS:
            other = cls.y if opponent == "Y" else cls.z
            cls.matches[day] = cls.make(day, cls.x if home else other, other if home else cls.x,
                                        gx if home else go, go if home else gx)

    @classmethod
    def make(cls, day, home, away, score_home, score_away, status=MatchStatus.FINISHED, competition=None):
        competition = competition or cls.ligue1
        scores = {} if status in ("SCHEDULED", "POSTPONED", "CANCELLED") else {
            "score_home": score_home, "score_away": score_away}
        return Match.objects.create(
            competition=competition, season=competition.seasons.get(is_current=True),
            home_team=home, away_team=away, kickoff_at=BASE + datetime.timedelta(days=day),
            status=status, **scores,
        )


class FormTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        Dataset.build()

    def setUp(self):
        cache.clear()
        self.x = Dataset.x

    def test_overall_form_on_a_known_dataset(self):
        form = compute_form(self.x.id)["overall"]
        five = form["5"]
        self.assertEqual(five["results"], ["L", "W", "D", "D", "W"])  # plus recent d'abord
        self.assertEqual((five["played"], five["wins"], five["draws"], five["losses"]), (5, 2, 2, 1))
        self.assertEqual((five["points"], five["points_per_match"]), (8, 1.6))
        self.assertEqual((five["goals_for"], five["goals_against"], five["goal_difference"]), (10, 5, 5))
        self.assertEqual((five["clean_sheets"], five["failed_to_score"], five["btts"], five["over_2_5"]), (2, 1, 3, 4))
        self.assertEqual(five["streak"], {"type": "L", "length": 1})
        self.assertTrue(five["complete"])

    def test_short_history_is_flagged_incomplete(self):
        ten = compute_form(self.x.id)["overall"]["10"]
        self.assertEqual((ten["played"], ten["complete"]), (8, False))
        self.assertEqual((ten["wins"], ten["draws"], ten["losses"], ten["points"]), (3, 3, 2, 12))
        self.assertEqual((ten["goals_for"], ten["goals_against"]), (13, 7))
        self.assertEqual(compute_form(self.x.id)["overall"]["20"]["played"], 8)

    def test_home_and_away_are_separate(self):
        form = compute_form(self.x.id)
        home, away = form["home"]["5"], form["away"]["5"]
        self.assertEqual((home["played"], home["results"], home["points"]), (4, ["W", "D", "L", "W"], 7))
        self.assertEqual((away["played"], away["results"], away["points"]), (4, ["L", "D", "W", "D"], 5))

    def test_only_finished_matches_count(self):
        y, z = Dataset.y, Dataset.z
        for offset, status in enumerate(("SCHEDULED", "POSTPONED", "CANCELLED")):
            Dataset.make(20 + offset, self.x, y, None, None, status=status)
        live = Dataset.make(21, self.x, z, 3, 0, status=MatchStatus.LIVE)
        self.assertEqual(live.status, "LIVE")
        self.assertEqual(compute_form(self.x.id)["overall"]["20"]["played"], 8)

    def test_no_look_ahead_before_is_strict(self):
        before = Dataset.matches[5].kickoff_at  # le match du jour 5 lui-meme est exclu
        form = compute_form(self.x.id, before=before)["overall"]["20"]
        self.assertEqual(form["played"], 4)
        self.assertEqual(form["results"], ["W", "L", "D", "W"])
        self.assertEqual(compute_form(self.x.id, before=BASE)["overall"]["5"]["played"], 0)

    def test_empty_history_has_no_division_by_zero(self):
        stranger = Team.objects.get(slug="arsenal")
        five = compute_form(stranger.id)["overall"]["5"]
        self.assertEqual((five["played"], five["points_per_match"], five["avg_goals_for"]), (0, None, None))
        self.assertEqual(five["streak"], {"type": None, "length": 0})

    def test_competition_filter(self):
        cl = Competition.objects.get(slug="champions-league")
        Dataset.make(30, self.x, Dataset.y, 5, 0, competition=cl)
        self.assertEqual(compute_form(self.x.id)["overall"]["20"]["played"], 9)
        self.assertEqual(compute_form(self.x.id, competition_id=Dataset.ligue1.id)["overall"]["20"]["played"], 8)
        self.assertEqual(compute_form(self.x.id, competition_id=cl.id)["overall"]["20"]["played"], 1)

    def test_naive_before_is_refused(self):
        with self.assertRaises(ValueError):
            team_form(self.x.id, before=datetime.datetime(2026, 4, 1))

    def test_second_call_is_served_from_cache_without_sql(self):
        team_form(self.x.id)
        with CaptureQueriesContext(connection) as ctx:
            team_form(self.x.id)
        self.assertEqual(len(ctx.captured_queries), 0)

    def test_cache_is_invalidated_when_a_new_match_finishes(self):
        self.assertEqual(team_form(self.x.id)["overall"]["5"]["results"][0], "L")
        Dataset.make(9, self.x, Dataset.y, 4, 0)
        self.assertEqual(team_form(self.x.id)["overall"]["5"]["results"][0], "W")

    def test_cache_is_invalidated_by_a_score_correction_and_a_deletion(self):
        team_form(self.x.id)
        match = Match.objects.get(pk=Dataset.matches[8].pk)  # x a l'exterieur : 1-2
        match.score_home, match.score_away = 3, 0  # X (a l'exterieur) n'a finalement marque aucun but
        match.save()
        self.assertEqual(team_form(self.x.id)["overall"]["5"]["goals_for"], 9)  # 10 - 1 + 0
        Match.objects.get(pk=Dataset.matches[8].pk).delete()
        self.assertEqual(team_form(self.x.id)["overall"]["5"]["results"][0], "W")

    def test_a_scheduled_match_does_not_invalidate_the_cache(self):
        team_form(self.x.id)
        Dataset.make(40, self.x, Dataset.y, None, None, status="SCHEDULED")
        with CaptureQueriesContext(connection) as ctx:
            team_form(self.x.id)
        self.assertEqual(len(ctx.captured_queries), 0)

    def test_warming_task_precomputes_the_form_shown_on_the_match_page(self):
        soon = Match.objects.create(
            competition=Dataset.ligue1, season=Dataset.season, home_team=self.x, away_team=Dataset.y,
            kickoff_at=timezone.now() + datetime.timedelta(hours=5))
        cache.clear()
        self.assertEqual(update_form_cache()["warmed"], 2)
        with CaptureQueriesContext(connection) as ctx:
            team_form(self.x.id, soon.kickoff_at)
            team_form(Dataset.y.id, soon.kickoff_at)
        self.assertEqual(len(ctx.captured_queries), 0)


class H2HTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        Dataset.build()

    def setUp(self):
        cache.clear()

    def test_summary_on_a_known_dataset(self):
        h2h = compute_h2h(Dataset.x.id, Dataset.y.id)
        s = h2h["summary"]
        self.assertEqual((s["played"], s["wins_a"], s["draws"], s["wins_b"]), (4, 2, 1, 1))
        self.assertEqual((s["goals_a"], s["goals_b"], s["avg_goals_per_match"]), (8, 5, 3.25))
        self.assertEqual((s["btts"], s["over_2_5"]), (3, 3))
        # plus recent d'abord : j8 (Y 2-1 X), j5 (X 2-2 Y), j4 (Y 1-3 X), j1 (X 2-0 Y)
        self.assertEqual([m["score_home"] for m in h2h["matches"]], [2, 2, 1, 2])

    def test_symmetry(self):
        a = compute_h2h(Dataset.x.id, Dataset.y.id)
        b = compute_h2h(Dataset.y.id, Dataset.x.id)
        self.assertEqual([m["id"] for m in a["matches"]], [m["id"] for m in b["matches"]])
        sa, sb = a["summary"], b["summary"]
        self.assertEqual((sa["wins_a"], sa["wins_b"]), (sb["wins_b"], sb["wins_a"]))
        self.assertEqual((sa["goals_a"], sa["goals_b"]), (sb["goals_b"], sb["goals_a"]))
        for key in ("played", "draws", "avg_goals_per_match", "btts", "over_2_5", "low_sample"):
            self.assertEqual(sa[key], sb[key], key)

    def test_low_sample_is_flagged_and_disappears_with_five_meetings(self):
        s = compute_h2h(Dataset.x.id, Dataset.y.id)["summary"]
        self.assertTrue(s["low_sample"])
        self.assertIn("faible significativite", s["warning"])
        Dataset.make(9, Dataset.x, Dataset.y, 1, 0)
        s = compute_h2h(Dataset.x.id, Dataset.y.id)["summary"]
        self.assertEqual((s["played"], s["low_sample"], s["warning"]), (5, False, ""))

    def test_before_excludes_the_match_itself_and_later_ones(self):
        h2h = compute_h2h(Dataset.x.id, Dataset.y.id, before=Dataset.matches[5].kickoff_at)
        self.assertEqual(h2h["summary"]["played"], 2)  # jours 1 et 4

    def test_limit_keeps_the_most_recent_meetings(self):
        h2h = compute_h2h(Dataset.x.id, Dataset.y.id, limit=2)
        self.assertEqual(h2h["summary"]["played"], 2)
        self.assertEqual([m["kickoff_at"][:10] for m in h2h["matches"]], ["2026-03-09", "2026-03-06"])

    def test_no_meeting_gives_an_empty_summary(self):
        s = compute_h2h(Dataset.y.id, Dataset.z.id)["summary"]
        self.assertEqual((s["played"], s["avg_goals_per_match"], s["low_sample"]), (0, None, True))

    def test_unfinished_meetings_are_ignored_and_cache_is_used(self):
        Dataset.make(50, Dataset.x, Dataset.y, None, None, status="SCHEDULED")
        self.assertEqual(head_to_head(Dataset.x.id, Dataset.y.id)["summary"]["played"], 4)
        with CaptureQueriesContext(connection) as ctx:
            head_to_head(Dataset.x.id, Dataset.y.id)
        self.assertEqual(len(ctx.captured_queries), 0)


class MatchStatModelTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        Dataset.build()

    def setUp(self):
        self.match = Dataset.matches[1]

    def test_valid_statistics_are_saved(self):
        stat = MatchStat.objects.create(match=self.match, team=Dataset.x,
                                        stats={"possession": 61, "shots_total": 14, "expected_goals": 1.8})
        stat.refresh_from_db()
        self.assertEqual(stat.stats["possession"], 61)
        self.assertEqual(stat.stats["expected_goals"], 1.8)

    def test_invalid_statistics_are_refused(self):
        for bad in ({"inconnue": 3}, {"possession": 130}, {"possession": -1}, {"corners": "beaucoup"},
                    {"corners": True}, {"shots_total": 3.5}, {"expected_goals": 99}, "pas un objet"):
            with self.assertRaises(ValidationError, msg=str(bad)):
                MatchStat.objects.create(match=self.match, team=Dataset.x, stats=bad)

    def test_team_must_play_the_match(self):
        with self.assertRaises(ValidationError):
            MatchStat.objects.create(match=self.match, team=Team.objects.get(slug="arsenal"), stats={"corners": 3})

    def test_one_row_per_team_and_match(self):
        MatchStat.objects.create(match=self.match, team=Dataset.x, stats={"corners": 3})
        with self.assertRaises(IntegrityError), transaction.atomic():
            MatchStat.objects.create(match=self.match, team=Dataset.x, stats={"corners": 4})

    def test_unknown_sport_has_no_schema(self):
        with self.assertRaises(ValidationError):
            validate_stats("tennis", {"aces": 3})

    def test_normalizer_converts_percentages_and_drops_missing_values(self):
        item = {"statistics": [
            {"team": {"id": 10}, "statistics": [
                {"type": "Ball Possession", "value": "61%"}, {"type": "Total Shots", "value": 14},
                {"type": "Shots on Goal", "value": None}, {"type": "expected_goals", "value": "1.83"},
                {"type": "Passes %", "value": "88%"}, {"type": "Goals prevented", "value": 0.4}]},
            {"team": {"id": 11}, "statistics": []},
        ]}
        self.assertEqual(normalize_statistics(item), {"10": {
            "possession": 61, "shots_total": 14, "expected_goals": 1.83, "pass_accuracy": 88}})


class AnalyticsApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        Dataset.build()
        cls.user = CustomUser.objects.create_user("a@x.com", "S3cure-pass-2026!", username="ana-user", is_verified=True)

    def setUp(self):
        cache.clear()
        self.client.force_authenticate(self.user)

    # -- /teams/{id}/form/ ----------------------------------------------------------
    def test_team_form_endpoint(self):
        r = self.client.get(reverse("team-form", args=[Dataset.x.id]))
        self.assertEqual(r.status_code, http.HTTP_200_OK)
        self.assertEqual(r.data["windows"], [5, 10, 20])
        self.assertEqual(r.data["overall"]["5"]["results"], ["L", "W", "D", "D", "W"])
        self.assertEqual(set(r.data), {"team", "as_of", "competition", "windows", "overall", "home", "away"})

    def test_team_form_before_and_competition_parameters(self):
        before = Dataset.matches[5].kickoff_at.isoformat().replace("+00:00", "Z")
        r = self.client.get(reverse("team-form", args=[Dataset.x.id]), {"before": before})
        self.assertEqual(r.data["overall"]["20"]["played"], 4)
        r = self.client.get(reverse("team-form", args=[Dataset.x.id]), {"competition": str(Dataset.ligue1.id)})
        self.assertEqual(r.data["overall"]["20"]["played"], 8)

    def test_team_form_invalid_parameters(self):
        url = reverse("team-form", args=[Dataset.x.id])
        for params in ({"before": "hier"}, {"before": "2026-03-05T10:00:00"}, {"competition": "nope"}):
            self.assertEqual(self.client.get(url, params).status_code, 400, params)
        self.assertEqual(self.client.get(reverse("team-form", args=["00000000-0000-0000-0000-000000000000"])).status_code, 404)

    # -- /matches/{id}/form|h2h|stats/ ------------------------------------------------
    def test_match_form_is_computed_at_kickoff_without_future_data(self):
        r = self.client.get(reverse("match-form", args=[Dataset.matches[5].id]))
        self.assertEqual(r.status_code, http.HTTP_200_OK)
        self.assertEqual(r.data["home_team"]["overall"]["20"]["played"], 4)  # jours 1 a 4 seulement
        self.assertEqual(r.data["away_team"]["overall"]["20"]["played"], 2)  # Y n'avait joue que les jours 1 et 4
        self.assertTrue(r.data["as_of"].endswith("Z"))

    def test_match_h2h_only_uses_meetings_before_the_match(self):
        r = self.client.get(reverse("match-h2h", args=[Dataset.matches[5].id]))
        self.assertEqual(r.data["summary"]["played"], 2)
        self.assertIn("faible significativite", r.data["summary"]["warning"])
        self.assertEqual(r.data["team_a"], str(Dataset.x.id))  # equipe a domicile de CE match

    def test_match_h2h_limit(self):
        url = reverse("match-h2h", args=[Dataset.matches[8].id])
        self.assertEqual(len(self.client.get(url, {"limit": 2}).data["matches"]), 2)
        for bad in ("0", "21", "x"):
            self.assertEqual(self.client.get(url, {"limit": bad}).status_code, 400, bad)

    def test_match_stats_empty_then_available(self):
        match = Dataset.matches[1]
        r = self.client.get(reverse("match-stats", args=[match.id]))
        self.assertEqual((r.data["available"], r.data["home"], r.data["away"]), (False, None, None))
        MatchStat.objects.create(match=match, team=match.home_team, stats={"possession": 58})
        MatchStat.objects.create(match=match, team=match.away_team, stats={"possession": 42})
        r = self.client.get(reverse("match-stats", args=[match.id]))
        self.assertTrue(r.data["available"])
        self.assertEqual((r.data["home"]["possession"], r.data["away"]["possession"]), (58, 42))

    # -- /h2h/ ---------------------------------------------------------------------
    def test_h2h_endpoint_is_symmetric(self):
        url = reverse("h2h")
        a = self.client.get(url, {"team_a": str(Dataset.x.id), "team_b": str(Dataset.y.id)}).data
        b = self.client.get(url, {"team_a": str(Dataset.y.id), "team_b": str(Dataset.x.id)}).data
        self.assertEqual(a["summary"]["wins_a"], b["summary"]["wins_b"])
        self.assertEqual(a["summary"]["played"], 4)

    def test_h2h_endpoint_validation(self):
        url, x, y = reverse("h2h"), str(Dataset.x.id), str(Dataset.y.id)
        self.assertEqual(self.client.get(url, {"team_a": x, "team_b": x}).status_code, 400)
        self.assertEqual(self.client.get(url, {"team_a": "nope", "team_b": y}).status_code, 400)
        self.assertEqual(self.client.get(url, {"team_a": x}).status_code, 400)
        self.assertEqual(self.client.get(url, {"team_a": x, "team_b": y, "before": "2026-03-05T10:00:00"}).status_code, 400)
        self.assertEqual(self.client.get(url, {"team_a": x, "team_b": "00000000-0000-0000-0000-000000000000"}).status_code, 404)

    def test_everything_requires_authentication(self):
        self.client.force_authenticate(None)
        for url in (reverse("team-form", args=[Dataset.x.id]), reverse("match-form", args=[Dataset.matches[1].id]),
                    reverse("match-h2h", args=[Dataset.matches[1].id]), reverse("match-stats", args=[Dataset.matches[1].id]),
                    reverse("h2h")):
            self.assertEqual(self.client.get(url).status_code, 401, url)


class StatisticsSyncTests(ptests.ProviderTestCase):
    """Les statistiques arrivent avec les evenements : meme requete, aucun cout supplementaire."""

    def _finished_match(self):
        call_command("seed_teams", verbosity=0)
        home = Team.objects.create(sport=self.ligue1.sport, name="Dom", slug="dom")
        away = Team.objects.create(sport=self.ligue1.sport, name="Ext", slug="ext")
        from apps.sports.models import TeamExternalId
        TeamExternalId.objects.create(team=home, provider="api-football", external_id="10")
        TeamExternalId.objects.create(team=away, provider="api-football", external_id="11")
        match = Match.objects.create(
            competition=self.ligue1, season=self.ligue1.seasons.get(is_current=True), home_team=home, away_team=away,
            kickoff_at=timezone.now() - datetime.timedelta(hours=6), status="FINISHED", score_home=2, score_away=1)
        MatchExternalId.objects.create(match=match, provider="api-football", external_id="700")
        return match

    def _payload(self, stats_home, stats_away):
        item = ptests.fixture_item(700, home=(10, "Dom"), away=(11, "Ext"), short="FT", goals=(2, 1))
        item["statistics"] = [
            {"team": {"id": 10}, "statistics": stats_home},
            {"team": {"id": 11}, "statistics": stats_away},
        ]
        return [item]

    def test_details_job_stores_statistics_in_the_same_request(self):
        match = self._finished_match()
        self.transport.set("fixtures", self._payload(
            [{"type": "Ball Possession", "value": "57%"}, {"type": "Total Shots", "value": 12}],
            [{"type": "Ball Possession", "value": "43%"}, {"type": "Corner Kicks", "value": 3}]))
        stats = self.stats_of(jobs.sync_details_job)
        self.assertEqual(len(self.transport.calls), 1)
        self.assertEqual(stats["stats_synced"], 2)
        by_team = {s.team.slug: s.stats for s in MatchStat.objects.filter(match=match)}
        self.assertEqual(by_team["dom"], {"possession": 57, "shots_total": 12})
        self.assertEqual(by_team["ext"], {"possession": 43, "corners": 3})

    def test_statistics_are_not_fetched_twice(self):
        self._finished_match()
        self.transport.set("fixtures", self._payload([{"type": "Total Shots", "value": 12}], []))
        self.stats_of(jobs.sync_details_job)
        again = self.stats_of(jobs.sync_details_job)
        self.assertEqual(len(self.transport.calls), 1)
        self.assertIn("aucun match termine", again["skipped"])

    def test_invalid_values_are_rejected_not_stored(self):
        match = self._finished_match()
        self.transport.set("fixtures", self._payload([{"type": "Ball Possession", "value": "180%"}], []))
        stats = self.stats_of(jobs.sync_details_job)
        self.assertEqual(stats["rejected"], 1)
        self.assertFalse(MatchStat.objects.filter(match=match).exists())

    def test_history_backfill_is_a_deliberate_choice(self):
        match = self._finished_match()
        Match.objects.filter(pk=match.pk).update(kickoff_at=timezone.now() - datetime.timedelta(days=400))
        self.transport.set("fixtures", self._payload([{"type": "Total Shots", "value": 9}], []))
        self.assertIn("aucun match", self.stats_of(jobs.sync_details_job)["skipped"])  # 7 jours par defaut
        self.assertEqual(self.transport.calls, [])
        stats = self.stats_of(jobs.sync_details_job, max_age_days=9999, batches=3)
        self.assertEqual((len(self.transport.calls), stats["stats_synced"]), (1, 1))

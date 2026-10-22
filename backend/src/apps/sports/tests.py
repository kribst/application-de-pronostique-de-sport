# Tests de l'app sports — roadmap phase 2.
# Fichier volontairement vide pour l'instant.
# -*- coding: utf-8 -*-
from django.core.cache import cache
from django.core.management import call_command
from django.db import IntegrityError, connection, transaction
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import CustomUser

from .models import (
    Competition,
    Season,
    Sport,
    Team,
    TeamExternalId,
    TeamSeasonStat,
)


class SeedTests(APITestCase):
    def test_seed_is_idempotent(self):
        call_command("seed_football", verbosity=0)
        before = (Sport.objects.count(), Competition.objects.count(), Season.objects.count())
        call_command("seed_football", verbosity=0)
        after = (Sport.objects.count(), Competition.objects.count(), Season.objects.count())
        self.assertEqual(before, after)
        self.assertEqual(before, (15, 7, 7))

    def test_only_one_current_season_per_competition(self):
        call_command("seed_football", verbosity=0)
        comp = Competition.objects.get(slug="ligue-1")
        with self.assertRaises(IntegrityError), transaction.atomic():
            Season.objects.create(competition=comp, year_start=2025, year_end=2026, is_current=True)


class ReferentialApiTests(APITestCase):
    def setUp(self):
        cache.clear()
        call_command("seed_football", verbosity=0)
        self.user = CustomUser.objects.create_user(
            "sports@x.com", "S3cure-pass-2026!", username="sports-test"
        )
        self.client.force_authenticate(self.user)

    def test_requires_authentication(self):
        self.client.force_authenticate(None)
        r = self.client.get(reverse("sport-list"))
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_sports_list_flags_inactive_sports(self):
        r = self.client.get(reverse("sport-list"))
        by_slug = {s["slug"]: s for s in r.data["results"]}
        self.assertTrue(by_slug["football"]["is_active"])
        self.assertFalse(by_slug["basketball"]["is_active"])

    def test_competitions_filter_by_country(self):
        r = self.client.get(reverse("competition-list"), {"country": "fra"})
        self.assertEqual([c["name"] for c in r.data["results"]], ["Ligue 1"])

    def test_competitions_list_has_seven_with_current_season(self):
        r = self.client.get(reverse("competition-list"), {"sport": "football"})
        self.assertEqual(r.data["count"], 7)
        self.assertEqual(r.data["results"][0]["current_season"]["label"], "2026/2027")

    def test_inactive_sport_hides_its_competitions(self):
        Sport.objects.filter(slug="football").update(is_active=False)
        r = self.client.get(reverse("competition-list"))
        self.assertEqual(r.data["count"], 0)

    def test_competition_detail_includes_seasons(self):
        comp = Competition.objects.get(slug="serie-a")
        r = self.client.get(reverse("competition-detail", args=[comp.pk]))
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(len(r.data["seasons"]), 1)

    def test_sport_markets(self):
        football = Sport.objects.get(slug="football")
        r = self.client.get(reverse("sport-markets", args=[football.pk]))
        self.assertIn("1X2", [m["market_type"] for m in r.data])


class ExtraFiltersTests(APITestCase):
    def setUp(self):
        cache.clear()
        call_command("seed_football", verbosity=0)
        self.client.force_authenticate(
            CustomUser.objects.create_user("f@x.com", "S3cure-pass-2026!", username="f-test")
        )

    def test_search_by_name(self):
        r = self.client.get(reverse("competition-list"), {"search": "ligue"})
        self.assertTrue(all("ligue" in c["name"].lower() for c in r.data["results"]))
        self.assertGreaterEqual(r.data["count"], 1)

    def test_filter_by_tier(self):
        r = self.client.get(reverse("competition-list"), {"tier": "1"})
        self.assertTrue(all(c["tier"] == 1 for c in r.data["results"]))


class TeamSeedAndConstraintTests(APITestCase):
    def setUp(self):
        call_command("seed_teams", verbosity=0)
        self.football = Sport.objects.get(slug="football")

    def test_seed_is_idempotent(self):
        before = (Team.objects.count(), TeamSeasonStat.objects.count())
        call_command("seed_teams", verbosity=0)
        self.assertEqual(before, (Team.objects.count(), TeamSeasonStat.objects.count()))
        self.assertEqual(before, (40, 56))

    def test_every_seeded_competition_has_teams(self):
        for competition in Competition.objects.all():
            season = competition.seasons.get(is_current=True)
            self.assertGreater(season.team_stats.count(), 0, competition.name)

    def test_every_seeded_team_has_a_short_code(self):
        self.assertFalse(Team.objects.filter(short_name="").exists())

    def test_team_slug_is_unique_per_sport(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            Team.objects.create(sport=self.football, name="Autre Arsenal", slug="arsenal")

    def test_external_id_is_unique_per_provider(self):
        arsenal = Team.objects.get(slug="arsenal")
        chelsea = Team.objects.get(slug="chelsea")
        TeamExternalId.objects.create(team=arsenal, provider="API-Football", external_id=42)
        with self.assertRaises(IntegrityError), transaction.atomic():
            TeamExternalId.objects.create(team=chelsea, provider="api-football", external_id="42")

    def test_same_external_id_is_allowed_for_another_provider(self):
        arsenal = Team.objects.get(slug="arsenal")
        chelsea = Team.objects.get(slug="chelsea")
        TeamExternalId.objects.create(team=arsenal, provider="api-football", external_id="42")
        other = TeamExternalId.objects.create(team=chelsea, provider="football-data", external_id="42")
        self.assertEqual(other.provider, "football-data")

    def test_team_has_one_external_id_per_provider(self):
        arsenal = Team.objects.get(slug="arsenal")
        TeamExternalId.objects.create(team=arsenal, provider="api-football", external_id="42")
        with self.assertRaises(IntegrityError), transaction.atomic():
            TeamExternalId.objects.create(team=arsenal, provider="api-football", external_id="43")

    def test_team_season_stat_is_unique(self):
        stat = TeamSeasonStat.objects.first()
        with self.assertRaises(IntegrityError), transaction.atomic():
            TeamSeasonStat.objects.create(team=stat.team, season=stat.season)


class TeamApiTests(APITestCase):
    def setUp(self):
        cache.clear()
        call_command("seed_teams", verbosity=0)
        self.user = CustomUser.objects.create_user(
            "teams@x.com", "S3cure-pass-2026!", username="teams-test"
        )
        self.client.force_authenticate(self.user)
        self.url = reverse("team-list")

    def test_requires_authentication(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_is_paginated(self):
        r = self.client.get(self.url)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data["count"], 40)
        self.assertEqual(len(r.data["results"]), 25)

    def test_filter_by_competition_uses_current_season(self):
        ligue1 = Competition.objects.get(slug="ligue-1")
        r = self.client.get(self.url, {"competition": str(ligue1.id)})
        self.assertEqual(r.data["count"], 8)
        self.assertTrue(all(t["country"]["code"] == "FRA" for t in r.data["results"]))

    def test_european_competition_mixes_countries(self):
        cl = Competition.objects.get(slug="champions-league")
        r = self.client.get(self.url, {"competition": str(cl.id)})
        self.assertEqual(r.data["count"], 8)
        self.assertGreater(len({t["country"]["code"] for t in r.data["results"]}), 1)

    def test_filter_by_season(self):
        season = Season.objects.get(competition__slug="serie-a", is_current=True)
        r = self.client.get(self.url, {"season": str(season.id)})
        self.assertEqual(r.data["count"], 8)

    def test_old_season_does_not_leak_into_current_filter(self):
        ligue1 = Competition.objects.get(slug="ligue-1")
        old = Season.objects.create(competition=ligue1, year_start=2025, year_end=2026)
        psg = Team.objects.get(slug="paris-saint-germain")
        TeamSeasonStat.objects.create(team=psg, season=old)
        r = self.client.get(self.url, {"competition": str(ligue1.id)})
        self.assertEqual(r.data["count"], 8)  # PSG n'est pas compte deux fois
        r = self.client.get(self.url, {"season": str(old.id)})
        self.assertEqual(r.data["count"], 1)

    def test_invalid_uuid_returns_400(self):
        r = self.client.get(self.url, {"competition": "pas-un-uuid"})
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_filter_by_country_and_search(self):
        r = self.client.get(self.url, {"country": "fra"})
        self.assertEqual(r.data["count"], 8)
        r = self.client.get(self.url, {"search": "real"})
        names = {t["name"] for t in r.data["results"]}
        self.assertIn("Real Madrid", names)
        self.assertTrue(all("real" in n.lower() for n in names))

    def test_inactive_team_and_inactive_sport_are_hidden(self):
        Team.objects.filter(slug="arsenal").update(is_active=False)
        r = self.client.get(self.url, {"search": "arsenal"})
        self.assertEqual(r.data["count"], 0)
        Sport.objects.filter(slug="football").update(is_active=False)
        self.assertEqual(self.client.get(self.url).data["count"], 0)

    def test_detail_has_venue_and_participations(self):
        psg = Team.objects.get(slug="paris-saint-germain")
        r = self.client.get(reverse("team-detail", args=[psg.id]))
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data["venue"]["name"], "Parc des Princes")
        competitions = {p["competition"]["slug"] for p in r.data["participations"]}
        self.assertEqual(competitions, {"ligue-1", "champions-league"})

    def test_external_ids_are_not_exposed(self):
        psg = Team.objects.get(slug="paris-saint-germain")
        TeamExternalId.objects.create(team=psg, provider="api-football", external_id="ext-zz-9137")
        r = self.client.get(reverse("team-detail", args=[psg.id]))
        self.assertNotIn("external_ids", r.data)
        self.assertNotIn("ext-zz-9137", str(r.data))
        self.assertNotIn("api-football", str(r.data))

    def test_list_exposes_stadium_and_domestic_league(self):
        r = self.client.get(self.url, {"search": "paris saint"})
        team = r.data["results"][0]
        self.assertEqual(team["stadium"], "Parc des Princes")
        # Ligue 1 (pays de l'equipe) et non la Ligue des champions.
        self.assertEqual(team["league"], "Ligue 1")

    def test_list_does_not_run_one_query_per_team(self):
        with CaptureQueriesContext(connection) as ctx:
            self.client.get(self.url)
        self.assertLessEqual(len(ctx.captured_queries), 8)

    def test_team_without_venue_has_empty_stadium(self):
        Team.objects.filter(slug="arsenal").update(venue=None)
        r = self.client.get(self.url, {"search": "arsenal"})
        self.assertEqual(r.data["results"][0]["stadium"], "")

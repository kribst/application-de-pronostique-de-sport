# Tests de l'app sports — roadmap phase 2.
# Fichier volontairement vide pour l'instant.
# -*- coding: utf-8 -*-
from django.core.cache import cache
from django.core.management import call_command
from django.db import IntegrityError, transaction
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import CustomUser

from .models import Competition, Season, Sport


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
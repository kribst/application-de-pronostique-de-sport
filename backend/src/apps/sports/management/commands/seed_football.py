# -*- coding: utf-8 -*-
"""Charge le referentiel de depart : sports, football actif, 7 competitions, saison 2026/2027.

Idempotent : peut etre relance sans creer de doublons.
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.sports.models import Competition, Country, Season, Sport, SportMarket, SportType

SPORTS = [  # (nom, slug, type, actif)
    ("Football", "football", SportType.TEAM, True),
    ("Basketball", "basketball", SportType.TEAM, False),
    ("Tennis", "tennis", SportType.INDIVIDUAL, False),
    ("Volleyball", "volleyball", SportType.TEAM, False),
    ("Hockey", "hockey", SportType.TEAM, False),
    ("Baseball", "baseball", SportType.TEAM, False),
    ("Rugby", "rugby", SportType.TEAM, False),
    ("Cricket", "cricket", SportType.TEAM, False),
    ("Handball", "handball", SportType.TEAM, False),
    ("NFL", "nfl", SportType.TEAM, False),
    ("F1", "f1", SportType.INDIVIDUAL, False),
    ("Boxe", "boxe", SportType.INDIVIDUAL, False),
    ("MMA", "mma", SportType.INDIVIDUAL, False),
    ("Golf", "golf", SportType.INDIVIDUAL, False),
    ("Esports", "esports", SportType.TEAM, False),
]

COUNTRIES = [("Angleterre", "ENG"), ("Espagne", "ESP"), ("France", "FRA"),
             ("Allemagne", "GER"), ("Italie", "ITA")]

COMPETITIONS = [  # (nom, slug, code pays ou None, tier)
    ("Premier League", "premier-league", "ENG", 1),
    ("La Liga", "la-liga", "ESP", 1),
    ("Ligue 1", "ligue-1", "FRA", 1),
    ("Bundesliga", "bundesliga", "GER", 1),
    ("Serie A", "serie-a", "ITA", 1),
    ("Ligue des champions", "champions-league", None, 1),
    ("Ligue Europa", "europa-league", None, 2),
]

FOOTBALL_MARKETS = [
    ("1X2", "Resultat du match (1X2)", {}),
    ("DOUBLE_CHANCE", "Double chance", {}),
    ("DNB", "Draw no bet", {}),
    ("BTTS", "Les deux equipes marquent", {}),
    ("OVER_UNDER", "Plus / moins de buts", {"lines": [1.5, 2.5, 3.5]}),
    ("HANDICAP", "Handicap", {}),
    ("CORNERS", "Corners", {}),
    ("CARDS", "Cartons", {}),
    ("CORRECT_SCORE", "Score exact", {}),
    ("HALF_TIME", "Mi-temps", {}),
    ("HT_FT", "Mi-temps / fin de match", {}),
    ("SCORER", "Buteur", {}),
]

SEASON = (2026, 2027)


class Command(BaseCommand):
    help = "Charge sports, football actif, competitions majeures et saison courante."

    @transaction.atomic
    def handle(self, *args, **options):
        for pos, (name, slug, stype, active) in enumerate(SPORTS):
            Sport.objects.update_or_create(
                slug=slug,
                defaults={"name": name, "sport_type": stype, "is_active": active, "position": pos},
            )
        football = Sport.objects.get(slug="football")

        for key, name, params in FOOTBALL_MARKETS:
            SportMarket.objects.update_or_create(
                sport=football, market_type=key, defaults={"name": name, "params": params}
            )

        countries = {}
        for name, code in COUNTRIES:
            countries[code], _ = Country.objects.update_or_create(code=code, defaults={"name": name})

        for name, slug, code, tier in COMPETITIONS:
            comp, _ = Competition.objects.update_or_create(
                sport=football, slug=slug,
                defaults={"name": name, "country": countries.get(code), "tier": tier},
            )
            Season.objects.update_or_create(
                competition=comp, year_start=SEASON[0],
                defaults={"year_end": SEASON[1], "is_current": True},
            )
        self.stdout.write(self.style.SUCCESS(
            f"{Sport.objects.count()} sports, {Competition.objects.count()} competitions."
        ))
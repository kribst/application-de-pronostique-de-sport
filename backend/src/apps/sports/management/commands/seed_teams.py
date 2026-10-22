# -*- coding: utf-8 -*-
"""Charge des equipes de TEST pour chaque competition seedee (phase 3).

Ce n'est pas la composition officielle des championnats : l'import reel
viendra du fournisseur de donnees (phase 5). Idempotent.
"""
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify

from apps.sports.models import Competition, Country, Sport, Team, TeamSeasonStat, Venue

# slug de competition -> [(equipe, stade, ville, code pays)]
LEAGUES = {
    "premier-league": [
        ("Arsenal", "Emirates Stadium", "Londres", "ENG"),
        ("Chelsea", "Stamford Bridge", "Londres", "ENG"),
        ("Liverpool", "Anfield", "Liverpool", "ENG"),
        ("Manchester City", "Etihad Stadium", "Manchester", "ENG"),
        ("Manchester United", "Old Trafford", "Manchester", "ENG"),
        ("Tottenham Hotspur", "Tottenham Hotspur Stadium", "Londres", "ENG"),
        ("Newcastle United", "St James' Park", "Newcastle", "ENG"),
        ("Aston Villa", "Villa Park", "Birmingham", "ENG"),
    ],
    "la-liga": [
        ("Real Madrid", "Santiago Bernabeu", "Madrid", "ESP"),
        ("FC Barcelone", "Spotify Camp Nou", "Barcelone", "ESP"),
        ("Atletico de Madrid", "Metropolitano", "Madrid", "ESP"),
        ("FC Seville", "Ramon Sanchez-Pizjuan", "Seville", "ESP"),
        ("Real Sociedad", "Reale Arena", "Saint-Sebastien", "ESP"),
        ("Villarreal", "Estadio de la Ceramica", "Villarreal", "ESP"),
        ("Athletic Bilbao", "San Mames", "Bilbao", "ESP"),
        ("Real Betis", "Benito Villamarin", "Seville", "ESP"),
    ],
    "ligue-1": [
        ("Paris Saint-Germain", "Parc des Princes", "Paris", "FRA"),
        ("Olympique de Marseille", "Orange Velodrome", "Marseille", "FRA"),
        ("AS Monaco", "Stade Louis-II", "Monaco", "FRA"),
        ("Olympique Lyonnais", "Groupama Stadium", "Decines-Charpieu", "FRA"),
        ("LOSC Lille", "Stade Pierre-Mauroy", "Villeneuve-d'Ascq", "FRA"),
        ("OGC Nice", "Allianz Riviera", "Nice", "FRA"),
        ("Stade Rennais", "Roazhon Park", "Rennes", "FRA"),
        ("RC Lens", "Stade Bollaert-Delelis", "Lens", "FRA"),
    ],
    "bundesliga": [
        ("Bayern Munich", "Allianz Arena", "Munich", "GER"),
        ("Borussia Dortmund", "Signal Iduna Park", "Dortmund", "GER"),
        ("RB Leipzig", "Red Bull Arena", "Leipzig", "GER"),
        ("Bayer Leverkusen", "BayArena", "Leverkusen", "GER"),
        ("Eintracht Francfort", "Deutsche Bank Park", "Francfort", "GER"),
        ("VfB Stuttgart", "MHP Arena", "Stuttgart", "GER"),
        ("Borussia Monchengladbach", "Borussia-Park", "Monchengladbach", "GER"),
        ("VfL Wolfsburg", "Volkswagen Arena", "Wolfsburg", "GER"),
    ],
    "serie-a": [
        ("Inter Milan", "San Siro", "Milan", "ITA"),
        ("AC Milan", "San Siro", "Milan", "ITA"),
        ("Juventus", "Allianz Stadium", "Turin", "ITA"),
        ("Naples", "Stadio Diego Armando Maradona", "Naples", "ITA"),
        ("AS Rome", "Stadio Olimpico", "Rome", "ITA"),
        ("Lazio Rome", "Stadio Olimpico", "Rome", "ITA"),
        ("Atalanta", "Gewiss Stadium", "Bergame", "ITA"),
        ("Fiorentina", "Stadio Artemio Franchi", "Florence", "ITA"),
    ],
}

# Codes courts affiches dans les ronds de l'interface (3-4 lettres).
SHORT_NAMES = {
    "Arsenal": "ARS", "Chelsea": "CHE", "Liverpool": "LIV", "Manchester City": "MCI",
    "Manchester United": "MUN", "Tottenham Hotspur": "TOT", "Newcastle United": "NEW",
    "Aston Villa": "AVL", "Real Madrid": "RMA", "FC Barcelone": "FCB",
    "Atletico de Madrid": "ATM", "FC Seville": "SEV", "Real Sociedad": "RSO",
    "Villarreal": "VIL", "Athletic Bilbao": "ATH", "Real Betis": "BET",
    "Paris Saint-Germain": "PSG", "Olympique de Marseille": "OM", "AS Monaco": "ASM",
    "Olympique Lyonnais": "OL", "LOSC Lille": "LOSC", "OGC Nice": "NIC",
    "Stade Rennais": "REN", "RC Lens": "RCL", "Bayern Munich": "BAY",
    "Borussia Dortmund": "BVB", "RB Leipzig": "RBL", "Bayer Leverkusen": "B04",
    "Eintracht Francfort": "SGE", "VfB Stuttgart": "VFB",
    "Borussia Monchengladbach": "BMG", "VfL Wolfsburg": "WOB", "Inter Milan": "INT",
    "AC Milan": "MIL", "Juventus": "JUV", "Naples": "NAP", "AS Rome": "ROM",
    "Lazio Rome": "LAZ", "Atalanta": "ATA", "Fiorentina": "FIO",
}

# Competitions europeennes : equipes (deja creees ci-dessus) qui y participent.
EUROPEAN = {
    "champions-league": [
        "Paris Saint-Germain", "Real Madrid", "FC Barcelone", "Manchester City",
        "Bayern Munich", "Inter Milan", "Arsenal", "Liverpool",
    ],
    "europa-league": [
        "Tottenham Hotspur", "AS Rome", "Lazio Rome", "Atalanta",
        "FC Seville", "Olympique de Marseille", "Eintracht Francfort", "Aston Villa",
    ],
}


class Command(BaseCommand):
    help = "Charge des equipes de test (et le referentiel si besoin) pour chaque competition."

    @transaction.atomic
    def handle(self, *args, **options):
        call_command("seed_football", verbosity=0)
        football = Sport.objects.get(slug="football")
        countries = {c.code: c for c in Country.objects.all()}

        teams = {}
        for comp_slug, entries in LEAGUES.items():
            for name, stadium, city, code in entries:
                venue, _ = Venue.objects.get_or_create(
                    name=stadium, city=city, defaults={"country": countries[code]}
                )
                team, _ = Team.objects.update_or_create(
                    sport=football,
                    slug=slugify(name),
                    defaults={
                        "name": name,
                        "short_name": SHORT_NAMES.get(name, ""),
                        "country": countries[code],
                        "venue": venue,
                    },
                )
                teams[name] = team
                self._enroll(team, comp_slug)

        for comp_slug, names in EUROPEAN.items():
            for name in names:
                self._enroll(teams[name], comp_slug)

        self.stdout.write(self.style.SUCCESS(
            f"{Team.objects.count()} equipes, {TeamSeasonStat.objects.count()} participations."
        ))

    @staticmethod
    def _enroll(team, comp_slug):
        competition = Competition.objects.get(sport=team.sport, slug=comp_slug)
        season = competition.seasons.get(is_current=True)
        TeamSeasonStat.objects.get_or_create(team=team, season=season)

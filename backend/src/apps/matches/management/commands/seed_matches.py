# -*- coding: utf-8 -*-
"""Genere des matchs de TEST autour de la date du jour (phase 4).

Pour chaque championnat : une journee terminee (il y a 3 jours), une journee
aujourd'hui et une journee a venir (dans 4 jours). Pour la Ligue des champions
et la Ligue Europa : une journee dans 2 jours. Les matchs de test sont
identifies par un identifiant externe (fournisseur "seed") : relancer la
commande les remplace, sans doublons et en recalant les dates sur aujourd'hui.
"""
import datetime
import hashlib

from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.matches.models import Match, MatchEvent, MatchEventType, MatchExternalId, MatchStatus
from apps.sports.models import Competition, Round, Team

DOMESTIC = ["premier-league", "la-liga", "ligue-1", "bundesliga", "serie-a"]
EUROPEAN = ["champions-league", "europa-league"]
PROVIDER = "seed"
# Heures de coup d'envoi (UTC) des 4 matchs d'une journee.
KICKOFF_HOURS = [13, 15, 17, 19]


def _pairings(teams, round_index):
    """Rencontres d'une journee (methode du cercle) : 8 equipes -> 4 matchs."""
    rotated = teams[:1] + teams[1:][round_index % (len(teams) - 1):] + teams[1:][: round_index % (len(teams) - 1)]
    half = len(rotated) // 2
    pairs = list(zip(rotated[:half], reversed(rotated[half:])))
    # alterne domicile/exterieur d'une journee a l'autre
    return [(b, a) if (round_index + i) % 2 else (a, b) for i, (a, b) in enumerate(pairs)]


def _number(key, modulo):
    return int(hashlib.sha1(key.encode()).hexdigest(), 16) % modulo


class Command(BaseCommand):
    help = "Remplace les matchs de test (fournisseur 'seed') par un jeu recale sur aujourd'hui."

    @transaction.atomic
    def handle(self, *args, **options):
        call_command("seed_teams", verbosity=0)

        # Supprime les anciens matchs de test (les evenements partent en cascade).
        Match.objects.filter(external_ids__provider=PROVIDER).delete()

        today = timezone.now().astimezone(datetime.timezone.utc).date()
        created = 0

        for slug in DOMESTIC:
            competition = Competition.objects.get(slug=slug)
            season = competition.seasons.get(is_current=True)
            teams = list(
                Team.objects.filter(season_stats__season=season).order_by("name")
            )
            for round_number, day_offset in ((1, -3), (2, 0), (3, 4)):
                round_obj, _ = Round.objects.get_or_create(season=season, number=round_number)
                day = today + datetime.timedelta(days=day_offset)
                for index, (home, away) in enumerate(_pairings(teams, round_number)):
                    created += self._create(competition, season, round_obj, home, away, day, index)

        for slug in EUROPEAN:
            competition = Competition.objects.get(slug=slug)
            season = competition.seasons.get(is_current=True)
            teams = list(Team.objects.filter(season_stats__season=season).order_by("name"))
            round_obj, _ = Round.objects.get_or_create(season=season, number=1)
            day = today + datetime.timedelta(days=2)
            for index, (home, away) in enumerate(_pairings(teams, 1)):
                created += self._create(competition, season, round_obj, home, away, day, index)

        self.stdout.write(self.style.SUCCESS(f"{created} matchs de test crees."))

    def _create(self, competition, season, round_obj, home, away, day, index):
        kickoff = datetime.datetime.combine(
            day, datetime.time(KICKOFF_HOURS[index % 4], 0), tzinfo=datetime.timezone.utc
        )
        key = f"{competition.slug}-r{round_obj.number}-{index}"
        now = timezone.now()

        if kickoff + datetime.timedelta(hours=2) < now:
            status = MatchStatus.FINISHED
        elif kickoff <= now:
            status = MatchStatus.LIVE
        else:
            status = MatchStatus.SCHEDULED

        score_home = score_away = None
        if status != MatchStatus.SCHEDULED:
            score_home = _number(key + "h", 4)
            score_away = _number(key + "a", 3)
            if status == MatchStatus.LIVE:  # en cours : score partiel
                score_home, score_away = min(score_home, 1), min(score_away, 1)

        match = Match(
            competition=competition, season=season, round=round_obj,
            home_team=home, away_team=away, kickoff_at=kickoff, status=status,
            score_home=score_home, score_away=score_away,
            venue=home.venue, referee="", weather={},
        )
        match.save()
        MatchExternalId.objects.create(match=match, provider=PROVIDER, external_id=key)

        # Un evenement "but" par but marque (minutes deterministes).
        if score_home is not None:
            for side, team, goals in (("h", home, score_home), ("a", away, score_away)):
                for n in range(goals):
                    MatchEvent.objects.create(
                        match=match, team=team, type=MatchEventType.GOAL,
                        minute=5 + _number(f"{key}{side}{n}", 85),
                    )
        return 1

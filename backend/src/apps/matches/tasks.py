# -*- coding: utf-8 -*-
"""Taches Celery de l'app matches (cahier §17). Decouvertes par celery.autodiscover_tasks()."""
import datetime

from celery import shared_task
from django.utils import timezone

from .form import team_form
from .models import Match, MatchStatus

WARM_BEFORE = datetime.timedelta(hours=36)
WARM_AFTER = datetime.timedelta(hours=6)


@shared_task(name="apps.matches.tasks.update_form_cache")
def update_form_cache():
    """Precalcule la forme des equipes concernees par les matchs proches (phase 6).

    - matchs a venir (36 h) : forme de chaque equipe au coup d'envoi (ce que la page du match affiche) ;
    - matchs termines depuis moins de 6 h : forme actuelle des deux equipes.
    Resultat identique a un calcul a la demande, mais deja pret quand l'utilisateur ouvre la page.
    """
    now = timezone.now()
    warmed = 0
    upcoming = Match.objects.filter(
        status__in=(MatchStatus.SCHEDULED, MatchStatus.LIVE), kickoff_at__gte=now - WARM_AFTER, kickoff_at__lte=now + WARM_BEFORE
    )
    for match in upcoming:
        for team_id in (match.home_team_id, match.away_team_id):
            team_form(team_id, match.kickoff_at)
            warmed += 1
    recent = Match.objects.filter(status=MatchStatus.FINISHED, kickoff_at__gte=now - WARM_AFTER)
    for match in recent:
        for team_id in (match.home_team_id, match.away_team_id):
            team_form(team_id)
            warmed += 1
    return {"warmed": warmed}

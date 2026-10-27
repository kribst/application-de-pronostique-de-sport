# -*- coding: utf-8 -*-
"""Config de l'app matches (cahier §4 modules 6-11 : matchs & donnees live).

Modeles : Match, MatchEvent, MatchStat. A venir : Lineup, LineupPlayer, Injury, Suspension.
"""
from django.apps import AppConfig


class MatchesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.matches"
    verbose_name = "Matches (matchs & live)"

    def ready(self):
        from . import signals  # noqa: F401  (branche l'invalidation du cache)

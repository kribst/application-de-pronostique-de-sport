# -*- coding: utf-8 -*-
"""Config de l'app matches (cahier §4 modules 6-11 : matchs & donnees live).

Modeles prevus : Match, MatchEvent, MatchStat (JSONField schema-less),
Lineup, LineupPlayer, Injury, Suspension.
"""
from django.apps import AppConfig


class MatchesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.matches"
    verbose_name = "Matches (matchs & live)"

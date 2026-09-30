# -*- coding: utf-8 -*-
"""Config de l'app sports (cahier §4 modules 2-5, 16 : referentiel sportif).

Modeles prevus : Sport, SportType, SportMarket, Country, Competition,
Season, Round, Team, TeamSeasonStat, Player, PlayerStat.
"""
from django.apps import AppConfig


class SportsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.sports"
    verbose_name = "Sports (referentiel)"

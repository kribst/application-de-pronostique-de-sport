# -*- coding: utf-8 -*-
"""Config de l'app odds (cahier §4 modules 12-13 : cotes & bookmakers).

Modeles prevus : Bookmaker, Market, MarketType, Odds, OddsHistory
(append-only pour l'historique de variation).
"""
from django.apps import AppConfig


class OddsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.odds"
    verbose_name = "Odds (cotes & bookmakers)"

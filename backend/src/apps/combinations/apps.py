# -*- coding: utf-8 -*-
"""Config de l'app combinations (cahier §4 modules 23-31, §15).

Modeles prevus : Combination, CombinationSelection, TargetOddsRequest,
OptimizationScore, RiskProfile, Bankroll, BankrollEntry, PredictionHistory.
"""
from django.apps import AppConfig


class CombinationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.combinations"
    verbose_name = "Combinations (combis & bankroll)"

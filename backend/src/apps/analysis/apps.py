# -*- coding: utf-8 -*-
"""Config de l'app analysis (cahier §4 module 17, §9 : moteur d'analyse).

Modeles prevus : FeatureSet (versionne, horodate), features JSON.
"""
from django.apps import AppConfig


class AnalysisConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.analysis"
    verbose_name = "Analysis (feature engineering)"

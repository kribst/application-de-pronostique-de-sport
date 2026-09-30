# -*- coding: utf-8 -*-
"""Config de l'app predictions (cahier §4 modules 18-22, §10-14, §16).

Modeles prevus : Prediction, PredictionMarketResult, MLModel,
ModelVersion, EnsembleWeight, SimulationRun, ValueBetSignal, Backtest,
BacktestResult.
"""
from django.apps import AppConfig


class PredictionsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.predictions"
    verbose_name = "Predictions (ML & simulations)"

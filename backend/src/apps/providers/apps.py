# -*- coding: utf-8 -*-
"""Config de l'app providers (cahier §4 modules 14-15, §18 : fournisseurs).

Modeles prevus : DataProviderConfig, ProviderSync, TaskLog, ApiCallLog.
Abstraction DataProvider : changer de fournisseur sans reecrire le metier.
"""
from django.apps import AppConfig


class ProvidersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.providers"
    verbose_name = "Providers (fournisseurs & sync)"

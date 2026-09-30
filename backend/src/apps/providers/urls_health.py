# -*- coding: utf-8 -*-
"""Routes de la sonde publique /api/v1/health/ (app providers).

Monte via pronostique/urls.py : path("api/v1/health/", include(...)).
Module separe de urls.py pour que le chemin reste stable meme quand
urls.py accueillera les routes metier de la phase 5 (fournisseurs & sync).
"""
from django.urls import path

from .views import HealthView

urlpatterns = [
    path("", HealthView.as_view(), name="health"),
]

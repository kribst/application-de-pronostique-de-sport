# URLs de l'app sports — a remplir en roadmap phase 2.
# Sera monte sous /api/v1/... via pronostique/urls.py (include).
# Fichier volontairement vide pour l'instant.


# -*- coding: utf-8 -*-
"""Montees sous /api/v1/ : /sports/, /competitions/, /countries/ (cahier section 7)."""
from rest_framework.routers import SimpleRouter

from .views import CompetitionViewSet, CountryViewSet, SportViewSet

router = SimpleRouter()
router.register("sports", SportViewSet, basename="sport")
router.register("competitions", CompetitionViewSet, basename="competition")
router.register("countries", CountryViewSet, basename="country")

urlpatterns = router.urls
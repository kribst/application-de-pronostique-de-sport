# -*- coding: utf-8 -*-
"""Monte sous /api/v1/matches/ (voir pronostique/urls.py) : liste et detail des matchs."""
from rest_framework.routers import DefaultRouter

from .views import MatchViewSet

router = DefaultRouter()
router.register("", MatchViewSet, basename="match")

urlpatterns = router.urls

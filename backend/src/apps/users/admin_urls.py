# -*- coding: utf-8 -*-
"""Superuser administration API, authenticated independently by Django session."""
from django.urls import include, path
from rest_framework.routers import SimpleRouter

from .admin_api import (
    CompetitionAdminViewSet,
    CountryAdminViewSet,
    LoginHistoryAdminViewSet,
    RoundAdminViewSet,
    SeasonAdminViewSet,
    SportAdminViewSet,
    UserAdminViewSet,
    admin_csrf,
    admin_login,
    admin_logout,
    admin_session,
)

router = SimpleRouter()
router.register("sports", SportAdminViewSet, basename="admin-sport")
router.register("countries", CountryAdminViewSet, basename="admin-country")
router.register("competitions", CompetitionAdminViewSet, basename="admin-competition")
router.register("seasons", SeasonAdminViewSet, basename="admin-season")
router.register("rounds", RoundAdminViewSet, basename="admin-round")
router.register("users", UserAdminViewSet, basename="admin-user")
router.register("login-history", LoginHistoryAdminViewSet, basename="admin-login-history")

urlpatterns = [
    path("auth/csrf/", admin_csrf, name="admin-csrf"),
    path("auth/login/", admin_login, name="admin-login"),
    path("auth/logout/", admin_logout, name="admin-logout"),
    path("auth/session/", admin_session, name="admin-session"),
    path("", include(router.urls)),
]

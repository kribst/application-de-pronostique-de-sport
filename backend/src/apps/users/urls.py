# -*- coding: utf-8 -*-
"""Montees sous /api/v1/users/ (pronostique/urls.py)."""
from django.urls import path

from .views import LoginHistoryView, MeView

urlpatterns = [
    path("me/", MeView.as_view(), name="users-me"),
    path("me/history/", LoginHistoryView.as_view(), name="users-me-history"),
]

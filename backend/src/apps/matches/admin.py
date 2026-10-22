# -*- coding: utf-8 -*-
from django.contrib import admin

from .models import Match, MatchEvent, MatchExternalId


class MatchEventInline(admin.TabularInline):
    model = MatchEvent
    extra = 0


class MatchExternalIdInline(admin.TabularInline):
    model = MatchExternalId
    extra = 0


@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = ("__str__", "competition", "kickoff_at", "status", "score_home", "score_away")
    list_filter = ("status", "competition")
    list_select_related = ("competition", "home_team", "away_team")
    search_fields = ("home_team__name", "away_team__name")
    date_hierarchy = "kickoff_at"
    autocomplete_fields = ("home_team", "away_team", "season")
    inlines = [MatchEventInline, MatchExternalIdInline]

# Admin de l'app sports — a remplir en roadmap phase 2.
# Fichier volontairement vide pour l'instant.


# -*- coding: utf-8 -*-
from django.contrib import admin

from .models import (
    Competition,
    Country,
    Round,
    Season,
    Sport,
    SportMarket,
    Team,
    TeamExternalId,
    TeamSeasonStat,
    Venue,
)


class SportMarketInline(admin.TabularInline):
    model = SportMarket
    extra = 0


class SeasonInline(admin.TabularInline):
    model = Season
    extra = 0


@admin.register(Sport)
class SportAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "sport_type", "is_active", "position")
    list_editable = ("is_active", "position")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [SportMarketInline]


@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = ("name", "code")
    search_fields = ("name", "code")


@admin.register(Competition)
class CompetitionAdmin(admin.ModelAdmin):
    list_display = ("name", "sport", "country", "tier", "is_active")
    list_filter = ("sport", "country", "is_active")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}
    inlines = [SeasonInline]


@admin.register(Round)
class RoundAdmin(admin.ModelAdmin):
    list_display = ("season", "number", "name")
    list_filter = ("season__competition",)


class TeamExternalIdInline(admin.TabularInline):
    model = TeamExternalId
    extra = 0


class TeamSeasonStatInline(admin.TabularInline):
    model = TeamSeasonStat
    extra = 0
    autocomplete_fields = ("season",)


@admin.register(Venue)
class VenueAdmin(admin.ModelAdmin):
    list_display = ("name", "city", "country", "capacity")
    list_filter = ("country",)
    search_fields = ("name", "city")


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ("name", "sport", "country", "venue", "is_active")
    list_filter = ("sport", "country", "is_active")
    search_fields = ("name", "short_name")
    prepopulated_fields = {"slug": ("name",)}
    autocomplete_fields = ("venue",)
    inlines = [TeamExternalIdInline, TeamSeasonStatInline]


@admin.register(TeamSeasonStat)
class TeamSeasonStatAdmin(admin.ModelAdmin):
    list_display = ("team", "season")
    list_filter = ("season__competition",)
    search_fields = ("team__name",)



@admin.register(Season)
class SeasonAdmin(admin.ModelAdmin):
    list_display = ("competition", "year_start", "year_end", "is_current")
    list_filter = ("competition", "is_current")
    search_fields = ("competition__name",)

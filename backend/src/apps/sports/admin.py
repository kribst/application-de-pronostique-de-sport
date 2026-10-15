# Admin de l'app sports — a remplir en roadmap phase 2.
# Fichier volontairement vide pour l'instant.


# -*- coding: utf-8 -*-
from django.contrib import admin

from .models import Competition, Country, Round, Season, Sport, SportMarket


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
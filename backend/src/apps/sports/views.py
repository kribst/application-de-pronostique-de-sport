# -*- coding: utf-8 -*-
"""Lecture seule du referentiel sportif (phase 2) : /sports/, /competitions/, /countries/."""
import uuid

from django.db.models import Prefetch
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from .models import Competition, Country, Season, Sport, Team, TeamSeasonStat
from .serializers import (
    CompetitionDetailSerializer,
    CompetitionSerializer,
    CountrySerializer,
    SportMarketSerializer,
    SportSerializer,
    TeamDetailSerializer,
    TeamSerializer,
)


class SportViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Sport.objects.all()
    serializer_class = SportSerializer

    @action(detail=True, methods=["get"])
    def markets(self, request, pk=None):
        sport = self.get_object()
        markets = sport.markets.filter(is_active=True)
        return Response(SportMarketSerializer(markets, many=True).data)


class CountryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Country.objects.all()
    serializer_class = CountrySerializer


class CompetitionViewSet(viewsets.ReadOnlyModelViewSet):
    """Filtres : ?sport=<slug>&country=<code>&tier=<n>&search=<texte>."""

    def get_queryset(self):
        qs = (
            Competition.objects.filter(is_active=True, sport__is_active=True)
            .select_related("sport", "country")
            .prefetch_related(
                Prefetch(
                    "seasons",
                    queryset=Season.objects.filter(is_current=True),
                    to_attr="current_seasons",
                )
            )
        )
        if self.action == "retrieve":
            qs = qs.prefetch_related("seasons")
        params = self.request.query_params
        if sport := params.get("sport"):
            qs = qs.filter(sport__slug=sport)
        if country := params.get("country"):
            qs = qs.filter(country__code__iexact=country)
        if (tier := params.get("tier")) and tier.isdigit():
            qs = qs.filter(tier=int(tier))
        if search := params.get("search"):
            qs = qs.filter(name__icontains=search)
        return qs

    def get_serializer_class(self):
        if self.action == "retrieve":
            return CompetitionDetailSerializer
        return CompetitionSerializer

def _uuid_param(params, name):
    """Lit un parametre UUID de l'URL ; 400 plutot qu'une erreur 500 s'il est invalide."""
    value = params.get(name)
    if not value:
        return None
    try:
        return uuid.UUID(value)
    except ValueError:
        raise ValidationError({name: "Identifiant invalide."})


class TeamViewSet(viewsets.ReadOnlyModelViewSet):
    """Equipes des sports actifs.

    Filtres : ?competition=<uuid> (saison courante de la competition),
    ?season=<uuid> (saison precise), ?sport=<slug>, ?country=<code>, ?search=<texte>.
    """

    def get_queryset(self):
        qs = Team.objects.filter(is_active=True, sport__is_active=True).select_related(
            "sport", "country", "venue"
        )
        params = self.request.query_params

        competition = _uuid_param(params, "competition")
        season = _uuid_param(params, "season")
        participation = {}
        if season:
            participation["season_stats__season_id"] = season
        if competition:
            participation["season_stats__season__competition_id"] = competition
            if not season:
                participation["season_stats__season__is_current"] = True
        if participation:
            # Un seul filter() : toutes les conditions portent sur la meme participation.
            qs = qs.filter(**participation)

        if sport := params.get("sport"):
            qs = qs.filter(sport__slug=sport)
        if country := params.get("country"):
            qs = qs.filter(country__code__iexact=country)
        if search := params.get("search"):
            qs = qs.filter(name__icontains=search)

        if self.action == "retrieve":
            qs = qs.prefetch_related(
                Prefetch(
                    "season_stats",
                    queryset=TeamSeasonStat.objects.select_related("season__competition"),
                )
            )
        else:
            # Championnat de la saison en cours affiche sur chaque carte (sans N+1).
            qs = qs.prefetch_related(
                Prefetch(
                    "season_stats",
                    queryset=TeamSeasonStat.objects.filter(
                        season__is_current=True
                    ).select_related("season__competition"),
                    to_attr="current_stats",
                )
            )
        return qs

    def get_serializer_class(self):
        if self.action == "retrieve":
            return TeamDetailSerializer
        return TeamSerializer

    @action(detail=True, methods=["get"])
    def form(self, request, pk=None):
        """Forme sur 5, 10 et 20 matchs (tous / domicile / exterieur).

        ?before=<ISO avec fuseau> : forme a cette date (defaut : maintenant) ;
        ?competition=<uuid> : uniquement les matchs de cette competition.
        """
        from apps.matches.form import team_form
        from apps.matches.views import _aware_param

        team = self.get_object()
        competition = _uuid_param(request.query_params, "competition")
        return Response(team_form(team.id, _aware_param(request.query_params, "before"), competition))

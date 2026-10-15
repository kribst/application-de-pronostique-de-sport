# -*- coding: utf-8 -*-
"""Lecture seule du referentiel sportif (phase 2) : /sports/, /competitions/, /countries/."""
from django.db.models import Prefetch
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Competition, Country, Season, Sport
from .serializers import (
    CompetitionDetailSerializer,
    CompetitionSerializer,
    CountrySerializer,
    SportMarketSerializer,
    SportSerializer,
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
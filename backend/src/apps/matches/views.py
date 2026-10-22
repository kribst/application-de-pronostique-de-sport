# -*- coding: utf-8 -*-
"""Endpoints de lecture des matchs (phase 4) et recherche globale (module 35)."""
import datetime
import uuid
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.db.models import Prefetch, Q
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.sports.models import Competition, Team
from apps.sports.serializers import CompetitionSerializer, TeamSerializer

from .models import Match, MatchEvent, MatchStatus
from .serializers import MatchDetailSerializer, MatchSerializer


def _uuid_param(params, name):
    value = params.get(name)
    if not value:
        return None
    try:
        return uuid.UUID(value)
    except ValueError:
        raise ValidationError({name: "Identifiant invalide."})


def _user_timezone(request, params):
    """Fuseau demande (?tz=), sinon celui du profil, sinon UTC."""
    name = params.get("tz") or getattr(request.user, "timezone", "") or "UTC"
    try:
        return ZoneInfo(name)
    except (ZoneInfoNotFoundError, ValueError):
        raise ValidationError({"tz": "Fuseau horaire invalide (ex. Africa/Douala)."})


class MatchViewSet(viewsets.ReadOnlyModelViewSet):
    """Matchs des competitions actives.

    Filtres : ?date=AAAA-MM-JJ (jour calendaire dans le fuseau ?tz=, defaut : celui du
    profil), ?competition=<uuid>, ?season=<uuid>, ?team=<uuid> (domicile ou exterieur),
    ?status=LIVE,FINISHED, ?ordering=kickoff_at|-kickoff_at.
    """

    def get_queryset(self):
        qs = (
            Match.objects.filter(competition__is_active=True, competition__sport__is_active=True)
            .select_related(
                "competition", "season", "round", "home_team", "away_team", "venue"
            )
        )
        params = self.request.query_params

        if competition := _uuid_param(params, "competition"):
            qs = qs.filter(competition_id=competition)
        if season := _uuid_param(params, "season"):
            qs = qs.filter(season_id=season)
        if team := _uuid_param(params, "team"):
            qs = qs.filter(Q(home_team_id=team) | Q(away_team_id=team))

        if raw := params.get("status"):
            statuses = [s.strip().upper() for s in raw.split(",") if s.strip()]
            invalid = [s for s in statuses if s not in MatchStatus.values]
            if invalid:
                raise ValidationError({"status": f"Statut inconnu : {', '.join(invalid)}."})
            qs = qs.filter(status__in=statuses)

        if raw_date := params.get("date"):
            try:
                day = datetime.date.fromisoformat(raw_date)
            except ValueError:
                raise ValidationError({"date": "Format attendu : AAAA-MM-JJ."})
            tz = _user_timezone(self.request, params)
            start = datetime.datetime.combine(day, datetime.time.min, tzinfo=tz)
            end = datetime.datetime.combine(day + datetime.timedelta(days=1), datetime.time.min, tzinfo=tz)
            qs = qs.filter(kickoff_at__gte=start, kickoff_at__lt=end)

        ordering = params.get("ordering", "kickoff_at")
        if ordering not in ("kickoff_at", "-kickoff_at"):
            raise ValidationError({"ordering": "Valeurs possibles : kickoff_at, -kickoff_at."})
        qs = qs.order_by(ordering, "id")

        if self.action == "retrieve":
            qs = qs.prefetch_related(
                Prefetch("events", queryset=MatchEvent.objects.select_related("team"))
            )
        return qs

    def get_serializer_class(self):
        return MatchDetailSerializer if self.action == "retrieve" else MatchSerializer


class SearchView(APIView):
    """Recherche globale : equipes, competitions et matchs (GET /api/v1/search/?q=).

    Recherche par sous-chaine (insensible a la casse), identique sur SQLite et
    PostgreSQL. Le full-text PostgreSQL pourra la remplacer quand le volume le justifiera.
    """

    LIMIT = 5

    def get(self, request):
        q = request.query_params.get("q", "").strip()
        if len(q) < 2:
            raise ValidationError({"q": "Saisissez au moins 2 caracteres."})

        teams = Team.objects.filter(
            Q(name__icontains=q) | Q(short_name__icontains=q),
            is_active=True, sport__is_active=True,
        ).select_related("sport", "country", "venue")[: self.LIMIT]
        competitions = Competition.objects.filter(
            name__icontains=q, is_active=True, sport__is_active=True
        ).select_related("sport", "country")[: self.LIMIT]
        matches = (
            Match.objects.filter(
                Q(home_team__name__icontains=q) | Q(away_team__name__icontains=q),
                competition__is_active=True, competition__sport__is_active=True,
            )
            .select_related("competition", "season", "round", "home_team", "away_team", "venue")
            .order_by("-kickoff_at")[: self.LIMIT]
        )

        return Response(
            {
                "query": q,
                "teams": TeamSerializer(teams, many=True).data,
                "competitions": CompetitionSerializer(competitions, many=True).data,
                "matches": MatchSerializer(matches, many=True).data,
            }
        )

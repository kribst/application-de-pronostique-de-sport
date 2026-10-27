# -*- coding: utf-8 -*-
"""Endpoints de lecture des matchs (phase 4) et recherche globale (module 35)."""
import datetime
import uuid
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.db.models import Prefetch, Q
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.sports.models import Competition, Team
from apps.sports.serializers import CompetitionSerializer, TeamSerializer

from .form import team_form
from .h2h import DEFAULT_LIMIT, MAX_LIMIT, head_to_head
from .models import Match, MatchEvent, MatchStat, MatchStatus
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


def _aware_param(params, name):
    """Date/heure ISO 8601 AVEC fuseau (ex. 2026-10-24T19:00:00Z), ou None."""
    raw = params.get(name)
    if not raw:
        return None
    try:
        value = datetime.datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError:
        raise ValidationError({name: "Date ISO 8601 attendue (ex. 2026-10-24T19:00:00Z)."})
    if value.tzinfo is None:
        raise ValidationError({name: "La date doit contenir un fuseau horaire (ex. ...Z)."})
    return value


def _limit_param(params):
    raw = params.get("limit", str(DEFAULT_LIMIT))
    if not raw.isdigit() or not 1 <= int(raw) <= MAX_LIMIT:
        raise ValidationError({"limit": f"Entier entre 1 et {MAX_LIMIT}."})
    return int(raw)


def _stats_payload(match):
    by_team = {s.team_id: s for s in MatchStat.objects.filter(match=match)}
    home, away = by_team.get(match.home_team_id), by_team.get(match.away_team_id)
    return {
        "match": str(match.id),
        "available": bool(home or away),
        "home": home.stats if home else None,
        "away": away.stats if away else None,
        "updated_at": max((s.updated_at for s in by_team.values()), default=None),
    }


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

    # --- Statistiques, forme et H2H d'un match (phase 6) -------------------------
    @action(detail=True, methods=["get"])
    def stats(self, request, pk=None):
        """Statistiques des deux equipes pour ce match (vides tant qu'elles ne sont pas importees)."""
        return Response(_stats_payload(self.get_object()))

    @action(detail=True, methods=["get"])
    def h2h(self, request, pk=None):
        """Confrontations directes AVANT ce match (le match lui-meme n'est jamais compte)."""
        match = self.get_object()
        return Response(
            head_to_head(match.home_team_id, match.away_team_id, match.kickoff_at, _limit_param(request.query_params))
        )

    @action(detail=True, methods=["get"])
    def form(self, request, pk=None):
        """Forme des deux equipes telle qu'elle etait au coup d'envoi (aucune donnee posterieure)."""
        match = self.get_object()
        return Response(
            {
                "match": str(match.id),
                "as_of": match.kickoff_at.astimezone(datetime.timezone.utc).isoformat().replace("+00:00", "Z"),
                "home_team": team_form(match.home_team_id, match.kickoff_at),
                "away_team": team_form(match.away_team_id, match.kickoff_at),
            }
        )


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


class H2HView(APIView):
    """GET /api/v1/h2h/?team_a=<uuid>&team_b=<uuid>[&before=<ISO>][&limit=10]."""

    def get(self, request):
        params = request.query_params
        ids = []
        for name in ("team_a", "team_b"):
            try:
                ids.append(uuid.UUID(params.get(name, "")))
            except ValueError:
                raise ValidationError({name: "Identifiant d'equipe invalide."})
        if ids[0] == ids[1]:
            raise ValidationError({"team_b": "Choisissez deux equipes differentes."})
        if Team.objects.filter(pk__in=ids, is_active=True).count() != 2:
            raise NotFound("Equipe introuvable.")
        return Response(head_to_head(ids[0], ids[1], _aware_param(params, "before"), _limit_param(params)))

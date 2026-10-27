# -*- coding: utf-8 -*-
"""Fournisseur API-Football (api-sports.io, v3) : appels + Normalizer.

Economie de requetes (chaque methode = UNE requete HTTP) :
- fetch_fixtures : toute une saison d'une competition (~380 matchs) en un appel ;
- fetch_live     : tous les matchs en cours du monde en un appel ;
- fetch_by_ids   : jusqu'a 20 matchs (avec leurs evenements) en un appel ;
- fetch_quota    : /status, qui ne consomme pas de requete.

ATTENTION : le format ci-dessous suit la documentation publique d'API-Football et
des exemples de reponses ; il doit etre verifie avec une vraie cle (commande
`provider_status --remote`, puis `sync_provider fixtures`).
"""
from __future__ import annotations

import datetime
import re
from typing import Sequence

from apps.matches.models import MatchEventType, MatchStatus

from .base import (
    Batch,
    DataProvider,
    EventDTO,
    InvalidPayload,
    MatchDetailDTO,
    MatchDTO,
    ProviderAuthError,
    ProviderError,
    ProviderPlanError,
    QuotaExceeded,
    QuotaInfo,
    TeamDTO,
    VenueDTO,
)
from .quota import Priority, ProviderClient
from .validators import validate_match, validate_team

SLUG = "api-football"
DEFAULT_BASE_URL = "https://v3.football.api-sports.io"

# Codes de statut courts d'API-Football -> statuts internes.
STATUS_MAP = {
    "TBD": MatchStatus.SCHEDULED, "NS": MatchStatus.SCHEDULED,
    "1H": MatchStatus.LIVE, "HT": MatchStatus.LIVE, "2H": MatchStatus.LIVE,
    "ET": MatchStatus.LIVE, "BT": MatchStatus.LIVE, "P": MatchStatus.LIVE,
    "LIVE": MatchStatus.LIVE, "INT": MatchStatus.LIVE,
    "SUSP": MatchStatus.SUSPENDED, "ABD": MatchStatus.SUSPENDED,
    "FT": MatchStatus.FINISHED, "AET": MatchStatus.FINISHED, "PEN": MatchStatus.FINISHED,
    "AWD": MatchStatus.FINISHED, "WO": MatchStatus.FINISHED,
    "PST": MatchStatus.POSTPONED,
    "CANC": MatchStatus.CANCELLED,
}

# Reponse "HTTP 200" contenant une erreur : on la classe d'apres son texte.
_QUOTA_WORDS = ("request limit", "rate limit", "too many", "limit for the day")
_PLAN_WORDS = ("plan", "season", "subscription")
_AUTH_WORDS = ("token", "api key", "apikey", "application key")


def raise_for_api_errors(body) -> None:
    if not isinstance(body, dict):
        raise ProviderError("Reponse inattendue.")
    errors = body.get("errors")
    if not errors:
        return
    values = errors.values() if isinstance(errors, dict) else errors
    text = " ".join(str(v) for v in values).lower()
    if any(w in text for w in _QUOTA_WORDS):
        raise QuotaExceeded("Quota du fournisseur atteint.")
    if any(w in text for w in _PLAN_WORDS):
        raise ProviderPlanError(f"Offre insuffisante : {text[:200]}")
    if any(w in text for w in _AUTH_WORDS):
        raise ProviderAuthError("Cle d'API refusee.")
    raise ProviderError(f"Erreur du fournisseur : {text[:200]}")


# --- Normalizer ---------------------------------------------------------------
def _get(data, *path):
    for key in path:
        if not isinstance(data, dict):
            return None
        data = data.get(key)
    return data


def _int_or_none(value):
    try:
        return int(value) if value is not None else None
    except (TypeError, ValueError):
        return None


def _venue(raw) -> VenueDTO | None:
    name = (_get(raw, "name") or "").strip()
    if not name:
        return None
    return VenueDTO(name=name, city=(_get(raw, "city") or "").strip(), capacity=_int_or_none(_get(raw, "capacity")))


def normalize_team(item) -> TeamDTO:
    team = _get(item, "team")
    external_id = _get(team, "id")
    if external_id is None:
        raise InvalidPayload("equipe sans identifiant")
    return validate_team(
        TeamDTO(
            external_id=str(external_id),
            name=(_get(team, "name") or "").strip(),
            country=(_get(team, "country") or "").strip(),
            founded_year=_int_or_none(_get(team, "founded")),
            logo_url=(_get(team, "logo") or "").strip(),
            venue=_venue(_get(item, "venue")),
        )
    )


def _team_ref(raw) -> TeamDTO:
    return TeamDTO(
        external_id=str(_get(raw, "id") or ""),
        name=(_get(raw, "name") or "").strip(),
        logo_url=(_get(raw, "logo") or "").strip(),
    )


def _parse_date(value) -> datetime.datetime:
    try:
        parsed = datetime.datetime.fromisoformat(str(value))
    except ValueError:
        raise InvalidPayload("date illisible") from None
    if parsed.tzinfo is None:
        raise InvalidPayload("date sans fuseau horaire")
    return parsed.astimezone(datetime.timezone.utc)


def normalize_match(item) -> MatchDTO:
    fixture = _get(item, "fixture")
    short = _get(fixture, "status", "short")
    if short not in STATUS_MAP:
        raise InvalidPayload(f"match {_get(fixture, 'id')}: statut inconnu '{short}'")
    status = STATUS_MAP[short]
    goals = _get(item, "goals")
    score_home, score_away = _int_or_none(_get(goals, "home")), _int_or_none(_get(goals, "away"))
    if status in (MatchStatus.SCHEDULED, MatchStatus.POSTPONED, MatchStatus.CANCELLED):
        score_home = score_away = None  # certains fournisseurs envoient 0-0 avant le coup d'envoi
    return validate_match(
        MatchDTO(
            external_id=str(_get(fixture, "id") or ""),
            league_external_id=str(_get(item, "league", "id") or ""),
            season_year=_int_or_none(_get(item, "league", "season")) or 0,
            round_label=(_get(item, "league", "round") or "").strip(),
            kickoff_at=_parse_date(_get(fixture, "date")),
            status=status,
            home=_team_ref(_get(item, "teams", "home")),
            away=_team_ref(_get(item, "teams", "away")),
            score_home=score_home,
            score_away=score_away,
            referee=(_get(fixture, "referee") or "").strip()[:120],
            venue=_venue(_get(fixture, "venue")),
        )
    )


# Libelles d'API-Football -> cles de apps/matches/stat_schemas.py
STAT_KEYS = {
    "Total Shots": "shots_total", "Shots on Goal": "shots_on_target", "Shots off Goal": "shots_off_target",
    "Blocked Shots": "shots_blocked", "Shots insidebox": "shots_inside_box", "Shots outsidebox": "shots_outside_box",
    "Ball Possession": "possession", "Corner Kicks": "corners", "Fouls": "fouls", "Offsides": "offsides",
    "Yellow Cards": "yellow_cards", "Red Cards": "red_cards", "Goalkeeper Saves": "saves",
    "Total passes": "passes_total", "Passes accurate": "passes_accurate", "Passes %": "pass_accuracy",
    "expected_goals": "expected_goals",
}


def _stat_number(value, key: str):
    """"55%" -> 55 ; "1.23" -> 1.23 ; None / texte -> None (statistique ignoree)."""
    if value is None:
        return None
    if isinstance(value, str):
        value = value.strip().rstrip("%")
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if key == "expected_goals" else int(number)


def normalize_statistics(item) -> dict:
    stats = {}
    for block in _get(item, "statistics") or []:
        team_id = _get(block, "team", "id")
        if team_id is None:
            continue
        values = {}
        for entry in _get(block, "statistics") or []:
            key = STAT_KEYS.get(_get(entry, "type"))
            number = _stat_number(_get(entry, "value"), key) if key else None
            if key and number is not None:
                values[key] = number
        if values:
            stats[str(team_id)] = values
    return stats


def normalize_events(item) -> MatchDetailDTO:
    events = []
    for raw in _get(item, "events") or []:
        kind, detail = (_get(raw, "type") or ""), (_get(raw, "detail") or "")
        mapped = None
        if kind == "Goal":
            mapped = {"Normal Goal": MatchEventType.GOAL, "Own Goal": MatchEventType.OWN_GOAL,
                      "Penalty": MatchEventType.PENALTY}.get(detail)
        elif kind == "Card":
            mapped = MatchEventType.YELLOW_CARD if detail == "Yellow Card" else (
                MatchEventType.RED_CARD if "red" in detail.lower() or "second yellow" in detail.lower() else None)
        elif kind == "subst":
            mapped = MatchEventType.SUBSTITUTION
        elif kind == "Var":
            mapped = MatchEventType.VAR
        minute = _int_or_none(_get(raw, "time", "elapsed"))
        if mapped is None or minute is None:
            continue  # evenement non gere (ex. penalty rate) : ignore
        events.append(
            EventDTO(
                minute=minute, extra_minute=_int_or_none(_get(raw, "time", "extra")), type=mapped,
                team_external_id=str(_get(raw, "team", "id") or ""),
                player_name=(_get(raw, "player", "name") or "").strip()[:120],
            )
        )
    return MatchDetailDTO(
        match_external_id=str(_get(item, "fixture", "id") or ""), events=tuple(events),
        stats=normalize_statistics(item),
    )


def _normalize_list(items, normalizer) -> Batch:
    batch = Batch()
    for item in items or []:
        try:
            batch.items.append(normalizer(item))
        except InvalidPayload as exc:
            batch.rejected.append(str(exc))
    return batch


# --- Fournisseur ----------------------------------------------------------------
class ApiFootballProvider(DataProvider):
    slug = SLUG

    def __init__(self, client: ProviderClient):
        self.client = client

    def _response(self, body) -> list:
        value = body.get("response") if isinstance(body, dict) else None
        return value if isinstance(value, list) else []

    def fetch_teams(self, league_ref: str, season_year: int, *, refresh: bool = False) -> Batch:
        body = self.client.get(
            "teams", {"league": league_ref, "season": season_year},
            priority=Priority.REFERENCE, ttl=7 * 24 * 3600, refresh=refresh,
        )
        return _normalize_list(self._response(body), normalize_team)

    def fetch_fixtures(self, league_ref: str, season_year: int, *, refresh: bool = False) -> Batch:
        body = self.client.get(
            "fixtures", {"league": league_ref, "season": season_year, "timezone": "UTC"},
            priority=Priority.RESULTS, ttl=20 * 60, refresh=refresh,
        )
        return _normalize_list(self._response(body), normalize_match)

    def fetch_live(self) -> Batch:
        body = self.client.get("fixtures", {"live": "all", "timezone": "UTC"}, priority=Priority.LIVE)
        return _normalize_list(self._response(body), normalize_match)

    def fetch_by_ids(self, ids: Sequence[str], *, with_details: bool = False) -> Batch:
        ids = list(ids)[:20]  # limite du fournisseur
        if not ids:
            return Batch()
        body = self.client.get(
            "fixtures", {"ids": "-".join(ids), "timezone": "UTC"},
            priority=Priority.REFERENCE if with_details else Priority.RESULTS,
        )
        items = self._response(body)
        batch = _normalize_list(items, normalize_match)
        if with_details:
            for item in items:
                detail = normalize_events(item)
                if detail.match_external_id:
                    batch.details[detail.match_external_id] = detail
        return batch

    def fetch_quota(self) -> QuotaInfo:
        body = self.client.get("status", {}, priority=Priority.LIVE, count_quota=False)
        response = body.get("response") if isinstance(body, dict) else None
        response = response if isinstance(response, dict) else {}
        return QuotaInfo(
            plan=str(_get(response, "subscription", "plan") or ""),
            limit_day=_int_or_none(_get(response, "requests", "limit_day")),
            used_day=_int_or_none(_get(response, "requests", "current")),
        )

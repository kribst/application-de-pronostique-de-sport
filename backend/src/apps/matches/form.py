# -*- coding: utf-8 -*-
"""Forme d'une equipe sur ses 5, 10 et 20 derniers matchs (cahier §9, roadmap phase 6).

Regles :
- seuls les matchs TERMINES comptent, et strictement AVANT `before` : jamais de donnee
  posterieure (pas de fuite du futur, indispensable au backtesting, cahier §16) ;
- trois vues : tous les matchs, domicile seulement, exterieur seulement ;
- victoire = 3 points, nul = 1, defaite = 0.
"""
from __future__ import annotations

import datetime

from django.db.models import Q
from django.utils import timezone

from .cache import as_key, cached, team_version
from .models import Match, MatchStatus

WINDOWS = (5, 10, 20)
MAX_WINDOW = max(WINDOWS)


def _result_row(team_id, match: Match) -> dict:
    home = match.home_team_id == team_id
    goals_for = match.score_home if home else match.score_away
    goals_against = match.score_away if home else match.score_home
    outcome = "W" if goals_for > goals_against else ("D" if goals_for == goals_against else "L")
    return {"outcome": outcome, "gf": goals_for, "ga": goals_against}


def summarize(rows: list[dict], window: int) -> dict:
    """Resume les `window` premieres lignes (les plus recentes en premier)."""
    rows = rows[:window]
    played = len(rows)
    wins = sum(r["outcome"] == "W" for r in rows)
    draws = sum(r["outcome"] == "D" for r in rows)
    losses = played - wins - draws
    goals_for, goals_against = sum(r["gf"] for r in rows), sum(r["ga"] for r in rows)
    points = 3 * wins + draws

    streak = {"type": None, "length": 0}
    if rows:
        streak["type"] = rows[0]["outcome"]
        for row in rows:
            if row["outcome"] != streak["type"]:
                break
            streak["length"] += 1

    def avg(value):
        return round(value / played, 2) if played else None

    return {
        "window": window,
        "played": played,
        "complete": played == window,  # faux : l'equipe a moins de `window` matchs connus
        "wins": wins, "draws": draws, "losses": losses,
        "points": points,
        "points_per_match": avg(points),
        "goals_for": goals_for, "goals_against": goals_against,
        "goal_difference": goals_for - goals_against,
        "avg_goals_for": avg(goals_for), "avg_goals_against": avg(goals_against),
        "clean_sheets": sum(r["ga"] == 0 for r in rows),
        "failed_to_score": sum(r["gf"] == 0 for r in rows),
        "btts": sum(r["gf"] > 0 and r["ga"] > 0 for r in rows),
        "over_2_5": sum(r["gf"] + r["ga"] > 2 for r in rows),
        "results": [r["outcome"] for r in rows],  # du plus recent au plus ancien
        "streak": streak,
    }


def _finished_before(team_id, before, competition_id, venue: str | None):
    query = Match.objects.filter(status=MatchStatus.FINISHED)
    if venue == "home":
        query = query.filter(home_team_id=team_id)
    elif venue == "away":
        query = query.filter(away_team_id=team_id)
    else:
        query = query.filter(Q(home_team_id=team_id) | Q(away_team_id=team_id))
    if before is not None:
        query = query.filter(kickoff_at__lt=before)
    if competition_id:
        query = query.filter(competition_id=competition_id)
    return list(query.order_by("-kickoff_at", "-id")[:MAX_WINDOW])


def compute_form(team_id, before: datetime.datetime | None = None, competition_id=None) -> dict:
    """Calcul brut (3 requetes SQL)."""
    views = {}
    for venue in (None, "home", "away"):
        matches = _finished_before(team_id, before, competition_id, venue)
        rows = [_result_row(team_id, m) for m in matches]
        views["overall" if venue is None else venue] = {str(w): summarize(rows, w) for w in WINDOWS}
    return {
        "team": str(team_id),
        "as_of": before.isoformat() if before else None,
        "competition": str(competition_id) if competition_id else None,
        "windows": list(WINDOWS),
        **views,
    }


def team_form(team_id, before: datetime.datetime | None = None, competition_id=None) -> dict:
    """Forme avec cache (clee par version d'equipe : voir cache.py)."""
    if before is not None and timezone.is_naive(before):
        raise ValueError("`before` doit contenir un fuseau horaire.")
    key = (
        f"analytics:form:{team_id}:{team_version(team_id)}:"
        f"{as_key(competition_id)}:{before.timestamp() if before else 'now'}"
    )
    return cached(key, lambda: compute_form(team_id, before, competition_id))

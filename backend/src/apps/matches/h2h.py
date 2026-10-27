# -*- coding: utf-8 -*-
"""Confrontations directes (H2H) entre deux equipes (cahier §9, roadmap phase 6).

Le resultat est exprime du point de vue des equipes A et B (pas "domicile/exterieur"),
donc h2h(A, B) et h2h(B, A) portent sur les memes matchs avec les victoires echangees
(propriete de symetrie testee). Un echantillon de moins de 5 rencontres est signale.
"""
from __future__ import annotations

import datetime

from django.db.models import Q

from .cache import as_key, cached, team_version
from .models import Match, MatchStatus

MIN_SAMPLE = 5
DEFAULT_LIMIT = 10
MAX_LIMIT = 20
LOW_SAMPLE_WARNING = (
    "Echantillon reduit : moins de {n} confrontations, ces statistiques ont une faible "
    "significativite statistique."
)


def compute_h2h(team_a, team_b, before: datetime.datetime | None = None, limit: int = DEFAULT_LIMIT) -> dict:
    limit = max(1, min(limit, MAX_LIMIT))
    query = Match.objects.filter(status=MatchStatus.FINISHED).filter(
        Q(home_team_id=team_a, away_team_id=team_b) | Q(home_team_id=team_b, away_team_id=team_a)
    )
    if before is not None:
        query = query.filter(kickoff_at__lt=before)  # jamais le match lui-meme ni un match posterieur
    matches = list(
        query.select_related("competition", "home_team", "away_team").order_by("-kickoff_at", "-id")[:limit]
    )

    wins_a = wins_b = draws = goals_a = goals_b = btts = over25 = 0
    for m in matches:
        a_home = m.home_team_id == team_a
        ga, gb = (m.score_home, m.score_away) if a_home else (m.score_away, m.score_home)
        goals_a, goals_b = goals_a + ga, goals_b + gb
        wins_a += ga > gb
        wins_b += gb > ga
        draws += ga == gb
        btts += ga > 0 and gb > 0
        over25 += ga + gb > 2

    played = len(matches)
    low = played < MIN_SAMPLE
    return {
        "team_a": str(team_a),
        "team_b": str(team_b),
        "as_of": before.isoformat() if before else None,
        "summary": {
            "played": played,
            "wins_a": wins_a, "draws": draws, "wins_b": wins_b,
            "goals_a": goals_a, "goals_b": goals_b,
            "avg_goals_per_match": round((goals_a + goals_b) / played, 2) if played else None,
            "btts": btts, "over_2_5": over25,
            "low_sample": low,
            "min_sample": MIN_SAMPLE,
            "warning": LOW_SAMPLE_WARNING.format(n=MIN_SAMPLE) if low else "",
        },
        "matches": [
            {
                "id": str(m.id),
                "kickoff_at": m.kickoff_at.astimezone(datetime.timezone.utc).isoformat().replace("+00:00", "Z"),
                "competition": {"id": str(m.competition_id), "name": m.competition.name},
                "home_team": {"id": str(m.home_team_id), "name": m.home_team.name},
                "away_team": {"id": str(m.away_team_id), "name": m.away_team.name},
                "score_home": m.score_home, "score_away": m.score_away,
            }
            for m in matches
        ],
    }


def head_to_head(team_a, team_b, before: datetime.datetime | None = None, limit: int = DEFAULT_LIMIT) -> dict:
    limit = max(1, min(limit, MAX_LIMIT))
    key = (
        f"analytics:h2h:{team_a}:{team_version(team_a)}:{team_b}:{team_version(team_b)}:"
        f"{before.timestamp() if before else 'now'}:{limit}"
    )
    return cached(key, lambda: compute_h2h(team_a, team_b, before, limit))

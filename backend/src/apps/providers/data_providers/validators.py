# -*- coding: utf-8 -*-
"""Validator : dernier controle avant l'ecriture en base (Provider > Normalizer > Validator).

Tout element incoherent est ecarte avec un motif, jamais ecrit.
"""
from __future__ import annotations

import datetime

from apps.matches.models import MatchStatus

from .base import InvalidPayload, MatchDTO, TeamDTO

SCORELESS = {MatchStatus.SCHEDULED, MatchStatus.POSTPONED, MatchStatus.CANCELLED}


def validate_team(team: TeamDTO) -> TeamDTO:
    if not team.external_id:
        raise InvalidPayload("equipe sans identifiant")
    if not team.name or not team.name.strip():
        raise InvalidPayload(f"equipe {team.external_id} sans nom")
    return team


def validate_match(match: MatchDTO) -> MatchDTO:
    ref = f"match {match.external_id or '?'}"
    if not match.external_id:
        raise InvalidPayload("match sans identifiant")
    if match.kickoff_at.tzinfo is None or match.kickoff_at.utcoffset() != datetime.timedelta(0):
        raise InvalidPayload(f"{ref}: date non normalisee en UTC")
    if match.status not in MatchStatus.values:
        raise InvalidPayload(f"{ref}: statut inconnu")
    validate_team(match.home)
    validate_team(match.away)
    if match.home.external_id == match.away.external_id:
        raise InvalidPayload(f"{ref}: meme equipe a domicile et a l'exterieur")

    has_home, has_away = match.score_home is not None, match.score_away is not None
    if has_home != has_away:
        raise InvalidPayload(f"{ref}: score incomplet")
    if match.score_home is not None and (match.score_home < 0 or match.score_away < 0):
        raise InvalidPayload(f"{ref}: score negatif")
    if match.status in SCORELESS and has_home:
        raise InvalidPayload(f"{ref}: score sur un match non joue")
    if match.status == MatchStatus.FINISHED and not has_home:
        raise InvalidPayload(f"{ref}: match termine sans score")
    return match

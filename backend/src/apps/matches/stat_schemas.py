# -*- coding: utf-8 -*-
"""Schemas des statistiques de match, par sport (cahier §6 : MatchStat, schema variable).

Chaque sport declare les cles autorisees avec leur type et leurs bornes. Une cle
inconnue, un mauvais type ou une valeur hors bornes est refuse : le JSON reste propre,
donc exploitable plus tard par les modeles de prediction.
"""
from __future__ import annotations

from django.core.exceptions import ValidationError

# cle -> (type, minimum, maximum)
FOOTBALL_STATS = {
    "shots_total": (int, 0, 100),
    "shots_on_target": (int, 0, 100),
    "shots_off_target": (int, 0, 100),
    "shots_blocked": (int, 0, 100),
    "shots_inside_box": (int, 0, 100),
    "shots_outside_box": (int, 0, 100),
    "possession": (int, 0, 100),  # pourcentage
    "corners": (int, 0, 50),
    "fouls": (int, 0, 100),
    "offsides": (int, 0, 30),
    "yellow_cards": (int, 0, 15),
    "red_cards": (int, 0, 11),
    "saves": (int, 0, 50),
    "passes_total": (int, 0, 2000),
    "passes_accurate": (int, 0, 2000),
    "pass_accuracy": (int, 0, 100),  # pourcentage
    "expected_goals": (float, 0.0, 15.0),
}

SCHEMAS = {"football": FOOTBALL_STATS}


def validate_stats(sport_slug: str, stats: dict) -> dict:
    """Retourne les statistiques validees ; leve ValidationError sinon."""
    schema = SCHEMAS.get(sport_slug)
    if schema is None:
        raise ValidationError(f"Aucun schema de statistiques pour le sport '{sport_slug}'.")
    if not isinstance(stats, dict):
        raise ValidationError("Les statistiques doivent etre un objet JSON.")

    cleaned, errors = {}, []
    for key, value in stats.items():
        if key not in schema:
            errors.append(f"cle inconnue '{key}'")
            continue
        kind, low, high = schema[key]
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            errors.append(f"'{key}' doit etre un nombre")
            continue
        if kind is int and isinstance(value, float) and not value.is_integer():
            errors.append(f"'{key}' doit etre un entier")
            continue
        value = kind(value)
        if not low <= value <= high:
            errors.append(f"'{key}'={value} hors de [{low}, {high}]")
            continue
        cleaned[key] = value
    if errors:
        raise ValidationError(errors)
    return cleaned

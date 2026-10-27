# -*- coding: utf-8 -*-
"""Cache de la forme et du H2H, invalide par version d'equipe.

Chaque equipe a un numero de version. Il change des qu'un match de cette equipe est
enregistre comme termine (ou corrige) : toutes les formes et tous les H2H qui la
concernent changent alors de cle, donc ne sont plus lus. Pas besoin de lister ni de
supprimer les anciennes entrees : elles expirent d'elles-memes.
"""
from __future__ import annotations

import time
import uuid

from django.core.cache import cache

CACHE_TTL = 24 * 3600


def team_version(team_id) -> str:
    key = f"analytics:ver:{team_id}"
    version = cache.get(key)
    if version is None:
        # Version absente (premier usage ou cache vide) : on en cree une NOUVELLE et unique,
        # pour ne jamais retomber sur une ancienne entree devenue obsolete.
        cache.add(key, time.time_ns(), timeout=None)
        version = cache.get(key)
    return str(version)


def bump_team_version(team_id) -> None:
    cache.set(f"analytics:ver:{team_id}", time.time_ns(), timeout=None)


def cached(key: str, compute, ttl: int = CACHE_TTL):
    value = cache.get(key)
    if value is None:
        value = compute()
        cache.set(key, value, ttl)
    return value


def as_key(value) -> str:
    return "none" if value is None else (str(value) if isinstance(value, uuid.UUID) else str(value))

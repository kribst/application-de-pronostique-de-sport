# -*- coding: utf-8 -*-
"""Gestion du quota et client HTTP economique (cache + priorites + journal).

Principe : le quota gratuit est faible (100 requetes/jour sur API-Football), donc
chaque requete doit etre justifiee. Trois priorites se partagent le budget du jour :

- LIVE       : scores en direct. Peut consommer jusqu'a la derniere requete.
- RESULTS    : calendrier et resultats. S'arrete quand il reste moins que la
               reserve du direct (reserve_live_pct, 20 % par defaut).
- REFERENCE  : equipes, details/evenements. S'arrete plus tot (reference_floor_pct,
               40 % par defaut) pour ne jamais priver les deux autres.
"""
from __future__ import annotations

import hashlib
import json
import math
from enum import IntEnum
from typing import Callable

from django.core.cache import cache as default_cache
from django.db.models import F
from django.utils import timezone

from apps.providers.models import ApiCallLog, DataProviderConfig, QuotaDay

from .base import (
    ProviderAuthError,
    ProviderDisabled,
    ProviderError,
    ProviderUnavailable,
    QuotaExceeded,
)
from .http import RawResponse, Transport


class Priority(IntEnum):
    LIVE = 0
    RESULTS = 1
    REFERENCE = 2


class QuotaManager:
    def __init__(self, config: DataProviderConfig, cache=default_cache):
        self.config = config
        self.cache = cache

    # -- compteur du jour -----------------------------------------------------
    def today(self) -> QuotaDay:
        day = timezone.now().date()  # UTC : le quota du fournisseur se reinitialise a 00:00 UTC
        quota, _ = QuotaDay.objects.get_or_create(provider=self.config, day=day)
        return quota

    def remaining(self) -> int:
        quota = self.today()
        if quota.remaining_reported is not None:
            return quota.remaining_reported  # valeur annoncee par le fournisseur : la plus fiable
        return max(0, self.config.daily_limit - quota.used)

    def limit(self) -> int:
        return self.today().limit_reported or self.config.daily_limit

    # -- decisions --------------------------------------------------------------
    def floor(self, priority: Priority) -> int:
        """Nombre de requetes a laisser intactes apres cet appel."""
        limit = self.limit()
        if priority == Priority.LIVE:
            return 0
        if priority == Priority.RESULTS:
            return math.ceil(limit * self.config.reserve_live_pct / 100)
        return math.ceil(limit * self.config.reference_floor_pct / 100)

    def can_spend(self, priority: Priority, cost: int = 1) -> bool:
        return self.remaining() - cost >= self.floor(priority)

    def minute_ok(self) -> bool:
        key = f"quota:{self.config.slug}:{timezone.now():%Y%m%d%H%M}"
        self.cache.add(key, 0, timeout=90)
        try:
            return self.cache.incr(key) <= self.config.per_minute_limit
        except ValueError:  # cle expiree entre add et incr
            return True

    # -- enregistrement -----------------------------------------------------------
    def record_call(self, headers: dict[str, str]) -> int | None:
        """Compte une requete et recale sur les en-tetes du fournisseur. Retourne le restant."""
        quota = self.today()
        QuotaDay.objects.filter(pk=quota.pk).update(used=F("used") + 1)
        remaining = _to_int(headers.get("x-ratelimit-requests-remaining"))
        limit = _to_int(headers.get("x-ratelimit-requests-limit"))
        if remaining is not None:
            QuotaDay.objects.filter(pk=quota.pk).update(remaining_reported=remaining)
        if limit is not None:
            QuotaDay.objects.filter(pk=quota.pk).update(limit_reported=limit)
        return remaining

    def sync_from_status(self, limit_day: int | None, used_day: int | None) -> None:
        quota = self.today()
        if limit_day is not None:
            quota.limit_reported = limit_day
        if limit_day is not None and used_day is not None:
            quota.remaining_reported = max(0, limit_day - used_day)
        quota.save()


def _to_int(value) -> int | None:
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


class ProviderClient:
    """Envoie les requetes en respectant quota, cache et journal.

    `check_body` : fonction propre au fournisseur qui leve l'erreur adaptee quand la
    reponse HTTP 200 contient en realite une erreur (cas d'API-Football).
    """

    def __init__(
        self,
        config: DataProviderConfig,
        transport: Transport,
        *,
        check_body: Callable[[object], None] | None = None,
        cache=default_cache,
    ):
        self.config = config
        self.transport = transport
        self.quota = QuotaManager(config, cache)
        self.cache = cache
        self.check_body = check_body or (lambda body: None)
        self.stats = {"http_calls": 0, "cache_hits": 0}

    def get(
        self,
        path: str,
        params: dict | None = None,
        *,
        priority: Priority = Priority.RESULTS,
        ttl: int = 0,
        count_quota: bool = True,
        refresh: bool = False,
    ):
        params = {k: str(v) for k, v in (params or {}).items()}
        cache_key = None
        if ttl:
            digest = hashlib.sha256(json.dumps([path, sorted(params.items())]).encode()).hexdigest()[:32]
            cache_key = f"provider:{self.config.slug}:{digest}"
            cached = None if refresh else self.cache.get(cache_key)  # refresh : on ignore le cache
            if cached is not None:
                self.stats["cache_hits"] += 1
                return cached

        if not self.config.is_active:
            raise ProviderDisabled("Fournisseur desactive.")
        if count_quota:
            if not self.quota.can_spend(priority):
                raise QuotaExceeded(f"Quota reserve (priorite {priority.name}).")
            if not self.quota.minute_ok():
                raise QuotaExceeded("Limite par minute atteinte.")

        try:
            raw: RawResponse = self.transport.get(path, params)
        except ProviderUnavailable as exc:
            self._log(path, params, None, False, str(exc), 0, None)
            raise

        self.stats["http_calls"] += 1
        remaining = self.quota.record_call(raw.headers) if count_quota else None
        error = ""
        try:
            self._check_http_status(raw)
            self.check_body(raw.body)
        except ProviderError as exc:
            error = str(exc)[:300]
            self._log(path, params, raw.status_code, False, error, raw.latency_ms, remaining)
            raise
        self._log(path, params, raw.status_code, True, "", raw.latency_ms, remaining)

        if cache_key:
            self.cache.set(cache_key, raw.body, ttl)
        return raw.body

    @staticmethod
    def _check_http_status(raw: RawResponse) -> None:
        if raw.status_code in (401, 403):
            raise ProviderAuthError("Cle d'API refusee.")
        if raw.status_code == 429:
            raise QuotaExceeded("Le fournisseur a repondu 429 (trop de requetes).")
        if raw.status_code >= 500:
            raise ProviderUnavailable(f"Erreur du fournisseur ({raw.status_code}).")
        if raw.status_code != 200 or not isinstance(raw.body, dict):
            raise ProviderError(f"Reponse inattendue ({raw.status_code}).")

    def _log(self, path, params, status, ok, error, latency, remaining) -> None:
        ApiCallLog.objects.create(
            provider=self.config, endpoint=path[:120], params=params, status_code=status,
            ok=ok, error=error[:300], latency_ms=latency, remaining_after=remaining,
        )

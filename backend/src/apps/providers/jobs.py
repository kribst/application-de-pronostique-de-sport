# -*- coding: utf-8 -*-
"""Taches de synchronisation : decident QUAND appeler le fournisseur (economie de requetes).

Regle d'or : une tache lancee a vide ne coute AUCUNE requete. Chaque tache verifie
d'abord, avec la base seule, qu'un appel est utile :
- calendrier : une requete par competition, seulement si elle est "perimee" ;
- direct     : seulement s'il y a un match en cours ou imminent, et pas plus souvent
               que live_min_interval_seconds ;
- resultats en retard : une requete (20 matchs) quand des matchs auraient du finir ;
- evenements : une requete (20 matchs) pour les matchs termines, une seule fois ;
- equipes    : une fois par semaine.
"""
from __future__ import annotations

import datetime
import logging
from typing import Callable

from django.core.cache import cache
from django.utils import timezone

from apps.matches.models import Match, MatchStatus

from .data_providers.base import (
    DataProvider, ProviderAuthError, ProviderDisabled, ProviderError, ProviderPlanError,
    ProviderUnavailable, QuotaExceeded,
)
from .data_providers.quota import QuotaManager
from .models import DataProviderConfig, SyncCursor, TaskLog, TaskStatus
from .sync import SyncService

logger = logging.getLogger(__name__)

LIVE_BEFORE = datetime.timedelta(minutes=10)
LIVE_AFTER = datetime.timedelta(hours=3)
PENDING = (MatchStatus.SCHEDULED, MatchStatus.LIVE, MatchStatus.SUSPENDED)
ACTIVE_BEFORE = datetime.timedelta(hours=6)
ACTIVE_AFTER = datetime.timedelta(hours=36)
DETAILS_MAX_AGE = datetime.timedelta(days=7)
STALE_RETRY = datetime.timedelta(minutes=30)
PLAN_RETRY = datetime.timedelta(hours=6)  # delai avant de retenter apres "offre insuffisante"
PLAN_ERROR_PREFIX = "Offre insuffisante"


# --- Journal --------------------------------------------------------------------
def run_logged(name: str, func: Callable[[dict], None]) -> TaskLog:
    """Execute `func(stats)` en journalisant le resultat ; ne leve jamais d'exception."""
    log = TaskLog.objects.create(task=name)
    stats: dict = {}
    status, error = TaskStatus.SUCCESS, ""
    try:
        func(stats)
        if stats.get("skipped"):
            status = TaskStatus.SKIPPED
        elif stats.get("errors") or stats.get("rejected") or stats.get("quota_blocked"):
            status = TaskStatus.PARTIAL
    except ProviderDisabled as exc:
        status, error = TaskStatus.SKIPPED, str(exc)
    except QuotaExceeded as exc:
        status, error = TaskStatus.PARTIAL, str(exc)
    except (ProviderAuthError, ProviderPlanError, ProviderUnavailable, ProviderError) as exc:
        status, error = TaskStatus.FAILED, f"{type(exc).__name__}: {exc}"
    except Exception as exc:  # noqa: BLE001 - une tache periodique ne doit jamais planter Celery
        logger.exception("Echec inattendu de la tache %s", name)
        status, error = TaskStatus.FAILED, f"{type(exc).__name__}: {exc}"
    log.status, log.error = status, error[:500]
    log.stats, log.finished_at = {k: v for k, v in stats.items() if v}, timezone.now()
    log.save()
    return log


def _merge(stats: dict, service_stats) -> None:
    for key, value in service_stats.items():
        stats[key] = stats.get(key, 0) + value


# --- Curseurs ------------------------------------------------------------------
def _cursor(provider: str, key: str) -> SyncCursor:
    cursor, _ = SyncCursor.objects.get_or_create(provider=provider, key=key)
    return cursor


def _is_due(cursor: SyncCursor, minutes: int, now) -> bool:
    return cursor.last_success_at is None or now - cursor.last_success_at >= datetime.timedelta(minutes=minutes)


def _plan_blocked(cursor: SyncCursor, now) -> bool:
    """Vrai si la derniere tentative a echoue faute d'offre adequate il y a moins de 6 h."""
    return bool(
        cursor.last_error.startswith(PLAN_ERROR_PREFIX)
        and cursor.last_attempt_at
        and now - cursor.last_attempt_at < PLAN_RETRY
    )


def _plan_message(exc: Exception) -> str:
    text = str(exc)
    return text if text.startswith(PLAN_ERROR_PREFIX) else f"{PLAN_ERROR_PREFIX} : {text}"


def _mark(cursor: SyncCursor, now, error: str = "") -> None:
    cursor.last_attempt_at = now
    if error:
        cursor.last_error = error[:300]
    else:
        cursor.last_success_at, cursor.last_error = now, ""
    cursor.save()


# --- Decisions (base de donnees uniquement, aucune requete HTTP) -----------------------
def live_window_active(provider_slug: str, now) -> bool:
    return Match.objects.filter(
        external_ids__provider=provider_slug, status__in=PENDING,
        kickoff_at__gte=now - LIVE_AFTER, kickoff_at__lte=now + LIVE_BEFORE,
    ).exists()


def competition_is_active(competition, now) -> bool:
    return Match.objects.filter(
        competition=competition, kickoff_at__gte=now - ACTIVE_BEFORE, kickoff_at__lte=now + ACTIVE_AFTER,
    ).exists()


def stale_match_ids(provider_slug: str, now, limit: int = 20) -> list[str]:
    """Matchs qui auraient du etre termines mais ne le sont pas dans notre base."""
    return list(
        Match.objects.filter(
            external_ids__provider=provider_slug, status__in=PENDING, kickoff_at__lt=now - LIVE_AFTER,
        ).order_by("kickoff_at").values_list("external_ids__external_id", flat=True)[:limit]
    )


# --- Jobs ------------------------------------------------------------------------------
def sync_fixtures_job(provider: DataProvider, config: DataProviderConfig, stats: dict, *, force=False,
                      only: str | None = None, season: int | None = None):
    """Calendrier + resultats. `season` : annee de depart d'une saison precise (ex. 2024), sinon la saison courante."""
    service, now = SyncService(provider), timezone.now()
    for competition, ref in service.mapped_competitions():
        if only and competition.slug != only:
            continue
        year = season
        if year is None:
            current = competition.seasons.filter(is_current=True).first()
            if current is None:
                stats["no_current_season"] = stats.get("no_current_season", 0) + 1
                continue
            year = current.year_start
        cursor = _cursor(provider.slug, f"fixtures:{competition.slug}:{year}")
        minutes = (
            config.fixtures_refresh_minutes if competition_is_active(competition, now)
            else config.fixtures_quiet_refresh_minutes
        )
        plan_cursor = _cursor(provider.slug, f"plan:{year}")  # l'offre limite des SAISONS, pas des competitions
        if not force and _plan_blocked(plan_cursor, now):
            stats["plan_blocked"] = stats.get("plan_blocked", 0) + 1
            continue
        if not force and not _is_due(cursor, minutes, now):
            stats["fresh"] = stats.get("fresh", 0) + 1
            continue
        try:
            service.stats.clear()
            service.sync_fixtures(competition, ref, year, refresh=force)
            _merge(stats, service.stats)
            _mark(cursor, now)
            _mark(plan_cursor, now)  # un succes leve le blocage (ex. apres passage au plan Pro)
            stats["competitions"] = stats.get("competitions", 0) + 1
        except QuotaExceeded as exc:
            _mark(cursor, now, str(exc))
            stats["quota_blocked"] = stats.get("quota_blocked", 0) + 1
            break  # inutile d'insister : les autres competitions seront bloquees aussi
        except ProviderPlanError as exc:
            _mark(cursor, now, _plan_message(exc))
            _mark(plan_cursor, now, _plan_message(exc))
            raise
        except (ProviderAuthError, ProviderUnavailable) as exc:
            _mark(cursor, now, str(exc))
            raise
    if stats.get("plan_blocked") and not stats.get("competitions"):
        stats["skipped"] = "offre insuffisante pour cette saison (nouvel essai dans 6 h)"


def sync_reference_job(provider: DataProvider, config: DataProviderConfig, stats: dict, *, force=False,
                       only: str | None = None, season: int | None = None):
    """Equipes d'une competition. `season` : annee de depart d'une saison precise, sinon la saison courante."""
    service, now = SyncService(provider), timezone.now()
    for competition, ref in service.mapped_competitions():
        if only and competition.slug != only:
            continue
        year = season
        if year is None:
            current = competition.seasons.filter(is_current=True).first()
            if current is None:
                continue
            year = current.year_start
        cursor = _cursor(provider.slug, f"teams:{competition.slug}:{year}")
        plan_cursor = _cursor(provider.slug, f"plan:{year}")  # l'offre limite des SAISONS, pas des competitions
        if not force and _plan_blocked(plan_cursor, now):
            stats["plan_blocked"] = stats.get("plan_blocked", 0) + 1
            continue
        if not force and not _is_due(cursor, config.reference_refresh_days * 1440, now):
            stats["fresh"] = stats.get("fresh", 0) + 1
            continue
        try:
            service.stats.clear()
            service.sync_reference(competition, ref, year, refresh=force)
            _merge(stats, service.stats)
            _mark(cursor, now)
            _mark(plan_cursor, now)  # un succes leve le blocage (ex. apres passage au plan Pro)
            stats["competitions"] = stats.get("competitions", 0) + 1
        except QuotaExceeded as exc:
            _mark(cursor, now, str(exc))
            stats["quota_blocked"] = stats.get("quota_blocked", 0) + 1
            break
        except ProviderPlanError as exc:
            _mark(cursor, now, _plan_message(exc))
            _mark(plan_cursor, now, _plan_message(exc))
            raise
        except (ProviderAuthError, ProviderUnavailable) as exc:
            _mark(cursor, now, str(exc))
            raise
    if stats.get("plan_blocked") and not stats.get("competitions"):
        stats["skipped"] = "offre insuffisante pour cette saison (nouvel essai dans 6 h)"


def sync_live_job(provider: DataProvider, config: DataProviderConfig, stats: dict, *, force=False):
    now = timezone.now()
    if not force:
        if not live_window_active(provider.slug, now):
            stats["skipped"] = "aucun match en cours ou imminent"
            return
        key = f"live:last:{provider.slug}"
        last = cache.get(key)
        if last and (now - last).total_seconds() < config.live_min_interval_seconds:
            stats["skipped"] = "delai minimal entre deux interrogations"
            return
        cache.set(key, now, timeout=config.live_min_interval_seconds * 2)  # avant l'appel : evite les appels doubles
    service = SyncService(provider)
    service.sync_live()
    _merge(stats, service.stats)


def sync_stale_job(provider: DataProvider, config: DataProviderConfig, stats: dict):
    """Rattrape les matchs dont le resultat final manque (1 requete pour 20 matchs)."""
    now = timezone.now()
    ids = stale_match_ids(provider.slug, now)
    if not ids:
        stats["skipped"] = "aucun match en retard"
        return
    cursor = _cursor(provider.slug, "stale")
    if cursor.last_attempt_at and now - cursor.last_attempt_at < STALE_RETRY:
        stats["skipped"] = "dernier rattrapage trop recent"
        return
    _mark(cursor, now)  # horodate la tentative meme en cas d'echec
    service = SyncService(provider)
    service.sync_by_ids(ids)
    _merge(stats, service.stats)


def sync_details_job(provider: DataProvider, config: DataProviderConfig, stats: dict):
    """Evenements des matchs termines : une seule fois par match, 20 matchs par requete."""
    now = timezone.now()
    ids = list(
        Match.objects.filter(
            external_ids__provider=provider.slug, status=MatchStatus.FINISHED,
            details_synced_at__isnull=True, kickoff_at__gte=now - DETAILS_MAX_AGE,
        ).order_by("kickoff_at").values_list("external_ids__external_id", flat=True)[:20]
    )
    if not ids:
        stats["skipped"] = "aucun match termine sans details"
        return
    service = SyncService(provider)
    service.sync_by_ids(ids, with_details=True)
    _merge(stats, service.stats)


def monitor_quota_job(provider: DataProvider, config: DataProviderConfig, stats: dict):
    """Relit le quota reel (/status ne consomme pas de requete) et alerte s'il est bas."""
    info = provider.fetch_quota()
    manager = QuotaManager(config)
    manager.sync_from_status(info.limit_day, info.used_day)
    limit, remaining = manager.limit(), manager.remaining()
    stats["remaining"], stats["limit"] = remaining, limit
    if limit and remaining / limit < 0.2:
        logger.warning("Quota %s bas : %s/%s requetes restantes.", provider.slug, remaining, limit)
        stats["errors"] = 1  # fait passer la tache en PARTIAL (visible dans l'admin)

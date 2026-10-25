# -*- coding: utf-8 -*-
"""Taches Celery de synchronisation (cahier §17). Planification : CELERY_BEAT_SCHEDULE.

Toutes sont sans danger a lancer souvent : elles verifient d'abord, avec la base seule,
qu'un appel au fournisseur est utile (voir jobs.py), et s'ignorent sans cle d'API.
"""
from celery import shared_task

from . import jobs
from .factory import build_provider, get_config


def _run(name, job, **kwargs):
    def execute(stats):
        config = get_config()
        job(build_provider(config), config, stats, **kwargs)

    log = jobs.run_logged(name, execute)
    return {"task": name, "status": log.status, "stats": log.stats}


@shared_task(name="apps.providers.tasks.sync_fixtures")
def sync_fixtures(force=False, competition=None):
    return _run("sync_fixtures", jobs.sync_fixtures_job, force=force, only=competition)


@shared_task(name="apps.providers.tasks.sync_live")
def sync_live(force=False):
    return _run("sync_live", jobs.sync_live_job, force=force)


@shared_task(name="apps.providers.tasks.sync_stale_results")
def sync_stale_results():
    return _run("sync_stale_results", jobs.sync_stale_job)


@shared_task(name="apps.providers.tasks.sync_details")
def sync_details():
    return _run("sync_details", jobs.sync_details_job)


@shared_task(name="apps.providers.tasks.sync_reference")
def sync_reference(force=False, competition=None):
    return _run("sync_reference", jobs.sync_reference_job, force=force, only=competition)


@shared_task(name="apps.providers.tasks.monitor_quota")
def monitor_quota():
    return _run("monitor_quota", jobs.monitor_quota_job)

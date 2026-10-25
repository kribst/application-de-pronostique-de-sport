# -*- coding: utf-8 -*-
"""Affiche l'etat du fournisseur : quota, derniers appels, dernieres synchronisations."""
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.providers import jobs
from apps.providers.data_providers.base import ProviderError
from apps.providers.data_providers.quota import QuotaManager
from apps.providers.factory import build_provider, get_config
from apps.providers.models import ApiCallLog, SyncCursor, TaskLog


class Command(BaseCommand):
    help = "Etat du fournisseur de donnees. --remote interroge /status (ne consomme pas de requete)."

    def add_arguments(self, parser):
        parser.add_argument("--remote", action="store_true", help="Relit le quota reel chez le fournisseur.")

    def handle(self, *args, **options):
        config = get_config()
        if options["remote"]:
            log = jobs.run_logged("monitor_quota", lambda stats: jobs.monitor_quota_job(build_provider(config), config, stats))
            self.stdout.write(f"/status : {log.status} {log.stats} {log.error}")
        manager = QuotaManager(config)
        quota = manager.today()
        self.stdout.write(self.style.MIGRATE_HEADING(f"{config.name} ({'actif' if config.is_active else 'DESACTIVE'})"))
        self.stdout.write(f"Quota du jour : {quota.used} requetes comptees ; restant {manager.remaining()}/{manager.limit()}")
        self.stdout.write(f"Appels aujourd'hui : {ApiCallLog.objects.filter(created_at__date=timezone.now().date()).count()}")
        self.stdout.write("Dernieres taches :")
        for log in TaskLog.objects.all()[:8]:
            self.stdout.write(f"  {log.started_at:%d/%m %H:%M} {log.task:<20} {log.status:<8} {log.stats or ''} {log.error}")
        self.stdout.write("Curseurs :")
        for cursor in SyncCursor.objects.all()[:12]:
            self.stdout.write(f"  {cursor.key:<40} ok={cursor.last_success_at:%d/%m %H:%M}" if cursor.last_success_at
                              else f"  {cursor.key:<40} jamais ({cursor.last_error})")

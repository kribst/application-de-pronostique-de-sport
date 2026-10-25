# -*- coding: utf-8 -*-
"""Administration des fournisseurs : configuration, quotas, journaux, lancement manuel."""
from django.contrib import admin, messages

from . import jobs
from .factory import build_provider
from .models import ApiCallLog, DataProviderConfig, QuotaDay, SyncCursor, TaskLog


class ReadOnlyAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(DataProviderConfig)
class DataProviderConfigAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active", "daily_limit", "per_minute_limit", "live_min_interval_seconds")
    actions = ["action_sync_fixtures", "action_sync_reference", "action_refresh_quota"]

    def _run(self, request, queryset, name, job, **kwargs):
        for config in queryset:
            def execute(stats, config=config):
                job(build_provider(config), config, stats, **kwargs)

            log = jobs.run_logged(name, execute)
            level = messages.SUCCESS if log.status in ("SUCCESS", "SKIPPED") else messages.WARNING
            if log.status == "FAILED":
                level = messages.ERROR
            self.message_user(request, f"{config.name} - {name} : {log.status} {log.stats or ''} {log.error}", level)

    @admin.action(description="Synchroniser calendrier et resultats (forcer)")
    def action_sync_fixtures(self, request, queryset):
        self._run(request, queryset, "sync_fixtures", jobs.sync_fixtures_job, force=True)

    @admin.action(description="Synchroniser les equipes (forcer)")
    def action_sync_reference(self, request, queryset):
        self._run(request, queryset, "sync_reference", jobs.sync_reference_job, force=True)

    @admin.action(description="Rafraichir le quota (ne consomme pas de requete)")
    def action_refresh_quota(self, request, queryset):
        self._run(request, queryset, "monitor_quota", jobs.monitor_quota_job)


@admin.register(QuotaDay)
class QuotaDayAdmin(ReadOnlyAdmin):
    list_display = ("provider", "day", "used", "remaining_reported", "limit_reported")
    list_filter = ("provider",)


@admin.register(ApiCallLog)
class ApiCallLogAdmin(ReadOnlyAdmin):
    list_display = ("created_at", "endpoint", "params", "status_code", "ok", "remaining_after", "latency_ms")
    list_filter = ("provider", "ok", "endpoint")
    date_hierarchy = "created_at"


@admin.register(TaskLog)
class TaskLogAdmin(ReadOnlyAdmin):
    list_display = ("started_at", "task", "status", "stats", "error")
    list_filter = ("task", "status")
    date_hierarchy = "started_at"


@admin.register(SyncCursor)
class SyncCursorAdmin(ReadOnlyAdmin):
    list_display = ("provider", "key", "last_success_at", "last_attempt_at", "last_error")
    list_filter = ("provider",)

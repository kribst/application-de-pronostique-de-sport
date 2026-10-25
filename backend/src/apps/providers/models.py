# -*- coding: utf-8 -*-
"""Modeles de l'app providers (cahier §4 modules 14-15, roadmap phase 5).

La cle d'API n'est JAMAIS stockee ici : elle vient de l'environnement (.env).
"""
from django.db import models


class DataProviderConfig(models.Model):
    """Reglages d'un fournisseur de donnees, modifiables dans l'admin (sans redeploiement).

    Les valeurs par defaut correspondent au plan GRATUIT d'API-Football
    (100 requetes/jour, 10/minute). En changeant de plan, ajuster ces champs.
    """

    slug = models.SlugField(max_length=40, unique=True)  # ex. "api-football"
    name = models.CharField(max_length=80)
    is_active = models.BooleanField(default=True)

    # --- Quotas du plan souscrit ---
    daily_limit = models.PositiveIntegerField(default=100, help_text="Requetes par jour (UTC).")
    per_minute_limit = models.PositiveSmallIntegerField(default=10)

    # --- Politique d'economie de requetes ---
    reserve_live_pct = models.PositiveSmallIntegerField(
        default=20,
        help_text="% du quota reserve au direct : calendrier/resultats s'arretent en dessous.",
    )
    reference_floor_pct = models.PositiveSmallIntegerField(
        default=40,
        help_text="% du quota sous lequel on ne rafraichit plus equipes/details.",
    )
    live_min_interval_seconds = models.PositiveIntegerField(
        default=900, help_text="Delai minimal entre deux interrogations 'en direct'."
    )
    fixtures_refresh_minutes = models.PositiveIntegerField(
        default=360, help_text="Rafraichissement du calendrier d'une competition ACTIVE."
    )
    fixtures_quiet_refresh_minutes = models.PositiveIntegerField(
        default=1440, help_text="Rafraichissement d'une competition sans match proche."
    )
    reference_refresh_days = models.PositiveSmallIntegerField(default=7)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "fournisseur de donnees"
        verbose_name_plural = "fournisseurs de donnees"

    def __str__(self):
        return self.name


class QuotaDay(models.Model):
    """Consommation de requetes d'un fournisseur pour un jour UTC."""

    provider = models.ForeignKey(DataProviderConfig, on_delete=models.CASCADE, related_name="quota_days")
    day = models.DateField()
    used = models.PositiveIntegerField(default=0)  # requetes comptees par nous
    limit_reported = models.PositiveIntegerField(null=True, blank=True)  # annoncee par le fournisseur
    remaining_reported = models.IntegerField(null=True, blank=True)  # restante selon le fournisseur
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-day"]
        constraints = [
            models.UniqueConstraint(fields=["provider", "day"], name="quotaday_provider_day_unique"),
        ]

    def __str__(self):
        return f"{self.provider} {self.day}: {self.used}"


class ApiCallLog(models.Model):
    """Une requete reellement envoyee au fournisseur (les reponses en cache n'y figurent pas)."""

    provider = models.ForeignKey(DataProviderConfig, on_delete=models.CASCADE, related_name="calls")
    endpoint = models.CharField(max_length=120)
    params = models.JSONField(default=dict, blank=True)
    status_code = models.PositiveSmallIntegerField(null=True, blank=True)
    ok = models.BooleanField(default=False)
    error = models.CharField(max_length=300, blank=True)
    latency_ms = models.PositiveIntegerField(default=0)
    remaining_after = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["provider", "created_at"], name="apicall_provider_date_idx")]

    def __str__(self):
        return f"{self.endpoint} {self.status_code}"


class TaskStatus(models.TextChoices):
    RUNNING = "RUNNING", "En cours"
    SUCCESS = "SUCCESS", "Reussi"
    PARTIAL = "PARTIAL", "Partiel"
    SKIPPED = "SKIPPED", "Ignore"
    FAILED = "FAILED", "Echec"


class TaskLog(models.Model):
    """Journal d'execution des synchronisations (cahier §4 module 15)."""

    task = models.CharField(max_length=80, db_index=True)
    status = models.CharField(max_length=10, choices=TaskStatus.choices, default=TaskStatus.RUNNING)
    started_at = models.DateTimeField(auto_now_add=True, db_index=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    stats = models.JSONField(default=dict, blank=True)
    error = models.CharField(max_length=500, blank=True)

    class Meta:
        ordering = ["-started_at"]

    def __str__(self):
        return f"{self.task} {self.status}"


class SyncCursor(models.Model):
    """Derniere synchronisation d'une ressource (ex. "fixtures:ligue-1:2026").

    Sert a ne rafraichir une ressource que lorsque c'est necessaire.
    """

    provider = models.SlugField(max_length=40)
    key = models.CharField(max_length=120)
    last_attempt_at = models.DateTimeField(null=True, blank=True)
    last_success_at = models.DateTimeField(null=True, blank=True)
    last_error = models.CharField(max_length=300, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["provider", "key"], name="synccursor_provider_key_unique"),
        ]

    def __str__(self):
        return f"{self.provider}/{self.key}"

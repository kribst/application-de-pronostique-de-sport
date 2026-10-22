# Models de l'app sports (cahier §4 modules 2-5, 16).
# Roadmap phase 2 : Sport, SportType, SportMarket, Country, Competition,
# Season, Round, Team, TeamSeasonStat, Player, PlayerStat.
# Fichier volontairement vide pour l'instant : aucun modele metier ici.



# -*- coding: utf-8 -*-
"""Referentiel sportif (cahier modules 2-3). Equipes (phase 3). Joueurs : phase suivante."""
import uuid

from django.db import models
from django.db.models import Q


class SportType(models.TextChoices):
    TEAM = "TEAM", "Sport collectif"
    INDIVIDUAL = "INDIVIDUAL", "Sport individuel"


class Sport(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=60, unique=True)
    slug = models.SlugField(max_length=60, unique=True)
    sport_type = models.CharField(max_length=12, choices=SportType.choices, default=SportType.TEAM)
    is_active = models.BooleanField(default=False, db_index=True)
    position = models.PositiveSmallIntegerField(default=0)
    # Parametres propres au sport (duree d'un match, regles...) sans migration.
    config = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["position", "name"]

    def __str__(self):
        return self.name


class SportMarket(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sport = models.ForeignKey(Sport, on_delete=models.CASCADE, related_name="markets")
    market_type = models.CharField(max_length=40)  # ex. "1X2", "OVER_UNDER"
    name = models.CharField(max_length=80)
    params = models.JSONField(default=dict, blank=True)  # ex. {"lines": [1.5, 2.5]}
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["sport", "name"]
        constraints = [
            models.UniqueConstraint(fields=["sport", "market_type"], name="sportmarket_unique"),
        ]

    def __str__(self):
        return f"{self.sport} - {self.name}"


class Country(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=80, unique=True)
    code = models.CharField(max_length=10, unique=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "countries"

    def __str__(self):
        return self.name


class Competition(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sport = models.ForeignKey(Sport, on_delete=models.PROTECT, related_name="competitions")
    # Null pour les competitions internationales (Ligue des champions...).
    country = models.ForeignKey(
        Country, null=True, blank=True, on_delete=models.PROTECT, related_name="competitions"
    )
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=120)
    tier = models.PositiveSmallIntegerField(default=1)
    is_active = models.BooleanField(default=True, db_index=True)
    # Identifiants chez les fournisseurs, ex. {"api-football": 39} (phase 5).
    external_ids = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["tier", "name"]
        constraints = [
            models.UniqueConstraint(fields=["sport", "slug"], name="competition_sport_slug_unique"),
        ]

    def __str__(self):
        return self.name


class Season(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    competition = models.ForeignKey(Competition, on_delete=models.CASCADE, related_name="seasons")
    year_start = models.PositiveSmallIntegerField()
    year_end = models.PositiveSmallIntegerField()
    is_current = models.BooleanField(default=False)

    class Meta:
        ordering = ["-year_start"]
        constraints = [
            models.UniqueConstraint(fields=["competition", "year_start"], name="season_unique"),
            models.UniqueConstraint(
                fields=["competition"], condition=Q(is_current=True), name="season_one_current"
            ),
            models.CheckConstraint(
                condition=Q(year_end__gte=models.F("year_start")), name="season_years_valid"
            ),
        ]

    @property
    def label(self):
        if self.year_end == self.year_start:
            return str(self.year_start)
        return f"{self.year_start}/{self.year_end}"

    def __str__(self):
        return f"{self.competition} {self.label}"


class Round(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    season = models.ForeignKey(Season, on_delete=models.CASCADE, related_name="rounds")
    number = models.PositiveSmallIntegerField()
    name = models.CharField(max_length=80, blank=True)

    class Meta:
        ordering = ["season", "number"]
        constraints = [
            models.UniqueConstraint(fields=["season", "number"], name="round_unique"),
        ]

    def __str__(self):
        return self.name or f"Journee {self.number}"


class Venue(models.Model):
    """Stade. Partage possible entre equipes (San Siro, Stade olympique de Rome...)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=120)
    city = models.CharField(max_length=80, blank=True)
    country = models.ForeignKey(
        Country, null=True, blank=True, on_delete=models.PROTECT, related_name="venues"
    )
    capacity = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(fields=["name", "city"], name="venue_name_city_unique"),
        ]

    def __str__(self):
        return f"{self.name} ({self.city})" if self.city else self.name


class Team(models.Model):
    """Equipe (club ou selection), independante d'une competition.

    Une equipe joue plusieurs competitions et change de championnat au fil des
    saisons : le lien equipe <-> competition passe par TeamSeasonStat.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sport = models.ForeignKey(Sport, on_delete=models.PROTECT, related_name="teams")
    country = models.ForeignKey(
        Country, null=True, blank=True, on_delete=models.PROTECT, related_name="teams"
    )
    venue = models.ForeignKey(
        Venue, null=True, blank=True, on_delete=models.SET_NULL, related_name="teams"
    )
    name = models.CharField(max_length=120)
    short_name = models.CharField(max_length=30, blank=True)
    slug = models.SlugField(max_length=120)
    founded_year = models.PositiveSmallIntegerField(null=True, blank=True)
    logo_url = models.URLField(max_length=300, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(fields=["sport", "slug"], name="team_sport_slug_unique"),
        ]

    def __str__(self):
        return self.name


class TeamExternalId(models.Model):
    """Identifiant d'une equipe chez un fournisseur de donnees (phase 5).

    Table dediee (et non un champ JSON) pour que la base garantisse qu'un meme
    identifiant externe ne designe jamais deux equipes pour un fournisseur.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="external_ids")
    provider = models.CharField(max_length=40)  # ex. "api-football"
    external_id = models.CharField(max_length=64)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["provider", "external_id"], name="teamexternalid_provider_id_unique"
            ),
            models.UniqueConstraint(
                fields=["team", "provider"], name="teamexternalid_team_provider_unique"
            ),
        ]

    def save(self, *args, **kwargs):
        self.provider = self.provider.strip().lower()
        self.external_id = str(self.external_id).strip()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.provider}:{self.external_id}"


class TeamSeasonStat(models.Model):
    """Participation d'une equipe a une saison (donc a une competition) + stats."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="season_stats")
    season = models.ForeignKey(Season, on_delete=models.CASCADE, related_name="team_stats")
    # Schema variable selon le sport (cahier §6), ex. {"played": 10, "points": 23}.
    stats = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-season__year_start", "team__name"]
        constraints = [
            models.UniqueConstraint(fields=["team", "season"], name="teamseasonstat_unique"),
        ]

    def __str__(self):
        return f"{self.team} - {self.season}"

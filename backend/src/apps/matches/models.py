# -*- coding: utf-8 -*-
"""Matchs et evenements de match (roadmap phase 4, cahier §4 module 6).

Regles de conception :
- kickoff_at est un datetime AWARE, stocke en UTC par Django (USE_TZ=True) ;
  la conversion vers le fuseau de l'utilisateur se fait a l'affichage.
- le statut ne peut evoluer que selon ALLOWED_TRANSITIONS (voir Match.clean).
- Statistiques, compositions, blessures : phases suivantes (MatchStat, Lineup...).
"""
import uuid

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import F, Q
from django.utils import timezone

from apps.sports.models import Competition, Round, Season, Team, Venue


class MatchStatus(models.TextChoices):
    SCHEDULED = "SCHEDULED", "Programme"
    LIVE = "LIVE", "En direct"
    FINISHED = "FINISHED", "Termine"
    POSTPONED = "POSTPONED", "Reporte"
    CANCELLED = "CANCELLED", "Annule"
    SUSPENDED = "SUSPENDED", "Suspendu"


# Transitions autorisees (statut actuel -> statuts suivants possibles).
# SCHEDULED -> FINISHED est permis : une synchronisation toutes les 5-10 minutes
# peut manquer la phase "en direct" d'un match.
# FINISHED et CANCELLED sont terminaux (on peut corriger le score, pas le statut).
ALLOWED_TRANSITIONS = {
    MatchStatus.SCHEDULED: {
        MatchStatus.LIVE, MatchStatus.FINISHED, MatchStatus.POSTPONED, MatchStatus.CANCELLED,
    },
    MatchStatus.LIVE: {MatchStatus.FINISHED, MatchStatus.SUSPENDED},
    MatchStatus.SUSPENDED: {
        MatchStatus.LIVE, MatchStatus.FINISHED, MatchStatus.POSTPONED, MatchStatus.CANCELLED,
    },
    MatchStatus.POSTPONED: {MatchStatus.SCHEDULED, MatchStatus.CANCELLED},
    MatchStatus.FINISHED: set(),
    MatchStatus.CANCELLED: set(),
}

SCORELESS_STATUSES = {MatchStatus.SCHEDULED, MatchStatus.POSTPONED, MatchStatus.CANCELLED}


class Match(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    competition = models.ForeignKey(Competition, on_delete=models.PROTECT, related_name="matches")
    season = models.ForeignKey(Season, on_delete=models.PROTECT, related_name="matches")
    round = models.ForeignKey(
        Round, null=True, blank=True, on_delete=models.SET_NULL, related_name="matches"
    )
    home_team = models.ForeignKey(Team, on_delete=models.PROTECT, related_name="home_matches")
    away_team = models.ForeignKey(Team, on_delete=models.PROTECT, related_name="away_matches")
    kickoff_at = models.DateTimeField()  # toujours aware ; stocke en UTC
    status = models.CharField(
        max_length=12, choices=MatchStatus.choices, default=MatchStatus.SCHEDULED
    )
    score_home = models.PositiveSmallIntegerField(null=True, blank=True)
    score_away = models.PositiveSmallIntegerField(null=True, blank=True)
    referee = models.CharField(max_length=120, blank=True)
    venue = models.ForeignKey(
        Venue, null=True, blank=True, on_delete=models.SET_NULL, related_name="matches"
    )
    weather = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["kickoff_at"]
        verbose_name_plural = "matches"
        indexes = [
            models.Index(fields=["kickoff_at", "status"], name="match_kickoff_status_idx"),
            models.Index(fields=["competition", "kickoff_at"], name="match_comp_kickoff_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=~Q(home_team=F("away_team")), name="match_home_differs_from_away"
            ),
            models.CheckConstraint(
                condition=(
                    Q(score_home__isnull=True, score_away__isnull=True)
                    | Q(score_home__isnull=False, score_away__isnull=False)
                ),
                name="match_scores_both_or_none",
            ),
            models.UniqueConstraint(
                fields=["season", "home_team", "away_team", "kickoff_at"],
                name="match_unique_fixture",
            ),
        ]

    def __str__(self):
        return f"{self.home_team} - {self.away_team} ({self.kickoff_at:%Y-%m-%d})"

    # -- suivi du statut charge depuis la base -------------------------------
    @classmethod
    def from_db(cls, db, field_names, values):
        instance = super().from_db(db, field_names, values)
        instance._loaded_status = instance.status if "status" in field_names else None
        return instance

    # -- validation -----------------------------------------------------------
    def clean(self):
        errors = {}

        if self.kickoff_at is not None and timezone.is_naive(self.kickoff_at):
            errors["kickoff_at"] = "La date doit contenir un fuseau horaire (datetime aware)."

        if self.home_team_id and self.home_team_id == self.away_team_id:
            errors["away_team"] = "Une equipe ne peut pas jouer contre elle-meme."

        if self.season_id and self.competition_id and self.season.competition_id != self.competition_id:
            errors["season"] = "Cette saison n'appartient pas a la competition choisie."

        if self.competition_id:
            sport_id = self.competition.sport_id
            for field in ("home_team", "away_team"):
                team = getattr(self, field, None) if getattr(self, f"{field}_id") else None
                if team is not None and team.sport_id != sport_id:
                    errors[field] = "Cette equipe n'appartient pas au sport de la competition."

        status = MatchStatus(self.status) if self.status in MatchStatus.values else None
        if status is None:
            errors["status"] = "Statut inconnu."
        else:
            has_home, has_away = self.score_home is not None, self.score_away is not None
            if has_home != has_away:
                errors["score_home"] = "Renseignez les deux scores ou aucun."
            elif status in SCORELESS_STATUSES and has_home:
                errors["score_home"] = "Un match non commence/reporte/annule n'a pas de score."
            elif status == MatchStatus.FINISHED and not has_home:
                errors["score_home"] = "Un match termine doit avoir un score."

            loaded = getattr(self, "_loaded_status", None)
            if loaded and loaded != status and status not in ALLOWED_TRANSITIONS[MatchStatus(loaded)]:
                errors["status"] = (
                    f"Transition de statut interdite : {loaded} -> {status}."
                )

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        # Garde-fou a chaque sauvegarde (import, admin, shell). Les requetes en
        # masse (QuerySet.update / bulk_create) contournent save() : a eviter
        # pour modifier un statut.
        self.clean()
        super().save(*args, **kwargs)
        self._loaded_status = self.status


class MatchExternalId(models.Model):
    """Identifiant d'un match chez un fournisseur de donnees (phase 5).

    Table dediee pour que la base garantisse l'unicite (fournisseur, identifiant),
    comme pour TeamExternalId.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name="external_ids")
    provider = models.CharField(max_length=40)
    external_id = models.CharField(max_length=64)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["provider", "external_id"], name="matchexternalid_provider_id_unique"
            ),
            models.UniqueConstraint(
                fields=["match", "provider"], name="matchexternalid_match_provider_unique"
            ),
        ]

    def save(self, *args, **kwargs):
        self.provider = self.provider.strip().lower()
        self.external_id = str(self.external_id).strip()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.provider}:{self.external_id}"


class MatchEventType(models.TextChoices):
    GOAL = "GOAL", "But"
    OWN_GOAL = "OWN_GOAL", "But contre son camp"
    PENALTY = "PENALTY", "But sur penalty"
    YELLOW_CARD = "YELLOW_CARD", "Carton jaune"
    RED_CARD = "RED_CARD", "Carton rouge"
    SUBSTITUTION = "SUBSTITUTION", "Remplacement"
    VAR = "VAR", "Decision VAR"


class MatchEvent(models.Model):
    """Evenement d'un match. Le joueur est un simple nom en attendant le modele
    Player (phase 9) : il deviendra alors une cle etrangere."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name="events")
    team = models.ForeignKey(
        Team, null=True, blank=True, on_delete=models.SET_NULL, related_name="match_events"
    )
    minute = models.PositiveSmallIntegerField()
    extra_minute = models.PositiveSmallIntegerField(null=True, blank=True)
    type = models.CharField(max_length=14, choices=MatchEventType.choices)
    player_name = models.CharField(max_length=120, blank=True)

    class Meta:
        ordering = ["minute", "extra_minute", "id"]

    def clean(self):
        if self.team_id and self.match_id and self.team_id not in (
            self.match.home_team_id, self.match.away_team_id
        ):
            raise ValidationError({"team": "L'equipe doit etre l'une des deux equipes du match."})

    def __str__(self):
        return f"{self.minute}' {self.type}"

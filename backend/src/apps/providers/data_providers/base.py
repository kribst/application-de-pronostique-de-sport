# -*- coding: utf-8 -*-
"""Contrat commun a tous les fournisseurs de donnees (cahier §3, module 14).

Le metier ne manipule JAMAIS la reponse brute d'un fournisseur : chaque
implementation la convertit en objets ci-dessous (Normalizer), puis le
Validator rejette ce qui est incoherent avant toute ecriture en base.
Changer de fournisseur = ecrire une nouvelle classe DataProvider.
"""
from __future__ import annotations

import datetime
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Sequence


# --- Erreurs -----------------------------------------------------------------
class ProviderError(Exception):
    """Erreur generique du fournisseur."""


class ProviderDisabled(ProviderError):
    """Fournisseur desactive ou cle d'API absente."""


class ProviderAuthError(ProviderError):
    """Cle refusee."""


class ProviderUnavailable(ProviderError):
    """Reseau coupe, delai depasse ou erreur 5xx : reessayer plus tard."""


class QuotaExceeded(ProviderError):
    """Quota (jour ou minute) atteint, ou reserve a un usage plus prioritaire."""


class ProviderPlanError(ProviderError):
    """L'offre souscrite n'a pas acces a cette ressource (ex. saison non incluse)."""


class InvalidPayload(ProviderError):
    """Un element de la reponse est incomplet ou incoherent (il est ecarte)."""


# --- Objets normalises -------------------------------------------------------
@dataclass(frozen=True)
class VenueDTO:
    name: str
    city: str = ""
    capacity: int | None = None


@dataclass(frozen=True)
class TeamDTO:
    external_id: str
    name: str
    country: str = ""
    founded_year: int | None = None
    logo_url: str = ""
    venue: VenueDTO | None = None


@dataclass(frozen=True)
class MatchDTO:
    external_id: str
    league_external_id: str
    season_year: int
    round_label: str
    kickoff_at: datetime.datetime  # aware, UTC
    status: str  # valeur de apps.matches.models.MatchStatus
    home: TeamDTO
    away: TeamDTO
    score_home: int | None = None
    score_away: int | None = None
    referee: str = ""
    venue: VenueDTO | None = None


@dataclass(frozen=True)
class EventDTO:
    minute: int
    extra_minute: int | None
    type: str  # valeur de apps.matches.models.MatchEventType
    team_external_id: str
    player_name: str = ""


@dataclass(frozen=True)
class MatchDetailDTO:
    match_external_id: str
    events: tuple[EventDTO, ...] = ()
    # statistiques par equipe : {identifiant de l'equipe chez le fournisseur: {cle normalisee: valeur}}
    stats: dict = field(default_factory=dict)


@dataclass(frozen=True)
class QuotaInfo:
    plan: str = ""
    limit_day: int | None = None
    used_day: int | None = None


@dataclass
class Batch:
    """Resultat d'un appel : elements valides + motifs des elements ecartes."""

    items: list = field(default_factory=list)
    rejected: list[str] = field(default_factory=list)
    details: dict[str, MatchDetailDTO] = field(default_factory=dict)


# --- Interface ----------------------------------------------------------------
class DataProvider(ABC):
    slug: str

    @abstractmethod
    def fetch_teams(self, league_ref: str, season_year: int, *, refresh: bool = False) -> Batch: ...

    @abstractmethod
    def fetch_fixtures(self, league_ref: str, season_year: int, *, refresh: bool = False) -> Batch:
        """Tout le calendrier + resultats d'une saison, en UNE requete."""

    @abstractmethod
    def fetch_live(self) -> Batch:
        """Tous les matchs en cours (toutes competitions), en UNE requete."""

    @abstractmethod
    def fetch_by_ids(self, ids: Sequence[str], *, with_details: bool = False) -> Batch:
        """Matchs precis (jusqu'a 20 par requete), avec leurs evenements si demande."""

    @abstractmethod
    def fetch_quota(self) -> QuotaInfo:
        """Quota restant. Ne doit pas consommer de requete."""

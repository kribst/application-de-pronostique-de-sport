# -*- coding: utf-8 -*-
"""Ecriture en base des donnees normalisees (Provider > Normalizer > Validator > base).

Tout est idempotent : chaque objet est retrouve par son identifiant chez le
fournisseur (TeamExternalId / MatchExternalId), donc relancer une synchronisation
ne cree aucun doublon et n'ecrit que ce qui a change.
Aucune reponse brute n'est stockee : uniquement des champs controles.
"""
from __future__ import annotations

import logging
import re
from collections import Counter

from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.utils import timezone
from django.utils.text import slugify

from apps.matches.models import Match, MatchEvent, MatchExternalId, MatchStat, MatchStatus
from apps.sports.models import (
    Competition, Country, Round, Season, Sport, Team, TeamExternalId, TeamSeasonStat, Venue,
)

from .data_providers.base import Batch, DataProvider, MatchDetailDTO, MatchDTO, TeamDTO, VenueDTO

logger = logging.getLogger(__name__)

# Pays d'API-Football (anglais) -> codes de notre referentiel.
COUNTRY_CODES = {"England": "ENG", "Spain": "ESP", "France": "FRA", "Germany": "GER", "Italy": "ITA"}
ROUND_NUMBER = re.compile(r"(\d+)\s*$")  # "Regular Season - 10" -> 10


class SyncService:
    def __init__(self, provider: DataProvider):
        self.provider = provider
        self.slug = provider.slug
        self.stats: Counter = Counter()
        self._teams: dict[str, Team] = {}
        self._seasons: dict[tuple, Season] = {}
        self._countries: dict[str, Country | None] = {}
        self._football: Sport | None = None

    # -- referentiel -----------------------------------------------------------
    @property
    def football(self) -> Sport:
        if self._football is None:
            self._football = Sport.objects.get(slug="football")
        return self._football

    def mapped_competitions(self) -> list[tuple[Competition, str]]:
        """Competitions rattachees au fournisseur (Competition.external_ids[slug])."""
        result = []
        for competition in Competition.objects.filter(is_active=True, sport__slug="football").order_by("name"):
            ref = competition.external_ids.get(self.slug)
            if ref:
                result.append((competition, str(ref)))
        return result

    def _season(self, competition: Competition, year: int) -> Season:
        key = (competition.pk, year)
        if key not in self._seasons:
            season, created = Season.objects.get_or_create(
                competition=competition, year_start=year, defaults={"year_end": year + 1}
            )
            if created:
                self.stats["seasons_created"] += 1
            self._seasons[key] = season
        return self._seasons[key]

    def _country(self, name: str) -> Country | None:
        if name not in self._countries:
            code = COUNTRY_CODES.get(name)
            country = Country.objects.filter(code=code).first() if code else None
            self._countries[name] = country or (Country.objects.filter(name__iexact=name).first() if name else None)
        return self._countries[name]

    # -- stades et equipes ---------------------------------------------------------
    def _venue(self, dto: VenueDTO | None, country: Country | None) -> Venue | None:
        if dto is None:
            return None
        venue, created = Venue.objects.get_or_create(
            name=dto.name, city=dto.city, defaults={"country": country, "capacity": dto.capacity}
        )
        if not created and dto.capacity and venue.capacity != dto.capacity:
            venue.capacity = dto.capacity
            venue.save(update_fields=["capacity"])
        return venue

    def _team(self, dto: TeamDTO) -> Team:
        if dto.external_id in self._teams:
            return self._teams[dto.external_id]

        link = TeamExternalId.objects.select_related("team").filter(
            provider=self.slug, external_id=dto.external_id
        ).first()
        country = self._country(dto.country)
        venue = self._venue(dto.venue, country)

        if link:
            team = link.team
            changes = {}
            for field, value in (
                ("logo_url", dto.logo_url), ("founded_year", dto.founded_year),
                ("venue", venue), ("country", country),
            ):
                if value and getattr(team, field) != value:
                    changes[field] = value
            if changes:
                for field, value in changes.items():
                    setattr(team, field, value)
                team.save(update_fields=list(changes))
                self.stats["teams_updated"] += 1
        else:
            slug = slugify(dto.name)
            team = Team.objects.filter(sport=self.football, slug=slug).first()
            if team and team.external_ids.filter(provider=self.slug).exists():
                team = None  # ce nom appartient deja a une autre equipe du fournisseur
                slug = f"{slug}-{dto.external_id}"
            if team is None:
                team = Team.objects.create(
                    sport=self.football, name=dto.name, slug=slug, country=country, venue=venue,
                    logo_url=dto.logo_url, founded_year=dto.founded_year,
                )
                self.stats["teams_created"] += 1
            else:  # equipe deja connue (ex. donnees de test) : on la rattache
                team.logo_url = dto.logo_url or team.logo_url
                team.country = team.country or country
                team.venue = team.venue or venue
                team.save()
                self.stats["teams_linked"] += 1
            TeamExternalId.objects.create(team=team, provider=self.slug, external_id=dto.external_id)

        self._teams[dto.external_id] = team
        return team

    # -- synchronisations --------------------------------------------------------------
    def sync_reference(self, competition: Competition, league_ref: str, year: int, *, refresh: bool = False) -> Counter:
        batch = self.provider.fetch_teams(league_ref, year, refresh=refresh)
        self._count_rejected(batch)
        season = self._season(competition, year)
        for dto in batch.items:
            team = self._team(dto)
            TeamSeasonStat.objects.get_or_create(team=team, season=season)
        return self.stats

    def sync_fixtures(self, competition: Competition, league_ref: str, year: int, *, refresh: bool = False) -> Counter:
        batch = self.provider.fetch_fixtures(league_ref, year, refresh=refresh)
        self._apply_matches(batch, {league_ref: competition})
        return self.stats

    def sync_live(self) -> Counter:
        by_league = {ref: comp for comp, ref in self.mapped_competitions()}
        batch = self.provider.fetch_live()
        # live=all renvoie le monde entier : on ne garde que nos competitions.
        batch.items = [m for m in batch.items if m.league_external_id in by_league]
        self._apply_matches(batch, by_league)
        return self.stats

    def sync_by_ids(self, external_ids: list[str], *, with_details: bool = False) -> Counter:
        by_league = {ref: comp for comp, ref in self.mapped_competitions()}
        batch = self.provider.fetch_by_ids(external_ids, with_details=with_details)
        self._apply_matches(batch, by_league)
        if with_details:
            self._apply_details(batch.details, external_ids)
        return self.stats

    # -- matchs ------------------------------------------------------------------------
    def _count_rejected(self, batch: Batch) -> None:
        self.stats["rejected"] += len(batch.rejected)
        for reason in batch.rejected[:5]:
            logger.warning("Element ecarte (%s) : %s", self.slug, reason)

    def _apply_matches(self, batch: Batch, by_league: dict[str, Competition]) -> None:
        self._count_rejected(batch)
        ids = [m.external_id for m in batch.items]
        existing = {
            link.external_id: link.match
            for link in MatchExternalId.objects.select_related("match").filter(
                provider=self.slug, external_id__in=ids
            )
        }
        for dto in batch.items:
            competition = by_league.get(dto.league_external_id)
            if competition is None:
                self.stats["unmapped"] += 1
                continue
            match = existing.get(dto.external_id)
            if match is None:
                self._create_match(dto, competition)
            else:
                self._update_match(match, dto, competition)

    def _round(self, season: Season, label: str) -> Round | None:
        found = ROUND_NUMBER.search(label or "")
        if not found:
            return None  # phases a elimination ("Quarter-finals") : pas de numero de journee
        round_obj, _ = Round.objects.get_or_create(season=season, number=int(found.group(1)))
        return round_obj

    def _create_match(self, dto: MatchDTO, competition: Competition) -> None:
        season = self._season(competition, dto.season_year)
        home, away = self._team(dto.home), self._team(dto.away)
        for team in (home, away):
            TeamSeasonStat.objects.get_or_create(team=team, season=season)
        try:
            with transaction.atomic():
                match = Match(
                    competition=competition, season=season, round=self._round(season, dto.round_label),
                    home_team=home, away_team=away, kickoff_at=dto.kickoff_at, status=dto.status,
                    score_home=dto.score_home, score_away=dto.score_away, referee=dto.referee,
                    venue=self._venue(dto.venue, None) or home.venue,
                )
                match.save()
                MatchExternalId.objects.create(match=match, provider=self.slug, external_id=dto.external_id)
        except (ValidationError, IntegrityError) as exc:
            self.stats["rejected"] += 1
            logger.warning("Match %s ecarte a la creation : %s", dto.external_id, exc)
            return
        self.stats["matches_created"] += 1

    def _update_match(self, match: Match, dto: MatchDTO, competition: Competition) -> None:
        season = self._season(competition, dto.season_year)
        wanted = {
            "kickoff_at": dto.kickoff_at, "status": dto.status,
            "score_home": dto.score_home, "score_away": dto.score_away,
        }
        if dto.referee:
            wanted["referee"] = dto.referee
        round_obj = self._round(season, dto.round_label)
        if round_obj:
            wanted["round"] = round_obj
        venue = self._venue(dto.venue, None)
        if venue:
            wanted["venue"] = venue

        changes = {f: v for f, v in wanted.items() if getattr(match, f) != v}
        if not changes:
            self.stats["matches_unchanged"] += 1
            return
        previous = {f: getattr(match, f) for f in changes}
        for field, value in changes.items():
            setattr(match, field, value)
        try:
            match.save()  # Match.clean() refuse une transition de statut interdite
        except ValidationError as exc:
            for field, value in previous.items():  # on ne garde pas l'objet en memoire modifie
                setattr(match, field, value)
            self.stats["rejected"] += 1
            logger.warning("Mise a jour du match %s refusee : %s", dto.external_id, exc)
            return
        self.stats["matches_updated"] += 1

    def _apply_statistics(self, match: Match, detail: MatchDetailDTO, team_links: dict, valid_teams: set) -> None:
        for team_external_id, values in detail.stats.items():
            team_id = team_links.get(team_external_id)
            if team_id not in valid_teams:
                self.stats["rejected"] += 1
                continue
            try:
                stat, _ = MatchStat.objects.get_or_create(match=match, team_id=team_id, defaults={"stats": values})
                if stat.stats != values:
                    stat.stats = values
                    stat.save()
            except ValidationError as exc:
                self.stats["rejected"] += 1
                logger.warning("Statistiques du match %s ecartees : %s", match.id, exc)
                continue
            self.stats["stats_synced"] += 1

    # -- evenements ------------------------------------------------------------------------
    def _apply_details(self, details: dict[str, MatchDetailDTO], requested: list[str]) -> None:
        links = MatchExternalId.objects.select_related("match").filter(
            provider=self.slug, external_id__in=requested
        )
        team_links = {
            t.external_id: t.team_id
            for t in TeamExternalId.objects.filter(provider=self.slug)
        }
        now = timezone.now()
        for link in links:
            detail = details.get(link.external_id)
            if detail is None:
                continue
            match = link.match
            valid_teams = {match.home_team_id, match.away_team_id}
            with transaction.atomic():
                match.events.all().delete()
                MatchEvent.objects.bulk_create(
                    MatchEvent(
                        match=match, minute=e.minute, extra_minute=e.extra_minute, type=e.type,
                        player_name=e.player_name,
                        team_id=team_links.get(e.team_external_id) if team_links.get(e.team_external_id) in valid_teams else None,
                    )
                    for e in detail.events
                )
                Match.objects.filter(pk=match.pk).update(details_synced_at=now)
            self.stats["details_synced"] += 1
            self._apply_statistics(match, detail, team_links, valid_teams)

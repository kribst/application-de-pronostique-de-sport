# -*- coding: utf-8 -*-
"""Tests de l'app providers — sonde /api/v1/health/.

Premier test du projet : GET public, sans authentification, qui verifie
le contrat de la sonde (statut 200 + payload {"status": "ok", ...}).
"""
from django.test import TestCase
from django.urls import reverse


class HealthEndpointTests(TestCase):
    """Contrat de GET /api/v1/health/ (sonde publique de disponibilite)."""

    def test_health_returns_200_with_ok_status(self):
        response = self.client.get(reverse("health"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/json")
        payload = response.json()
        self.assertEqual(payload["status"], "ok")
        self.assertEqual(payload["database"], "ok")

    def test_health_does_not_require_authentication(self):
        # Pas de session, pas de token : la sonde reste accessible
        # (orchestrateurs Docker, reverse proxy, uptime monitors).
        self.client.logout()
        response = self.client.get("/api/v1/health/")
        self.assertEqual(response.status_code, 200)


# =============================================================================
# Phase 5 : fournisseur de donnees (aucun test n'appelle le reseau : faux transport)
# =============================================================================
import datetime
from unittest import mock

from django.core.cache import cache
from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

from apps.matches.models import Match, MatchEvent, MatchExternalId, MatchStatus
from apps.sports.models import Competition, Season, Team, TeamExternalId, TeamSeasonStat

from . import jobs
from .data_providers.api_football import normalize_events, normalize_match, normalize_team, raise_for_api_errors
from .data_providers.base import (
    InvalidPayload, ProviderAuthError, ProviderDisabled, ProviderPlanError, ProviderUnavailable, QuotaExceeded,
)
from .data_providers.http import RawResponse
from .data_providers.quota import Priority, QuotaManager
from .factory import build_provider, get_config
from .models import ApiCallLog, QuotaDay, SyncCursor, TaskLog

UTC = datetime.timezone.utc


# --- Faux fournisseur --------------------------------------------------------------
def far_future():
    """Date relative a l'horloge : les tests ne dependent jamais de la date du jour."""
    return (timezone.now() + datetime.timedelta(days=10)).isoformat()


def fixture_item(fid, home=(10, "Paris Saint Germain"), away=(11, "Marseille"), short="NS",
                 date=None, goals=(None, None), league=61, season=2026,
                 round_="Regular Season - 10", events=None):
    date = date or far_future()
    return {
        "fixture": {"id": fid, "referee": "A. Arbitre", "date": date,
                    "venue": {"id": 1, "name": "Parc des Princes", "city": "Paris"},
                    "status": {"short": short, "elapsed": None}},
        "league": {"id": league, "season": season, "round": round_},
        "teams": {"home": {"id": home[0], "name": home[1], "logo": f"https://logo/{home[0]}.png"},
                  "away": {"id": away[0], "name": away[1], "logo": f"https://logo/{away[0]}.png"}},
        "goals": {"home": goals[0], "away": goals[1]},
        "events": events or [],
    }


def team_item(tid, name, country="France", venue="Parc des Princes"):
    return {"team": {"id": tid, "name": name, "country": country, "founded": 1970, "logo": f"https://logo/{tid}.png"},
            "venue": {"name": venue, "city": "Paris", "capacity": 47929}}


class FakeTransport:
    """Repond avec des charges utiles preparees et compte les appels."""

    def __init__(self, daily_limit=100):
        self.responses: dict[str, object] = {}
        self.calls: list[tuple[str, dict]] = []
        self.remaining = daily_limit
        self.limit = daily_limit
        self.error: Exception | None = None
        self.status_code = 200

    def set(self, path, items=None, errors=None, body=None):
        if callable(items):  # reponse calculee a partir des parametres de la requete
            self.responses[path] = lambda params, f=items: {"errors": [], "response": f(params)}
        else:
            self.responses[path] = body if body is not None else {"errors": errors or [], "response": items or []}

    def get(self, path, params):
        if self.error:
            raise self.error
        self.calls.append((path, params))
        if path != "status":
            self.remaining -= 1
        body = self.responses.get(path, {"errors": [], "response": []})
        if callable(body):
            body = body(params)
        return RawResponse(
            status_code=self.status_code, body=body, latency_ms=5,
            headers={"x-ratelimit-requests-remaining": str(self.remaining),
                     "x-ratelimit-requests-limit": str(self.limit)},
        )


class ProviderTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_football", verbosity=0)
        call_command("provider_setup", verbosity=0)

    def setUp(self):
        cache.clear()
        self.config = get_config()
        # Limite par minute relevee : les tests lancent plusieurs synchronisations de suite.
        # (test_per_minute_limit remet une petite valeur pour verifier la limite elle-meme.)
        self.config.per_minute_limit = 1000
        self.config.save()
        self.transport = FakeTransport()
        self.provider = build_provider(self.config, self.transport)
        self.ligue1 = Competition.objects.get(slug="ligue-1")

    def stats_of(self, job, **kwargs):
        stats = {}
        job(self.provider, self.config, stats, **kwargs)
        return stats


# --- Normalizer / validator ---------------------------------------------------------
class NormalizerTests(TestCase):
    def test_status_codes_are_mapped(self):
        cases = {"NS": "SCHEDULED", "TBD": "SCHEDULED", "1H": "LIVE", "HT": "LIVE", "2H": "LIVE",
                 "FT": "FINISHED", "AET": "FINISHED", "PEN": "FINISHED", "PST": "POSTPONED",
                 "CANC": "CANCELLED", "SUSP": "SUSPENDED", "ABD": "SUSPENDED"}
        for short, expected in cases.items():
            goals = (1, 0) if expected in ("FINISHED", "LIVE", "SUSPENDED") else (None, None)
            self.assertEqual(normalize_match(fixture_item(1, short=short, goals=goals)).status, expected, short)

    def test_unknown_status_is_rejected(self):
        with self.assertRaises(InvalidPayload):
            normalize_match(fixture_item(1, short="???"))

    def test_kickoff_is_converted_to_utc(self):
        dto = normalize_match(fixture_item(1, date="2026-10-24T21:00:00+02:00"))
        self.assertEqual(dto.kickoff_at, datetime.datetime(2026, 10, 24, 19, 0, tzinfo=UTC))
        self.assertEqual(dto.kickoff_at.utcoffset(), datetime.timedelta(0))

    def test_naive_or_garbage_date_is_rejected(self):
        for bad in ("2026-10-24T19:00:00", "pas une date", None):
            item = fixture_item(1)
            item["fixture"]["date"] = bad
            with self.assertRaises(InvalidPayload):
                normalize_match(item)

    def test_scoreless_status_ignores_zero_zero_sent_before_kickoff(self):
        self.assertIsNone(normalize_match(fixture_item(1, short="NS", goals=(0, 0))).score_home)

    def test_finished_match_without_score_is_rejected(self):
        with self.assertRaises(InvalidPayload):
            normalize_match(fixture_item(1, short="FT"))

    def test_same_team_on_both_sides_is_rejected(self):
        with self.assertRaises(InvalidPayload):
            normalize_match(fixture_item(1, home=(10, "A"), away=(10, "A")))

    def test_missing_id_or_name_is_rejected(self):
        with self.assertRaises(InvalidPayload):
            normalize_team({"team": {"name": "X"}})
        with self.assertRaises(InvalidPayload):
            normalize_team({"team": {"id": 1, "name": "  "}})

    def test_events_are_mapped_and_unknown_ones_ignored(self):
        item = fixture_item(1, short="FT", goals=(1, 0), events=[
            {"time": {"elapsed": 12, "extra": None}, "team": {"id": 10}, "player": {"name": "Dembele"}, "type": "Goal", "detail": "Normal Goal"},
            {"time": {"elapsed": 45, "extra": 2}, "team": {"id": 11}, "player": {"name": "X"}, "type": "Card", "detail": "Yellow Card"},
            {"time": {"elapsed": 60, "extra": None}, "team": {"id": 11}, "player": {"name": "Y"}, "type": "Goal", "detail": "Missed Penalty"},
            {"time": {"elapsed": None}, "team": {"id": 11}, "player": {"name": "Z"}, "type": "Goal", "detail": "Normal Goal"},
        ])
        detail = normalize_events(item)
        self.assertEqual([(e.minute, e.extra_minute, e.type) for e in detail.events],
                         [(12, None, "GOAL"), (45, 2, "YELLOW_CARD")])

    def test_api_errors_in_a_200_response_are_classified(self):
        with self.assertRaises(QuotaExceeded):
            raise_for_api_errors({"errors": {"requests": "You have reached the request limit for the day"}})
        with self.assertRaises(ProviderPlanError):
            raise_for_api_errors({"errors": {"plan": "Free plans do not have access to this season, try from 2021 to 2023."}})
        with self.assertRaises(ProviderAuthError):
            raise_for_api_errors({"errors": {"token": "Error/Missing application key"}})
        raise_for_api_errors({"errors": []})  # pas d'erreur : rien ne se passe


# --- Quota ---------------------------------------------------------------------------
class QuotaTests(ProviderTestCase):
    def test_priorities_share_the_budget(self):
        manager = QuotaManager(self.config)
        quota = manager.today()
        # limite 100 : reference s'arrete a 40 restantes, resultats a 20, direct a 0.
        for remaining, expected in ((100, (True, True, True)), (41, (True, True, True)),
                                    (40, (False, True, True)), (21, (False, True, True)),
                                    (20, (False, False, True)), (1, (False, False, True)),
                                    (0, (False, False, False))):
            QuotaDay.objects.filter(pk=quota.pk).update(remaining_reported=remaining)
            got = tuple(manager.can_spend(p) for p in (Priority.REFERENCE, Priority.RESULTS, Priority.LIVE))
            self.assertEqual(got, expected, f"restant={remaining}")

    def test_provider_headers_are_the_source_of_truth(self):
        self.transport.remaining = 77
        self.provider.fetch_fixtures("61", 2026)
        quota = QuotaManager(self.config).today()
        self.assertEqual(quota.remaining_reported, 76)
        self.assertEqual(quota.used, 1)

    def test_call_is_refused_when_budget_is_reserved(self):
        QuotaDay.objects.update_or_create(provider=self.config, day=timezone.now().date(),
                                          defaults={"remaining_reported": 20})
        with self.assertRaises(QuotaExceeded):
            self.provider.fetch_fixtures("61", 2026)
        self.assertEqual(self.transport.calls, [])  # aucune requete reseau
        self.provider.fetch_live()  # le direct garde le droit d'utiliser la reserve
        self.assertEqual(len(self.transport.calls), 1)

    def test_per_minute_limit(self):
        self.config.per_minute_limit = 2
        self.config.save()
        self.provider.fetch_live()
        self.provider.fetch_live()
        with self.assertRaises(QuotaExceeded):
            self.provider.fetch_live()

    def test_counter_restarts_each_utc_day(self):
        manager = QuotaManager(self.config)
        yesterday = timezone.now().date() - datetime.timedelta(days=1)
        QuotaDay.objects.create(provider=self.config, day=yesterday, used=100, remaining_reported=0)
        self.assertEqual(manager.remaining(), 100)

    def test_status_endpoint_costs_no_quota(self):
        self.transport.set("status", body={"errors": [], "response": {
            "subscription": {"plan": "Free"}, "requests": {"current": 30, "limit_day": 100}}})
        info = self.provider.fetch_quota()
        self.assertEqual((info.plan, info.limit_day, info.used_day), ("Free", 100, 30))
        self.assertEqual(QuotaManager(self.config).today().used, 0)

    def test_disabled_provider_makes_no_call(self):
        self.config.is_active = False
        with self.assertRaises(ProviderDisabled):
            self.provider.fetch_live()
        self.assertEqual(self.transport.calls, [])

    def test_missing_api_key_disables_the_provider(self):
        with self.settings(SPORTS_API_KEY=""):
            with self.assertRaises(ProviderDisabled):
                build_provider(self.config)

    def test_api_key_is_never_stored_in_logs(self):
        with self.settings(SPORTS_API_KEY="SECRET-KEY-123"):
            self.provider.fetch_live()
        for log in ApiCallLog.objects.all():
            self.assertNotIn("SECRET-KEY-123", f"{log.endpoint}{log.params}{log.error}")


# --- Resilience -------------------------------------------------------------------------
class ResilienceTests(ProviderTestCase):
    def test_network_failure_is_logged_and_counts_no_quota(self):
        self.transport.error = ProviderUnavailable("Erreur reseau (ConnectTimeout).")
        with self.assertRaises(ProviderUnavailable):
            self.provider.fetch_live()
        self.assertEqual(QuotaManager(self.config).today().used, 0)
        self.assertFalse(ApiCallLog.objects.get().ok)

    def test_http_errors_are_classified(self):
        for code, exc in ((401, ProviderAuthError), (429, QuotaExceeded), (503, ProviderUnavailable)):
            self.transport.status_code = code
            with self.assertRaises(exc):
                self.provider.fetch_live()

    def test_incomplete_response_is_not_an_error(self):
        self.transport.set("fixtures", body={"errors": [], "response": None})
        self.assertEqual(self.provider.fetch_live().items, [])

    def test_bad_items_are_dropped_good_ones_kept(self):
        self.transport.set("fixtures", [fixture_item(1), {"fixture": {"id": 2}}, fixture_item(3, short="???")])
        batch = self.provider.fetch_fixtures("61", 2026)
        self.assertEqual([m.external_id for m in batch.items], ["1"])
        self.assertEqual(len(batch.rejected), 2)

    def test_plan_error_marks_the_task_failed_without_retrying(self):
        self.transport.set("fixtures", errors={"plan": "Free plans do not have access to this season"})
        log = jobs.run_logged("sync_fixtures", lambda s: jobs.sync_fixtures_job(self.provider, self.config, s))
        self.assertEqual(log.status, "FAILED")
        self.assertIn("ProviderPlanError", log.error)
        self.assertEqual(len(self.transport.calls), 1)  # s'arrete a la premiere competition

    def test_task_never_raises(self):
        self.transport.error = RuntimeError("boom")
        log = jobs.run_logged("x", lambda s: self.provider.fetch_live())
        self.assertEqual(log.status, "FAILED")


# --- Synchronisation et idempotence -----------------------------------------------------
class SyncTests(ProviderTestCase):
    def setUp(self):
        super().setUp()
        self.transport.set("fixtures", [
            fixture_item(1, home=(10, "Paris Saint Germain"), away=(11, "Marseille"), short="FT",
                         goals=(2, 1), date="2026-10-17T19:00:00+00:00", round_="Regular Season - 9"),
            fixture_item(2, home=(12, "Lyon"), away=(13, "Monaco"), date="2026-10-25T19:00:00+00:00"),
        ])

    def test_first_sync_creates_everything_second_creates_nothing(self):
        first = self.stats_of(jobs.sync_fixtures_job)
        self.assertEqual(first["matches_created"], 2)
        self.assertEqual((Match.objects.filter(external_ids__provider="api-football").count(),
                          Team.objects.filter(external_ids__provider="api-football").count()), (2, 4))
        counts = (Match.objects.count(), Team.objects.count(), TeamExternalId.objects.count(),
                  MatchExternalId.objects.count(), Season.objects.count())
        second = self.stats_of(jobs.sync_fixtures_job, force=True)
        self.assertNotIn("matches_created", second)
        self.assertEqual(counts, (Match.objects.count(), Team.objects.count(), TeamExternalId.objects.count(),
                                  MatchExternalId.objects.count(), Season.objects.count()))
        self.assertEqual(second["matches_unchanged"], 2)

    def test_imported_match_has_expected_data(self):
        self.stats_of(jobs.sync_fixtures_job)
        match = Match.objects.get(external_ids__external_id="1")
        self.assertEqual((match.status, match.score_home, match.score_away), ("FINISHED", 2, 1))
        self.assertEqual(match.round.number, 9)
        self.assertEqual(match.venue.name, "Parc des Princes")
        self.assertEqual(match.competition, self.ligue1)
        self.assertTrue(TeamSeasonStat.objects.filter(team=match.home_team, season=match.season).exists())

    def test_result_update_changes_only_what_changed(self):
        self.stats_of(jobs.sync_fixtures_job)
        self.transport.set("fixtures", [
            fixture_item(1, short="FT", goals=(2, 1), date="2026-10-17T19:00:00+00:00", round_="Regular Season - 9"),
            fixture_item(2, home=(12, "Lyon"), away=(13, "Monaco"), short="FT", goals=(0, 3),
                         date="2026-10-25T19:00:00+00:00"),
        ])
        stats = self.stats_of(jobs.sync_fixtures_job, force=True)
        self.assertEqual((stats["matches_updated"], stats["matches_unchanged"]), (1, 1))
        self.assertEqual(Match.objects.get(external_ids__external_id="2").score_away, 3)

    def test_forbidden_status_transition_is_rejected_not_applied(self):
        self.stats_of(jobs.sync_fixtures_job)
        self.transport.set("fixtures", [fixture_item(1, short="2H", goals=(1, 1), date="2026-10-17T19:00:00+00:00",
                                                    round_="Regular Season - 9")])
        stats = self.stats_of(jobs.sync_fixtures_job, force=True)
        self.assertEqual(stats["rejected"], 1)
        self.assertEqual(Match.objects.get(external_ids__external_id="1").status, "FINISHED")
        self.assertEqual(Match.objects.get(external_ids__external_id="1").score_home, 2)

    def test_postponed_match_can_be_rescheduled(self):
        self.stats_of(jobs.sync_fixtures_job)
        self.transport.set("fixtures", [fixture_item(2, home=(12, "Lyon"), away=(13, "Monaco"), short="PST",
                                                    date="2026-10-25T19:00:00+00:00")])
        self.stats_of(jobs.sync_fixtures_job, force=True)
        self.transport.set("fixtures", [fixture_item(2, home=(12, "Lyon"), away=(13, "Monaco"), short="NS",
                                                    date="2026-11-02T19:00:00+00:00")])
        self.stats_of(jobs.sync_fixtures_job, force=True)
        match = Match.objects.get(external_ids__external_id="2")
        self.assertEqual((match.status, match.kickoff_at.day), ("SCHEDULED", 2))

    def test_existing_team_is_linked_not_duplicated(self):
        call_command("seed_teams", verbosity=0)
        psg = Team.objects.get(slug="paris-saint-germain")
        self.transport.set("fixtures", [fixture_item(1, home=(10, "Paris Saint-Germain"), away=(11, "Marseille"))])
        stats = self.stats_of(jobs.sync_fixtures_job)
        self.assertEqual(stats["teams_linked"], 1)
        self.assertEqual(TeamExternalId.objects.get(provider="api-football", external_id="10").team, psg)

    def test_competition_outside_our_mapping_is_ignored(self):
        self.transport.set("fixtures", [fixture_item(9, league=999)])
        stats = {}
        from .sync import SyncService
        service = SyncService(self.provider)
        service.sync_fixtures(self.ligue1, "61", 2026)
        self.assertEqual(service.stats["unmapped"], 1)
        self.assertFalse(Match.objects.filter(external_ids__external_id="9").exists())

    def test_reference_sync_links_teams_to_the_season(self):
        self.transport.set("teams", [team_item(10, "Paris Saint Germain"), team_item(11, "Marseille", venue="Velodrome")])
        stats = self.stats_of(jobs.sync_reference_job, only="ligue-1")
        self.assertEqual(stats["teams_created"], 2)
        season = self.ligue1.seasons.get(is_current=True)
        self.assertEqual(TeamSeasonStat.objects.filter(season=season, team__external_ids__provider="api-football").count(), 2)
        self.assertEqual(Team.objects.get(external_ids__external_id="10").country.code, "FRA")
        again = self.stats_of(jobs.sync_reference_job, only="ligue-1", force=True)
        self.assertNotIn("teams_created", again)


# --- Economie de requetes ---------------------------------------------------------------
class RequestSavingTests(ProviderTestCase):
    def setUp(self):
        super().setUp()
        self.transport.set("fixtures", [fixture_item(1)])

    def calls(self, path="fixtures"):
        return [c for c in self.transport.calls if c[0] == path]

    def test_one_request_per_competition_not_per_match(self):
        self.stats_of(jobs.sync_fixtures_job)
        self.assertEqual(len(self.calls()), 7)  # 7 competitions mappees, 1 requete chacune

    def test_nothing_is_fetched_again_while_data_is_fresh(self):
        self.stats_of(jobs.sync_fixtures_job)
        before = len(self.transport.calls)
        stats = self.stats_of(jobs.sync_fixtures_job)
        self.assertEqual(len(self.transport.calls), before)
        self.assertEqual(stats["fresh"], 7)

    def test_quiet_competitions_wait_24h_before_a_refresh(self):
        self.stats_of(jobs.sync_fixtures_job)
        SyncCursor.objects.update(last_success_at=timezone.now() - datetime.timedelta(hours=7))
        self.stats_of(jobs.sync_fixtures_job)  # aucun match proche : le delai est de 24 h
        self.assertEqual(len(self.calls()), 7)
        SyncCursor.objects.update(last_success_at=timezone.now() - datetime.timedelta(hours=25))
        cache.clear()  # en production, le cache de 20 min a expire depuis longtemps
        self.stats_of(jobs.sync_fixtures_job)
        self.assertEqual(len(self.calls()), 14)

    def test_active_competition_refreshes_sooner(self):
        self.stats_of(jobs.sync_fixtures_job)
        soon = timezone.now() + datetime.timedelta(hours=2)
        season = self.ligue1.seasons.get(is_current=True)
        teams = [Team.objects.create(sport=self.ligue1.sport, name=n, slug=n.lower()) for n in ("T1", "T2")]
        Match.objects.create(competition=self.ligue1, season=season, home_team=teams[0], away_team=teams[1], kickoff_at=soon)
        SyncCursor.objects.update(last_success_at=timezone.now() - datetime.timedelta(hours=7))
        stats = self.stats_of(jobs.sync_fixtures_job)
        self.assertEqual(stats["competitions"], 1)  # seule la Ligue 1 est "active"
        self.assertEqual(stats["fresh"], 6)

    def test_identical_request_is_served_from_cache(self):
        self.provider.fetch_fixtures("61", 2026)
        self.provider.fetch_fixtures("61", 2026)
        self.assertEqual(len(self.transport.calls), 1)
        self.assertEqual(self.provider.client.stats["cache_hits"], 1)

    def test_quota_exhaustion_stops_the_run_cleanly(self):
        QuotaDay.objects.update_or_create(provider=self.config, day=timezone.now().date(),
                                          defaults={"remaining_reported": 23})
        self.transport.remaining = 23
        stats = self.stats_of(jobs.sync_fixtures_job)
        self.assertEqual(stats["competitions"], 3)  # 23 -> 20 restantes = reserve du direct
        self.assertEqual(stats["quota_blocked"], 1)
        self.assertEqual(len(self.transport.calls), 3)

    def test_idle_live_task_costs_nothing(self):
        stats = self.stats_of(jobs.sync_live_job)
        self.assertEqual(self.transport.calls, [])
        self.assertIn("aucun match", stats["skipped"])

    def _upcoming_match(self, minutes_from_now=-30, provider="api-football"):
        season = self.ligue1.seasons.get(is_current=True)
        home = Team.objects.create(sport=self.ligue1.sport, name="Dom", slug=f"dom{minutes_from_now}")
        away = Team.objects.create(sport=self.ligue1.sport, name="Ext", slug=f"ext{minutes_from_now}")
        match = Match.objects.create(competition=self.ligue1, season=season, home_team=home, away_team=away,
                                     kickoff_at=timezone.now() + datetime.timedelta(minutes=minutes_from_now))
        MatchExternalId.objects.create(match=match, provider=provider, external_id=str(900 + abs(minutes_from_now)))
        return match

    def test_live_polling_only_when_a_match_is_on_and_not_too_often(self):
        self._upcoming_match(-30)
        self.transport.set("fixtures", [])
        self.stats_of(jobs.sync_live_job)
        self.assertEqual(len(self.calls()), 1)
        stats = self.stats_of(jobs.sync_live_job)  # 2e appel immediat : bloque par le delai minimal
        self.assertEqual(len(self.calls()), 1)
        self.assertIn("delai minimal", stats["skipped"])

    def test_live_update_applies_score_for_our_competitions_only(self):
        match = self._upcoming_match(-30)
        ext = match.external_ids.get().external_id
        self.transport.set("fixtures", [
            fixture_item(int(ext), short="1H", goals=(1, 0), date=match.kickoff_at.isoformat()),
            fixture_item(5555, league=999, short="1H", goals=(3, 3)),  # autre ligue du monde
        ])
        stats = self.stats_of(jobs.sync_live_job)
        match.refresh_from_db()
        self.assertEqual((match.status, match.score_home), ("LIVE", 1))
        self.assertFalse(Match.objects.filter(external_ids__external_id="5555").exists())
        self.assertEqual(stats["matches_updated"], 1)

    def test_far_future_match_does_not_trigger_live_polling(self):
        self._upcoming_match(+300)
        self.stats_of(jobs.sync_live_job)
        self.assertEqual(self.transport.calls, [])

    def test_late_results_are_fetched_in_one_request_for_20_matches(self):
        matches = [self._upcoming_match(-(200 + i)) for i in range(25)]
        self.transport.set("fixtures", lambda params: [
            fixture_item(int(i), short="FT", goals=(1, 0)) for i in params["ids"].split("-")
        ])
        self.stats_of(jobs.sync_stale_job)
        self.assertEqual(len(self.calls()), 1)
        self.assertEqual(len(self.calls()[0][1]["ids"].split("-")), 20)
        self.assertEqual(self.stats_of(jobs.sync_stale_job)["skipped"], "dernier rattrapage trop recent")

    def test_event_details_fetched_once_in_batches(self):
        for i in range(3):
            m = self._upcoming_match(-(300 + i))
            Match.objects.filter(pk=m.pk).update(status="FINISHED", score_home=1, score_away=0)
        ids = list(MatchExternalId.objects.values_list("external_id", flat=True))
        self.transport.set("fixtures", lambda params: [
            fixture_item(int(i), short="FT", goals=(1, 0), events=[
                {"time": {"elapsed": 33, "extra": None}, "team": {"id": 10}, "player": {"name": "Buteur"},
                 "type": "Goal", "detail": "Normal Goal"}]) for i in params["ids"].split("-")
        ])
        stats = self.stats_of(jobs.sync_details_job)
        self.assertEqual((len(self.calls()), stats["details_synced"]), (1, 3))
        self.assertEqual(MatchEvent.objects.count(), 3)
        again = self.stats_of(jobs.sync_details_job)
        self.assertEqual(len(self.calls()), 1)  # rien de nouveau a recuperer
        self.assertIn("aucun match termine", again["skipped"])

    def test_reference_data_is_not_refetched_within_a_week(self):
        self.transport.set("teams", [team_item(10, "Paris Saint Germain")])
        self.stats_of(jobs.sync_reference_job)
        n = len(self.calls("teams"))
        self.stats_of(jobs.sync_reference_job)
        self.assertEqual(len(self.calls("teams")), n)

    def test_reference_data_stops_before_the_budget_needed_for_live(self):
        QuotaDay.objects.update_or_create(provider=self.config, day=timezone.now().date(),
                                          defaults={"remaining_reported": 41})
        self.transport.remaining = 41
        self.transport.set("teams", [team_item(10, "Paris Saint Germain")])
        stats = self.stats_of(jobs.sync_reference_job)
        self.assertEqual(stats["competitions"], 1)   # 41 -> 40 restantes = plancher
        self.assertEqual(stats["quota_blocked"], 1)


# --- Taches, journal, commandes ----------------------------------------------------------
class TaskAndCommandTests(ProviderTestCase):
    def test_tasks_skip_quietly_without_api_key(self):
        from .tasks import sync_fixtures, sync_live, monitor_quota
        with self.settings(SPORTS_API_KEY=""):
            for task in (sync_fixtures, sync_live, monitor_quota):
                self.assertEqual(task()["status"], "SKIPPED")
        self.assertEqual(ApiCallLog.objects.count(), 0)

    def test_task_log_records_status_and_stats(self):
        self.transport.set("fixtures", [fixture_item(1)])
        log = jobs.run_logged("sync_fixtures", lambda s: jobs.sync_fixtures_job(self.provider, self.config, s))
        self.assertEqual(log.status, "SUCCESS")
        self.assertEqual(log.stats["matches_created"], 1)
        self.assertEqual(log.stats["unmapped"], 6)  # la reponse n'appartient qu'a la Ligue 1
        self.assertIsNotNone(log.finished_at)

    def test_monitor_quota_flags_a_low_quota(self):
        self.transport.set("status", body={"errors": [], "response": {
            "subscription": {"plan": "Free"}, "requests": {"current": 95, "limit_day": 100}}})
        log = jobs.run_logged("monitor_quota", lambda s: jobs.monitor_quota_job(self.provider, self.config, s))
        self.assertEqual(log.status, "PARTIAL")
        self.assertEqual(log.stats["remaining"], 5)

    def test_beat_schedule_points_to_existing_tasks(self):
        from django.conf import settings
        from pronostique.celery import app
        app.loader.import_default_modules()
        for entry in settings.CELERY_BEAT_SCHEDULE.values():
            self.assertIn(entry["task"], app.tasks, entry["task"])

    def test_setup_command_links_leagues_idempotently(self):
        self.assertEqual(self.ligue1.external_ids["api-football"], 61)
        call_command("provider_setup", verbosity=0)
        self.ligue1.refresh_from_db()
        self.assertEqual(self.ligue1.external_ids["api-football"], 61)

    def test_status_command_runs(self):
        from io import StringIO
        out = StringIO()
        call_command("provider_status", stdout=out)
        self.assertIn("Quota du jour", out.getvalue())


# --- Plan gratuit : saisons historiques et delai apres "offre insuffisante" -------------------
class FreePlanTests(ProviderTestCase):
    PLAN_ERROR = {"plan": "Free plans do not have access to this season, try from 2022 to 2024."}

    def test_a_past_season_can_be_imported_without_becoming_current(self):
        self.transport.set("fixtures", [fixture_item(1, short="FT", goals=(2, 0), season=2024,
                                                    date="2024-10-05T19:00:00+00:00", round_="Regular Season - 8")])
        stats = self.stats_of(jobs.sync_fixtures_job, only="ligue-1", season=2024)
        self.assertEqual(stats["matches_created"], 1)
        self.assertEqual(self.transport.calls[0][1]["season"], "2024")
        season = Season.objects.get(competition=self.ligue1, year_start=2024)
        self.assertFalse(season.is_current)
        self.assertEqual(season.year_end, 2025)
        self.assertTrue(self.ligue1.seasons.get(is_current=True).year_start == 2026)  # la saison courante ne change pas
        self.assertEqual(Match.objects.get(external_ids__external_id="1").season, season)

    def test_teams_of_a_past_season_are_linked_to_that_season(self):
        self.transport.set("teams", [team_item(10, "Paris Saint Germain")])
        self.stats_of(jobs.sync_reference_job, only="ligue-1", season=2023)
        season = Season.objects.get(competition=self.ligue1, year_start=2023)
        self.assertEqual(TeamSeasonStat.objects.filter(season=season).count(), 1)

    def test_plan_error_is_not_retried_for_six_hours(self):
        self.transport.set("fixtures", errors=self.PLAN_ERROR)
        first = jobs.run_logged("sync_fixtures", lambda s: jobs.sync_fixtures_job(self.provider, self.config, s))
        self.assertEqual(first.status, "FAILED")
        self.assertIn("2022 to 2024", first.error)
        calls = len(self.transport.calls)
        second = jobs.run_logged("sync_fixtures", lambda s: jobs.sync_fixtures_job(self.provider, self.config, s))
        self.assertEqual(len(self.transport.calls), calls)  # aucune nouvelle requete
        self.assertEqual(second.status, "SKIPPED")
        self.assertIn("offre insuffisante", second.stats["skipped"])

    def test_plan_error_is_retried_after_six_hours_and_when_forced(self):
        self.transport.set("fixtures", errors=self.PLAN_ERROR)
        jobs.run_logged("x", lambda s: jobs.sync_fixtures_job(self.provider, self.config, s))
        calls = len(self.transport.calls)
        SyncCursor.objects.update(last_attempt_at=timezone.now() - datetime.timedelta(hours=7))
        jobs.run_logged("x", lambda s: jobs.sync_fixtures_job(self.provider, self.config, s))
        self.assertEqual(len(self.transport.calls), calls + 1)
        jobs.run_logged("x", lambda s: jobs.sync_fixtures_job(self.provider, self.config, s, force=True))
        self.assertEqual(len(self.transport.calls), calls + 2)

    def test_a_historical_season_still_works_while_the_current_one_is_blocked(self):
        self.transport.set("fixtures", errors=self.PLAN_ERROR)
        jobs.run_logged("x", lambda s: jobs.sync_fixtures_job(self.provider, self.config, s, only="ligue-1"))
        self.transport.set("fixtures", [fixture_item(7, short="FT", goals=(1, 1), season=2024,
                                                    date="2024-09-01T19:00:00+00:00")])
        stats = self.stats_of(jobs.sync_fixtures_job, only="ligue-1", season=2024)
        self.assertEqual(stats["matches_created"], 1)

    def test_command_accepts_a_season(self):
        from io import StringIO
        self.transport.set("fixtures", [fixture_item(3, short="FT", goals=(0, 1), season=2024,
                                                    date="2024-09-02T19:00:00+00:00")])
        out = StringIO()
        target = "apps.providers.management.commands.sync_provider.build_provider"
        with mock.patch(target, return_value=self.provider):
            call_command("sync_provider", "fixtures", "--competition", "ligue-1", "--season", "2024", stdout=out)
        self.assertIn("SUCCESS", out.getvalue())
        self.assertTrue(Match.objects.filter(external_ids__external_id="3").exists())

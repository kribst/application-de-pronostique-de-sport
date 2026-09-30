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

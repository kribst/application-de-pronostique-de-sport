# -*- coding: utf-8 -*-
"""Vues de l'app providers — monitoring & synchronisation.

/api/v1/health/ : sonde publique de disponibilite (cahier, module
Monitoring : Logs, quotas, dispo API). Sans authentification pour les
orchestrateurs (Docker, reverse proxy, uptime monitors). Verifie :
- que Django repond (toujours vrai si on lit cette reponse),
- que la base de donnees par defaut accepte une connexion.

Note : INTENTIONNELLEMENT, la sonde ne touche ni au cache Redis ni a
Celery — un broker eteint ne doit pas faire passer l'API pour "down".
"""
from django.db import connections
from django.db.utils import OperationalError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthView(APIView):
    """GET /api/v1/health/ -> {"status": "ok"|"degraded", ...}."""

    authentication_classes = []
    permission_classes = []
    # Pas de throttling : la sonde utilise le cache par defaut pour les
    # throttles DRF, et un broker/cache eteint ne doit pas faire passer
    # l'API pour "down".
    throttle_classes = []

    def get(self, request):
        database_ok = True
        try:
            connections["default"].ensure_connection()
        except OperationalError:
            database_ok = False

        payload = {
            "status": "ok" if database_ok else "degraded",
            "database": "ok" if database_ok else "unreachable",
        }
        http_status = (
            status.HTTP_200_OK if database_ok else status.HTTP_503_SERVICE_UNAVAILABLE
        )
        return Response(payload, status=http_status)

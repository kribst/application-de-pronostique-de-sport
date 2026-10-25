# -*- coding: utf-8 -*-
"""Construction du fournisseur a partir de la configuration (cle d'API dans .env uniquement)."""
from django.conf import settings

from .data_providers.api_football import (
    DEFAULT_BASE_URL, SLUG, ApiFootballProvider, raise_for_api_errors,
)
from .data_providers.base import ProviderDisabled
from .data_providers.http import RequestsTransport, Transport
from .data_providers.quota import ProviderClient
from .models import DataProviderConfig


def get_config(slug: str = SLUG) -> DataProviderConfig:
    config, _ = DataProviderConfig.objects.get_or_create(slug=slug, defaults={"name": "API-Football"})
    return config


def build_provider(config: DataProviderConfig | None = None, transport: Transport | None = None) -> ApiFootballProvider:
    """`transport` n'est fourni que par les tests (faux fournisseur, aucun reseau)."""
    config = config or get_config()
    if transport is None:
        if not settings.SPORTS_API_KEY:
            raise ProviderDisabled("SPORTS_API_KEY absente du fichier .env.")
        transport = RequestsTransport(settings.SPORTS_API_BASE_URL or DEFAULT_BASE_URL, settings.SPORTS_API_KEY)
    client = ProviderClient(config, transport, check_body=raise_for_api_errors)
    return ApiFootballProvider(client)

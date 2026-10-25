# -*- coding: utf-8 -*-
"""Transport HTTP (isole pour pouvoir le remplacer par un faux dans les tests)."""
from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Protocol

import requests

from .base import ProviderUnavailable


@dataclass
class RawResponse:
    status_code: int
    body: object  # JSON decode (dict) ou None
    headers: dict[str, str] = field(default_factory=dict)
    latency_ms: int = 0


class Transport(Protocol):
    def get(self, path: str, params: dict[str, str]) -> RawResponse: ...


class RequestsTransport:
    """Transport reel. La cle d'API n'est jamais loguee ni renvoyee dans une erreur."""

    def __init__(self, base_url: str, api_key: str, *, key_header: str = "x-apisports-key", timeout: int = 15):
        self.base_url = base_url.rstrip("/")
        self._headers = {key_header: api_key, "Accept": "application/json"}
        self.timeout = timeout
        self._session = requests.Session()

    def get(self, path: str, params: dict[str, str]) -> RawResponse:
        started = time.monotonic()
        try:
            response = self._session.get(
                f"{self.base_url}/{path.lstrip('/')}",
                params=params,
                headers=self._headers,
                timeout=self.timeout,
            )
        except requests.RequestException as exc:
            # On ne propage que le TYPE de l'erreur : le message peut contenir l'URL.
            raise ProviderUnavailable(f"Erreur reseau ({type(exc).__name__}).") from None
        latency = int((time.monotonic() - started) * 1000)
        try:
            body = response.json()
        except ValueError:
            body = None
        return RawResponse(
            status_code=response.status_code,
            body=body,
            headers={k.lower(): v for k, v in response.headers.items()},
            latency_ms=latency,
        )

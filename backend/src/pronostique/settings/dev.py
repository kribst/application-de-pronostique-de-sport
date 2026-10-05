# -*- coding: utf-8 -*-
"""Settings de developpement local.

Usage : ``python src/manage.py <commande>`` (module par defaut de manage.py),
ou ``DJANGO_SETTINGS_MODULE=pronostique.settings.dev``.
"""
from .base import *  # noqa: F401,F403
from .base import ALLOWED_HOSTS as _BASE_ALLOWED_HOSTS
from .base import _database_config, env

# --- Debug -------------------------------------------------------------------
DEBUG = True

# SQLite par defaut (backend/src/db.sqlite3) ; Postgres si DATABASE_URL est
# renseigne dans le .env (cf. docker-compose.yml). Une valeur vide retombe
# sur SQLite (gestion centralisee dans base._database_config).
DATABASES = {"default": _database_config()}

ALLOWED_HOSTS = ["localhost", "127.0.0.1", "[::1]", *(_BASE_ALLOWED_HOSTS or [])]

# Frontend Next.js local (npm run dev -> :3000) + API locale sur 8001.
# Le port 8000 est souvent occupe par un conteneur d'un autre projet en local ;
# lancer Django sur 8001 evite que `localhost:8000` tombe sur ce conteneur :
#   python src/manage.py runserver 8001
CSRF_TRUSTED_ORIGINS = sorted(
    {
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8001",
        "http://127.0.0.1:8001",
        *env.list("DJANGO_CSRF_TRUSTED_ORIGINS", default=[]),
    }
)

# CORS dev : le frontend Next.js local (:3000) en plus des origines du .env.
CORS_ALLOWED_ORIGINS = sorted(
    {
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        *env.list("DJANGO_CORS_ALLOWED_ORIGINS", default=[]),
    }
)

INTERNAL_IPS = ["127.0.0.1"]

# Emails affiches dans la console pendant le dev.
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Securite assouplie en local uniquement (prod.py durcit tout).
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

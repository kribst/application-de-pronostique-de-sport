# -*- coding: utf-8 -*-
"""Settings de production.

Usage : module par defaut de wsgi.py/asgi.py, ou
``DJANGO_SETTINGS_MODULE=pronostique.settings.prod``.

Exige DJANGO_SECRET_KEY, DJANGO_ALLOWED_HOSTS et DATABASE_URL (Postgres).
DEBUG est force a False, quelle que soit la valeur de DJANGO_DEBUG.
"""
from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F401,F403
from .base import env

# --- Debug : toujours False en prod ------------------------------------------
DEBUG = False

# --- Secrets obligatoires ------------------------------------------------------
SECRET_KEY = env("DJANGO_SECRET_KEY")  # leve ImproperlyConfigured si absent

ALLOWED_HOSTS = env("DJANGO_ALLOWED_HOSTS")
if not ALLOWED_HOSTS:
    raise ImproperlyConfigured(
        "DJANGO_ALLOWED_HOSTS est vide : renseignez les domaines du serveur "
        "(ex. DJANGO_ALLOWED_HOSTS=api.example.com,www.example.com)."
    )

CSRF_TRUSTED_ORIGINS = env("DJANGO_CSRF_TRUSTED_ORIGINS")

# CORS prod : strictement les origines declarees dans le .env.
CORS_ALLOWED_ORIGINS = env("DJANGO_CORS_ALLOWED_ORIGINS")
CORS_ALLOW_CREDENTIALS = True

# --- Base Postgres obligatoire ---------------------------------------------------
if not env("DATABASE_URL"):
    raise ImproperlyConfigured(
        "DATABASE_URL est vide : renseignez l'URL Postgres "
        "(ex. DATABASE_URL=postgres://user:pass@db:5432/pronostique)."
    )
DATABASES = {"default": env.db_url("DATABASE_URL")}

# --- Durcissement HTTPS / cookies ----------------------------------------------
SECURE_SSL_REDIRECT = env("DJANGO_SECURE_SSL_REDIRECT", default=True)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = env("DJANGO_SECURE_HSTS_SECONDS", default=31536000)
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
# Derriere un reverse proxy HTTPS (nginx, Caddy, ...) :
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
X_FRAME_OPTIONS = "DENY"

# --- Statiques : servis via `collectstatic` (STATIC_ROOT) -------------------------
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.ManifestStaticFilesStorage",
    },
}

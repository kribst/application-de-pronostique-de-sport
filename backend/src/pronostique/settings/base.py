# -*- coding: utf-8 -*-
"""Settings de base du projet pronostique (communs a dev et prod).

Les valeurs sensibles/variables sont lues depuis l'environnement (fichier
`.env` a la racine du depot, partage avec docker-compose.yml). Voir le
modele commente : .env.example
"""
import os
from datetime import timedelta
from pathlib import Path

import environ

# --- Chemins ---------------------------------------------------------------
# Ce fichier : backend/src/pronostique/settings/base.py
# BASE_DIR    : backend/src        (comme l'ancien settings.py : db.sqlite3 reste ici)
# PROJECT_ROOT: racine du depot    (la ou vivent .env.example et docker-compose.yml)
BASE_DIR = Path(__file__).resolve().parent.parent.parent
PROJECT_ROOT = BASE_DIR.parent.parent

# --- Environnement (.env) --------------------------------------------------
env = environ.Env(
    DJANGO_DEBUG=(bool, False),
    DJANGO_ALLOWED_HOSTS=(list, []),
    DJANGO_CSRF_TRUSTED_ORIGINS=(list, []),
    DJANGO_CORS_ALLOWED_ORIGINS=(list, []),
    DJANGO_LANGUAGE_CODE=(str, "fr-fr"),
    DJANGO_TIME_ZONE=(str, "Europe/Paris"),
    DJANGO_LOG_LEVEL=(str, "INFO"),
    DATABASE_URL=(str, ""),
    POSTGRES_DB=(str, "pronostique"),
    POSTGRES_USER=(str, "pronostique"),
    POSTGRES_PASSWORD=(str, ""),
    REDIS_URL=(str, ""),
    CELERY_BROKER_URL=(str, ""),
    CELERY_RESULT_BACKEND=(str, ""),
    CELERY_TASK_ALWAYS_EAGER=(bool, False),
    CELERY_BEAT_SCHEDULE_FILENAME=(str, ""),
    SPORTS_API_KEY=(str, ""),
    SPORTS_API_BASE_URL=(str, ""),
    JWT_ACCESS_TOKEN_LIFETIME_MINUTES=(int, 30),
    JWT_REFRESH_TOKEN_LIFETIME_DAYS=(int, 7),
    EMAIL_BACKEND=(str, "django.core.mail.backends.smtp.EmailBackend"),
    EMAIL_HOST=(str, "localhost"),
    EMAIL_PORT=(int, 1025),
    EMAIL_HOST_USER=(str, ""),
    EMAIL_HOST_PASSWORD=(str, ""),
    EMAIL_USE_TLS=(bool, False),
    DEFAULT_FROM_EMAIL=(str, "no-reply@pronostique.local"),
    DJANGO_SECURE_SSL_REDIRECT=(bool, False),
    DJANGO_SECURE_HSTS_SECONDS=(int, 0),
    DJANGO_ADMINS=(list, []),
)

_ENV_FILE = Path(os.environ.get("ENV_FILE", PROJECT_ROOT / ".env"))
if _ENV_FILE.is_file():
    environ.Env.read_env(str(_ENV_FILE))

# --- Securite / debug ------------------------------------------------------
# Dev : surchargeable via DJANGO_SECRET_KEY, sinon cle dev (jamais en prod).
SECRET_KEY = env(
    "DJANGO_SECRET_KEY",
    default="django-insecure-dev-only-do-not-use-in-production",
)
DEBUG = env("DJANGO_DEBUG")

ALLOWED_HOSTS = env("DJANGO_ALLOWED_HOSTS")
CSRF_TRUSTED_ORIGINS = env("DJANGO_CSRF_TRUSTED_ORIGINS")


# --- Applications ----------------------------------------------------------
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # API : DRF + CORS (frontend Next.js) + doc OpenAPI.
    # NB : seul le module "token_blacklist" de rest_framework_simplejwt doit
    # etre declare ici (il fournit les modeles OutstandingToken/BlacklistedToken
    # pour la rotation des refresh tokens). La config se fait via SIMPLE_JWT.
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "drf_spectacular",
    # Apps metier (structure §4 du cahier : users, sports, matches, odds,
    # providers, analysis, predictions, combinations). Squelettes vides
    # pour l'instant : modeles/endpoints en roadmap phases 1+.
    "apps.users.apps.UsersConfig",
    "apps.sports.apps.SportsConfig",
    "apps.matches.apps.MatchesConfig",
    "apps.odds.apps.OddsConfig",
    "apps.providers.apps.ProvidersConfig",
    "apps.analysis.apps.AnalysisConfig",
    "apps.predictions.apps.PredictionsConfig",
    "apps.combinations.apps.CombinationsConfig",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

AUTH_USER_MODEL = "users.CustomUser"

ROOT_URLCONF = "pronostique.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "pronostique.wsgi.application"
ASGI_APPLICATION = "pronostique.asgi.application"


def _database_config():
    """Config DB : Postgres si DATABASE_URL renseigne, sinon SQLite local.

    Note : une valeur vide (``DATABASE_URL=`` dans le .env) est traitee
    comme absente, pour retomber sur SQLite en dev.
    """
    database_url = (env("DATABASE_URL") or "").strip()
    if database_url:
        return env.db_url("DATABASE_URL")
    return env.db_url("SQLITE_URL", default=_SQLITE_URL)


# --- Base de donnees -------------------------------------------------------
# Sans DATABASE_URL -> SQLite local (backend/src/db.sqlite3).
# Avec DATABASE_URL=postgres://... -> PostgreSQL (docker compose / prod).
_SQLITE_URL = "sqlite:///" + str(BASE_DIR / "db.sqlite3")
DATABASES = {"default": _database_config()}


# --- Validation des mots de passe ------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# --- Internationalisation ---------------------------------------------------
LANGUAGE_CODE = env("DJANGO_LANGUAGE_CODE")
TIME_ZONE = env("DJANGO_TIME_ZONE")
USE_I18N = True
USE_TZ = True


# --- Fichiers statiques / medias --------------------------------------------
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"


# --- Cle primaire par defaut -------------------------------------------------
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# --- Cache Redis (optionnel) -------------------------------------------------
# Active uniquement si REDIS_URL est defini (service redis de docker-compose).
if env("REDIS_URL"):
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": env("REDIS_URL"),
        }
    }


# --- Celery + Beat (roadmap : sync, backtests, alertes) ----------------------
# Broker/resultat : Redis (service redis de docker-compose.yml).
# CELERY_TASK_ALWAYS_EAGER=True permet de dev/tester sans worker ni Redis.
CELERY_BROKER_URL = env("CELERY_BROKER_URL") or env("REDIS_URL")
CELERY_RESULT_BACKEND = env("CELERY_RESULT_BACKEND") or env("REDIS_URL")
CELERY_TASK_ALWAYS_EAGER = env("CELERY_TASK_ALWAYS_EAGER")
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TIMEZONE = TIME_ZONE
CELERY_ENABLE_UTC = True
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60
CELERY_TASK_SOFT_TIME_LIMIT = 25 * 60

# Ordonnanceur Beat : persistant en fichier local (pas de tâche planifiee
# pour l'instant — CELERY_BEAT_SCHEDULE reste vide). Quand les taches
# metier existeront (cahier §17 : sync_matches, sync_odds, monitor_quota,
# run_backtests...), les ajouter ici, ex. :
# CELERY_BEAT_SCHEDULE = {
#     "monitor-quota-hourly": {
#         "task": "apps.providers.tasks.monitor_quota",
#         "schedule": crontab(minute=0),  # toutes les heures
#     },
# }
CELERY_BEAT_SCHEDULER = "celery.beat:PersistentScheduler"
CELERY_BEAT_SCHEDULE_FILENAME = env("CELERY_BEAT_SCHEDULE_FILENAME") or str(
    BASE_DIR / "celerybeat-schedule"
)
CELERY_BEAT_SCHEDULE = {}


# --- Fournisseur de donnees sportives (roadmap phase 5) ----------------------
SPORTS_API_KEY = env("SPORTS_API_KEY")
SPORTS_API_BASE_URL = env("SPORTS_API_BASE_URL")
POSTGRES_DB = env("POSTGRES_DB")
POSTGRES_USER = env("POSTGRES_USER")
POSTGRES_PASSWORD = env("POSTGRES_PASSWORD")


# --- Auth JWT (roadmap phase 1 : djangorestframework-simplejwt) ------------
JWT_ACCESS_TOKEN_LIFETIME_MINUTES = env("JWT_ACCESS_TOKEN_LIFETIME_MINUTES")
JWT_REFRESH_TOKEN_LIFETIME_DAYS = env("JWT_REFRESH_TOKEN_LIFETIME_DAYS")


# --- API REST : DRF + JWT + OpenAPI (drf-spectacular) ----------------------
# JWTAccess : la session navigateur/admin Django continue de fonctionner.
# JWT par defaut pour l'API, surmontable par vue si besoin.
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 25,
    # Limite anti-abus globale (affinable par vue/throttle scope).
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/hour",
        "user": "1000/hour",
        "auth": "10/min",
    },
}

# Durees de vie JWT pilotables par env (voir .env.example).
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(
        minutes=JWT_ACCESS_TOKEN_LIFETIME_MINUTES
    ),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=JWT_REFRESH_TOKEN_LIFETIME_DAYS),
    # Renouvellement automatique du refresh a chaque refresh + blacklist de
    # l'ancien token (revoque) : limite la reutilisation en cas de fuite.
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    # Met a jour last_login de l'utilisateur lors d'un login par token.
    "UPDATE_LAST_LOGIN": True,
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Pronostique API",
    "DESCRIPTION": (
        "API de la plateforme de pronostics & analyse sportive : "
        "referentiel (sports, competitions, equipes, matchs), cotes, "
        "predictions, combinaisons et backtesting. V1 sous /api/v1/."
    ),
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "SCHEMA_PATH_PREFIX": r"/api/v[0-9]",
}


# --- CORS : frontend Next.js ------------------------------------------------
# Origines autorisees a appeler l'API (liste separee par des virgules).
CORS_ALLOWED_ORIGINS = env("DJANGO_CORS_ALLOWED_ORIGINS")


# --- Emails ------------------------------------------------------------------
EMAIL_BACKEND = env("EMAIL_BACKEND")
EMAIL_HOST = env("EMAIL_HOST")
EMAIL_PORT = env("EMAIL_PORT")
EMAIL_HOST_USER = env("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD")
EMAIL_USE_TLS = env("EMAIL_USE_TLS")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL")


# --- Admins / logs ------------------------------------------------------------
ADMINS = [(email, email) for email in env("DJANGO_ADMINS")]

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "console": {
            "format": "[{levelname}] {asctime} {name}: {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "console",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": env("DJANGO_LOG_LEVEL"),
    },
}


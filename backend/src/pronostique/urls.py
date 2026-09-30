"""URL configuration for pronostique project.

Routes :
- /admin/                     : back-office Django
- /api/v1/health/             : sonde publique de disponibilite (monitoring)
- /api/v1/auth/token/         : obtention JWT (access + refresh)
- /api/v1/auth/token/refresh/ : renouvellement JWT
- /api/v1/schema/             : schema OpenAPI (YAML telechargeable)
- /api/docs/                  : Swagger UI
- /api/redoc/                 : ReDoc

Apps metier (squelettes) — endpoints montes au fil de la roadmap :
- users        -> /api/v1/users/         (phase 1 : Auth & roles)
- sports       -> /api/v1/sports/        (phase 2 : referentiel sportif)
- matches      -> /api/v1/matches/       (phase 4 : matchs & live)
- odds         -> /api/v1/odds/          (phase 11 : cotes & bookmakers)
- providers    -> /api/v1/providers/     (phase 5 : fournisseurs & sync)
- analysis     -> /api/v1/analysis/      (phase 7 : moteur d'analyse)
- predictions  -> /api/v1/predictions/   (phases 8-10 : predictions & ML)
- combinations -> /api/v1/combinations/  (phases 13-14 : combis & bankroll)
"""
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    # Sonde publique de disponibilite (monitoring : Docker, reverse proxy,
    # uptime monitors). Montee a la racine du router pour un chemin stable
    # /api/v1/health/ independant de l'app qui l'heberge.
    path("api/v1/health/", include("apps.providers.urls_health")),
    # Auth JWT (roadmap phase 1 : Authentification & roles).
    path("api/v1/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/v1/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # Apps metier (squelettes : urlpatterns vides, montes ici des maintenant
    # pour figer les prefixes /api/v1/<domaine>/ de la roadmap).
    path("api/v1/users/", include("apps.users.urls")),
    path("api/v1/sports/", include("apps.sports.urls")),
    path("api/v1/matches/", include("apps.matches.urls")),
    path("api/v1/odds/", include("apps.odds.urls")),
    path("api/v1/providers/", include("apps.providers.urls")),
    path("api/v1/analysis/", include("apps.analysis.urls")),
    path("api/v1/predictions/", include("apps.predictions.urls")),
    path("api/v1/combinations/", include("apps.combinations.urls")),
    # Documentation OpenAPI.
    path("api/v1/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]

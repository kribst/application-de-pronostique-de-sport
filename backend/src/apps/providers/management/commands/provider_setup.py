# -*- coding: utf-8 -*-
"""Prepare l'integration API-Football : configuration + identifiants de ligues."""
from django.core.management.base import BaseCommand

from apps.providers.factory import get_config
from apps.sports.models import Competition

# Identifiants de ligues d'API-Football (stables, documentes par le fournisseur).
LEAGUE_IDS = {
    "premier-league": 39, "la-liga": 140, "ligue-1": 61, "bundesliga": 78,
    "serie-a": 135, "champions-league": 2, "europa-league": 3,
}


class Command(BaseCommand):
    help = "Cree la configuration du fournisseur et rattache les competitions a leurs ligues API-Football."

    def handle(self, *args, **options):
        config = get_config()
        linked = 0
        for slug, league_id in LEAGUE_IDS.items():
            competition = Competition.objects.filter(sport__slug="football", slug=slug).first()
            if competition and competition.external_ids.get("api-football") != league_id:
                competition.external_ids = {**competition.external_ids, "api-football": league_id}
                competition.save(update_fields=["external_ids"])
                linked += 1
        self.stdout.write(self.style.SUCCESS(
            f"Fournisseur '{config.name}' pret (quota: {config.daily_limit}/jour). "
            f"{linked} competition(s) rattachee(s)."
        ))

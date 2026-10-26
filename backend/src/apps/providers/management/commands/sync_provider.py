# -*- coding: utf-8 -*-
"""Lance une synchronisation a la main (utile pour le premier import)."""
from django.core.management.base import BaseCommand, CommandError

from apps.matches.models import Match, MatchExternalId
from apps.providers import jobs
from apps.providers.factory import build_provider, get_config
from apps.sports.models import Team

JOBS = {
    "reference": jobs.sync_reference_job,
    "fixtures": jobs.sync_fixtures_job,
    "live": jobs.sync_live_job,
    "stale": jobs.sync_stale_job,
    "details": jobs.sync_details_job,
}


class Command(BaseCommand):
    help = "sync_provider reference|fixtures|live|stale|details|all [--competition SLUG] [--season ANNEE] [--force]"

    def add_arguments(self, parser):
        parser.add_argument("what", choices=[*JOBS, "all"])
        parser.add_argument("--competition", help="slug d'une competition (ex. ligue-1)")
        parser.add_argument("--force", action="store_true", help="ignore les delais de rafraichissement")
        parser.add_argument("--season", type=int, help="annee de depart d'une saison precise (ex. 2024) ; "
                                                        "par defaut la saison courante. Utile avec le plan gratuit.")
        parser.add_argument("--purge-seed", action="store_true", help="supprime d'abord les matchs de test (seed)")
        parser.add_argument("--deactivate-unlinked-teams", action="store_true",
                            help="apres import, desactive les equipes de test jamais rattachees au fournisseur")

    def handle(self, *args, **options):
        if options["purge_seed"]:
            deleted, _ = Match.objects.filter(external_ids__provider="seed").delete()
            self.stdout.write(f"{deleted} objet(s) de test supprime(s).")

        config = get_config()
        names = list(JOBS) if options["what"] == "all" else [options["what"]]
        for name in names:
            kwargs = {}
            if name in ("reference", "fixtures"):
                kwargs = {"force": options["force"], "only": options["competition"], "season": options["season"]}
            elif name == "live":
                kwargs = {"force": options["force"]}

            def execute(stats, job=JOBS[name], kwargs=kwargs):
                job(build_provider(config), config, stats, **kwargs)

            log = jobs.run_logged(f"sync_{name}", execute)
            style = self.style.SUCCESS if log.status in ("SUCCESS", "SKIPPED") else self.style.WARNING
            self.stdout.write(style(f"{name}: {log.status} {log.stats} {log.error}"))

        if options["deactivate_unlinked_teams"]:
            count = Team.objects.filter(external_ids__isnull=True, is_active=True).update(is_active=False)
            self.stdout.write(f"{count} equipe(s) de test desactivee(s).")

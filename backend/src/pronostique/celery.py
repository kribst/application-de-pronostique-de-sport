# -*- coding: utf-8 -*-
"""Application Celery du projet pronostique.

Lancement (depuis backend/src, Docker Desktop lance pour db/redis) :
    # Terminal 1 — worker (traite les taches) :
    celery -A pronostique worker -l info --pool=solo          # Windows
    celery -A pronostique worker -l info                      # Linux/macOS
    # Terminal 2 — beat (ordonnanceur periodique) :
    celery -A pronostique beat -l info

Test de bout en bout (worker lance) :
    celery -A pronostique call pronostique.celery.celery_ping

Note Windows : le pool prefork par defaut (billiard) n'y fonctionne pas,
d'ou --pool=solo en local. En production Linux, omettre l'option.
"""
import os

from celery import Celery

# Meme regle que manage.py : dev local par defaut, surchargeable via
# DJANGO_SETTINGS_MODULE=pronostique.settings.prod.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "pronostique.settings.dev")

app = Celery("pronostique")

# Toute cle CELERY_* des settings Django (namespace CELERY) pilote Celery.
app.config_from_object("django.conf:settings", namespace="CELERY")

# Decouvre les tasks.py des futures apps (src/apps/*) via shared_task.
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=False, name="pronostique.celery.celery_ping")
def celery_ping(self):
    """Sonde de diagnostic (pas une tache metier).

    Verifie que le worker demarre, lit la config Django et repond.
    Les futures taches metier (sync_matches, monitor_quota, ...) seront
    declarees avec @shared_task dans src/apps/<domaine>/tasks.py et
    planifiees dans CELERY_BEAT_SCHEDULE (settings/base.py).
    """
    from django.utils import timezone

    return {
        "status": "ok",
        "task": self.name,
        "request_id": self.request.id,
        "now": timezone.now().isoformat(),
    }

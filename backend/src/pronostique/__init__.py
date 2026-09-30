# -*- coding: utf-8 -*-
"""Package du projet pronostique.

Expose l'application Celery (pattern officiel Celery + Django) pour que
les futures taches declarees avec @shared_task soient decouvertes par
le worker via app.autodiscover_tasks().
"""
from .celery import app as celery_app

__all__ = ("celery_app",)

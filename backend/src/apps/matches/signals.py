# -*- coding: utf-8 -*-
"""Invalide le cache de forme / H2H quand un match termine est cree, corrige ou supprime."""
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .cache import bump_team_version
from .models import Match, MatchStatus


def _touch(instance: Match) -> None:
    loaded = getattr(instance, "_loaded_status", None)
    if instance.status == MatchStatus.FINISHED or loaded == MatchStatus.FINISHED:
        bump_team_version(instance.home_team_id)
        bump_team_version(instance.away_team_id)


@receiver(post_save, sender=Match)
def match_saved(sender, instance, **kwargs):
    _touch(instance)


@receiver(post_delete, sender=Match)
def match_deleted(sender, instance, **kwargs):
    _touch(instance)

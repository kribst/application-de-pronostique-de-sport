# -*- coding: utf-8 -*-
"""Jetons, emails et revocation des refresh tokens du module users."""
import logging
from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core import signing
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

logger = logging.getLogger(__name__)

VERIFY_SALT = "users.email-verification"
VERIFY_MAX_AGE = 48 * 3600


def _frontend_link(path, **params):
    return f"{settings.FRONTEND_URL.rstrip('/')}{path}?{urlencode(params)}"


def _send(subject, body, to):
    try:
        send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [to])
    except Exception:
        logger.exception("Echec d'envoi d'email a %s", to)


def make_verification_token(user):
    return signing.dumps({"uid": str(user.pk), "email": user.email}, salt=VERIFY_SALT)


def read_verification_token(token):
    return signing.loads(token, salt=VERIFY_SALT, max_age=VERIFY_MAX_AGE)


def send_verification_email(user):
    link = _frontend_link("/auth/verify-email", token=make_verification_token(user))
    _send(
        "Confirmez votre adresse email",
        "Bonjour,\n\nConfirmez votre adresse email en ouvrant ce lien "
        f"(valable 48 heures) :\n{link}\n\n"
        "Si vous n'etes pas a l'origine de cette inscription, ignorez ce message.",
        user.email,
    )


def send_password_reset_email(user):
    link = _frontend_link(
        "/auth/password-reset",
        uid=urlsafe_base64_encode(force_bytes(str(user.pk))),
        token=default_token_generator.make_token(user),
    )
    minutes = settings.PASSWORD_RESET_TIMEOUT // 60
    _send(
        "Reinitialisation de votre mot de passe",
        f"Bonjour,\n\nPour definir un nouveau mot de passe, ouvrez ce lien "
        f"(valable {minutes} minutes, usage unique) :\n{link}\n\n"
        "Si vous n'avez rien demande, ignorez ce message : votre mot de passe "
        "reste inchange.",
        user.email,
    )


def revoke_all_refresh_tokens(user):
    """Blackliste tous les refresh tokens de l'utilisateur."""
    for token in OutstandingToken.objects.filter(user=user):
        BlacklistedToken.objects.get_or_create(token=token)
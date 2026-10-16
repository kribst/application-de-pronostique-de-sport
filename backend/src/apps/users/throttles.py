# -*- coding: utf-8 -*-
"""Limites anti-abus propres a l'authentification."""
import hashlib

from rest_framework.throttling import SimpleRateThrottle


class EmailRateThrottle(SimpleRateThrottle):
    """Limite par adresse email ciblee (en plus de la limite par IP).

    Empeche de deviner le mot de passe d'un compte en changeant d'IP. Limite
    connue : quelqu'un peut bloquer la connexion d'un compte pendant la fenetre
    (1 minute) en echouant volontairement ; c'est le compromis accepte.
    """

    scope = "auth_email"

    def get_cache_key(self, request, view):
        email = str(request.data.get("email", "")).strip().lower()
        if not email:
            return None
        ident = hashlib.sha256(email.encode("utf-8")).hexdigest()
        return self.cache_format % {"scope": self.scope, "ident": ident}

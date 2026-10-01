# -*- coding: utf-8 -*-
import ipaddress


def get_client_ip(request):
    """IP du client (derriere un proxy : premiere valeur de X-Forwarded-For).

    Valeur falsifiable par le client : usage journal uniquement, jamais controle d'acces.
    """
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    candidate = forwarded.split(",")[0].strip() if forwarded else request.META.get("REMOTE_ADDR")
    try:
        return str(ipaddress.ip_address(candidate))
    except (ValueError, TypeError):
        return None


def get_device(request):
    return request.META.get("HTTP_USER_AGENT", "")[:255]

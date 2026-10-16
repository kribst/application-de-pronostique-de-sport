# -*- coding: utf-8 -*-
import ipaddress

from rest_framework.throttling import BaseThrottle


def get_client_ip(request):
    """IP du client, calculee comme le fait DRF pour ses limites (NUM_PROXIES).

    Avec NUM_PROXIES=0 (defaut), X-Forwarded-For est ignore : on ne fait
    jamais confiance a un en-tete que le client peut falsifier. En production,
    derriere N reverse proxies de confiance, regler DJANGO_NUM_PROXIES=N.
    """
    candidate = BaseThrottle().get_ident(request)
    try:
        return str(ipaddress.ip_address(candidate))
    except (ValueError, TypeError):
        return None


def get_device(request):
    return request.META.get("HTTP_USER_AGENT", "")[:255]

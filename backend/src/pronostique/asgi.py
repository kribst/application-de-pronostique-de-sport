"""
ASGI config for pronostique project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application

# Production par defaut ; surchargeable via DJANGO_SETTINGS_MODULE.
# (manage.py fixe deja 'pronostique.settings.dev' en local : ce setdefault
# ne l'ecrase pas.)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pronostique.settings.prod')

application = get_asgi_application()

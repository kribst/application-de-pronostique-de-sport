"""
WSGI config for pronostique project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

# Production par defaut ; surchargeable via DJANGO_SETTINGS_MODULE.
# (manage.py fixe deja 'pronostique.settings.dev' en local : ce setdefault
# ne l'ecrase pas, donc `runserver` reste en dev.)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pronostique.settings.prod')

application = get_wsgi_application()

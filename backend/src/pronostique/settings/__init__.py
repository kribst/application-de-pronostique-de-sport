# -*- coding: utf-8 -*-
"""Package des settings Django (split settings : base / dev / prod).

Chargement explicite via la variable d'environnement DJANGO_SETTINGS_MODULE :

    DJANGO_SETTINGS_MODULE=pronostique.settings.dev    # local (defaut de manage.py)
    DJANGO_SETTINGS_MODULE=pronostique.settings.prod   # serveur (defaut de wsgi.py/asgi.py)

Aucun module n'est importe ici par defaut : Django charge uniquement celui
designe par DJANGO_SETTINGS_MODULE.
"""
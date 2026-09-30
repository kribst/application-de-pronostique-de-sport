#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys
from pathlib import Path


def main():
    """Run administrative tasks."""
    # Charger le .env situe a la racine du depot (le meme que docker-compose)
    # AVANT de choisir le module de settings, pour que DJANGO_SETTINGS_MODULE
    # et ENV_FILE puissent y etre definis.
    try:
        import environ

        repo_root = Path(__file__).resolve().parent.parent.parent
        env_file = Path(os.environ.get("ENV_FILE", repo_root / ".env"))
        if env_file.is_file():
            environ.Env.read_env(str(env_file))
    except ImportError:
        # django-environ n'est pas installe : on utilise uniquement
        # les variables d'environnement du systeme.
        pass
    # Dev local par defaut ; surchargeable via :
    #   DJANGO_SETTINGS_MODULE=pronostique.settings.prod python src/manage.py ...
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pronostique.settings.dev')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()

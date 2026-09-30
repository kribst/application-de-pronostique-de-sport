# -*- coding: utf-8 -*-
"""Config de l'app users (cahier §4 module 1 : Auth & Users, §5 roles).

Modeles prevus (roadmap phase 1) : CustomUser, Role, LoginHistory.
"""
from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.users"
    verbose_name = "Users (auth & roles)"

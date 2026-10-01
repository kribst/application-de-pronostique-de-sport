# -*- coding: utf-8 -*-
from rest_framework.permissions import BasePermission

from .models import Role


class HasRole(BasePermission):
    allowed_roles: tuple = ()
    message = "Votre role ne permet pas cette action."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role in self.allowed_roles)


class IsPremium(HasRole):
    allowed_roles = (Role.PREMIUM, Role.ADMIN)


class IsModerator(HasRole):
    allowed_roles = (Role.MODERATOR, Role.ADMIN)


class IsAdminRole(HasRole):
    allowed_roles = (Role.ADMIN,)

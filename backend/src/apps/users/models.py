# -*- coding: utf-8 -*-
"""Modeles de l'app users (cahier §4 module 1, §5 roles)."""
import uuid
from functools import lru_cache
from zoneinfo import available_timezones

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models.functions import Lower
from django.utils import timezone as dj_timezone


class Role(models.TextChoices):
    USER = "USER", "Utilisateur (Free)"
    PREMIUM = "PREMIUM", "Premium"
    MODERATOR = "MODERATOR", "Moderateur"
    ADMIN = "ADMIN", "Administrateur"


class Locale(models.TextChoices):
    FR = "fr", "Francais"
    EN = "en", "English"


@lru_cache(maxsize=1)
def _valid_timezones():
    return available_timezones()


def validate_timezone_name(value):
    if value not in _valid_timezones():
        raise ValidationError("Fuseau horaire invalide (ex. Africa/Douala).")


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("L'adresse email est obligatoire.")
        email = self.normalize_email(email).lower()
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", Role.ADMIN)
        extra_fields.setdefault("is_verified", True)
        if not extra_fields["is_staff"] or not extra_fields["is_superuser"]:
            raise ValueError("Un superuser doit avoir is_staff=True et is_superuser=True.")
        return self._create_user(email, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, max_length=254)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.USER, db_index=True)
    locale = models.CharField(max_length=5, choices=Locale.choices, default=Locale.FR)
    timezone = models.CharField(
        max_length=64, default="Africa/Douala", validators=[validate_timezone_name]
    )
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=dj_timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        constraints = [
            models.UniqueConstraint(Lower("email"), name="users_email_ci_unique"),
        ]

    def __str__(self):
        return self.email

    @property
    def has_premium_access(self):
        return self.role in (Role.PREMIUM, Role.ADMIN)


class LoginHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="login_history")
    ip = models.GenericIPAddressField(null=True, blank=True)
    device = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "-created_at"])]
        verbose_name_plural = "login histories"

    def __str__(self):
        return f"{self.user} @ {self.created_at:%Y-%m-%d %H:%M}"

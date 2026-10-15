# -*- coding: utf-8 -*-
"""Session-authenticated API for the independent administration console."""
import json

from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST
from rest_framework import serializers, viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import BasePermission

from apps.sports.models import Competition, Country, Round, Season, Sport

from .models import CustomUser, LoginHistory


class IsSuperuser(BasePermission):
    message = "L’accès est réservé aux superutilisateurs actifs."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_active
            and request.user.is_staff
            and request.user.is_superuser
        )


class AdminPagination(PageNumberPagination):
    page_size = 100
    page_size_query_param = "page_size"
    max_page_size = 500


def _session_user(user):
    return {
        "id": str(user.pk),
        "email": user.email,
        "username": user.username,
        "is_active": user.is_active,
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
    }


@ensure_csrf_cookie
@require_GET
def admin_csrf(request):
    return JsonResponse({"csrfToken": get_token(request)})


@csrf_protect
@require_POST
def admin_login(request):
    try:
        payload = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"message": "Requête invalide."}, status=400)

    email = payload.get("email")
    password = payload.get("password")
    if not isinstance(email, str) or not isinstance(password, str):
        return JsonResponse(
            {"message": "Renseignez votre email et votre mot de passe."},
            status=400,
        )

    user = authenticate(
        request,
        username=email.strip().lower(),
        password=password,
    )
    if user is None:
        return JsonResponse(
            {"message": "Email ou mot de passe incorrect."},
            status=401,
        )
    if not user.is_active or not user.is_staff or not user.is_superuser:
        return JsonResponse(
            {"message": "Cette interface est réservée aux superutilisateurs."},
            status=403,
        )

    login(request, user)
    return JsonResponse({"user": _session_user(user), "csrfToken": get_token(request)})


@require_GET
def admin_session(request):
    user = request.user
    if not user.is_authenticated:
        return JsonResponse({"message": "Connexion requise."}, status=401)
    if not user.is_active or not user.is_staff or not user.is_superuser:
        return JsonResponse(
            {"message": "Cette interface est réservée aux superutilisateurs."},
            status=403,
        )
    return JsonResponse({"user": _session_user(user), "csrfToken": get_token(request)})


@csrf_protect
@require_POST
def admin_logout(request):
    logout(request)
    return JsonResponse({"ok": True})


class AdminModelViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSuperuser]
    pagination_class = AdminPagination


class SportAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sport
        fields = ("id", "name", "slug", "sport_type", "is_active", "position", "config")


class SportAdminViewSet(AdminModelViewSet):
    queryset = Sport.objects.all()
    serializer_class = SportAdminSerializer


class CountryAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = ("id", "name", "code")


class CountryAdminViewSet(AdminModelViewSet):
    queryset = Country.objects.all()
    serializer_class = CountryAdminSerializer


class CompetitionAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Competition
        fields = (
            "id",
            "sport",
            "country",
            "name",
            "slug",
            "tier",
            "is_active",
            "external_ids",
        )


class CompetitionAdminViewSet(AdminModelViewSet):
    queryset = Competition.objects.select_related("sport", "country").all()
    serializer_class = CompetitionAdminSerializer


class SeasonAdminSerializer(serializers.ModelSerializer):
    label = serializers.CharField(read_only=True)

    class Meta:
        model = Season
        fields = ("id", "competition", "label", "year_start", "year_end", "is_current")


class SeasonAdminViewSet(AdminModelViewSet):
    queryset = Season.objects.select_related("competition").all()
    serializer_class = SeasonAdminSerializer


class RoundAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Round
        fields = ("id", "season", "number", "name")


class RoundAdminViewSet(AdminModelViewSet):
    queryset = Round.objects.select_related("season", "season__competition").all()
    serializer_class = RoundAdminSerializer


class UserAdminSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=6)

    class Meta:
        model = CustomUser
        fields = (
            "id",
            "email",
            "username",
            "role",
            "locale",
            "timezone",
            "is_verified",
            "is_active",
            "is_staff",
            "date_joined",
            "password",
        )
        read_only_fields = ("id", "date_joined")

    def validate(self, attrs):
        if self.instance is None and not attrs.get("password"):
            raise serializers.ValidationError({"password": "Ce champ est obligatoire."})
        if self.instance is not None and self.instance.pk == self.context["request"].user.pk:
            if attrs.get("is_active") is False or attrs.get("is_staff") is False or attrs.get("is_superuser") is False:
                raise serializers.ValidationError(
                    "Vous ne pouvez pas désactiver votre propre compte superutilisateur."
                )
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        return CustomUser.objects.create_user(password=password, **validated_data)

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        if password:
            instance.set_password(password)
        return super().update(instance, validated_data)


class UserAdminViewSet(AdminModelViewSet):
    queryset = CustomUser.objects.all().order_by("-date_joined")
    serializer_class = UserAdminSerializer

    def perform_destroy(self, instance):
        if instance.pk == self.request.user.pk:
            raise ValidationError("Vous ne pouvez pas supprimer votre propre compte.")
        if instance.is_superuser:
            raise PermissionDenied(
                "La suppression d’un superutilisateur doit être effectuée dans Django Admin."
            )
        instance.delete()


class LoginHistoryAdminSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = LoginHistory
        fields = ("id", "user", "user_email", "ip", "device", "created_at")
        read_only_fields = fields


class LoginHistoryAdminViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LoginHistory.objects.select_related("user").all()
    serializer_class = LoginHistoryAdminSerializer
    permission_classes = [IsSuperuser]
    pagination_class = AdminPagination

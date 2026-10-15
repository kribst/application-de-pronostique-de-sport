# -*- coding: utf-8 -*-
import binascii

from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core import signing
from rest_framework import serializers
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import RefreshToken

from .models import LoginHistory
from .services import read_verification_token, revoke_all_refresh_tokens
from .utils import get_client_ip, get_device

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "username", "role", "locale", "timezone", "is_verified", "is_active", "is_staff", "is_superuser", "date_joined")
        # Seuls locale et timezone sont modifiables par l'utilisateur.
        read_only_fields = ("id", "email", "role", "is_verified", "is_active", "is_staff", "is_superuser", "date_joined")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, min_length=6, style={"input_type": "password"}
    )
    password_confirm = serializers.CharField(write_only=True, style={"input_type": "password"})
    username = serializers.CharField(
        required=True,
        min_length=6,
        max_length=150,
        help_text="Doit contenir au moins 6 caractères.",
        style={"input_type": "text"},
    )

    class Meta:
        model = User
        fields = ("email", "password", "password_confirm", "locale", "timezone", "username")
        extra_kwargs = {
            "locale": {"required": False},
            "timezone": {"required": False},
            "username": {"required": True},
        }

    def validate_email(self, value):
        value = value.lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Un compte existe deja avec cet email.")
        return value

    def validate_username(self, value):
        value = value.strip()
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Ce nom d'utilisateur est deja utilise.")
        return value

    def validate(self, attrs):
        confirm = attrs.pop("password_confirm")
        if attrs["password"] != confirm:
            raise serializers.ValidationError(
                {"password_confirm": "Les mots de passe ne correspondent pas."}
            )
        try:
            validate_password(
                attrs["password"],
                User(email=attrs["email"], username=attrs["username"]),
            )
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)})
        return attrs

    def create(self, validated_data):
        # Le role n'est jamais lu depuis la requete : tout nouveau compte est USER.
        return User.objects.create_user(**validated_data)


class LoginSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        attrs["email"] = attrs["email"].lower()
        data = super().validate(attrs)
        if not self.user.is_verified:
            from rest_framework_simplejwt.tokens import RefreshToken

            RefreshToken(data["refresh"]).blacklist()
            raise serializers.ValidationError("Veuillez d'abord confirmer votre adresse email.")
        request = self.context.get("request")
        if request is not None:
            LoginHistory.objects.create(
                user=self.user, ip=get_client_ip(request), device=get_device(request)
            )
        data["user"] = UserSerializer(self.user).data
        return data


class VerifiedTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        try:
            refresh = RefreshToken(attrs["refresh"])
            user_id = refresh.get(api_settings.USER_ID_CLAIM)
            user = User.objects.get(**{api_settings.USER_ID_FIELD: user_id})
        except (TokenError, User.DoesNotExist) as exc:
            raise InvalidToken({"detail": str(exc), "code": "token_not_valid"})
        if not user.is_active or not user.is_verified:
            raise InvalidToken(
                {"detail": "Compte inactif ou adresse email non confirmee.", "code": "token_not_valid"}
            )
        return super().validate(attrs)


class LoginHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = LoginHistory
        fields = ("id", "ip", "device", "created_at")


class EmailOnlySerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(write_only=True, style={"input_type": "password"})
    password_confirm = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate(self, attrs):
        invalid = serializers.ValidationError({"token": "Lien invalide ou expire."})
        try:
            pk = force_str(urlsafe_base64_decode(attrs["uid"]))
            user = User.objects.get(pk=pk, is_active=True)
        except (
            binascii.Error,
            TypeError,
            ValueError,
            OverflowError,
            DjangoValidationError,
            User.DoesNotExist,
        ):
            raise invalid
        if not default_token_generator.check_token(user, attrs["token"]):
            raise invalid
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": "Les mots de passe ne correspondent pas."}
            )
        try:
            validate_password(attrs["password"], user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)})
        attrs["user"] = user
        return attrs

    def save(self, **kwargs):
        user = self.validated_data["user"]
        user.set_password(self.validated_data["password"])
        user.save(update_fields=["password"])
        revoke_all_refresh_tokens(user)
        return user


class VerifyEmailSerializer(serializers.Serializer):
    token = serializers.CharField()

    def validate(self, attrs):
        try:
            data = read_verification_token(attrs["token"])
            attrs["user"] = User.objects.get(
                pk=data["uid"], email=data["email"], is_active=True
            )
        except (
            signing.BadSignature,
            KeyError,
            TypeError,
            ValueError,
            DjangoValidationError,
            User.DoesNotExist,
        ):
            raise serializers.ValidationError({"token": "Lien invalide ou expire."})
        return attrs

    def save(self, **kwargs):
        user = self.validated_data["user"]
        if not user.is_verified:
            user.is_verified = True
            user.save(update_fields=["is_verified"])
        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate_old_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("Mot de passe actuel incorrect.")
        return value

    def validate(self, attrs):
        user = self.context["request"].user
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": "Les mots de passe ne correspondent pas."}
            )
        try:
            validate_password(attrs["new_password"], user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"new_password": list(exc.messages)})
        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        revoke_all_refresh_tokens(user)
        return user

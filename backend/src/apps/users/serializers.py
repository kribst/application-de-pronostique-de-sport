# -*- coding: utf-8 -*-
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import LoginHistory
from .utils import get_client_ip, get_device

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "role", "locale", "timezone", "is_verified", "date_joined")
        # Seuls locale et timezone sont modifiables par l'utilisateur.
        read_only_fields = ("id", "email", "role", "is_verified", "date_joined")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, style={"input_type": "password"})
    password_confirm = serializers.CharField(write_only=True, style={"input_type": "password"})

    class Meta:
        model = User
        fields = ("email", "password", "password_confirm", "locale", "timezone")
        extra_kwargs = {"locale": {"required": False}, "timezone": {"required": False}}

    def validate_email(self, value):
        value = value.lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Un compte existe deja avec cet email.")
        return value

    def validate(self, attrs):
        confirm = attrs.pop("password_confirm")
        if attrs["password"] != confirm:
            raise serializers.ValidationError(
                {"password_confirm": "Les mots de passe ne correspondent pas."}
            )
        try:
            validate_password(attrs["password"], User(email=attrs["email"]))
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
        request = self.context.get("request")
        if request is not None:
            LoginHistory.objects.create(
                user=self.user, ip=get_client_ip(request), device=get_device(request)
            )
        data["user"] = UserSerializer(self.user).data
        return data


class LoginHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = LoginHistory
        fields = ("id", "ip", "device", "created_at")

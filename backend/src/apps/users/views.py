# -*- coding: utf-8 -*-
from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import LoginHistory
from .serializers import (
    ChangePasswordSerializer,
    EmailOnlySerializer,
    LoginHistorySerializer,
    LoginSerializer,
    PasswordResetConfirmSerializer,
    RegisterSerializer,
    UserSerializer,
    VerifyEmailSerializer,
    VerifiedTokenRefreshSerializer,
)
from .throttles import EmailRateThrottle
from .services import send_password_reset_email, send_verification_email

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        send_verification_email(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "detail": "Un email de confirmation vient de vous etre envoye.",
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer
    throttle_classes = [ScopedRateThrottle, EmailRateThrottle]
    throttle_scope = "auth"


class VerifiedTokenRefreshView(TokenRefreshView):
    serializer_class = VerifiedTokenRefreshSerializer


class LogoutView(generics.GenericAPIView):
    """Revoque le refresh token transmis dans le corps de la requete.

    Le client (frontend Next.js) appelle cette route depuis sa route
    /api/auth/logout avant de supprimer ses cookies httpOnly. Le refresh token
    est ajoute a la blacklist : il ne pourra plus servir a obtenir un nouvel
    access token. L'access token deja emis reste valide jusqu'a expiration
    (30 min), la blacklist ne couvrant pas les access tokens.

    Un refresh token invalide, deja revoque ou expire renvoie 205 plutot
    qu'une erreur : la deconnexion doit aboutir dans tous les cas.
    """

    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = None
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        raw_refresh = request.data.get("refresh")
        if not raw_refresh:
            return Response(status=status.HTTP_205_RESET_CONTENT)
        try:
            RefreshToken(raw_refresh).blacklist()
        except TokenError:
            # Deja revoque, expire ou forgé : la session est de toute facon close.
            pass
        return Response(status=status.HTTP_205_RESET_CONTENT)


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "patch", "head", "options"]

    def get_object(self):
        return self.request.user


class LoginHistoryView(generics.ListAPIView):
    serializer_class = LoginHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return LoginHistory.objects.filter(user=self.request.user)


class PasswordResetRequestView(generics.GenericAPIView):
    serializer_class = EmailOnlySerializer
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle, EmailRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.filter(
            email__iexact=serializer.validated_data["email"], is_active=True
        ).first()
        if user is not None:
            send_password_reset_email(user)
        return Response(
            {"detail": "Si un compte correspond a cette adresse, un email a ete envoye."}
        )


class PasswordResetConfirmView(generics.GenericAPIView):
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class VerifyEmailView(generics.GenericAPIView):
    serializer_class = VerifyEmailSerializer
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Adresse email confirmee."})


class ResendVerificationView(generics.GenericAPIView):
    serializer_class = EmailOnlySerializer
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle, EmailRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.filter(
            email__iexact=serializer.validated_data["email"],
            is_active=True,
            is_verified=False,
        ).first()
        if user is not None:
            send_verification_email(user)
        return Response(
            {"detail": "Si un compte non confirme correspond a cette adresse, un email a ete envoye."}
        )


class ChangePasswordView(generics.GenericAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

# -*- coding: utf-8 -*-
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import LoginHistory
from .serializers import (
    LoginHistorySerializer,
    LoginSerializer,
    RegisterSerializer,
    UserSerializer,
)


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
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"


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

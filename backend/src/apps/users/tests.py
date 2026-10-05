# -*- coding: utf-8 -*-
from types import SimpleNamespace

from django.core.cache import cache
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import CustomUser, LoginHistory, Role
from .permissions import IsAdminRole, IsPremium

PASSWORD = "S3cure-pass-2026!"


def register_payload(email="test@example.com", **extra):
    return {"email": email, "password": PASSWORD, "password_confirm": PASSWORD, **extra}


class AuthFlowTests(APITestCase):
    def setUp(self):
        cache.clear()  # remet a zero le rate limiting entre les tests

    def test_register_creates_user_with_default_role(self):
        r = self.client.post(reverse("auth-register"), register_payload("Test@Example.com"), format="json")
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", r.data)
        user = CustomUser.objects.get(email="test@example.com")
        self.assertEqual(user.role, Role.USER)
        self.assertFalse(user.is_verified)

    def test_register_ignores_role_in_payload(self):
        self.client.post(
            reverse("auth-register"), register_payload(role="ADMIN", is_staff=True), format="json"
        )
        user = CustomUser.objects.get(email="test@example.com")
        self.assertEqual(user.role, Role.USER)
        self.assertFalse(user.is_staff)

    def test_register_duplicate_email_is_case_insensitive(self):
        self.client.post(reverse("auth-register"), register_payload("a@b.com"), format="json")
        r = self.client.post(reverse("auth-register"), register_payload("A@B.com"), format="json")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_password_mismatch(self):
        payload = register_payload()
        payload["password_confirm"] = "autre-chose"
        r = self.client.post(reverse("auth-register"), payload, format="json")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_returns_tokens_and_records_history(self):
        CustomUser.objects.create_user("u@x.com", PASSWORD)
        r = self.client.post(reverse("auth-login"), {"email": "U@x.com", "password": PASSWORD}, format="json")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertIn("access", r.data)
        self.assertIn("refresh", r.data)
        self.assertEqual(LoginHistory.objects.filter(user__email="u@x.com").count(), 1)

    def test_login_wrong_password(self):
        CustomUser.objects.create_user("u@x.com", PASSWORD)
        r = self.client.post(reverse("auth-login"), {"email": "u@x.com", "password": "nope"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(LoginHistory.objects.count(), 0)

    def test_refresh_returns_new_access(self):
        CustomUser.objects.create_user("u@x.com", PASSWORD)
        login = self.client.post(reverse("auth-login"), {"email": "u@x.com", "password": PASSWORD}, format="json")
        r = self.client.post(reverse("auth-refresh"), {"refresh": login.data["refresh"]}, format="json")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertIn("access", r.data)

    def test_login_is_rate_limited(self):
        for _ in range(10):
            self.client.post(reverse("auth-login"), {"email": "x@x.com", "password": "bad"}, format="json")
        r = self.client.post(reverse("auth-login"), {"email": "x@x.com", "password": "bad"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_logout_blacklists_refresh_token(self):
        CustomUser.objects.create_user("u@x.com", PASSWORD)
        login = self.client.post(reverse("auth-login"), {"email": "u@x.com", "password": PASSWORD}, format="json")
        refresh = login.data["refresh"]

        r = self.client.post(reverse("auth-logout"), {"refresh": refresh}, format="json")
        self.assertEqual(r.status_code, status.HTTP_205_RESET_CONTENT)

        # Le refresh revoque ne permet plus d'obtenir un nouvel access token.
        again = self.client.post(reverse("auth-refresh"), {"refresh": refresh}, format="json")
        self.assertEqual(again.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_accepts_missing_or_invalid_refresh(self):
        r = self.client.post(reverse("auth-logout"), {}, format="json")
        self.assertEqual(r.status_code, status.HTTP_205_RESET_CONTENT)
        r = self.client.post(reverse("auth-logout"), {"refresh": "pas-un-jwt"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_205_RESET_CONTENT)


class MeEndpointTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = CustomUser.objects.create_user("me@x.com", PASSWORD)

    def test_me_requires_authentication(self):
        r = self.client.get(reverse("users-me"))
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_get_and_patch_allowed_fields(self):
        self.client.force_authenticate(self.user)
        r = self.client.patch(reverse("users-me"), {"locale": "en", "timezone": "Europe/Paris"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.locale, "en")
        self.assertEqual(self.user.timezone, "Europe/Paris")

    def test_me_cannot_escalate_role(self):
        self.client.force_authenticate(self.user)
        self.client.patch(reverse("users-me"), {"role": "ADMIN", "is_verified": True}, format="json")
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, Role.USER)
        self.assertFalse(self.user.is_verified)

    def test_me_rejects_invalid_timezone(self):
        self.client.force_authenticate(self.user)
        r = self.client.patch(reverse("users-me"), {"timezone": "Mars/Olympus"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_history_only_lists_own_entries(self):
        other = CustomUser.objects.create_user("other@x.com", PASSWORD)
        LoginHistory.objects.create(user=self.user, ip="127.0.0.1")
        LoginHistory.objects.create(user=other, ip="10.0.0.1")
        self.client.force_authenticate(self.user)
        r = self.client.get(reverse("users-me-history"))
        self.assertEqual(r.data["count"], 1)


class RolePermissionTests(APITestCase):
    def _request(self, role):
        user = CustomUser.objects.create_user(f"{role.lower()}@x.com", PASSWORD, role=role)
        return SimpleNamespace(user=user)

    def test_premium_permission(self):
        perm = IsPremium()
        self.assertFalse(perm.has_permission(self._request(Role.USER), None))
        self.assertTrue(perm.has_permission(self._request(Role.PREMIUM), None))
        self.assertTrue(perm.has_permission(self._request(Role.ADMIN), None))

    def test_admin_permission(self):
        perm = IsAdminRole()
        self.assertFalse(perm.has_permission(self._request(Role.MODERATOR), None))
        self.assertTrue(perm.has_permission(self._request(Role.ADMIN), None))

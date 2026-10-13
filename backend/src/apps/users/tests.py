# -*- coding: utf-8 -*-
from urllib.parse import parse_qs, urlsplit
from types import SimpleNamespace

from django.core.cache import cache
from django.core import mail
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from .models import CustomUser, LoginHistory, Role
from .permissions import IsAdminRole, IsPremium
from .services import make_verification_token

PASSWORD = "S3cure-pass-2026!"


def register_payload(email="test@example.com", **extra):
    return {
        "email": email,
        "username": "test_user",
        "password": PASSWORD,
        "password_confirm": PASSWORD,
        **extra,
    }


class AuthFlowTests(APITestCase):
    def setUp(self):
        cache.clear()  # remet a zero le rate limiting entre les tests

    def test_register_creates_user_with_default_role(self):
        r = self.client.post(reverse("auth-register"), register_payload("Test@Example.com"), format="json")
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertNotIn("access", r.data)
        self.assertNotIn("refresh", r.data)
        user = CustomUser.objects.get(email="test@example.com")
        self.assertEqual(user.role, Role.USER)
        self.assertFalse(user.is_verified)
        self.assertEqual(user.username, "test_user")

    def test_register_rejects_username_shorter_than_six_characters(self):
        response = self.client.post(
            reverse("auth-register"), register_payload(username="abcde"), format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)

    def test_register_rejects_duplicate_username(self):
        first = self.client.post(
            reverse("auth-register"),
            register_payload("first@example.com", username="same_user"),
            format="json",
        )
        second = self.client.post(
            reverse("auth-register"),
            register_payload("second@example.com", username="same_user"),
            format="json",
        )
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", second.data)

    def test_register_rejects_password_shorter_than_six_characters(self):
        payload = register_payload(password="Ab3!x", password_confirm="Ab3!x")
        response = self.client.post(reverse("auth-register"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)

    def test_register_accepts_six_character_password(self):
        response = self.client.post(
            reverse("auth-register"),
            register_payload(
                "six-character@example.com",
                username="six_char",
                password="Ax5!qZ",
                password_confirm="Ax5!qZ",
            ),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

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
        CustomUser.objects.create_user("u@x.com", PASSWORD, username="user_test", is_verified=True)
        r = self.client.post(reverse("auth-login"), {"email": "U@x.com", "password": PASSWORD}, format="json")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertIn("access", r.data)
        self.assertIn("refresh", r.data)
        self.assertEqual(LoginHistory.objects.filter(user__email="u@x.com").count(), 1)

    def test_login_wrong_password(self):
        CustomUser.objects.create_user("u@x.com", PASSWORD, username="user_test", is_verified=True)
        r = self.client.post(reverse("auth-login"), {"email": "u@x.com", "password": "nope"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(LoginHistory.objects.count(), 0)

    def test_refresh_returns_new_access(self):
        CustomUser.objects.create_user("u@x.com", PASSWORD, username="user_test", is_verified=True)
        login = self.client.post(reverse("auth-login"), {"email": "u@x.com", "password": PASSWORD}, format="json")
        r = self.client.post(reverse("auth-refresh"), {"refresh": login.data["refresh"]}, format="json")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertIn("access", r.data)

    def test_refresh_rejects_unverified_account(self):
        user = CustomUser.objects.create_user("pending@x.com", PASSWORD, username="pending_user")
        refresh = RefreshToken.for_user(user)
        response = self.client.post(
            reverse("auth-refresh"), {"refresh": str(refresh)}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_is_rate_limited(self):
        for _ in range(10):
            self.client.post(reverse("auth-login"), {"email": "x@x.com", "password": "bad"}, format="json")
        r = self.client.post(reverse("auth-login"), {"email": "x@x.com", "password": "bad"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_logout_blacklists_refresh_token(self):
        CustomUser.objects.create_user("u@x.com", PASSWORD, username="user_test", is_verified=True)
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


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    FRONTEND_URL="http://localhost:3000",
)
class AccountSecurityFlowTests(APITestCase):
    def setUp(self):
        cache.clear()
        mail.outbox.clear()

    def _email_params(self, message):
        link = next(line for line in message.body.splitlines() if line.startswith("http://"))
        return parse_qs(urlsplit(link).query)

    def test_registration_requires_email_verification_before_login(self):
        response = self.client.post(
            reverse("auth-register"), register_payload("verify@example.com"), format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn("access", response.data)
        self.assertEqual(len(mail.outbox), 1)

        user = CustomUser.objects.get(email="verify@example.com")
        login = self.client.post(
            reverse("auth-login"),
            {"email": user.email, "password": PASSWORD},
            format="json",
        )
        self.assertEqual(login.status_code, status.HTTP_400_BAD_REQUEST)

        params = self._email_params(mail.outbox[0])
        verified = self.client.post(
            reverse("auth-verify-email"), {"token": params["token"][0]}, format="json"
        )
        self.assertEqual(verified.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.is_verified)

        login = self.client.post(
            reverse("auth-login"),
            {"email": user.email, "password": PASSWORD},
            format="json",
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)

    def test_verification_rejects_invalid_token(self):
        response = self.client.post(
            reverse("auth-verify-email"), {"token": "invalid"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_resend_verification_is_generic_for_unknown_email(self):
        self.client.post(
            reverse("auth-register"), register_payload("pending@example.com"), format="json"
        )
        pending = self.client.post(
            reverse("auth-resend-verification"),
            {"email": "pending@example.com"},
            format="json",
        )
        unknown = self.client.post(
            reverse("auth-resend-verification"),
            {"email": "unknown@example.com"},
            format="json",
        )
        self.assertEqual(pending.status_code, status.HTTP_200_OK)
        self.assertEqual(pending.data, unknown.data)
        self.assertEqual(len(mail.outbox), 2)

    def test_password_reset_rejects_invalid_uid(self):
        response = self.client.post(
            reverse("auth-password-reset-confirm"),
            {
                "uid": "%%%",
                "token": "invalid",
                "password": "Another-secure-pass-2026!",
                "password_confirm": "Another-secure-pass-2026!",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_password_reset_request_does_not_disclose_unknown_email(self):
        CustomUser.objects.create_user(
            "known@example.com", PASSWORD, username="known_user", is_verified=True
        )
        known = self.client.post(
            reverse("auth-password-reset"), {"email": "known@example.com"}, format="json"
        )
        unknown = self.client.post(
            reverse("auth-password-reset"), {"email": "unknown@example.com"}, format="json"
        )
        self.assertEqual(known.status_code, status.HTTP_200_OK)
        self.assertEqual(known.data, unknown.data)
        self.assertEqual(len(mail.outbox), 1)

    def test_password_reset_changes_password_and_revokes_refresh_token(self):
        user = CustomUser.objects.create_user(
            "reset@example.com", PASSWORD, username="reset_user", is_verified=True
        )
        login = self.client.post(
            reverse("auth-login"),
            {"email": user.email, "password": PASSWORD},
            format="json",
        )
        self.client.post(
            reverse("auth-password-reset"), {"email": user.email}, format="json"
        )
        reset_link = next(
            line for line in mail.outbox[0].body.splitlines() if line.startswith("http://")
        )
        self.assertEqual(urlsplit(reset_link).path, "/auth/password-reset")
        params = parse_qs(urlsplit(reset_link).query)
        new_password = "Another-secure-pass-2026!"
        response = self.client.post(
            reverse("auth-password-reset-confirm"),
            {
                "uid": params["uid"][0],
                "token": params["token"][0],
                "password": new_password,
                "password_confirm": new_password,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        user.refresh_from_db()
        self.assertTrue(user.check_password(new_password))

        refresh = self.client.post(
            reverse("auth-refresh"), {"refresh": login.data["refresh"]}, format="json"
        )
        self.assertEqual(refresh.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_change_password_requires_current_password_and_revokes_refresh(self):
        user = CustomUser.objects.create_user(
            "change@example.com", PASSWORD, username="change_user", is_verified=True
        )
        login = self.client.post(
            reverse("auth-login"),
            {"email": user.email, "password": PASSWORD},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
        new_password = "Changed-secure-pass-2026!"
        response = self.client.post(
            reverse("users-me-password"),
            {
                "old_password": PASSWORD,
                "new_password": new_password,
                "new_password_confirm": new_password,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        user.refresh_from_db()
        self.assertTrue(user.check_password(new_password))

        refresh = self.client.post(
            reverse("auth-refresh"), {"refresh": login.data["refresh"]}, format="json"
        )
        self.assertEqual(refresh.status_code, status.HTTP_401_UNAUTHORIZED)


class MeEndpointTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = CustomUser.objects.create_user("me@x.com", PASSWORD, username="me_user")

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
        other = CustomUser.objects.create_user("other@x.com", PASSWORD, username="other_user")
        LoginHistory.objects.create(user=self.user, ip="127.0.0.1")
        LoginHistory.objects.create(user=other, ip="10.0.0.1")
        self.client.force_authenticate(self.user)
        r = self.client.get(reverse("users-me-history"))
        self.assertEqual(r.data["count"], 1)


class RolePermissionTests(APITestCase):
    def _request(self, role):
        user = CustomUser.objects.create_user(
            f"{role.lower()}@x.com", PASSWORD, username=f"{role.lower()}user", role=role
        )
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

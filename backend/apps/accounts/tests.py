from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

User = get_user_model()

REGISTER_URL = '/api/v1/accounts/register/'
PAYLOAD = {'username': 'newbie', 'email': 'n@x.com', 'password': 'a-long-passphrase-42'}


class RegisterTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def test_registration_closed_by_default(self):
        r = self.client.post(REGISTER_URL, PAYLOAD, format='json')
        self.assertEqual(r.status_code, 403)
        self.assertFalse(User.objects.filter(username='newbie').exists())

    @override_settings(ALLOW_PUBLIC_REGISTRATION=True)
    def test_registration_when_enabled(self):
        r = self.client.post(REGISTER_URL, PAYLOAD, format='json')
        self.assertEqual(r.status_code, 201, r.content)
        self.assertTrue(User.objects.filter(username='newbie').exists())


class TokenThrottleTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def test_login_attempts_are_rate_limited(self):
        statuses = [
            self.client.post(
                '/api/v1/auth/token/',
                {'email': 'nobody@x.com', 'password': 'wrong'},
                format='json',
            ).status_code
            for _ in range(11)  # `auth` scope allows 10/min
        ]
        self.assertEqual(statuses, [401] * 10 + [429])

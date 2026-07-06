from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient

from apps.common.permissions import GROUP_MODERATOR

from .models import ContactMessage, ContactReply

User = get_user_model()


class ContactMessageModelTests(TestCase):
    def test_default_status_is_new(self):
        m = ContactMessage.objects.create(name='X', email='x@y.com', message='hello')
        self.assertEqual(m.status, ContactMessage.Status.NEW)

    def test_mark_read_sets_timestamp(self):
        m = ContactMessage.objects.create(name='X', email='x@y.com', message='h')
        m.mark_read()
        self.assertEqual(m.status, ContactMessage.Status.READ)
        self.assertIsNotNone(m.read_at)

    def test_mark_read_from_read_state_is_noop(self):
        m = ContactMessage.objects.create(
            name='X', email='x@y.com', message='h', status=ContactMessage.Status.READ,
        )
        m.mark_read()  # no-op
        self.assertEqual(m.status, ContactMessage.Status.READ)

    def test_mark_handled_records_who(self):
        u = User.objects.create_user(username='u', email='u@x.com', password='X')
        m = ContactMessage.objects.create(name='X', email='x@y.com', message='h')
        m.mark_handled(by=u)
        self.assertEqual(m.status, ContactMessage.Status.HANDLED)
        self.assertEqual(m.handled_by, u)
        self.assertIsNotNone(m.handled_at)

    def test_open_queryset(self):
        for st in [
            ContactMessage.Status.NEW,
            ContactMessage.Status.READ,
            ContactMessage.Status.IN_PROGRESS,
            ContactMessage.Status.HANDLED,
            ContactMessage.Status.ARCHIVED,
            ContactMessage.Status.SPAM,
        ]:
            ContactMessage.objects.create(name=st, email=f'{st}@x.com', message='h', status=st)
        self.assertEqual(ContactMessage.objects.open().count(), 3)


class ContactPublicApiTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def test_submit_creates_new(self):
        r = self.client.post('/api/v1/contacts/', {
            'name': 'Jean', 'email': 'j@x.com',
            'subject': 'Bonjour', 'message': 'Merci pour la chaîne.',
        }, format='json')
        self.assertEqual(r.status_code, 201, r.content)
        m = ContactMessage.objects.get()
        self.assertEqual(m.name, 'Jean')
        self.assertEqual(m.status, ContactMessage.Status.NEW)

    def test_honeypot_returns_success_without_saving(self):
        before = ContactMessage.objects.count()
        r = self.client.post('/api/v1/contacts/', {
            'name': 'Bot', 'email': 'b@x.com', 'message': 'spam',
            'hp_field': 'gotcha',
        }, format='json')
        self.assertEqual(r.status_code, 201)
        self.assertEqual(ContactMessage.objects.count(), before)

    def test_submit_captures_audit(self):
        r = self.client.post(
            '/api/v1/contacts/',
            {'name': 'IP', 'email': 'ip@x.com', 'message': 'hi'},
            format='json',
            HTTP_X_FORWARDED_FOR='9.9.9.9, 10.0.0.1',
            HTTP_USER_AGENT='TestUA/1.0',
            HTTP_REFERER='https://ltltv.com/contact',
        )
        self.assertEqual(r.status_code, 201)
        m = ContactMessage.objects.get(name='IP')
        self.assertEqual(m.submitted_ip, '9.9.9.9')
        self.assertEqual(m.submitted_user_agent, 'TestUA/1.0')
        self.assertEqual(m.referrer, 'https://ltltv.com/contact')

    def test_missing_required_returns_400(self):
        r = self.client.post('/api/v1/contacts/', {'name': 'X'}, format='json')
        self.assertEqual(r.status_code, 400)

    def test_no_public_list(self):
        r = self.client.get('/api/v1/contacts/')
        # Router only mounts POST for this viewset — GET should 405 or 404
        self.assertIn(r.status_code, (404, 405))


class ContactAdminApiTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.moderator = User.objects.create_user(
            username='mod', email='mod@x.com', password='StrongPass123', is_staff=True,
        )
        self.moderator.groups.add(Group.objects.create(name=GROUP_MODERATOR))
        self.m = ContactMessage.objects.create(
            name='Alice', email='a@x.com', message='Bonjour',
        )

    def test_anon_cannot_access(self):
        r = self.client.get('/api/v1/contacts/admin/')
        self.assertIn(r.status_code, (401, 403))

    def test_moderator_list(self):
        self.client.force_authenticate(self.moderator)
        r = self.client.get('/api/v1/contacts/admin/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.json()['results']), 1)

    def test_mark_read(self):
        self.client.force_authenticate(self.moderator)
        r = self.client.post(f'/api/v1/contacts/admin/{self.m.pk}/mark_read/')
        self.assertEqual(r.status_code, 200)
        self.m.refresh_from_db()
        self.assertEqual(self.m.status, ContactMessage.Status.READ)

    def test_mark_handled(self):
        self.client.force_authenticate(self.moderator)
        r = self.client.post(f'/api/v1/contacts/admin/{self.m.pk}/mark_handled/')
        self.assertEqual(r.status_code, 200)
        self.m.refresh_from_db()
        self.assertEqual(self.m.status, ContactMessage.Status.HANDLED)
        self.assertEqual(self.m.handled_by, self.moderator)

    def test_archive_and_spam(self):
        self.client.force_authenticate(self.moderator)
        r = self.client.post(f'/api/v1/contacts/admin/{self.m.pk}/archive/')
        self.assertEqual(r.status_code, 200)
        self.m.refresh_from_db()
        self.assertEqual(self.m.status, ContactMessage.Status.ARCHIVED)

        r = self.client.post(f'/api/v1/contacts/admin/{self.m.pk}/mark_spam/')
        self.m.refresh_from_db()
        self.assertEqual(self.m.status, ContactMessage.Status.SPAM)

    def test_assign_and_unassign(self):
        other = User.objects.create_user(username='other', email='o@x.com', password='X')
        self.client.force_authenticate(self.moderator)

        r = self.client.post(
            f'/api/v1/contacts/admin/{self.m.pk}/assign/',
            {'user_id': other.pk}, format='json',
        )
        self.assertEqual(r.status_code, 200)
        self.m.refresh_from_db()
        self.assertEqual(self.m.assigned_to, other)

        r = self.client.post(
            f'/api/v1/contacts/admin/{self.m.pk}/assign/',
            {'user_id': ''}, format='json',
        )
        self.assertEqual(r.status_code, 200)
        self.m.refresh_from_db()
        self.assertIsNone(self.m.assigned_to)

    def test_assign_nonexistent_returns_404(self):
        self.client.force_authenticate(self.moderator)
        r = self.client.post(
            f'/api/v1/contacts/admin/{self.m.pk}/assign/',
            {'user_id': 99999}, format='json',
        )
        self.assertEqual(r.status_code, 404)

    def test_reply_creates_and_transitions(self):
        self.client.force_authenticate(self.moderator)
        r = self.client.post(
            f'/api/v1/contacts/admin/{self.m.pk}/reply/',
            {'body': 'Bonjour Alice, merci pour votre message.'},
            format='json',
        )
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(ContactReply.objects.count(), 1)
        reply = ContactReply.objects.get()
        self.assertEqual(reply.author, self.moderator)
        # Auto-transition new → in_progress
        self.m.refresh_from_db()
        self.assertEqual(self.m.status, ContactMessage.Status.IN_PROGRESS)

    def test_reply_empty_body_returns_400(self):
        self.client.force_authenticate(self.moderator)
        r = self.client.post(
            f'/api/v1/contacts/admin/{self.m.pk}/reply/',
            {'body': '   '}, format='json',
        )
        self.assertEqual(r.status_code, 400)

    def test_filter_by_status(self):
        ContactMessage.objects.create(name='X', email='x@x.com', message='h',
                                      status=ContactMessage.Status.HANDLED)
        self.client.force_authenticate(self.moderator)
        r = self.client.get('/api/v1/contacts/admin/?status=handled')
        self.assertEqual(r.status_code, 200)
        results = r.json()['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['status'], 'handled')

    def test_search(self):
        ContactMessage.objects.create(name='Marie', email='marie@x.com', message='autre')
        self.client.force_authenticate(self.moderator)
        r = self.client.get('/api/v1/contacts/admin/?search=Marie')
        self.assertEqual(r.status_code, 200)
        results = r.json()['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['name'], 'Marie')

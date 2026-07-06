from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient

from apps.common.permissions import GROUP_MODERATOR

from .models import Testimonial

User = get_user_model()


class TestimonialModelTests(TestCase):
    def test_default_status_is_pending(self):
        t = Testimonial.objects.create(author_name='Sarah M.', story='Test story')
        self.assertEqual(t.status, Testimonial.Status.PENDING)

    def test_story_short_auto_truncates(self):
        t = Testimonial.objects.create(
            author_name='X', story='a' * 500,
        )
        self.assertLessEqual(len(t.story_short), 280)
        self.assertTrue(t.story_short.endswith('…'))

    def test_slug_auto_generated(self):
        t = Testimonial.objects.create(author_name='Sarah M.', story='s')
        self.assertEqual(t.slug, 'sarah-m')

    def test_approve_records_moderator(self):
        user = User.objects.create_user(username='mod', email='m@x.com', password='X')
        t = Testimonial.objects.create(author_name='A', story='s')
        t.approve(by=user)
        self.assertEqual(t.status, Testimonial.Status.APPROVED)
        self.assertEqual(t.moderated_by, user)
        self.assertIsNotNone(t.moderated_at)

    def test_reject_stores_note(self):
        t = Testimonial.objects.create(author_name='B', story='s')
        t.reject(note='Contenu inapproprié')
        self.assertEqual(t.status, Testimonial.Status.REJECTED)
        self.assertEqual(t.moderation_note, 'Contenu inapproprié')

    def test_display_photo_respects_consent(self):
        # Both bool + non-None handling
        t = Testimonial.objects.create(
            author_name='C', story='s', is_photo_public=False,
        )
        self.assertIsNone(t.display_photo)


class TestimonialPublicApiTests(TestCase):
    def setUp(self):
        # Reset throttle counters between tests (scoped throttle uses cache).
        cache.clear()
        self.client = APIClient()
        self.approved = Testimonial.objects.create(
            author_name='Approved', story='Public story',
            status=Testimonial.Status.APPROVED,
        )
        self.pending = Testimonial.objects.create(
            author_name='Pending', story='Waiting',
            status=Testimonial.Status.PENDING,
        )
        self.rejected = Testimonial.objects.create(
            author_name='Rejected', story='Hidden',
            status=Testimonial.Status.REJECTED,
        )

    def test_list_shows_only_approved(self):
        r = self.client.get('/api/v1/temoignages/')
        self.assertEqual(r.status_code, 200)
        names = [t['author_name'] for t in r.json()['results']]
        self.assertEqual(names, ['Approved'])

    def test_public_serializer_hides_email(self):
        Testimonial.objects.filter(pk=self.approved.pk).update(author_email='x@y.com')
        r = self.client.get('/api/v1/temoignages/')
        self.assertNotIn('author_email', r.json()['results'][0])

    def test_legacy_field_names_still_work(self):
        """The old frontend uses {author, location, message}."""
        r = self.client.post('/api/v1/temoignages/', {
            'author': 'Legacy Name',
            'location': 'Kinshasa',
            'message': 'Merci pour votre chaîne.',
        }, format='json')
        self.assertEqual(r.status_code, 201, r.content)
        t = Testimonial.objects.get(author_name='Legacy Name')
        self.assertEqual(t.city, 'Kinshasa')
        self.assertEqual(t.story, 'Merci pour votre chaîne.')
        self.assertEqual(t.status, Testimonial.Status.PENDING)

    def test_new_field_names_work(self):
        r = self.client.post('/api/v1/temoignages/', {
            'author_name': 'New Name',
            'city': 'Lubumbashi',
            'country': 'RDC',
            'story': 'Belle histoire.',
        }, format='json')
        self.assertEqual(r.status_code, 201, r.content)

    def test_honeypot_returns_success_without_saving(self):
        before = Testimonial.objects.count()
        r = self.client.post('/api/v1/temoignages/', {
            'author': 'Bot', 'message': 'spam', 'hp_field': 'gotcha',
        }, format='json')
        self.assertEqual(r.status_code, 201)
        self.assertEqual(Testimonial.objects.count(), before)

    def test_submit_captures_ip(self):
        r = self.client.post(
            '/api/v1/temoignages/',
            {'author': 'IP Test', 'message': 'Hello'},
            format='json',
            HTTP_X_FORWARDED_FOR='1.2.3.4, 10.0.0.1',
        )
        self.assertEqual(r.status_code, 201)
        t = Testimonial.objects.get(author_name='IP Test')
        self.assertEqual(t.submitted_ip, '1.2.3.4')

    def test_missing_required_returns_400(self):
        r = self.client.post('/api/v1/temoignages/', {'author': 'X'}, format='json')
        self.assertEqual(r.status_code, 400)


class TestimonialAdminApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.moderator = User.objects.create_user(
            username='mod', email='mod@x.com', password='StrongPass123', is_staff=True,
        )
        self.moderator.groups.add(Group.objects.create(name=GROUP_MODERATOR))
        self.t = Testimonial.objects.create(
            author_name='Under review', story='hello',
        )

    def test_anon_cannot_access_admin(self):
        r = self.client.get('/api/v1/temoignages/admin/')
        self.assertIn(r.status_code, (401, 403))

    def test_moderator_can_list_all_states(self):
        Testimonial.objects.create(author_name='Rejected one', story='x',
                                    status=Testimonial.Status.REJECTED)
        self.client.force_authenticate(self.moderator)
        r = self.client.get('/api/v1/temoignages/admin/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.json()['results']), 2)

    def test_moderator_approves(self):
        self.client.force_authenticate(self.moderator)
        r = self.client.post(f'/api/v1/temoignages/admin/{self.t.slug}/approve/')
        self.assertEqual(r.status_code, 200)
        self.t.refresh_from_db()
        self.assertEqual(self.t.status, Testimonial.Status.APPROVED)
        self.assertEqual(self.t.moderated_by, self.moderator)

    def test_moderator_rejects_with_note(self):
        self.client.force_authenticate(self.moderator)
        r = self.client.post(
            f'/api/v1/temoignages/admin/{self.t.slug}/reject/',
            {'note': 'Contenu HS.'}, format='json',
        )
        self.assertEqual(r.status_code, 200)
        self.t.refresh_from_db()
        self.assertEqual(self.t.status, Testimonial.Status.REJECTED)
        self.assertEqual(self.t.moderation_note, 'Contenu HS.')

    def test_moderator_archives(self):
        self.client.force_authenticate(self.moderator)
        r = self.client.post(f'/api/v1/temoignages/admin/{self.t.slug}/archive/')
        self.assertEqual(r.status_code, 200)
        self.t.refresh_from_db()
        self.assertEqual(self.t.status, Testimonial.Status.ARCHIVED)

from datetime import timedelta
from io import StringIO

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.articles.models import Article
from apps.common.permissions import GROUP_ADMIN, GROUP_EDITOR
from apps.contacts.models import ContactMessage
from apps.temoignages.models import Testimonial

from . import stats

User = get_user_model()


class StatsUnitTests(TestCase):
    def setUp(self):
        past = timezone.now() - timedelta(days=1)
        Article.objects.create(title='Published', content_md='x',
                               status=Article.Status.PUBLISHED, published_at=past)
        Article.objects.create(title='Draft', content_md='x')
        Testimonial.objects.create(author_name='Pending', story='x',
                                    status=Testimonial.Status.PENDING)
        ContactMessage.objects.create(name='Alice', email='a@x.com', message='hi')

    def test_content_kpis_shape(self):
        kpis = stats.content_kpis()
        self.assertIsInstance(kpis, list)
        self.assertGreater(len(kpis), 0)
        for k in kpis:
            self.assertIn('label', k)
            self.assertIn('value', k)
            self.assertIn('icon', k)

    def test_alerts_include_pending_testimonials(self):
        alerts = stats.moderation_alerts()
        self.assertTrue(any('témoignage' in a['label'].lower() for a in alerts))

    def test_alerts_include_new_contact(self):
        alerts = stats.moderation_alerts()
        self.assertTrue(any('contact' in a['label'].lower() for a in alerts))

    def test_recent_content_returns_publications(self):
        recent = stats.recent_content(limit=10)
        titles = [r['title'] for r in recent]
        self.assertIn('Published', titles)
        # Drafts should NOT appear
        self.assertNotIn('Draft', titles)

    def test_publications_chart_shape(self):
        chart = stats.publications_chart(days=30)
        self.assertIn('labels', chart)
        self.assertIn('series', chart)
        self.assertEqual(len(chart['labels']), 30)
        self.assertEqual(len(chart['series']), 3)
        for series in chart['series']:
            self.assertEqual(len(series['data']), 30)

    def test_full_snapshot_shape(self):
        snap = stats.full_snapshot()
        for key in ('generated_at', 'kpi', 'alerts', 'recent', 'publications_chart'):
            self.assertIn(key, snap)


class DashboardApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.editor = User.objects.create_user(
            username='ed', email='ed@x.com', password='StrongPass123', is_staff=True,
        )
        self.editor.groups.add(Group.objects.get_or_create(name=GROUP_EDITOR)[0])
        Article.objects.create(title='X', content_md='x',
                               status=Article.Status.PUBLISHED,
                               published_at=timezone.now() - timedelta(days=1))

    def test_anon_forbidden(self):
        r = self.client.get('/api/v1/dashboard/stats/')
        self.assertIn(r.status_code, (401, 403))

    def test_editor_can_read(self):
        self.client.force_authenticate(self.editor)
        r = self.client.get('/api/v1/dashboard/stats/')
        self.assertEqual(r.status_code, 200)
        self.assertIn('kpi', r.json())

    def test_kpi_endpoint_lightweight(self):
        self.client.force_authenticate(self.editor)
        r = self.client.get('/api/v1/dashboard/kpi/')
        self.assertEqual(r.status_code, 200)
        self.assertIn('kpi', r.json())
        self.assertNotIn('recent', r.json())

    def test_alerts_endpoint(self):
        Testimonial.objects.create(author_name='Pending', story='x')
        self.client.force_authenticate(self.editor)
        r = self.client.get('/api/v1/dashboard/alerts/')
        self.assertEqual(r.status_code, 200)
        self.assertGreater(len(r.json()['alerts']), 0)


class PromoteUserCommandTests(TestCase):
    def test_promote_editor(self):
        user = User.objects.create_user(username='u', email='u@x.com', password='x')
        out = StringIO()
        call_command('promote_user', 'u@x.com', 'editor', stdout=out)
        user.refresh_from_db()
        self.assertTrue(user.is_staff)
        self.assertTrue(user.groups.filter(name=GROUP_EDITOR).exists())

    def test_promote_admin_sets_staff(self):
        user = User.objects.create_user(username='u2', email='u2@x.com', password='x')
        call_command('promote_user', 'u2@x.com', 'admin', stdout=StringIO())
        user.refresh_from_db()
        self.assertTrue(user.is_staff)
        self.assertTrue(user.groups.filter(name=GROUP_ADMIN).exists())

    def test_remove_flag(self):
        user = User.objects.create_user(username='u3', email='u3@x.com', password='x')
        user.groups.add(Group.objects.get_or_create(name=GROUP_EDITOR)[0])
        call_command('promote_user', 'u3@x.com', 'editor', '--remove', stdout=StringIO())
        user.refresh_from_db()
        self.assertFalse(user.groups.filter(name=GROUP_EDITOR).exists())

    def test_unknown_email_raises(self):
        from django.core.management.base import CommandError
        with self.assertRaises(CommandError):
            call_command('promote_user', 'nobody@x.com', 'admin', stdout=StringIO())

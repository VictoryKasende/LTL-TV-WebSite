from datetime import date, datetime, time, timedelta

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.common.permissions import GROUP_EDITOR

from .models import ProgramType, WeeklyProgram

User = get_user_model()


class WeeklyProgramQuerysetTests(TestCase):
    def setUp(self):
        today = timezone.localdate()
        self.past = WeeklyProgram.objects.create(
            title='Past event',
            date=today - timedelta(days=2),
            start_time=time(10, 0),
            status=WeeklyProgram.Status.PUBLISHED,
        )
        self.future = WeeklyProgram.objects.create(
            title='Future event',
            date=today + timedelta(days=3),
            start_time=time(10, 0),
            status=WeeklyProgram.Status.PUBLISHED,
        )
        self.draft = WeeklyProgram.objects.create(
            title='Draft future',
            date=today + timedelta(days=5),
            start_time=time(10, 0),
        )

    def test_published_filters_drafts(self):
        titles = set(WeeklyProgram.objects.published().values_list('title', flat=True))
        self.assertEqual(titles, {'Past event', 'Future event'})

    def test_upcoming_excludes_past(self):
        titles = set(WeeklyProgram.objects.upcoming().values_list('title', flat=True))
        self.assertIn('Future event', titles)
        self.assertIn('Draft future', titles)
        self.assertNotIn('Past event', titles)

    def test_upcoming_and_published_chain(self):
        titles = set(
            WeeklyProgram.objects.published().upcoming().values_list('title', flat=True)
        )
        self.assertEqual(titles, {'Future event'})

    def test_is_upcoming_property(self):
        self.assertTrue(self.future.is_upcoming)
        self.assertFalse(self.past.is_upcoming)


class WeeklyProgramApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Types are pre-seeded by migration 0003
        self.culte = ProgramType.objects.get(slug='culte')
        today = timezone.localdate()
        self.wp = WeeklyProgram.objects.create(
            title='Culte du dimanche',
            date=today + timedelta(days=1),
            start_time=time(10, 0),
            end_time=time(12, 30),
            program_type=self.culte,
            mode=WeeklyProgram.Mode.HYBRID,
            location='Kinshasa — Bandal',
            meeting_url='https://zoom.us/j/123',
            status=WeeklyProgram.Status.PUBLISHED,
        )

    def test_upcoming_endpoint_public(self):
        r = self.client.get('/api/v1/programmes/upcoming/')
        self.assertEqual(r.status_code, 200)
        slugs = [w['slug'] for w in r.json()]
        self.assertIn(self.wp.slug, slugs)

    def test_detail_serializer(self):
        r = self.client.get(f'/api/v1/programmes/{self.wp.slug}/')
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(data['title'], 'Culte du dimanche')
        self.assertEqual(data['program_type']['slug'], 'culte')
        self.assertTrue(data['is_online_accessible'])

    def test_anon_cannot_create(self):
        r = self.client.post('/api/v1/programmes/', {
            'title': 'X', 'date': '2026-08-01', 'start_time': '10:00',
        }, format='json')
        self.assertIn(r.status_code, (401, 403))

    def test_editor_can_create(self):
        editor = User.objects.create_user(
            username='ed', email='ed@x.com', password='StrongPass123', is_staff=True,
        )
        editor.groups.add(Group.objects.create(name=GROUP_EDITOR))
        self.client.force_authenticate(editor)
        r = self.client.post('/api/v1/programmes/', {
            'title': 'Nouveau', 'date': '2026-08-01', 'start_time': '10:00',
            'mode': 'in_person',
        }, format='json')
        self.assertEqual(r.status_code, 201, r.content)

    def test_filter_by_program_type(self):
        r = self.client.get('/api/v1/programmes/?program_type=culte')
        self.assertEqual(r.status_code, 200)
        slugs = [w['slug'] for w in r.json()['results']]
        self.assertIn(self.wp.slug, slugs)

    def test_filter_by_date_range(self):
        today = timezone.localdate()
        r = self.client.get(
            f'/api/v1/programmes/?date_from={today.isoformat()}'
            f'&date_to={(today + timedelta(days=7)).isoformat()}'
        )
        self.assertEqual(r.status_code, 200)


class ProgramTypeApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_seed_types_present(self):
        """Migration 0003 seeds 6 default types."""
        slugs = set(ProgramType.objects.values_list('slug', flat=True))
        self.assertGreaterEqual(len(slugs), 6)
        for expected in ('culte', 'formation', 'retraite', 'jeunesse',
                         'conference', 'rencontre'):
            self.assertIn(expected, slugs)

    def test_public_list(self):
        r = self.client.get('/api/v1/programmes/types/')
        self.assertEqual(r.status_code, 200)
        self.assertGreaterEqual(len(r.json()['results']), 6)

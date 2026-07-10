from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.test import TestCase
from rest_framework.test import APIClient

from apps.common.permissions import GROUP_EDITOR

from .models import AboutPage, CoreValue, TeamMember

User = get_user_model()


class AboutPageModelTests(TestCase):
    def test_load_creates_singleton(self):
        self.assertEqual(AboutPage.objects.count(), 0)
        obj = AboutPage.load()
        self.assertEqual(obj.pk, 1)
        self.assertEqual(AboutPage.objects.count(), 1)

    def test_load_returns_same_instance(self):
        first = AboutPage.load()
        first.mission = 'Annoncer l\'évangile.'
        first.save()
        second = AboutPage.load()
        self.assertEqual(second.pk, first.pk)
        self.assertEqual(second.mission, 'Annoncer l\'évangile.')

    def test_save_always_forces_pk_one(self):
        obj = AboutPage(pk=42, mission='X')
        obj.save()
        self.assertEqual(obj.pk, 1)
        self.assertEqual(AboutPage.objects.count(), 1)

    def test_delete_is_noop(self):
        obj = AboutPage.load()
        obj.delete()
        self.assertEqual(AboutPage.objects.count(), 1)


class CoreValueModelTests(TestCase):
    def test_ordering(self):
        CoreValue.objects.create(title='B', order=2)
        CoreValue.objects.create(title='A', order=1)
        titles = list(CoreValue.objects.values_list('title', flat=True))
        self.assertEqual(titles, ['A', 'B'])


class TeamMemberModelTests(TestCase):
    def test_str_includes_category_display(self):
        m = TeamMember.objects.create(
            full_name='Jean Kabeya', category=TeamMember.Category.DIRECTION,
        )
        self.assertIn('Jean Kabeya', str(m))
        self.assertIn('Direction', str(m))


class AboutApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.editor = User.objects.create_user(
            username='ed', email='ed@x.com', password='StrongPass123', is_staff=True,
        )
        self.editor.groups.add(Group.objects.create(name=GROUP_EDITOR))

    def test_anon_can_read_page(self):
        AboutPage.load()
        r = self.client.get('/api/v1/about/page/')
        self.assertEqual(r.status_code, 200)
        self.assertIn('mission', r.json())

    def test_anon_cannot_patch_page(self):
        r = self.client.patch('/api/v1/about/page/', {'mission': 'Hack'}, format='json')
        self.assertIn(r.status_code, (401, 403))

    def test_editor_can_patch_page(self):
        self.client.force_authenticate(self.editor)
        r = self.client.patch(
            '/api/v1/about/page/',
            {'mission': 'Annoncer la Bonne Nouvelle à toutes les nations.'},
            format='json',
        )
        self.assertEqual(r.status_code, 200, r.content)
        self.assertEqual(AboutPage.load().mission, 'Annoncer la Bonne Nouvelle à toutes les nations.')

    def test_values_list_is_public(self):
        CoreValue.objects.create(title='Excellence', order=1)
        r = self.client.get('/api/v1/about/values/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.json()), 1)

    def test_team_anon_sees_only_active(self):
        TeamMember.objects.create(full_name='Actif', is_active=True)
        TeamMember.objects.create(full_name='Inactif', is_active=False)
        r = self.client.get('/api/v1/about/team/')
        self.assertEqual(r.status_code, 200)
        names = [m['full_name'] for m in r.json()['results']]
        self.assertIn('Actif', names)
        self.assertNotIn('Inactif', names)

    def test_team_staff_sees_inactive_too(self):
        TeamMember.objects.create(full_name='Actif', is_active=True)
        TeamMember.objects.create(full_name='Inactif', is_active=False)
        self.client.force_authenticate(self.editor)
        r = self.client.get('/api/v1/about/team/')
        names = [m['full_name'] for m in r.json()['results']]
        self.assertIn('Actif', names)
        self.assertIn('Inactif', names)

    def test_anon_cannot_create_team_member(self):
        r = self.client.post('/api/v1/about/team/', {'full_name': 'X'}, format='json')
        self.assertIn(r.status_code, (401, 403))

    def test_team_filter_by_category(self):
        TeamMember.objects.create(full_name='Dir', category=TeamMember.Category.DIRECTION)
        TeamMember.objects.create(full_name='Coord', category=TeamMember.Category.COORDINATION)
        r = self.client.get('/api/v1/about/team/?category=direction')
        self.assertEqual(r.status_code, 200)
        names = [m['full_name'] for m in r.json()['results']]
        self.assertEqual(names, ['Dir'])

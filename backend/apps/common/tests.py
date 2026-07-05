"""Smoke tests for base building blocks. Kept minimal — each domain
app will add its own coverage."""
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.test import TestCase

from apps.common.permissions import _has_group, GROUP_ADMIN, GROUP_EDITOR

User = get_user_model()


class RoleHelperTests(TestCase):
    def setUp(self):
        self.admin_group = Group.objects.create(name=GROUP_ADMIN)
        self.editor_group = Group.objects.create(name=GROUP_EDITOR)

    def test_superuser_always_passes(self):
        u = User.objects.create_superuser(username='root', email='root@ltltv.com', password='x')
        self.assertTrue(_has_group(u, (GROUP_ADMIN,)))
        self.assertTrue(_has_group(u, (GROUP_EDITOR,)))

    def test_anonymous_never_passes(self):
        from django.contrib.auth.models import AnonymousUser
        self.assertFalse(_has_group(AnonymousUser(), (GROUP_ADMIN,)))

    def test_group_membership(self):
        u = User.objects.create_user(username='e', email='e@x.com', password='x')
        u.groups.add(self.editor_group)
        self.assertFalse(_has_group(u, (GROUP_ADMIN,)))
        self.assertTrue(_has_group(u, (GROUP_ADMIN, GROUP_EDITOR)))

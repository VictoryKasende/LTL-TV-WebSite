"""Promote a user to Admin / Editor / Moderator role.

Usage::

    python manage.py promote_user contact@ltltv.com admin
    python manage.py promote_user editor@ltltv.com editor
    python manage.py promote_user mod@ltltv.com moderator
"""
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand, CommandError

from apps.common.permissions import GROUP_ADMIN, GROUP_EDITOR, GROUP_MODERATOR


class Command(BaseCommand):
    help = 'Promote a user to Admin / Editor / Moderator (creates the Group if missing).'

    ROLE_TO_GROUP = {
        'admin':     GROUP_ADMIN,
        'editor':    GROUP_EDITOR,
        'moderator': GROUP_MODERATOR,
    }

    def add_arguments(self, parser):
        parser.add_argument('email', help='Adresse email du user cible.')
        parser.add_argument(
            'role', choices=self.ROLE_TO_GROUP.keys(),
            help='Rôle à attribuer (admin / editor / moderator).',
        )
        parser.add_argument(
            '--remove', action='store_true',
            help='Retire le rôle au lieu de l\'ajouter.',
        )

    def handle(self, *args, email, role, remove, **opts):
        User = get_user_model()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist as exc:
            raise CommandError(f'Aucun user avec l\'email « {email} ».') from exc

        group_name = self.ROLE_TO_GROUP[role]
        group, _ = Group.objects.get_or_create(name=group_name)

        if remove:
            user.groups.remove(group)
            self.stdout.write(self.style.WARNING(
                f'{user.email} → rôle « {role} » retiré.'
            ))
            return

        user.groups.add(group)
        # Admins also need Django's staff flag to access the admin site.
        if role == 'admin':
            user.is_staff = True
            user.save(update_fields=['is_staff'])
        # Editors and moderators also need staff to reach /admin/.
        elif role in ('editor', 'moderator') and not user.is_staff:
            user.is_staff = True
            user.save(update_fields=['is_staff'])

        self.stdout.write(self.style.SUCCESS(
            f'{user.email} → {group_name} ✓'
        ))

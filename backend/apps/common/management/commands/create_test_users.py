"""Create 6 throwaway staff accounts, one per admin-panel group, so the
groups created by ``setup_roles`` can be tested end-to-end.

NOT called by the deploy pipeline — run manually when you need test
accounts:

    python manage.py create_test_users

Idempotent by email: re-running updates the group/password on existing
test accounts instead of duplicating them.
"""
from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand, CommandError

from apps.accounts.models import User

DEFAULT_PASSWORD = 'LtlTest2026!'

# (email, first name, admin-panel group to test)
TEST_USERS = (
    ('admin.test@ltltv.cd', 'Test Admin', 'Admin'),
    ('comptes.test@ltltv.cd', 'Test Comptes', 'Comptes & À propos'),
    ('emissions.test@ltltv.cd', 'Test Émissions', 'Émissions — Émissions, séries & épisodes'),
    ('articles.test@ltltv.cd', 'Test Articles', 'Articles'),
    ('programmes.test@ltltv.cd', 'Test Programmes', 'Programmes & bannières'),
    ('temoignages.test@ltltv.cd', 'Test Témoignages', 'Témoignages & contact'),
)


class Command(BaseCommand):
    help = "Create 6 test accounts (one per admin-panel group) to verify group permissions."

    def add_arguments(self, parser):
        parser.add_argument(
            '--password', default=DEFAULT_PASSWORD,
            help='Password set on every created/updated test account.',
        )

    def handle(self, *args, **options):
        password = options['password']

        for email, name, group_name in TEST_USERS:
            try:
                group = Group.objects.get(name=group_name)
            except Group.DoesNotExist:
                raise CommandError(
                    f'Groupe "{group_name}" introuvable — lance `manage.py setup_roles` d\'abord.'
                )

            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email.split('@')[0],
                    'first_name': name,
                    'is_staff': True,
                    'is_active': True,
                },
            )
            user.set_password(password)
            user.is_staff = True
            user.is_active = True
            user.save()
            user.groups.set([group])

            state = 'créé' if created else 'mis à jour'
            self.stdout.write(f'  {email} — {state} — groupe "{group_name}"')

        self.stdout.write(self.style.SUCCESS(f'6 comptes de test prêts. Mot de passe : {password}'))
        self.stdout.write(
            self.style.WARNING(
                'Ces comptes sont pour test uniquement — supprime-les avant la mise en '
                'production finale, ou change leur mot de passe.'
            )
        )

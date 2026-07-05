"""Create the default LTL TV roles (Admin / Editor / Moderator).

Idempotent: safe to run on every deploy. The GitHub Actions deploy step
calls it after ``migrate``.
"""
from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand

ROLES = ('Admin', 'Editor', 'Moderator')


class Command(BaseCommand):
    help = 'Create the default LTL TV roles (Admin / Editor / Moderator).'

    def handle(self, *args, **options):
        for name in ROLES:
            _, created = Group.objects.get_or_create(name=name)
            state = 'créé' if created else 'existe déjà'
            self.stdout.write(f'  Groupe "{name}" — {state}')
        self.stdout.write(self.style.SUCCESS('Rôles prêts.'))

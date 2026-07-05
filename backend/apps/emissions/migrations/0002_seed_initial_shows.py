"""Seed the three initial shows.

Idempotent — uses ``get_or_create`` keyed by slug so re-running is a
no-op. If the shows are later renamed/deleted in the admin, this
migration won't recreate them (that's on purpose: the migration is
frozen state at deploy-time, further changes happen in the admin).
"""
from django.db import migrations


SHOWS = [
    {
        'slug': 'prends-courage',
        'title': 'Prends Courage',
        'tagline': 'Une méditation quotidienne pour bien commencer la journée.',
        'default_schedule': 'Lundi — Vendredi · 07h00',
        'color': '#212870',
        'status': 'published',
        'is_featured': True,
        'order': 1,
    },
    {
        'slug': 'dans-les-profondeurs',
        'title': 'Dans Les Profondeurs',
        'tagline': 'Enseignement approfondi de la Parole, verset par verset.',
        'default_schedule': 'Samedi · 20h30',
        'color': '#E85521',
        'status': 'published',
        'is_featured': True,
        'order': 2,
    },
    {
        'slug': 'rafraichissement',
        'title': 'Matinées de Rafraîchissement',
        'tagline': 'Louange et Parole pour bien démarrer le dimanche.',
        'default_schedule': 'Dimanche · 07h00',
        'color': '#3D53EA',
        'status': 'published',
        'is_featured': True,
        'order': 3,
    },
]


def create_initial_shows(apps, schema_editor):
    Show = apps.get_model('emissions', 'Show')
    from django.utils import timezone
    now = timezone.now()
    for data in SHOWS:
        Show.objects.get_or_create(
            slug=data['slug'],
            defaults={**data, 'published_at': now},
        )


def remove_initial_shows(apps, schema_editor):
    Show = apps.get_model('emissions', 'Show')
    Show.objects.filter(slug__in=[s['slug'] for s in SHOWS]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('emissions', '0001_initial'),
    ]
    operations = [
        migrations.RunPython(create_initial_shows, remove_initial_shows),
    ]

"""Seed the initial ProgramType rows.

Idempotent — uses get_or_create on ``slug``. Safe to re-run.
"""
from django.db import migrations


SEEDS = [
    # (name, slug, color, icon, order)
    ('Culte',       'culte',       '#212870', 'church',      1),
    ('Formation',   'formation',   '#3D53EA', 'book-open',   2),
    ('Retraite',    'retraite',    '#E85521', 'tent',        3),
    ('Jeunesse',    'jeunesse',    '#F5C24E', 'users',       4),
    ('Conférence',  'conference',  '#141640', 'mic',         5),
    ('Rencontre',   'rencontre',   '#3D53EA', 'handshake',   6),
]


def seed(apps, schema_editor):
    ProgramType = apps.get_model('programmes', 'ProgramType')
    for name, slug, color, icon, order in SEEDS:
        ProgramType.objects.get_or_create(
            slug=slug,
            defaults={'name': name, 'color': color, 'icon': icon, 'order': order},
        )


def unseed(apps, schema_editor):
    ProgramType = apps.get_model('programmes', 'ProgramType')
    ProgramType.objects.filter(slug__in=[s[1] for s in SEEDS]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('programmes', '0002_replace_programme_with_weeklyprogram'),
    ]
    operations = [migrations.RunPython(seed, unseed)]

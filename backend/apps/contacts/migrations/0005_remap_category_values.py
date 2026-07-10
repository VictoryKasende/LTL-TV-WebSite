"""Remap ContactMessage.category from the old choice set to the new one.

Old  -> New
question    -> biblical_question
prayer      -> prayer_request
donation    -> offering
partnership -> other   (dropped — folded into "Autre")
technical   -> other   (dropped — folded into "Autre")

Historical rows (``HistoricalContactMessage``) are left untouched —
they're an audit trail of what was true at the time.
"""
from django.db import migrations

FORWARD_MAP = {
    'question': 'biblical_question',
    'prayer': 'prayer_request',
    'donation': 'offering',
    'partnership': 'other',
    'technical': 'other',
}

BACKWARD_MAP = {
    'biblical_question': 'question',
    'prayer_request': 'prayer',
    'offering': 'donation',
}


def forwards(apps, schema_editor):
    ContactMessage = apps.get_model('contacts', 'ContactMessage')
    for old, new in FORWARD_MAP.items():
        ContactMessage.objects.filter(category=old).update(category=new)


def backwards(apps, schema_editor):
    ContactMessage = apps.get_model('contacts', 'ContactMessage')
    for old, new in BACKWARD_MAP.items():
        ContactMessage.objects.filter(category=old).update(category=new)


class Migration(migrations.Migration):

    dependencies = [
        ('contacts', '0004_alter_contactmessage_category_and_more'),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]

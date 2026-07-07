"""Celery application for the LTL TV project."""
import os
import sys

from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('ltltv')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Run tasks synchronously in tests (no broker needed).
if 'test' in sys.argv:
    app.conf.task_always_eager = True
    app.conf.task_eager_propagates = True

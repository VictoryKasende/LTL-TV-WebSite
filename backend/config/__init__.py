# Load the Celery app when Django starts, so @shared_task uses our
# configured app rather than the default (no config).
from .celery import app as celery_app

__all__ = ('celery_app',)

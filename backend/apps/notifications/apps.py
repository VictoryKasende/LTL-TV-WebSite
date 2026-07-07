from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.notifications'
    verbose_name = 'Notifications push'

    def ready(self):
        # Wire up publish-time push signals.
        from . import signals  # noqa: F401

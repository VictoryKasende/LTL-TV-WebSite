"""The red announcement bar shown above the Navbar.

Used to promote an urgent event / live programme site-wide. Only one
announcement is meant to be shown at a time — the frontend consumes a
single "active" one (see ``AnnouncementViewSet.active``), scoped by
``is_active`` + an optional ``[starts_at, ends_at)`` window, exactly
like ``apps.banners.Banner``.
"""
from __future__ import annotations

from django.db import models
from django.utils import timezone
from simple_history.models import HistoricalRecords

from apps.banners.validators import validate_internal_or_external_url
from apps.common.models import TimestampedModel


class AnnouncementQuerySet(models.QuerySet):
    def active_now(self):
        """Announcements active RIGHT NOW: enabled + in their time window."""
        now = timezone.now()
        return (
            self.filter(is_active=True)
                .filter(models.Q(starts_at__isnull=True) | models.Q(starts_at__lte=now))
                .filter(models.Q(ends_at__isnull=True) | models.Q(ends_at__gt=now))
        )


class Announcement(TimestampedModel):
    """One message for the red bar, with an optional call-to-action link."""

    message = models.CharField(
        'Message', max_length=300,
        help_text='Texte défilant affiché dans la bande rouge.',
    )
    cta_label = models.CharField(
        'Texte du bouton', max_length=60, blank=True,
        help_text='Ex. « S\'inscrire ». Vide = pas de bouton.',
    )
    cta_url = models.CharField(
        'URL du bouton', max_length=500, blank=True,
        validators=[validate_internal_or_external_url],
        help_text='Interne : commence par « / » (ex. /evenements/mes-vacances-avec-ltl-tv — '
                  'utilisez la liste de suggestions ci-dessous). '
                  'Externe : URL complète (ex. https://exemple.com).',
    )

    is_active = models.BooleanField('Actif', default=False, db_index=True)
    starts_at = models.DateTimeField(
        'Visible à partir de', null=True, blank=True, db_index=True,
        help_text='À partir de quand la bande est visible. Vide = immédiatement.',
    )
    ends_at = models.DateTimeField(
        'Visible jusqu\'à', null=True, blank=True, db_index=True,
        help_text='Jusqu\'à quand (strict). Vide = indéfiniment.',
    )

    objects = AnnouncementQuerySet.as_manager()
    history = HistoricalRecords()

    class Meta:
        verbose_name = 'Annonce'
        verbose_name_plural = 'Annonces'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['is_active', 'starts_at', 'ends_at']),
        ]

    def __str__(self) -> str:
        return self.message

    @property
    def is_active_now(self) -> bool:
        now = timezone.now()
        if not self.is_active:
            return False
        if self.starts_at and self.starts_at > now:
            return False
        if self.ends_at and self.ends_at <= now:
            return False
        return True

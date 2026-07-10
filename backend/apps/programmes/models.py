"""Weekly programme calendar.

A ``WeeklyProgram`` is a scheduled event on a specific date, e.g.
« Culte du dimanche · 10h00 · Kinshasa Bandal ». Different from an
``emissions.Show`` (which is a recurring TV/YouTube brand).
"""
from __future__ import annotations

from django.db import models
from django.utils import timezone
from simple_history.models import HistoricalRecords

from apps.common.models import (
    PublishableModel,
    PublishableQuerySet,
    SeoMixin,
    SluggedModel,
    TimestampedModel,
)


class ProgramType(TimestampedModel, SluggedModel):
    """Category of program: culte, formation, retraite, jeunesse, etc.

    Editors can add new types on the fly from the admin — no schema
    change needed."""

    SLUG_SOURCE_FIELD = 'name'

    name = models.CharField('Nom', max_length=80, unique=True)
    description = models.CharField('Description', max_length=280, blank=True)
    color = models.CharField(
        'Couleur (hex)', max_length=9, blank=True, default='#3D53EA',
    )
    icon = models.CharField(
        'Icône', max_length=48, blank=True,
        help_text='Nom d\'icône lucide-react (ex : church, users, mic, book-open).',
    )
    order = models.PositiveIntegerField('Ordre d\'affichage', default=0, db_index=True)

    class Meta:
        verbose_name = 'Type de programme'
        verbose_name_plural = 'Types de programme'
        ordering = ['order', 'name']

    def __str__(self) -> str:
        return self.name


class WeeklyProgramQuerySet(PublishableQuerySet):
    """Adds ``upcoming()`` and ``past()`` on top of the inherited
    ``published()``. All are chainable."""

    def upcoming(self):
        """Events whose start (date + start_time) is >= now."""
        now = timezone.now()
        today = now.date()
        current = now.time()
        return self.filter(
            models.Q(date__gt=today)
            | models.Q(date=today, start_time__gte=current)
        )

    def past(self):
        now = timezone.now()
        today = now.date()
        current = now.time()
        return self.filter(
            models.Q(date__lt=today)
            | models.Q(date=today, start_time__lt=current)
        )

    def for_week(self, monday):
        """All programs from ``monday`` (a date) through the following Sunday."""
        from datetime import timedelta
        sunday = monday + timedelta(days=6)
        return self.filter(date__gte=monday, date__lte=sunday)


class WeeklyProgram(TimestampedModel, SluggedModel, PublishableModel, SeoMixin):
    """One scheduled event in the weekly calendar."""

    SLUG_SOURCE_FIELD = 'title'

    class Mode(models.TextChoices):
        IN_PERSON = 'in_person', 'Présentiel'
        ONLINE    = 'online',    'En ligne'
        HYBRID    = 'hybrid',    'Hybride'

    # --- Schedule ---------------------------------------------------
    date = models.DateField('Date', db_index=True, help_text='Date du programme.')
    start_time = models.TimeField('Heure de début', help_text='Heure de début (fuseau local).')
    end_time = models.TimeField(
        'Heure de fin', null=True, blank=True,
        help_text='Heure de fin (optionnelle).',
    )

    # --- Content ----------------------------------------------------
    title = models.CharField('Titre', max_length=200)
    description = models.TextField('Description', blank=True)
    responsable = models.CharField(
        'Responsable', max_length=200, blank=True,
        help_text='Responsable / animateur principal.',
    )
    program_type = models.ForeignKey(
        ProgramType, on_delete=models.PROTECT,
        related_name='programs',
        null=True, blank=True,
        verbose_name='Type de programme',
    )

    # --- Mode & location -------------------------------------------
    mode = models.CharField(
        'Mode', max_length=16, choices=Mode.choices, default=Mode.IN_PERSON, db_index=True,
    )
    location = models.CharField(
        'Lieu', max_length=200, blank=True,
        help_text='Ville / lieu (ex : « Kinshasa — Bandal »).',
    )
    address = models.CharField(
        'Adresse', max_length=280, blank=True,
        help_text='Adresse complète (présentiel).',
    )
    latitude = models.FloatField('Latitude', null=True, blank=True)
    longitude = models.FloatField('Longitude', null=True, blank=True)

    meeting_url = models.URLField(
        'Lien de la réunion', blank=True,
        help_text='Lien Zoom / YouTube / autre (en ligne ou hybride).',
    )

    # --- Media ------------------------------------------------------
    image = models.ImageField(
        'Image', upload_to='programmes/', blank=True, null=True,
        help_text='Bannière du programme (16:9 recommandé).',
    )

    # --- Ordering within a day ------------------------------------
    order = models.PositiveIntegerField(
        'Ordre d\'affichage', default=0,
        help_text='Ordre au sein d\'une même date (utile pour plusieurs '
                  'programmes le même jour).',
    )

    objects = WeeklyProgramQuerySet.as_manager()
    history = HistoricalRecords()

    class Meta:
        verbose_name = 'Programme hebdomadaire'
        verbose_name_plural = 'Programmes hebdomadaires'
        ordering = ['date', 'start_time', 'order']
        indexes = [
            models.Index(fields=['date', 'start_time']),
            models.Index(fields=['status', 'date']),
            models.Index(fields=['is_featured', 'status']),
        ]

    def __str__(self) -> str:
        return f'{self.date:%Y-%m-%d} · {self.start_time:%H:%M} · {self.title}'

    @property
    def is_upcoming(self) -> bool:
        now = timezone.now()
        if self.date > now.date():
            return True
        if self.date == now.date():
            return self.start_time >= now.time()
        return False

    @property
    def is_online_accessible(self) -> bool:
        return self.mode in {self.Mode.ONLINE, self.Mode.HYBRID} and bool(self.meeting_url)

"""Events with public registration (e.g. « Mes Vacances avec LTL TV »).

An ``Event`` is a campaign visitors register for once (as opposed to
``apps.programmes.WeeklyProgram``, which is a recurring calendar entry
with no per-visitor registration).
"""
from __future__ import annotations

from django.db import models
from simple_history.models import HistoricalRecords

from apps.common.models import SluggedModel, TimestampedModel


class Event(TimestampedModel, SluggedModel):
    """One registration-based campaign / live event."""

    SLUG_SOURCE_FIELD = 'title'

    title = models.CharField('Titre', max_length=200)
    subtitle = models.CharField(
        'Sous-titre', max_length=200, blank=True,
        help_text='Ex. « Live Zoom Meeting Conference (Inscription obligatoire) ».',
    )

    start_date = models.DateField('Date de début')
    end_date = models.DateField(
        'Date de fin', null=True, blank=True,
        help_text='Vide si l\'événement se déroule sur une seule journée.',
    )
    daily_time = models.TimeField(
        'Heure', null=True, blank=True,
        help_text='Heure quotidienne de l\'événement (ex : 20:45).',
    )

    meeting_url = models.URLField(
        'Lien de la réunion', blank=True,
        help_text='Lien Zoom / autre, communiqué aux inscrits (usage interne pour le moment).',
    )
    conditions = models.TextField(
        'Conditions de participation', blank=True,
        help_text='Affiché sur le formulaire d\'inscription, avec un « Voir plus ».',
    )

    is_active = models.BooleanField(
        'Actif', default=True, db_index=True,
        help_text='Désactive la page et l\'inscription si décoché.',
    )
    is_registration_open = models.BooleanField(
        'Inscriptions ouvertes', default=True, db_index=True,
        help_text='Permet de fermer les inscriptions sans masquer la page.',
    )

    history = HistoricalRecords()

    class Meta:
        verbose_name = 'Événement'
        verbose_name_plural = 'Événements'
        ordering = ['-start_date']

    def __str__(self) -> str:
        return self.title


class EventRegistration(TimestampedModel):
    """One visitor's registration to an ``Event``."""

    event = models.ForeignKey(
        Event, on_delete=models.CASCADE, related_name='registrations',
        verbose_name='Événement',
    )

    first_name = models.CharField('Prénom', max_length=100)
    last_name = models.CharField('Nom', max_length=100)
    gender = models.CharField('Genre', max_length=30)
    email = models.EmailField('Email')
    phone = models.CharField('Téléphone', max_length=32)
    country = models.CharField('Pays', max_length=80, blank=True)
    motivation = models.TextField(
        'Motivation',
        help_text='Ce qui motive la personne à participer.',
    )
    accepted_conditions = models.BooleanField('Conditions acceptées', default=False)

    internal_notes = models.TextField(
        'Notes internes', blank=True,
        help_text='Notes de l\'équipe. Non visibles par l\'inscrit.',
    )

    submitted_ip = models.GenericIPAddressField('Adresse IP', null=True, blank=True)
    submitted_user_agent = models.CharField('Navigateur', max_length=280, blank=True)
    referrer = models.URLField('Page d\'origine', blank=True)

    history = HistoricalRecords()

    class Meta:
        verbose_name = 'Inscription'
        verbose_name_plural = 'Inscriptions'
        ordering = ['-created_at']
        unique_together = [('event', 'email')]
        indexes = [
            models.Index(fields=['event', '-created_at']),
        ]

    def __str__(self) -> str:
        return f'{self.first_name} {self.last_name} — {self.event}'

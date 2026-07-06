"""Testimonials with a proper moderation workflow.

Every submission lands in ``pending``. A moderator reviews it and moves it
to ``approved`` (visible publicly), ``rejected`` (invisible, kept for audit)
or ``archived`` (was public, now removed).
"""
from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils import timezone
from simple_history.models import HistoricalRecords

from apps.common.models import SluggedModel, TimestampedModel


class TestimonialQuerySet(models.QuerySet):
    def approved(self):
        return self.filter(status=Testimonial.Status.APPROVED)

    def pending(self):
        return self.filter(status=Testimonial.Status.PENDING)

    def public_visible(self):
        """Approved AND (photo consent OR no photo). For public /list/."""
        return self.approved()


class Testimonial(TimestampedModel, SluggedModel):
    """One user-submitted testimonial."""

    SLUG_SOURCE_FIELD = 'author_name'

    class Status(models.TextChoices):
        PENDING  = 'pending',  'En attente'
        APPROVED = 'approved', 'Approuvé'
        REJECTED = 'rejected', 'Rejeté'
        ARCHIVED = 'archived', 'Archivé'

    # --- Author -----------------------------------------------------
    author_name = models.CharField(max_length=120, help_text='Prénom + initiale (ex : Sarah M.).')
    author_email = models.EmailField(
        blank=True,
        help_text='Interne uniquement — jamais affiché publiquement. Sert au suivi.',
    )
    author_phone = models.CharField(
        max_length=32, blank=True,
        help_text='Interne uniquement.',
    )

    # --- Location ---------------------------------------------------
    country = models.CharField(max_length=80, blank=True, help_text='Ex : RDC, France, Belgique.')
    city = models.CharField(max_length=120, blank=True)

    # --- Story ------------------------------------------------------
    title = models.CharField(
        max_length=200, blank=True,
        help_text='Titre optionnel du témoignage (ex : « Comment j\'ai retrouvé la paix »).',
    )
    story_short = models.CharField(
        max_length=280, blank=True,
        help_text='Résumé pour vignettes (auto-tronqué depuis `story` si vide).',
    )
    story = models.TextField(help_text='Le témoignage complet.')

    # --- Media ------------------------------------------------------
    photo = models.ImageField(upload_to='temoignages/', blank=True, null=True)
    is_photo_public = models.BooleanField(
        default=True,
        help_text='L\'auteur autorise l\'affichage public de sa photo.',
    )

    # --- Moderation -------------------------------------------------
    status = models.CharField(
        max_length=16, choices=Status.choices,
        default=Status.PENDING, db_index=True,
    )
    moderation_note = models.TextField(
        blank=True,
        help_text='Note interne (raison de rejet, remarque). Jamais publique.',
    )
    moderated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='moderated_testimonials',
    )
    moderated_at = models.DateTimeField(null=True, blank=True)

    # --- Display ----------------------------------------------------
    is_featured = models.BooleanField(default=False, db_index=True)
    order = models.PositiveIntegerField(default=0)

    # --- Audit ------------------------------------------------------
    submitted_ip = models.GenericIPAddressField(null=True, blank=True)
    submitted_user_agent = models.CharField(max_length=280, blank=True)

    objects = TestimonialQuerySet.as_manager()
    history = HistoricalRecords()

    class Meta:
        verbose_name = 'Témoignage'
        verbose_name_plural = 'Témoignages'
        ordering = ['order', '-created_at']
        indexes = [
            models.Index(fields=['status', 'is_featured']),
            models.Index(fields=['status', '-created_at']),
        ]

    def __str__(self) -> str:
        return f'{self.author_name} — {self.get_status_display()}'

    def save(self, *args, **kwargs):
        if not self.story_short and self.story:
            self.story_short = self.story[:277].rstrip() + ('…' if len(self.story) > 280 else '')
        super().save(*args, **kwargs)

    # --- Moderation helpers ---------------------------------------
    def approve(self, *, by=None):
        self.status = self.Status.APPROVED
        self.moderated_by = by
        self.moderated_at = timezone.now()
        self.save(update_fields=['status', 'moderated_by', 'moderated_at'])

    def reject(self, *, by=None, note: str = ''):
        self.status = self.Status.REJECTED
        self.moderated_by = by
        self.moderated_at = timezone.now()
        if note:
            self.moderation_note = note
        self.save(update_fields=['status', 'moderated_by', 'moderated_at', 'moderation_note'])

    def archive(self, *, by=None):
        self.status = self.Status.ARCHIVED
        self.moderated_by = by
        self.moderated_at = timezone.now()
        self.save(update_fields=['status', 'moderated_by', 'moderated_at'])

    @property
    def display_photo(self):
        """Return the photo file only if consent was given."""
        return self.photo if (self.is_photo_public and self.photo) else None

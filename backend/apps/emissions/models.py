"""Emissions domain models.

- ``Category`` — cross-cutting classification (Enseignement, Louange…)
- ``Show``     — a recurring show (Prends Courage, Dans Les Profondeurs…)
- ``Episode``  — a single YouTube video attached to a Show
"""
from __future__ import annotations

from django.core.exceptions import ValidationError
from django.db import models
from simple_history.models import HistoricalRecords
from taggit.managers import TaggableManager

from apps.common.models import (
    PublishableModel,
    SeoMixin,
    SluggedModel,
    TimestampedModel,
)

from .youtube import extract_youtube_id, youtube_embed_url, youtube_thumbnail_url


class Category(TimestampedModel, SluggedModel):
    """Cross-cutting classification for emissions.

    Distinct from ``articles.Category`` — the two domains have
    different editorial needs and we don't want to force one to
    match the other's list."""

    SLUG_SOURCE_FIELD = 'name'

    name = models.CharField('Nom', max_length=80, unique=True)
    description = models.CharField('Description', max_length=280, blank=True)
    color = models.CharField(
        'Couleur (hex)', max_length=9, blank=True, default='',
        help_text='Couleur d\'accent (hex, ex : ``#3D53EA``).',
    )
    order = models.PositiveIntegerField('Ordre d\'affichage', default=0, db_index=True)

    class Meta:
        verbose_name = 'Catégorie'
        verbose_name_plural = 'Catégories'
        ordering = ['order', 'name']

    def __str__(self) -> str:
        return self.name


class Show(TimestampedModel, SluggedModel, PublishableModel, SeoMixin):
    """A recurring show — a "chaîne dans la chaîne".

    ``Prends Courage``, ``Dans Les Profondeurs`` and ``Matinées de
    Rafraîchissement`` are the three initial shows (seeded via
    a data migration).
    """

    SLUG_SOURCE_FIELD = 'title'

    title = models.CharField('Titre', max_length=200)
    tagline = models.CharField(
        'Accroche', max_length=280, blank=True,
        help_text='Court résumé, utilisé dans les cartes et vignettes.',
    )
    description = models.TextField(
        'Description', blank=True,
        help_text='Description longue de l\'émission (page dédiée).',
    )
    host = models.CharField(
        'Animateur', max_length=200, blank=True,
        help_text='Animateur / pasteur principal.',
    )

    cover = models.ImageField(
        'Image de couverture', upload_to='emissions/shows/cover/', blank=True, null=True,
        help_text='Bannière large (16:9 recommandé).',
    )
    logo = models.ImageField(
        'Logo', upload_to='emissions/shows/logo/', blank=True, null=True,
        help_text='Logo transparent (carte, footer).',
    )
    color = models.CharField(
        'Couleur (hex)', max_length=9, blank=True, default='#3D53EA',
        help_text='Couleur d\'accent (hex).',
    )

    default_schedule = models.CharField(
        'Horaire habituel', max_length=200, blank=True,
        help_text='Ex : « Lundi — Vendredi · 07h00 » (texte libre).',
    )
    youtube_channel_url = models.URLField('URL de la chaîne YouTube', blank=True)

    order = models.PositiveIntegerField(
        'Ordre d\'affichage', default=0, db_index=True,
        help_text='Ordre d\'affichage (plus petit = plus en avant).',
    )

    tags = TaggableManager(blank=True)
    history = HistoricalRecords()

    class Meta:
        verbose_name = 'Émission'
        verbose_name_plural = 'Émissions'
        ordering = ['order', '-created_at']
        indexes = [
            models.Index(fields=['status', 'is_featured']),
        ]

    def __str__(self) -> str:
        return self.title


class Episode(TimestampedModel, SluggedModel, PublishableModel, SeoMixin):
    """A single YouTube episode within a ``Show``."""

    SLUG_SOURCE_FIELD = 'title'

    show = models.ForeignKey(
        Show, on_delete=models.CASCADE, related_name='episodes',
        verbose_name='Émission',
    )
    title = models.CharField('Titre', max_length=220)
    subtitle = models.CharField('Sous-titre', max_length=280, blank=True)
    excerpt = models.TextField(
        'Résumé', blank=True,
        help_text='Résumé court (2-3 phrases).',
    )
    description = models.TextField(
        'Description', blank=True,
        help_text='Notes / plan / commentaire long.',
    )

    speaker = models.CharField(
        'Intervenant', max_length=200, blank=True,
        help_text='Nom de l\'intervenant principal.',
    )
    guests = models.JSONField(
        'Invités', default=list, blank=True,
        help_text='Invités additionnels : liste de dicts '
                  '``[{"name": "...", "role": "..."}]``.',
    )

    youtube_url = models.URLField(
        'URL YouTube',
        help_text='URL YouTube (formats : watch, youtu.be, shorts, live, embed).',
    )
    youtube_id = models.CharField(
        'ID YouTube', max_length=20, blank=True, db_index=True,
        help_text='Auto-extrait de l\'URL. Utilisé pour l\'embed et la miniature.',
    )
    duration_seconds = models.PositiveIntegerField(
        'Durée (secondes)', default=0,
        help_text='Durée en secondes. 0 = inconnue.',
    )

    cover = models.ImageField(
        'Miniature', upload_to='emissions/episodes/cover/', blank=True, null=True,
        help_text='Miniature personnalisée. Si vide, celle de YouTube est utilisée.',
    )

    aired_at = models.DateTimeField(
        'Diffusé le', null=True, blank=True, db_index=True,
        help_text='Date/heure de première diffusion.',
    )

    categories = models.ManyToManyField(
        Category, blank=True, related_name='episodes',
        verbose_name='Catégories',
    )
    tags = TaggableManager('Mots-clés', blank=True)

    view_count = models.PositiveIntegerField('Nombre de vues', default=0, editable=False)

    history = HistoricalRecords()

    class Meta:
        verbose_name = 'Épisode'
        verbose_name_plural = 'Épisodes'
        ordering = ['-aired_at', '-created_at']
        indexes = [
            models.Index(fields=['show', 'status', 'published_at']),
            models.Index(fields=['is_featured', 'status']),
        ]

    def __str__(self) -> str:
        return f'{self.show.title} — {self.title}'

    def clean(self):
        if self.youtube_url and not extract_youtube_id(self.youtube_url):
            raise ValidationError({
                'youtube_url': "URL YouTube non reconnue. Formats supportés : "
                               "watch?v=, youtu.be, /embed/, /shorts/, /live/."
            })

    def save(self, *args, **kwargs):
        if self.youtube_url and not self.youtube_id:
            self.youtube_id = extract_youtube_id(self.youtube_url) or ''
        super().save(*args, **kwargs)

    @property
    def embed_url(self) -> str:
        return youtube_embed_url(self.youtube_id)

    @property
    def thumbnail_url(self) -> str:
        if self.cover:
            return self.cover.url
        return youtube_thumbnail_url(self.youtube_id)

    def increment_views(self, by: int = 1) -> None:
        """Atomic, race-safe increment. Doesn't reload ``self``."""
        type(self).objects.filter(pk=self.pk).update(
            view_count=models.F('view_count') + by,
        )

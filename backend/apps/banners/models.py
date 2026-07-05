"""Dynamic carousel banners.

Design principles:
- No text overlays. The banner IS the image — the visitor sees only pixels.
- Multiple image variants per banner (mobile / tablet / desktop / ultrawide)
  so the frontend can serve the right file to each viewport via ``<picture>``.
- Scheduling: banners are visible only within their [starts_at, ends_at)
  window while ``is_active=True``.
"""
from __future__ import annotations

from django.db import models
from django.utils import timezone
from simple_history.models import HistoricalRecords

from apps.common.models import TimestampedModel


class BannerQuerySet(models.QuerySet):
    def active_now(self):
        """Banners active RIGHT NOW: enabled + in their time window."""
        now = timezone.now()
        return (
            self.filter(is_active=True)
                .filter(models.Q(starts_at__isnull=True) | models.Q(starts_at__lte=now))
                .filter(models.Q(ends_at__isnull=True) | models.Q(ends_at__gt=now))
        )


class Banner(TimestampedModel):
    """A single carousel slide.

    ``title`` and other free-text fields are for **admin organisation only** —
    they are never displayed to visitors. Visitors see the image and click
    through to ``link_url`` (optional).
    """

    title = models.CharField(
        max_length=200,
        help_text='Titre interne (jamais affiché aux visiteurs). Sert à organiser dans l\'admin.',
    )
    link_url = models.URLField(
        blank=True,
        help_text='URL cible au clic. Vide = image non cliquable. Peut être '
                  'interne (/programmes/prends-courage) ou externe.',
    )

    class LinkTarget(models.TextChoices):
        SELF = '_self', 'Même onglet'
        BLANK = '_blank', 'Nouvel onglet'

    link_target = models.CharField(
        max_length=8, choices=LinkTarget.choices, default=LinkTarget.SELF,
    )

    alt_text = models.CharField(
        max_length=200,
        help_text='Description de l\'image pour les lecteurs d\'écran (accessibilité). '
                  'Ex. « Campagne LIVE Zoom : Guérison et Restauration ».',
    )

    is_active = models.BooleanField(default=True, db_index=True)
    starts_at = models.DateTimeField(
        null=True, blank=True, db_index=True,
        help_text='À partir de quand la bannière est visible. Vide = immédiatement.',
    )
    ends_at = models.DateTimeField(
        null=True, blank=True, db_index=True,
        help_text='Jusqu\'à quand (strict). Vide = indéfiniment.',
    )

    order = models.PositiveIntegerField(
        default=0, db_index=True,
        help_text='Ordre d\'apparition dans le carousel (plus petit = plus tôt).',
    )

    objects = BannerQuerySet.as_manager()
    history = HistoricalRecords()

    class Meta:
        verbose_name = 'Bannière'
        verbose_name_plural = 'Bannières'
        ordering = ['order', '-created_at']
        indexes = [
            models.Index(fields=['is_active', 'starts_at', 'ends_at']),
        ]

    def __str__(self) -> str:
        return self.title

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


class BannerImage(models.Model):
    """One image variant for a banner.

    Frontend uses ``<picture>`` with ``<source media="(min-width: Xpx)">``
    per variant, falling back to the mobile image.
    """

    class Variant(models.TextChoices):
        MOBILE    = 'mobile',    'Mobile (~750×1000, portrait)'
        TABLET    = 'tablet',    'Tablette (~1024×500, paysage)'
        DESKTOP   = 'desktop',   'Desktop bannière (~1920×540)'
        ULTRAWIDE = 'ultrawide', 'Ultra-wide (~2560×600)'

    _DEFAULT_MIN_VIEWPORT = {
        Variant.MOBILE:     0,
        Variant.TABLET:     768,
        Variant.DESKTOP:    1280,
        Variant.ULTRAWIDE:  1920,
    }

    banner = models.ForeignKey(
        Banner, on_delete=models.CASCADE, related_name='images',
    )
    variant = models.CharField(max_length=16, choices=Variant.choices)

    image = models.ImageField(
        upload_to='banners/',
        width_field='width', height_field='height',
    )
    width = models.PositiveIntegerField(null=True, blank=True, editable=False)
    height = models.PositiveIntegerField(null=True, blank=True, editable=False)

    min_viewport_width = models.PositiveIntegerField(
        null=True, blank=True,
        help_text='Largeur minimale de viewport (px) où cette image sera utilisée. '
                  'Vide = valeur par défaut selon la variante '
                  '(mobile=0, tablet=768, desktop=1280, ultrawide=1920).',
    )

    class Meta:
        verbose_name = 'Image de bannière'
        verbose_name_plural = 'Images de bannière'
        unique_together = [('banner', 'variant')]
        ordering = ['banner', 'variant']

    def __str__(self) -> str:
        return f'{self.banner.title} — {self.get_variant_display()}'

    def save(self, *args, **kwargs):
        if self.min_viewport_width is None:
            self.min_viewport_width = self._DEFAULT_MIN_VIEWPORT.get(self.variant, 0)
        super().save(*args, **kwargs)

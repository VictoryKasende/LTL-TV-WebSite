"""Dynamic carousel banners.

Design principles:
- No text overlays. The banner IS the image — the visitor sees only pixels.
- Multiple image variants per banner (mobile / tablet / desktop / ultrawide)
  so the frontend can serve the right file to each viewport via ``<picture>``.
- Scheduling: banners are visible only within their [starts_at, ends_at)
  window while ``is_active=True``.
"""
from __future__ import annotations

from pathlib import Path

from django.db import models
from django.utils import timezone
from simple_history.models import HistoricalRecords

from apps.common.models import TimestampedModel

from .validators import validate_internal_or_external_url


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

    ``title``, when typed in by an admin, is shown to visitors as the
    slide's headline. If left blank, it falls back to the filename of
    the first image added (see ``fill_missing_labels_from_image``) —
    that auto-filled value is for admin organisation only and is
    hidden from visitors via ``title_is_auto``/``public_title``.
    Visitors also see the image and click through to ``link_url``
    (optional).
    """

    title = models.CharField(
        'Titre', max_length=200, blank=True,
        help_text='Titre affiché aux visiteurs sur la bannière. Laissé vide, reprend le nom du '
                  'fichier de la première image ajoutée pour organiser l\'admin — dans ce cas, '
                  'rien ne s\'affiche sur le carousel public.',
    )
    title_is_auto = models.BooleanField(
        'Titre auto-généré', default=False, editable=False,
        help_text='Vrai si le titre a été rempli automatiquement depuis le nom du fichier '
                  '(donc masqué sur le site public).',
    )
    link_url = models.CharField(
        'URL du lien', max_length=500, blank=True,
        validators=[validate_internal_or_external_url],
        help_text='URL cible au clic. Vide = image non cliquable. Interne : commence par « / » '
                  '(ex. /programmes/prends-courage — utilisez la liste de suggestions ci-dessous). '
                  'Externe : URL complète (ex. https://exemple.com).',
    )

    class LinkTarget(models.TextChoices):
        SELF = '_self', 'Même onglet'
        BLANK = '_blank', 'Nouvel onglet'

    link_target = models.CharField(
        'Cible du lien', max_length=8, choices=LinkTarget.choices, default=LinkTarget.SELF,
    )

    alt_text = models.CharField(
        'Texte alternatif', max_length=200, blank=True,
        help_text='Description de l\'image pour les lecteurs d\'écran (accessibilité). '
                  'Ex. « Campagne LIVE Zoom : Guérison et Restauration ». '
                  'Laissé vide, reprend le titre.',
    )

    is_active = models.BooleanField('Actif', default=True, db_index=True)
    starts_at = models.DateTimeField(
        'Visible à partir de', null=True, blank=True, db_index=True,
        help_text='À partir de quand la bannière est visible. Vide = immédiatement.',
    )
    ends_at = models.DateTimeField(
        'Visible jusqu\'à', null=True, blank=True, db_index=True,
        help_text='Jusqu\'à quand (strict). Vide = indéfiniment.',
    )

    order = models.PositiveIntegerField(
        'Ordre d\'affichage', default=0, db_index=True,
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
        return self.title or f'Bannière #{self.pk}'

    def save(self, *args, **kwargs):
        if self.pk:
            previous_title = (
                type(self).objects.filter(pk=self.pk).values_list('title', flat=True).first()
            )
            if previous_title is not None and self.title != previous_title:
                # The admin actually typed/changed the title themselves
                # (as opposed to our own filename-fallback .update() below,
                # which bypasses save() entirely) — it's no longer auto.
                self.title_is_auto = False
        super().save(*args, **kwargs)

    def fill_missing_labels_from_image(self, image) -> None:
        """Falls back ``title`` to the image's filename and ``alt_text``
        to ``title``, but only while they're still blank — never
        overwrites something the admin actually typed in. Called after
        the first ``BannerImage`` variant is saved."""
        update_fields = []
        if not self.title and image:
            self.title = Path(image.name).stem
            self.title_is_auto = True
            update_fields += ['title', 'title_is_auto']
        if not self.alt_text and self.title:
            self.alt_text = self.title
            update_fields.append('alt_text')
        if update_fields:
            type(self).objects.filter(pk=self.pk).update(
                **{field: getattr(self, field) for field in update_fields}
            )

    @property
    def public_title(self) -> str:
        """``title`` as it should appear to visitors: empty when it was
        only auto-filled from an image filename."""
        return '' if self.title_is_auto else self.title

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
        verbose_name='Bannière',
    )
    variant = models.CharField('Variante', max_length=16, choices=Variant.choices)

    image = models.ImageField(
        'Image', upload_to='banners/',
        width_field='width', height_field='height',
    )
    width = models.PositiveIntegerField('Largeur', null=True, blank=True, editable=False)
    height = models.PositiveIntegerField('Hauteur', null=True, blank=True, editable=False)

    min_viewport_width = models.PositiveIntegerField(
        'Largeur minimale de viewport', null=True, blank=True,
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
        return f'{self.banner} — {self.get_variant_display()}'

    def save(self, *args, **kwargs):
        if self.min_viewport_width is None:
            self.min_viewport_width = self._DEFAULT_MIN_VIEWPORT.get(self.variant, 0)
        super().save(*args, **kwargs)
        self.banner.fill_missing_labels_from_image(self.image)

"""Abstract base models used across the project.

These mixins are the building blocks for domain models. Compose freely:

    class Article(TimestampedModel, SluggedModel, SoftDeleteModel):
        title = models.CharField(...)
        SLUG_SOURCE_FIELD = 'title'
"""
from __future__ import annotations

import uuid

from django.db import models
from django.utils import timezone
from slugify import slugify as unicode_slugify


class TimestampedModel(models.Model):
    """Adds ``created_at`` / ``updated_at``. Indexed on ``created_at``
    for ordering / pagination performance."""

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ['-created_at']


class UUIDPrimaryKeyModel(models.Model):
    """Uses a UUID as PK. Prevents enumeration attacks on public IDs
    (predicting sequential IDs to scrape or probe). Costs one B-tree
    lookup vs int PK — negligible at our scale, and future-proofs
    external IDs."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True


class SluggedModel(models.Model):
    """Auto-generates a URL-safe unique slug on first save.

    The source is ``SLUG_SOURCE_FIELD`` (defaults to ``title``). Uses
    ``python-slugify`` which handles unicode / accents correctly
    (« Émission spéciale » → ``emission-speciale``).
    """

    SLUG_SOURCE_FIELD: str = 'title'
    SLUG_MAX_LENGTH: int = 220

    slug = models.SlugField(max_length=220, unique=True, db_index=True, blank=True)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._generate_unique_slug()
        super().save(*args, **kwargs)

    def _generate_unique_slug(self) -> str:
        source = getattr(self, self.SLUG_SOURCE_FIELD, '') or self._meta.model_name
        base = unicode_slugify(source, max_length=self.SLUG_MAX_LENGTH) or self._meta.model_name
        slug = base
        Model = type(self)
        idx = 1
        while Model.objects.filter(slug=slug).exclude(pk=self.pk).exists():
            idx += 1
            suffix = f'-{idx}'
            slug = f'{base[: self.SLUG_MAX_LENGTH - len(suffix)]}{suffix}'
        return slug


class SoftDeleteQuerySet(models.QuerySet):
    def delete(self):
        return super().update(deleted_at=timezone.now())

    def alive(self):
        return self.filter(deleted_at__isnull=True)

    def dead(self):
        return self.filter(deleted_at__isnull=False)


class SoftDeleteManager(models.Manager):
    """Default manager: hides soft-deleted rows."""

    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db).alive()


class SoftDeleteModel(models.Model):
    """Adds ``deleted_at``. ``delete()`` sets the timestamp;
    ``hard_delete()`` performs the real SQL DELETE; ``restore()``
    clears the timestamp.

    Two managers are exposed:
      - ``objects``      : alive rows only (default)
      - ``all_objects``  : includes deleted (for admin / recovery)
    """

    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at'])

    def hard_delete(self, using=None, keep_parents=False):
        super().delete(using=using, keep_parents=keep_parents)

    def restore(self):
        self.deleted_at = None
        self.save(update_fields=['deleted_at'])

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None


class PublishableQuerySet(models.QuerySet):
    def published(self):
        now = timezone.now()
        return self.filter(
            status=PublishableModel.Status.PUBLISHED,
        ).filter(models.Q(published_at__isnull=True) | models.Q(published_at__lte=now))


class PublishableManager(models.Manager.from_queryset(PublishableQuerySet)):
    pass


class PublishableModel(models.Model):
    """Editorial workflow: draft → published → archived, plus optional
    scheduled ``published_at`` for future release.

    Used by Article, Emission Episode, WeeklyProgram, etc.
    """

    class Status(models.TextChoices):
        DRAFT = 'draft', 'Brouillon'
        PUBLISHED = 'published', 'Publié'
        ARCHIVED = 'archived', 'Archivé'

    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.DRAFT, db_index=True,
    )
    published_at = models.DateTimeField(null=True, blank=True, db_index=True,
        help_text='Date de publication (auto-remplie ; peut être future pour programmer).')
    is_featured = models.BooleanField(default=False, db_index=True,
        help_text='Mise en avant sur la home / rubriques.')

    objects = PublishableManager()

    class Meta:
        abstract = True

    def publish(self, *, at=None, save: bool = True):
        self.status = self.Status.PUBLISHED
        self.published_at = at or timezone.now()
        if save:
            self.save(update_fields=['status', 'published_at'])

    def archive(self, *, save: bool = True):
        self.status = self.Status.ARCHIVED
        if save:
            self.save(update_fields=['status'])

    @property
    def is_public(self) -> bool:
        return (
            self.status == self.Status.PUBLISHED
            and (self.published_at is None or self.published_at <= timezone.now())
        )


class SeoMixin(models.Model):
    """SEO/OpenGraph fields for anything that renders as a public page.

    Each field is optional; the frontend falls back to the model's
    natural title / description / cover when empty.
    """

    meta_title = models.CharField(max_length=70, blank=True,
        help_text='Titre HTML (≤ 70 caractères). Si vide, `title` est utilisé.')
    meta_description = models.CharField(max_length=180, blank=True,
        help_text='Description meta (≤ 180 caractères).')
    og_image = models.ImageField(upload_to='seo/og/', blank=True, null=True,
        help_text='Image Open Graph (1200×630 recommandé).')
    canonical_url = models.URLField(blank=True,
        help_text='URL canonique (si le contenu est syndiqué depuis une autre source).')

    class Meta:
        abstract = True

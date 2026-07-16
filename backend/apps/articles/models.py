"""Articles CMS.

Editor writes rich text (WYSIWYG, see ``ArticleAdmin``) in ``content_md``,
which despite the name holds HTML directly — not Markdown. The ``save()``
hook mirrors it into ``content_html`` (kept as a distinct field so the
public read API's shape doesn't change) and computes reading time /
auto-excerpt from the plain-text version at the same time.
"""
from __future__ import annotations

from math import ceil

from django.conf import settings
from django.db import models
from django.db.models import Count, F, Q
from django.utils.html import strip_tags
from simple_history.models import HistoricalRecords
from taggit.managers import TaggableManager

from apps.common.models import (
    PublishableModel,
    SeoMixin,
    SluggedModel,
    TimestampedModel,
)


class Category(TimestampedModel, SluggedModel):
    """Article category. Distinct from ``emissions.Category``."""

    SLUG_SOURCE_FIELD = 'name'

    name = models.CharField('Nom', max_length=80, unique=True)
    description = models.CharField('Description', max_length=280, blank=True)
    cover = models.ImageField('Image', upload_to='articles/categories/', blank=True, null=True)
    color = models.CharField('Couleur (hex)', max_length=9, blank=True, default='#3D53EA')
    icon = models.CharField(
        'Icône', max_length=48, blank=True,
        help_text='Nom d\'icône lucide-react (ex : book-open, church, tv).',
    )
    order = models.PositiveIntegerField('Ordre d\'affichage', default=0, db_index=True)

    # SEO on category pages too
    meta_title = models.CharField(
        'Titre SEO', max_length=70, blank=True,
        help_text='Titre affiché dans les résultats Google (≤ 70 caractères).',
    )
    meta_description = models.CharField(
        'Description SEO', max_length=180, blank=True,
        help_text='Résumé affiché sous le titre dans Google (≤ 180 caractères).',
    )

    class Meta:
        verbose_name = 'Catégorie d\'article'
        verbose_name_plural = 'Catégories d\'article'
        ordering = ['order', 'name']

    def __str__(self) -> str:
        return self.name


class Article(TimestampedModel, SluggedModel, PublishableModel, SeoMixin):
    """One editorial article."""

    SLUG_SOURCE_FIELD = 'title'

    # --- Content --------------------------------------------------
    title = models.CharField('Titre', max_length=220)
    subtitle = models.CharField('Sous-titre', max_length=280, blank=True)
    excerpt = models.TextField(
        'Résumé', blank=True,
        help_text='Court résumé affiché sur les vignettes. Auto-généré depuis '
                  'le contenu si laissé vide.',
    )
    content_md = models.TextField(
        'Contenu',
        help_text='Le corps de l\'article.',
    )
    content_html = models.TextField(
        'Contenu HTML (auto)', blank=True, editable=False,
        help_text='Copie du contenu ci-dessus, générée automatiquement à la sauvegarde.',
    )
    reading_time_minutes = models.PositiveIntegerField(
        'Temps de lecture (min)', default=0, editable=False,
        help_text='Estimé sur la base de 200 mots par minute.',
    )

    # --- Media ----------------------------------------------------
    cover = models.ImageField('Image de couverture', upload_to='articles/', blank=True, null=True)
    cover_alt = models.CharField(
        'Description de la couverture', max_length=200, blank=True,
        help_text='Texte alternatif pour les lecteurs d\'écran (accessibilité).',
    )
    cover_credit = models.CharField(
        'Crédit photo', max_length=200, blank=True,
        help_text='Crédit du photographe ou de l\'illustrateur.',
    )

    # --- Authorship & classification ------------------------------
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='articles',
        verbose_name='Auteur',
    )
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='articles',
        verbose_name='Catégorie',
    )
    tags = TaggableManager('Mots-clés', blank=True)

    # --- SEO extras (on top of SeoMixin) -------------------------
    focus_keyword = models.CharField(
        'Mot-clé principal pour Google', max_length=80, blank=True,
        help_text="Le mot ou l'expression que les gens pourraient taper dans Google "
                  "pour trouver cet article. Optionnel.",
    )
    no_index = models.BooleanField(
        'Cacher cette page à Google', default=False,
        help_text='Cochez pour empêcher Google et les autres moteurs de recherche d\'afficher cette page.',
    )

    # --- Stats ---------------------------------------------------
    view_count = models.PositiveIntegerField('Nombre de vues', default=0, editable=False)

    history = HistoricalRecords()

    class Meta:
        verbose_name = 'Article'
        verbose_name_plural = 'Articles'
        ordering = ['-published_at', '-created_at']
        indexes = [
            models.Index(fields=['status', 'published_at']),
            models.Index(fields=['is_featured', 'status']),
            models.Index(fields=['category', 'status']),
        ]

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        # Mirror the WYSIWYG HTML + compute reading time from its plain text.
        if self.content_md:
            self.content_html = self.content_md
            word_count = len(strip_tags(self.content_md).split())
            self.reading_time_minutes = max(1, ceil(word_count / 200))
        else:
            self.content_html = ''
            self.reading_time_minutes = 0

        # Auto-truncate excerpt from the content if empty.
        if not self.excerpt and self.content_md:
            plain = ' '.join(strip_tags(self.content_md).split())
            self.excerpt = plain[:277].rstrip() + ('…' if len(plain) > 280 else '')

        super().save(*args, **kwargs)

    # --- Business helpers ----------------------------------------
    def increment_views(self, by: int = 1) -> None:
        """Atomic, race-safe increment."""
        type(self).objects.filter(pk=self.pk).update(view_count=F('view_count') + by)

    def get_related(self, limit: int = 3):
        """Articles sharing tags (scored) or category, published, excluding self."""
        Model = type(self)
        base = Model.objects.published().exclude(pk=self.pk)

        tag_ids = list(self.tags.values_list('id', flat=True))
        if tag_ids:
            related = (
                base.annotate(
                    shared=Count('tags', filter=Q(tags__id__in=tag_ids), distinct=True)
                )
                .filter(shared__gt=0)
                .order_by('-shared', '-published_at')
            )
            picks = list(related[:limit])
            if len(picks) >= limit:
                return picks
            fill = limit - len(picks)
            existing_ids = [p.pk for p in picks]
            filler_qs = base.exclude(pk__in=existing_ids)
            if self.category:
                filler_qs = filler_qs.filter(category=self.category)
            picks.extend(list(filler_qs.order_by('-published_at')[:fill]))
            return picks

        if self.category:
            return list(
                base.filter(category=self.category)
                    .order_by('-published_at')[:limit]
            )
        return list(base.order_by('-published_at')[:limit])

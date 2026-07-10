"""« À propos » — contenu institutionnel de LTL·TV.

- ``AboutPage``  — singleton : mission, vision, histoire, SEO.
- ``CoreValue``  — une valeur (carte titre + description + icône).
- ``TeamMember`` — un membre de l'équipe (bio, photo, réseaux sociaux).
"""
from __future__ import annotations

from django.db import models
from simple_history.models import HistoricalRecords

from apps.common.models import SeoMixin, TimestampedModel


class AboutPage(TimestampedModel, SeoMixin):
    """Singleton — le contenu de la page publique « À propos ».

    Utilisez ``AboutPage.load()`` pour récupérer l'instance unique
    (créée automatiquement au premier appel)."""

    mission = models.TextField(
        'Mission', blank=True,
        help_text='Ce que LTL·TV cherche à accomplir au quotidien.',
    )
    vision = models.TextField(
        'Vision', blank=True,
        help_text='Où LTL·TV se projette à long terme.',
    )
    history_text = models.TextField(
        'Histoire', blank=True,
        help_text='Le récit de la création et de l\'évolution de la chaîne.',
    )
    founded_year = models.PositiveIntegerField(
        'Année de création', null=True, blank=True,
    )
    cover = models.ImageField(
        'Image de couverture', upload_to='about/', blank=True, null=True,
        help_text='Bannière affichée en tête de la page « À propos ».',
    )

    history = HistoricalRecords()

    class Meta:
        verbose_name = 'Page « À propos »'
        verbose_name_plural = 'Page « À propos »'

    def __str__(self) -> str:
        return 'Page « À propos »'

    def save(self, *args, **kwargs):
        self.pk = 1  # Singleton : toujours la même ligne.
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        pass  # Singleton : jamais supprimé.

    @classmethod
    def load(cls) -> 'AboutPage':
        obj, _created = cls.objects.get_or_create(pk=1)
        return obj


class CoreValue(TimestampedModel):
    """Une valeur fondamentale affichée sur la page « À propos »."""

    title = models.CharField('Titre', max_length=120)
    description = models.TextField('Description', blank=True)
    icon = models.CharField(
        'Icône', max_length=48, blank=True,
        help_text='Nom d\'icône lucide-react (ex : heart, book-open, users, compass).',
    )
    order = models.PositiveIntegerField('Ordre d\'affichage', default=0, db_index=True)

    class Meta:
        verbose_name = 'Valeur'
        verbose_name_plural = 'Valeurs'
        ordering = ['order', 'title']

    def __str__(self) -> str:
        return self.title


class TeamMember(TimestampedModel):
    """Un membre de l'équipe LTL·TV affiché sur la page « À propos »."""

    class Category(models.TextChoices):
        DIRECTION     = 'direction',     'Direction'
        COORDINATION  = 'coordination',  'Coordination'
        PASTORALE     = 'pastorale',     'Équipe pastorale'
        PRODUCTION    = 'production',    'Production & réalisation'
        TECHNIQUE     = 'technique',     'Technique'
        COMMUNICATION = 'communication', 'Communication & réseaux sociaux'
        BENEVOLE      = 'benevole',      'Bénévole'

    full_name = models.CharField('Nom complet', max_length=150)
    role = models.CharField(
        'Fonction', max_length=150, blank=True,
        help_text='Ex : « Directeur général », « Coordinatrice des programmes ».',
    )
    category = models.CharField(
        'Catégorie', max_length=20, choices=Category.choices,
        default=Category.DIRECTION, db_index=True,
    )
    bio = models.TextField('Biographie', blank=True)
    photo = models.ImageField('Photo', upload_to='about/team/', blank=True, null=True)

    email = models.EmailField('Email public', blank=True)
    phone = models.CharField('Téléphone public', max_length=32, blank=True)
    facebook_url = models.URLField('Facebook', blank=True)
    instagram_url = models.URLField('Instagram', blank=True)
    twitter_url = models.URLField('X (Twitter)', blank=True)
    linkedin_url = models.URLField('LinkedIn', blank=True)
    youtube_url = models.URLField('YouTube', blank=True)

    is_active = models.BooleanField(
        'Actif', default=True, db_index=True,
        help_text='Décochez pour masquer ce membre sans le supprimer.',
    )
    order = models.PositiveIntegerField('Ordre d\'affichage', default=0, db_index=True)

    history = HistoricalRecords()

    class Meta:
        verbose_name = 'Membre de l\'équipe'
        verbose_name_plural = 'Membres de l\'équipe'
        ordering = ['category', 'order', 'full_name']
        indexes = [
            models.Index(fields=['category', 'is_active']),
        ]

    def __str__(self) -> str:
        return f'{self.full_name} — {self.get_category_display()}'

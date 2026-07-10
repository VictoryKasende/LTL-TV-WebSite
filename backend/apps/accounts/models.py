from django.contrib.auth.models import AbstractUser
from django.db import models

from apps.common.permissions import GROUP_ADMIN, GROUP_EDITOR, GROUP_MODERATOR


class User(AbstractUser):
    """Extends the default Django user with profile fields used across
    the CMS and public site (author bio, avatar, phone…)."""

    email = models.EmailField('Adresse email', unique=True)
    phone = models.CharField('Téléphone', max_length=32, blank=True)
    avatar = models.ImageField('Avatar', upload_to='avatars/', blank=True, null=True)
    bio = models.TextField('Biographie', blank=True,
        help_text='Biographie publique (utilisée pour l\'affichage des auteurs).')
    is_email_verified = models.BooleanField('Email vérifié', default=False, db_index=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'
        indexes = [
            models.Index(fields=['is_email_verified', 'is_active']),
        ]

    def __str__(self) -> str:
        return self.email or self.username

    @property
    def display_name(self) -> str:
        return self.get_full_name() or self.username or self.email

    @property
    def role(self) -> str | None:
        """Highest role held by this user, or None. Values : 'admin',
        'editor', 'moderator'. Superusers report ``admin``."""
        if self.is_superuser:
            return 'admin'
        names = set(self.groups.values_list('name', flat=True))
        for label, value in (
            (GROUP_ADMIN, 'admin'),
            (GROUP_EDITOR, 'editor'),
            (GROUP_MODERATOR, 'moderator'),
        ):
            if label in names:
                return value
        return None

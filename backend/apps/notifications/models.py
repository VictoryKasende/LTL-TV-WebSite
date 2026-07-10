"""Web Push notifications — subscriptions + campaigns.

Design:
- ``PushSubscription`` stores a single browser's endpoint + VAPID keys.
  The browser reports 410 Gone once the user has revoked; we mark such
  rows inactive and stop trying.
- ``PushCampaign`` is a notification payload we've decided to send —
  either composed manually or auto-created by publish-time signals
  (see ``signals.py``). Sending is done asynchronously by Celery
  (see ``tasks.py``).
"""
from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.common.models import TimestampedModel


class PushSubscriptionQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)


class PushSubscription(TimestampedModel):
    """One browser push subscription.

    ``endpoint`` is globally unique — a browser can only have one
    active subscription per site."""

    endpoint = models.URLField('Endpoint', max_length=500, unique=True)
    p256dh_key = models.CharField(
        'Clé P256DH', max_length=200,
        help_text='Clé publique ECDH (base64url) fournie par le navigateur.',
    )
    auth_key = models.CharField(
        'Clé d\'authentification', max_length=100,
        help_text='Secret d\'authentification (base64url).',
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        null=True, blank=True, related_name='push_subscriptions',
        verbose_name='Utilisateur',
    )
    user_agent = models.CharField('Navigateur', max_length=280, blank=True)
    locale = models.CharField('Langue', max_length=8, default='fr')

    is_active = models.BooleanField('Actif', default=True, db_index=True)
    last_seen_at = models.DateTimeField('Vu pour la dernière fois le', default=timezone.now)
    unsubscribed_at = models.DateTimeField('Désabonné le', null=True, blank=True)

    failed_count = models.PositiveIntegerField('Nombre d\'échecs', default=0)
    last_failure_at = models.DateTimeField('Dernier échec le', null=True, blank=True)
    last_failure_status = models.PositiveIntegerField('Code du dernier échec', null=True, blank=True)

    objects = PushSubscriptionQuerySet.as_manager()

    class Meta:
        verbose_name = 'Abonnement push'
        verbose_name_plural = 'Abonnements push'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['is_active', '-last_seen_at']),
            models.Index(fields=['user']),
        ]

    def __str__(self) -> str:
        return f'{self.endpoint[:60]}…'

    def to_web_push_dict(self) -> dict:
        """Format expected by pywebpush."""
        return {
            'endpoint': self.endpoint,
            'keys': {'p256dh': self.p256dh_key, 'auth': self.auth_key},
        }

    def mark_dead(self, status_code: int) -> None:
        self.is_active = False
        self.unsubscribed_at = timezone.now()
        self.last_failure_status = status_code
        self.last_failure_at = timezone.now()
        self.save(update_fields=[
            'is_active', 'unsubscribed_at', 'last_failure_status', 'last_failure_at',
        ])

    def note_failure(self, status_code: int) -> None:
        self.failed_count = models.F('failed_count') + 1
        self.last_failure_status = status_code
        self.last_failure_at = timezone.now()
        self.save(update_fields=['failed_count', 'last_failure_status', 'last_failure_at'])


class PushCampaign(TimestampedModel):
    """A push notification campaign (payload + audience + workflow)."""

    class Status(models.TextChoices):
        DRAFT     = 'draft',     'Brouillon'
        SCHEDULED = 'scheduled', 'Programmée'
        SENDING   = 'sending',   'En cours d\'envoi'
        SENT      = 'sent',      'Envoyée'
        FAILED    = 'failed',    'Échec'

    class Audience(models.TextChoices):
        ALL           = 'all',           'Tous les abonnés'
        AUTHENTICATED = 'authenticated', 'Utilisateurs connectés seulement'

    class TriggerType(models.TextChoices):
        MANUAL    = 'manual',    'Composée manuellement'
        ARTICLE   = 'article',   'Nouvel article'
        EPISODE   = 'episode',   'Nouvel épisode'
        PROGRAMME = 'programme', 'Nouveau programme'

    # --- Payload -----------------------------------------------
    title = models.CharField('Titre', max_length=100)
    body = models.CharField(
        'Corps du message', max_length=280,
        help_text='Texte de la notification (280 chars max — style tweet).',
    )
    icon = models.URLField(
        'Icône', blank=True,
        help_text='URL d\'icône affichée dans la notif (192×192 recommandé).',
    )
    image = models.URLField(
        'Image', blank=True,
        help_text='Grande image (optionnelle, s\'affiche dans les notifs riches).',
    )
    url = models.CharField(
        'URL de destination', max_length=500, blank=True,
        help_text='URL de destination au clic — chemin relatif (`/articles/...`) '
                  'ou absolu (`https://ltltv.com/...`).',
    )

    # --- Targeting ---------------------------------------------
    audience = models.CharField(
        'Audience', max_length=20, choices=Audience.choices, default=Audience.ALL,
    )

    # --- Origin ------------------------------------------------
    trigger_type = models.CharField(
        'Type de déclencheur', max_length=20, choices=TriggerType.choices, default=TriggerType.MANUAL,
    )
    trigger_ref = models.CharField(
        'Référence du déclencheur', max_length=100, blank=True, db_index=True,
        help_text='Référence unique de l\'origine (ex : ``article:42``). '
                  'Évite les doublons quand un contenu est modifié plusieurs fois.',
    )

    # --- Workflow ----------------------------------------------
    status = models.CharField(
        'Statut', max_length=16, choices=Status.choices, default=Status.DRAFT, db_index=True,
    )
    scheduled_at = models.DateTimeField('Programmée pour le', null=True, blank=True)
    sent_at = models.DateTimeField('Envoyée le', null=True, blank=True)

    # --- Stats --------------------------------------------------
    target_count = models.PositiveIntegerField('Nombre de destinataires', default=0, editable=False)
    delivered_count = models.PositiveIntegerField('Nombre de livraisons', default=0, editable=False)
    failed_count = models.PositiveIntegerField('Nombre d\'échecs', default=0, editable=False)
    click_count = models.PositiveIntegerField('Nombre de clics', default=0, editable=False)

    # --- Ownership ---------------------------------------------
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='push_campaigns',
        verbose_name='Créée par',
    )

    class Meta:
        verbose_name = 'Campagne push'
        verbose_name_plural = 'Campagnes push'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['trigger_ref'],
                condition=~models.Q(trigger_ref=''),
                name='uniq_push_campaign_trigger_ref',
            ),
        ]

    def __str__(self) -> str:
        return f'{self.title} — {self.get_status_display()}'

    def get_target_subscriptions(self):
        qs = PushSubscription.objects.active()
        if self.audience == self.Audience.AUTHENTICATED:
            qs = qs.filter(user__isnull=False)
        return qs

    def to_payload(self) -> dict:
        """Payload sent through the wire (JSON in the push message body)."""
        return {
            'title': self.title,
            'body': self.body,
            'icon': self.icon or '',
            'image': self.image or '',
            'url': self.url or '',
            'campaign_id': self.pk,
        }

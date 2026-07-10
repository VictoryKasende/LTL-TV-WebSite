"""Contact messages with workflow, categorization, replies and audit."""
from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils import timezone
from simple_history.models import HistoricalRecords

from apps.common.models import TimestampedModel


class ContactMessageQuerySet(models.QuerySet):
    def new(self):
        return self.filter(status=ContactMessage.Status.NEW)

    def open(self):
        return self.filter(status__in=[
            ContactMessage.Status.NEW,
            ContactMessage.Status.READ,
            ContactMessage.Status.IN_PROGRESS,
        ])

    def handled(self):
        return self.filter(status=ContactMessage.Status.HANDLED)


class ContactMessage(TimestampedModel):
    """One inbound contact message.

    Workflow: new → read → in_progress → handled / archived / spam.
    """

    class Status(models.TextChoices):
        NEW         = 'new',         'Nouveau'
        READ        = 'read',        'Lu'
        IN_PROGRESS = 'in_progress', 'En traitement'
        HANDLED     = 'handled',     'Traité'
        ARCHIVED    = 'archived',    'Archivé'
        SPAM        = 'spam',        'Spam'

    class Category(models.TextChoices):
        TESTIMONY         = 'testimony',         'Témoignage'
        PRAYER_REQUEST    = 'prayer_request',    'Demande de prière'
        OFFERING          = 'offering',          'Offrande / don'
        CONTENT_PROPOSAL  = 'content_proposal',  'Proposition de contenu'
        BIBLICAL_QUESTION = 'biblical_question', 'Question biblique'
        FEEDBACK          = 'feedback',          'Feedback sur LTL·TV'
        OTHER             = 'other',             'Autre'

    class Priority(models.TextChoices):
        LOW    = 'low',    'Basse'
        NORMAL = 'normal', 'Normale'
        HIGH   = 'high',   'Haute'
        URGENT = 'urgent', 'Urgente'

    # --- Public fields (what the visitor sent) --------------------
    name = models.CharField('Nom', max_length=120)
    email = models.EmailField('Email')
    phone = models.CharField('Téléphone', max_length=32, blank=True)
    subject = models.CharField('Sujet', max_length=200, blank=True)
    message = models.TextField('Message')

    # --- Team classification --------------------------------------
    category = models.CharField(
        'Catégorie', max_length=20, choices=Category.choices,
        default=Category.OTHER, db_index=True,
        help_text='Type de message pour aider au tri.',
    )
    priority = models.CharField(
        'Priorité', max_length=16, choices=Priority.choices,
        default=Priority.NORMAL, db_index=True,
    )
    status = models.CharField(
        'Statut', max_length=16, choices=Status.choices,
        default=Status.NEW, db_index=True,
    )

    # --- Ownership -----------------------------------------------
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='assigned_contacts',
        verbose_name='Assigné à',
        help_text='Membre de l\'équipe responsable du traitement.',
    )
    internal_notes = models.TextField(
        'Notes internes', blank=True,
        help_text='Notes de l\'équipe. Non visibles par l\'expéditeur.',
    )

    # --- Workflow timestamps -------------------------------------
    read_at = models.DateTimeField('Lu le', null=True, blank=True)
    handled_at = models.DateTimeField('Traité le', null=True, blank=True)
    handled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='handled_contacts',
        verbose_name='Traité par',
    )

    # --- Audit ---------------------------------------------------
    submitted_ip = models.GenericIPAddressField('Adresse IP', null=True, blank=True)
    submitted_user_agent = models.CharField('Navigateur', max_length=280, blank=True)
    referrer = models.URLField('Page d\'origine', blank=True)

    objects = ContactMessageQuerySet.as_manager()
    history = HistoricalRecords()

    class Meta:
        verbose_name = 'Message de contact'
        verbose_name_plural = 'Messages de contact'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'priority']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['category']),
        ]

    def __str__(self) -> str:
        return f'{self.name} — {self.subject or "(sans sujet)"}'

    # --- Workflow helpers ----------------------------------------
    def mark_read(self, *, by=None):
        if self.status == self.Status.NEW:
            self.status = self.Status.READ
            self.read_at = timezone.now()
            self.save(update_fields=['status', 'read_at'])

    def mark_in_progress(self, *, by=None):
        if by is not None and self.assigned_to is None:
            self.assigned_to = by
            self.save(update_fields=['assigned_to'])
        if self.status not in {self.Status.HANDLED, self.Status.ARCHIVED, self.Status.SPAM}:
            self.status = self.Status.IN_PROGRESS
            self.save(update_fields=['status'])

    def mark_handled(self, *, by=None):
        self.status = self.Status.HANDLED
        self.handled_at = timezone.now()
        self.handled_by = by
        self.save(update_fields=['status', 'handled_at', 'handled_by'])

    def archive(self):
        self.status = self.Status.ARCHIVED
        self.save(update_fields=['status'])

    def mark_spam(self):
        self.status = self.Status.SPAM
        self.save(update_fields=['status'])

    @property
    def is_open(self) -> bool:
        return self.status in {self.Status.NEW, self.Status.READ, self.Status.IN_PROGRESS}


class ContactReply(TimestampedModel):
    """One reply from the team to a ``ContactMessage``.

    We store the reply body in the DB for full audit. Actually
    sending it (SMTP) is out of scope for this phase.
    """

    message = models.ForeignKey(
        ContactMessage, on_delete=models.CASCADE, related_name='replies',
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='contact_replies_written',
    )
    body = models.TextField()

    # Was the reply actually delivered by email? Toggled by the
    # future SMTP integration.
    is_sent = models.BooleanField(default=False, db_index=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Réponse'
        verbose_name_plural = 'Réponses'
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f'Réponse à #{self.message_id} par {self.author}'

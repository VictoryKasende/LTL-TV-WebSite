"""Serializers for the contacts module.

- ``ContactSubmissionSerializer`` — public POST. Only exposes fields the
  visitor should be able to set. Includes a honeypot.
- ``ContactAdminSerializer`` — full shape for staff. Includes replies.
- ``ContactReplySerializer`` — used when adding / listing replies.
"""
from __future__ import annotations

from rest_framework import serializers

from .models import ContactMessage, ContactReply


class ContactSubmissionSerializer(serializers.ModelSerializer):
    """Public POST-only serializer."""

    hp_field = serializers.CharField(
        required=False, allow_blank=True, write_only=True,
        help_text='Champ anti-bot. Laissez vide.',
    )

    class Meta:
        model = ContactMessage
        fields = ('name', 'email', 'phone', 'subject', 'message', 'category', 'hp_field')

    def validate(self, attrs):
        attrs.pop('hp_field', None)  # never persisted
        return attrs


class ContactReplySerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = ContactReply
        fields = ('id', 'body', 'author', 'author_name',
                  'is_sent', 'sent_at', 'created_at')
        read_only_fields = ('id', 'author', 'author_name', 'is_sent', 'sent_at', 'created_at')


class ContactAdminSerializer(serializers.ModelSerializer):
    """Full shape for staff. Includes nested replies."""

    replies = ContactReplySerializer(many=True, read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True)
    handled_by_name = serializers.CharField(source='handled_by.username', read_only=True)
    is_open = serializers.BooleanField(read_only=True)

    class Meta:
        model = ContactMessage
        fields = (
            'id',
            'name', 'email', 'phone', 'subject', 'message',
            'category', 'priority', 'status',
            'assigned_to', 'assigned_to_name', 'internal_notes',
            'read_at', 'handled_at', 'handled_by', 'handled_by_name',
            'submitted_ip', 'submitted_user_agent', 'referrer',
            'replies', 'is_open',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'submitted_ip', 'submitted_user_agent', 'referrer',
            'assigned_to_name', 'handled_by_name', 'is_open',
            'replies', 'read_at', 'handled_at', 'handled_by',
            'created_at', 'updated_at',
        )

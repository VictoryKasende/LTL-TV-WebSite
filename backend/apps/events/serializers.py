"""Serializers for the events module.

- ``EventSerializer`` — public event detail/list.
- ``EventRegistrationSubmissionSerializer`` — public POST. Only exposes
  fields the visitor should be able to set. Includes a honeypot.
- ``EventRegistrationAdminSerializer`` — full shape for staff.
"""
from __future__ import annotations

from rest_framework import serializers

from .models import Event, EventRegistration


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = (
            'id', 'slug', 'title', 'subtitle',
            'start_date', 'end_date', 'daily_time',
            'conditions', 'is_active', 'is_registration_open',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'slug', 'created_at', 'updated_at')


class EventRegistrationSubmissionSerializer(serializers.ModelSerializer):
    """Public POST-only serializer."""

    hp_field = serializers.CharField(
        required=False, allow_blank=True, write_only=True,
        help_text='Champ anti-bot. Laissez vide.',
    )

    class Meta:
        model = EventRegistration
        fields = (
            'first_name', 'last_name', 'gender', 'email', 'phone',
            'country', 'motivation', 'accepted_conditions', 'hp_field',
        )

    def validate_accepted_conditions(self, value):
        if not value:
            raise serializers.ValidationError(
                'Vous devez accepter les conditions de participation.'
            )
        return value

    def validate(self, attrs):
        attrs.pop('hp_field', None)  # never persisted
        return attrs


class EventRegistrationAdminSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(source='event.title', read_only=True)

    class Meta:
        model = EventRegistration
        fields = (
            'id', 'event', 'event_title',
            'first_name', 'last_name', 'gender', 'email', 'phone', 'country',
            'motivation', 'accepted_conditions', 'internal_notes',
            'submitted_ip', 'submitted_user_agent', 'referrer',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'event_title', 'submitted_ip', 'submitted_user_agent', 'referrer',
            'created_at', 'updated_at',
        )

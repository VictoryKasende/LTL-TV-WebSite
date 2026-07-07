"""Serializers for the notifications module."""
from __future__ import annotations

from rest_framework import serializers

from .models import PushCampaign, PushSubscription


class PushSubscribeSerializer(serializers.Serializer):
    """Accepts the raw ``PushSubscription`` JSON produced by the browser.

    Shape::

        {
          "endpoint": "https://fcm.googleapis.com/fcm/send/...",
          "keys": {"p256dh": "BAc...", "auth": "abc..."}
        }
    """

    endpoint = serializers.URLField(max_length=500)
    keys = serializers.DictField(child=serializers.CharField())
    locale = serializers.CharField(max_length=8, required=False, default='fr')

    def validate_keys(self, keys):
        missing = {'p256dh', 'auth'} - set(keys.keys())
        if missing:
            raise serializers.ValidationError(f'Clés manquantes : {sorted(missing)}.')
        return keys


class PushUnsubscribeSerializer(serializers.Serializer):
    endpoint = serializers.URLField(max_length=500)


class PushCampaignSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = PushCampaign
        fields = (
            'id',
            'title', 'body', 'icon', 'image', 'url',
            'audience', 'trigger_type', 'trigger_ref',
            'status', 'scheduled_at', 'sent_at',
            'target_count', 'delivered_count', 'failed_count', 'click_count',
            'created_by', 'created_by_name',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'status', 'sent_at',
            'target_count', 'delivered_count', 'failed_count', 'click_count',
            'created_by', 'created_by_name', 'created_at', 'updated_at',
        )


class PushSubscriptionAdminSerializer(serializers.ModelSerializer):
    """Admin-only shape — surfaces internals for debugging."""

    class Meta:
        model = PushSubscription
        fields = (
            'id',
            'endpoint', 'user', 'user_agent', 'locale',
            'is_active', 'last_seen_at', 'unsubscribed_at',
            'failed_count', 'last_failure_at', 'last_failure_status',
            'created_at', 'updated_at',
        )
        read_only_fields = fields

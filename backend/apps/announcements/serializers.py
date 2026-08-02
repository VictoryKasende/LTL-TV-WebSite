from rest_framework import serializers

from .models import Announcement


class AnnouncementSerializer(serializers.ModelSerializer):
    is_active_now = serializers.BooleanField(read_only=True)

    class Meta:
        model = Announcement
        fields = (
            'id', 'message', 'cta_label', 'cta_url',
            'is_active', 'starts_at', 'ends_at', 'is_active_now',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'is_active_now', 'created_at', 'updated_at')

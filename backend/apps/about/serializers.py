"""DRF serializers for the « À propos » domain."""
from __future__ import annotations

from rest_framework import serializers

from .models import AboutPage, CoreValue, TeamMember


class AboutPageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AboutPage
        fields = (
            'mission', 'vision', 'history_text', 'founded_year', 'cover',
            'meta_title', 'meta_description', 'og_image', 'canonical_url',
            'updated_at',
        )
        read_only_fields = ('updated_at',)


class CoreValueSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoreValue
        fields = ('id', 'title', 'description', 'icon', 'order')
        read_only_fields = ('id',)


class TeamMemberSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = TeamMember
        fields = (
            'id', 'full_name', 'role', 'category', 'category_display',
            'bio', 'photo', 'email', 'phone',
            'facebook_url', 'instagram_url', 'twitter_url', 'linkedin_url', 'youtube_url',
            'is_active', 'order', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'category_display', 'created_at', 'updated_at')

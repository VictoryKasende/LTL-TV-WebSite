"""DRF serializers for the emissions domain."""
from __future__ import annotations

from rest_framework import serializers
from taggit.serializers import TaggitSerializer, TagListSerializerField

from .models import Category, Episode, Show


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'description', 'color', 'order')
        read_only_fields = ('id', 'slug')


class ShowListSerializer(TaggitSerializer, serializers.ModelSerializer):
    """Compact serializer for lists / cards."""

    tags = TagListSerializerField(required=False)
    episodes_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Show
        fields = (
            'id', 'slug', 'title', 'tagline', 'host',
            'cover', 'logo', 'color',
            'default_schedule', 'youtube_channel_url',
            'order', 'status', 'published_at', 'is_featured',
            'tags', 'episodes_count',
        )
        read_only_fields = ('id', 'slug', 'episodes_count')


class ShowDetailSerializer(ShowListSerializer):
    """Full serializer for the show detail page."""

    class Meta(ShowListSerializer.Meta):
        fields = ShowListSerializer.Meta.fields + (
            'description',
            'meta_title', 'meta_description', 'og_image', 'canonical_url',
            'created_at', 'updated_at',
        )


class EpisodeListSerializer(TaggitSerializer, serializers.ModelSerializer):
    """Compact serializer for episode cards / feeds."""

    tags = TagListSerializerField(required=False)
    categories = CategorySerializer(many=True, read_only=True)
    category_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=Category.objects.all(),
        source='categories', required=False,
    )
    show_slug = serializers.CharField(source='show.slug', read_only=True)
    show_title = serializers.CharField(source='show.title', read_only=True)
    thumbnail_url = serializers.CharField(read_only=True)
    embed_url = serializers.CharField(read_only=True)

    class Meta:
        model = Episode
        fields = (
            'id', 'slug',
            'title', 'subtitle', 'excerpt',
            'show', 'show_slug', 'show_title',
            'speaker', 'guests',
            'youtube_url', 'youtube_id', 'embed_url', 'thumbnail_url',
            'duration_seconds', 'cover', 'aired_at',
            'categories', 'category_ids', 'tags',
            'status', 'published_at', 'is_featured', 'view_count',
        )
        read_only_fields = (
            'id', 'slug', 'youtube_id', 'embed_url', 'thumbnail_url',
            'show_slug', 'show_title', 'view_count',
        )


class EpisodeDetailSerializer(EpisodeListSerializer):
    """Full serializer for the episode detail page."""

    class Meta(EpisodeListSerializer.Meta):
        fields = EpisodeListSerializer.Meta.fields + (
            'description',
            'meta_title', 'meta_description', 'og_image', 'canonical_url',
            'created_at', 'updated_at',
        )

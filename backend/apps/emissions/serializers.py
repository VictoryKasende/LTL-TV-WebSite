"""DRF serializers for the emissions domain."""
from __future__ import annotations

from rest_framework import serializers
from taggit.serializers import TaggitSerializer, TagListSerializerField

from .models import Category, Episode, Series, Show


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
            'id', 'slug', 'title', 'tagline', 'host', 'host_photo',
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


class SeriesSerializer(serializers.ModelSerializer):
    """Compact serializer — series metadata without its episodes."""

    show_slug = serializers.CharField(source='show.slug', read_only=True)
    show_title = serializers.CharField(source='show.title', read_only=True)
    episode_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Series
        fields = (
            'id', 'slug', 'show', 'show_slug', 'show_title',
            'title', 'theme', 'description', 'cover',
            'starts_on', 'ends_on', 'order',
            'status', 'published_at', 'is_featured',
            'episode_count', 'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'slug', 'show_slug', 'show_title',
            'episode_count', 'created_at', 'updated_at',
        )


class SeriesWithEpisodesSerializer(SeriesSerializer):
    """Series wrapped around its (published) episodes — used on the
    show detail page to display episodes grouped by teaching series."""

    episodes = serializers.SerializerMethodField()

    class Meta(SeriesSerializer.Meta):
        fields = SeriesSerializer.Meta.fields + ('episodes',)

    def get_episodes(self, obj):
        episodes = getattr(obj, 'prefetched_episodes', None)
        if episodes is None:
            request = self.context.get('request')
            staff = bool(
                request and request.user and request.user.is_authenticated
                and request.user.is_staff,
            )
            qs = obj.episodes.all() if staff else obj.episodes.published()
            episodes = qs.order_by('episode_number', 'aired_at')
        return EpisodeListSerializer(episodes, many=True, context=self.context).data


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
    series_slug = serializers.CharField(source='series.slug', read_only=True, default=None)
    series_title = serializers.CharField(source='series.title', read_only=True, default=None)
    thumbnail_url = serializers.CharField(read_only=True)
    embed_url = serializers.CharField(read_only=True)

    class Meta:
        model = Episode
        fields = (
            'id', 'slug',
            'title', 'subtitle', 'excerpt',
            'show', 'show_slug', 'show_title',
            'series', 'series_slug', 'series_title', 'episode_number',
            'speaker', 'guests',
            'youtube_url', 'youtube_id', 'embed_url', 'thumbnail_url',
            'duration_seconds', 'cover', 'aired_at',
            'categories', 'category_ids', 'tags',
            'status', 'published_at', 'is_featured', 'view_count',
        )
        read_only_fields = (
            'id', 'slug', 'youtube_id', 'embed_url', 'thumbnail_url',
            'show_slug', 'show_title', 'series_slug', 'series_title', 'view_count',
        )


class EpisodeDetailSerializer(EpisodeListSerializer):
    """Full serializer for the episode detail page."""

    class Meta(EpisodeListSerializer.Meta):
        fields = EpisodeListSerializer.Meta.fields + (
            'description',
            'meta_title', 'meta_description', 'og_image', 'canonical_url',
            'created_at', 'updated_at',
        )

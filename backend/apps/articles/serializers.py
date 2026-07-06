"""Serializers for the articles CMS.

Three shapes:

- ``ArticleListSerializer`` — compact for feeds / cards. No ``content_html``.
- ``ArticleDetailSerializer`` — full article for the reader page.
- ``ArticleWriteSerializer`` — admin write. Accepts ``content_md``.
"""
from __future__ import annotations

from rest_framework import serializers
from taggit.serializers import TagListSerializerField, TaggitSerializer

from .models import Article, Category


class CategorySerializer(serializers.ModelSerializer):
    articles_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = (
            'id', 'name', 'slug', 'description', 'cover', 'color', 'icon',
            'order', 'meta_title', 'meta_description', 'articles_count',
        )
        read_only_fields = ('id', 'slug', 'articles_count')


class ArticleAuthorMiniSerializer(serializers.Serializer):
    """Compact author view for embedding in Article payloads."""

    id = serializers.IntegerField()
    username = serializers.CharField()
    display_name = serializers.SerializerMethodField()
    avatar = serializers.ImageField()
    bio = serializers.CharField()

    def get_display_name(self, obj):
        return obj.get_full_name() or obj.username


class ArticleListSerializer(TaggitSerializer, serializers.ModelSerializer):
    """Compact serializer for /list/ and teasers."""

    tags = TagListSerializerField(required=False)
    category = CategorySerializer(read_only=True)
    author = ArticleAuthorMiniSerializer(read_only=True)

    class Meta:
        model = Article
        fields = (
            'id', 'slug', 'title', 'subtitle', 'excerpt',
            'cover', 'cover_alt',
            'category', 'author', 'tags',
            'reading_time_minutes', 'view_count',
            'status', 'published_at', 'is_featured',
            'created_at',
        )
        read_only_fields = (
            'id', 'slug', 'reading_time_minutes', 'view_count',
            'category', 'author', 'created_at',
        )


class ArticleDetailSerializer(ArticleListSerializer):
    """Full serializer for the reader page — includes rendered HTML."""

    class Meta(ArticleListSerializer.Meta):
        fields = ArticleListSerializer.Meta.fields + (
            'content_html', 'cover_credit',
            'meta_title', 'meta_description', 'og_image', 'canonical_url',
            'focus_keyword', 'no_index',
            'updated_at',
        )
        read_only_fields = ArticleListSerializer.Meta.read_only_fields + (
            'content_html', 'updated_at',
        )


class ArticleWriteSerializer(TaggitSerializer, serializers.ModelSerializer):
    """Editor / admin write shape."""

    tags = TagListSerializerField(required=False)

    class Meta:
        model = Article
        fields = (
            'id', 'slug',
            'title', 'subtitle', 'excerpt',
            'content_md',
            'cover', 'cover_alt', 'cover_credit',
            'author', 'category', 'tags',
            'meta_title', 'meta_description', 'og_image', 'canonical_url',
            'focus_keyword', 'no_index',
            'status', 'published_at', 'is_featured',
            'reading_time_minutes', 'view_count',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'slug', 'reading_time_minutes', 'view_count',
            'created_at', 'updated_at',
        )

"""Django admin for the emissions domain."""
from __future__ import annotations

from django.contrib import admin
from django.utils.html import format_html

from apps.common.admin import BaseAdmin, HistoryAdmin, PublishAdminMixin

from .models import Category, Episode, Series, Show


@admin.register(Category)
class CategoryAdmin(BaseAdmin):
    list_display = ('name', 'slug', 'order')
    list_editable = ('order',)
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)
    ordering = ('order', 'name')


@admin.register(Show)
class ShowAdmin(PublishAdminMixin, HistoryAdmin):
    list_display = ('title', 'host', 'status', 'is_featured', 'order',
                    'episodes_count_admin', 'created_at')
    list_filter = ('status', 'is_featured', 'created_at')
    list_editable = ('order', 'is_featured')
    search_fields = ('title', 'tagline', 'host', 'description')
    prepopulated_fields = {'slug': ('title',)}
    ordering = ('order', '-created_at')
    fieldsets = (
        ('Contenu', {
            'fields': ('title', 'slug', 'tagline', 'description', 'host',
                       'default_schedule', 'color'),
        }),
        ('Médias', {'fields': ('cover', 'logo')}),
        ('Publication', {
            'fields': ('status', 'published_at', 'is_featured', 'order'),
        }),
        ('YouTube', {'fields': ('youtube_channel_url',)}),
        ('SEO', {
            'classes': ('collapse',),
            'fields': ('meta_title', 'meta_description', 'og_image', 'canonical_url'),
        }),
    )

    @admin.display(description='Épisodes publiés')
    def episodes_count_admin(self, obj: Show) -> int:
        return obj.episodes.filter(status=Show.Status.PUBLISHED).count()


@admin.register(Series)
class SeriesAdmin(PublishAdminMixin, HistoryAdmin):
    list_display = ('title', 'show', 'starts_on', 'ends_on',
                    'status', 'is_featured', 'order', 'episode_count_admin')
    list_filter = ('show', 'status', 'is_featured')
    list_editable = ('order',)
    search_fields = ('title', 'theme', 'description')
    prepopulated_fields = {'slug': ('title',)}
    autocomplete_fields = ('show',)
    ordering = ('-starts_on', 'order', '-created_at')
    fieldsets = (
        ('Contenu', {
            'fields': ('show', 'title', 'slug', 'theme', 'description'),
        }),
        ('Période', {'fields': ('starts_on', 'ends_on')}),
        ('Médias', {'fields': ('cover',)}),
        ('Publication', {
            'fields': ('status', 'published_at', 'is_featured', 'order'),
        }),
        ('SEO', {
            'classes': ('collapse',),
            'fields': ('meta_title', 'meta_description', 'og_image', 'canonical_url'),
        }),
    )

    @admin.display(description='Épisodes')
    def episode_count_admin(self, obj: Series) -> int:
        return obj.episode_count


@admin.register(Episode)
class EpisodeAdmin(PublishAdminMixin, HistoryAdmin):
    list_display = ('title', 'show', 'series', 'speaker', 'aired_at',
                    'status', 'is_featured', 'view_count', 'thumb_preview')
    list_filter = ('show', 'series', 'status', 'is_featured', 'categories', 'aired_at')
    list_editable = ('is_featured',)
    search_fields = ('title', 'subtitle', 'excerpt', 'description', 'speaker')
    prepopulated_fields = {'slug': ('title',)}
    autocomplete_fields = ('show', 'series')
    filter_horizontal = ('categories',)
    date_hierarchy = 'aired_at'
    readonly_fields = ('youtube_id', 'view_count', 'thumb_preview')
    ordering = ('-aired_at', '-created_at')
    fieldsets = (
        ('Contenu', {
            'fields': ('show', 'title', 'slug', 'subtitle', 'excerpt', 'description'),
        }),
        ('Série', {'fields': ('series', 'episode_number')}),
        ('Intervenants', {'fields': ('speaker', 'guests')}),
        ('YouTube', {
            'fields': ('youtube_url', 'youtube_id', 'duration_seconds', 'thumb_preview'),
        }),
        ('Classement', {'fields': ('categories',)}),
        ('Médias', {'fields': ('cover',)}),
        ('Publication', {
            'fields': ('status', 'published_at', 'aired_at', 'is_featured', 'view_count'),
        }),
        ('SEO', {
            'classes': ('collapse',),
            'fields': ('meta_title', 'meta_description', 'og_image', 'canonical_url'),
        }),
    )

    @admin.display(description='Miniature')
    def thumb_preview(self, obj: Episode | None) -> str:
        if not obj or not obj.thumbnail_url:
            return '—'
        return format_html(
            '<img src="{}" style="max-width:180px;border-radius:6px" />',
            obj.thumbnail_url,
        )

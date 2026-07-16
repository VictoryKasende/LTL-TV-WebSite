"""Django admin for the emissions domain."""
from __future__ import annotations

from django.contrib import admin
from django.forms.widgets import CheckboxSelectMultiple
from django.utils.html import format_html

from apps.common.admin import (
    BaseAdmin,
    HiddenFieldsAdminMixin,
    HistoryAdmin,
    PublishAdminMixin,
    SeoFieldsetAdminMixin,
)
from apps.common.permissions import is_full_site_admin

from .models import Category, Episode, Series, Show


@admin.register(Category)
class CategoryAdmin(HiddenFieldsAdminMixin, BaseAdmin):
    admin_only_fields = ('slug', 'color')
    list_display = ('name', 'slug', 'order')
    list_editable = ('order',)
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)
    ordering = ('order', 'name')

    def get_list_display(self, request):
        if is_full_site_admin(request.user):
            return self.list_display
        return tuple(f for f in self.list_display if f != 'slug')


@admin.register(Show)
class ShowAdmin(HiddenFieldsAdminMixin, SeoFieldsetAdminMixin, PublishAdminMixin, HistoryAdmin):
    admin_only_fields = ('slug', 'color')
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
        ('Médias', {'fields': ('cover', 'logo', 'host_photo')}),
        ('Publication', {
            'fields': ('status', 'published_at', 'is_featured', 'order'),
        }),
        ('YouTube', {'fields': ('youtube_channel_url',)}),
        ('Référencement Google (optionnel)', {
            'classes': ('collapse',),
            'fields': ('meta_title', 'meta_description', 'og_image', 'canonical_url'),
        }),
    )

    @admin.display(description='Épisodes publiés')
    def episodes_count_admin(self, obj: Show) -> int:
        return obj.episodes.filter(status=Show.Status.PUBLISHED).count()


@admin.register(Series)
class SeriesAdmin(HiddenFieldsAdminMixin, SeoFieldsetAdminMixin, PublishAdminMixin, HistoryAdmin):
    admin_only_fields = ('slug',)
    # The Émissions group manages Series/Episode but not Show itself, so it
    # has no `view_show` permission — the autocomplete widget would 403.
    # A plain dropdown doesn't need that permission to populate.
    admin_only_autocomplete_fields = ('show',)
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
        ('Référencement Google (optionnel)', {
            'classes': ('collapse',),
            'fields': ('meta_title', 'meta_description', 'og_image', 'canonical_url'),
        }),
    )

    @admin.display(description='Épisodes')
    def episode_count_admin(self, obj: Series) -> int:
        return obj.episode_count


@admin.register(Episode)
class EpisodeAdmin(HiddenFieldsAdminMixin, SeoFieldsetAdminMixin, PublishAdminMixin, HistoryAdmin):
    # Non-Admin: 'slug' (auto-generated), 'youtube_id' (auto-derived from
    # the URL) and 'guests' (raw JSON) are hidden — the main `speaker`
    # field covers routine episode entry.
    admin_only_fields = ('slug', 'youtube_id', 'guests')
    admin_only_autocomplete_fields = ('show',)
    list_display = ('title', 'show', 'series', 'speaker', 'aired_at',
                    'status', 'is_featured', 'view_count', 'thumb_preview')
    list_filter = ('show', 'series', 'status', 'is_featured', 'categories', 'aired_at')
    list_editable = ('is_featured',)
    search_fields = ('title', 'subtitle', 'excerpt', 'description', 'speaker')
    prepopulated_fields = {'slug': ('title',)}
    autocomplete_fields = ('show', 'series')
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
        ('Référencement Google (optionnel)', {
            'classes': ('collapse',),
            'fields': ('meta_title', 'meta_description', 'og_image', 'canonical_url'),
        }),
    )

    # No `filter_horizontal` on purpose (see apps.accounts.admin) — Unfold
    # renders a small M2M list as a plain checkbox group, styled correctly,
    # instead of Django's unstyled JS dual-listbox.
    def formfield_for_manytomany(self, db_field, request, **kwargs):
        if db_field.name == 'categories':
            kwargs['widget'] = CheckboxSelectMultiple()
        return super().formfield_for_manytomany(db_field, request, **kwargs)

    @admin.display(description='Miniature')
    def thumb_preview(self, obj: Episode | None) -> str:
        if not obj or not obj.thumbnail_url:
            return '—'
        return format_html(
            '<img src="{}" style="max-width:180px;border-radius:6px" />',
            obj.thumbnail_url,
        )

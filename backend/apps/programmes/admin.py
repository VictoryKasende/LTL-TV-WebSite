"""Admin for the weekly programme calendar."""
from __future__ import annotations

from django.contrib import admin
from django.utils.html import format_html

from apps.common.admin import (
    BaseAdmin,
    HiddenFieldsAdminMixin,
    HistoryAdmin,
    PublishAdminMixin,
    SeoFieldsetAdminMixin,
)
from apps.common.permissions import is_full_site_admin

from .models import ProgramType, WeeklyProgram


@admin.register(ProgramType)
class ProgramTypeAdmin(HiddenFieldsAdminMixin, BaseAdmin):
    # Slug (auto-generated), couleur et icône (nom technique lucide-react)
    # réservés à l'Admin — mêmes raisons que emissions.Category.
    admin_only_fields = ('slug', 'color', 'icon')
    list_display = ('name', 'slug', 'color_swatch', 'icon', 'order')
    list_editable = ('order',)
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)
    ordering = ('order', 'name')

    def get_list_display(self, request):
        if is_full_site_admin(request.user):
            return self.list_display
        hidden = {'slug', 'color_swatch', 'icon'}
        return tuple(f for f in self.list_display if f not in hidden)

    @admin.display(description='Couleur')
    def color_swatch(self, obj: ProgramType) -> str:
        if not obj.color:
            return '—'
        return format_html(
            '<span style="display:inline-block;width:20px;height:20px;'
            'border-radius:4px;background:{};border:1px solid rgba(0,0,0,0.1)"></span> {}',
            obj.color, obj.color,
        )


@admin.register(WeeklyProgram)
class WeeklyProgramAdmin(HiddenFieldsAdminMixin, SeoFieldsetAdminMixin, PublishAdminMixin, HistoryAdmin):
    # Slug (auto-généré), ID YouTube (auto-extrait) et latitude/longitude
    # (coordonnées GPS techniques, sans widget de carte) réservés à l'Admin.
    admin_only_fields = ('slug', 'youtube_id', 'latitude', 'longitude')
    list_display = (
        'date', 'start_time', 'title', 'program_type', 'mode',
        'location', 'status', 'is_featured', 'image_preview',
    )
    list_filter = ('status', 'is_featured', 'mode', 'program_type', 'date')
    list_editable = ('is_featured',)
    search_fields = ('title', 'description', 'responsable', 'location')
    prepopulated_fields = {'slug': ('title',)}
    autocomplete_fields = ('program_type',)
    date_hierarchy = 'date'
    readonly_fields = ('youtube_id', 'image_preview')
    ordering = ('-date', 'start_time', 'order')
    fieldsets = (
        ('Planning', {
            'fields': ('date', 'start_time', 'end_time', 'order'),
        }),
        ('Contenu', {
            'fields': ('title', 'slug', 'description', 'program_type', 'responsable'),
        }),
        ('Lieu / mode', {
            'fields': ('mode', 'location', 'address', 'latitude', 'longitude',
                       'meeting_url'),
        }),
        ('Média', {'fields': ('image', 'youtube_url', 'youtube_id', 'image_preview')}),
        ('Publication', {
            'fields': ('status', 'published_at', 'is_featured'),
        }),
        ('Référencement Google (optionnel)', {
            'classes': ('collapse',),
            'fields': ('meta_title', 'meta_description', 'og_image', 'canonical_url'),
        }),
    )

    @admin.display(description='Aperçu')
    def image_preview(self, obj: WeeklyProgram | None) -> str:
        if not obj or not obj.thumbnail_url:
            return '—'
        return format_html(
            '<img src="{}" style="max-width:200px;border-radius:6px" />',
            obj.thumbnail_url,
        )

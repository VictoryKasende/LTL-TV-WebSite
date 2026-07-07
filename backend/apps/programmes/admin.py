"""Admin for the weekly programme calendar."""
from __future__ import annotations

from django.contrib import admin
from django.utils.html import format_html

from apps.common.admin import BaseAdmin, HistoryAdmin, PublishAdminMixin

from .models import ProgramType, WeeklyProgram


@admin.register(ProgramType)
class ProgramTypeAdmin(BaseAdmin):
    list_display = ('name', 'slug', 'color_swatch', 'icon', 'order')
    list_editable = ('order',)
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)
    ordering = ('order', 'name')

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
class WeeklyProgramAdmin(PublishAdminMixin, HistoryAdmin):
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
    readonly_fields = ('image_preview',)
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
        ('Média', {'fields': ('image', 'image_preview')}),
        ('Publication', {
            'fields': ('status', 'published_at', 'is_featured'),
        }),
        ('SEO', {
            'classes': ('collapse',),
            'fields': ('meta_title', 'meta_description', 'og_image', 'canonical_url'),
        }),
    )

    @admin.display(description='Aperçu')
    def image_preview(self, obj: WeeklyProgram | None) -> str:
        if not obj or not obj.image:
            return '—'
        return format_html(
            '<img src="{}" style="max-width:200px;border-radius:6px" />',
            obj.image.url,
        )

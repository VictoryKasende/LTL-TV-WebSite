"""Admin for banners: inline image variants + preview."""
from __future__ import annotations

from django.contrib import admin
from django.utils.html import format_html

from apps.common.admin import BaseAdmin, BaseStackedInline, HiddenFieldsAdminMixin, HistoryAdmin

from .models import Banner, BannerImage


class BannerImageInline(HiddenFieldsAdminMixin, BaseStackedInline):
    # Technique, auto-calculé selon la variante si laissé vide (voir
    # BannerImage.save()) — réservé à l'Admin.
    admin_only_fields = ('min_viewport_width',)
    model = BannerImage
    extra = 1
    max_num = 4  # one per Variant
    fields = ('variant', 'image', 'preview', 'min_viewport_width', 'width', 'height')
    readonly_fields = ('preview', 'width', 'height')

    @admin.display(description='Aperçu')
    def preview(self, obj: BannerImage | None) -> str:
        if not obj or not getattr(obj, 'image', None):
            return '—'
        return format_html(
            '<img src="{}" style="max-width:360px;max-height:180px;'
            'border-radius:6px;object-fit:contain;background:#0f1114" />',
            obj.image.url,
        )


@admin.register(Banner)
class BannerAdmin(HistoryAdmin):
    inlines = [BannerImageInline]
    list_display = (
        'title', 'is_active', 'is_active_now_display',
        'starts_at', 'ends_at', 'order', 'images_count',
    )
    list_filter = ('is_active',)
    list_editable = ('order',)
    search_fields = ('title', 'alt_text')
    ordering = ('order', '-created_at')
    date_hierarchy = 'starts_at'
    fieldsets = (
        ('Métadonnées internes (jamais visibles publiquement)', {
            'fields': ('title', 'alt_text'),
        }),
        ('Cible du clic', {'fields': ('link_url', 'link_target')}),
        ('Planification', {
            'fields': ('is_active', 'starts_at', 'ends_at', 'order'),
        }),
    )

    @admin.display(description='Diffusion actuelle', boolean=True)
    def is_active_now_display(self, obj: Banner) -> bool:
        return obj.is_active_now

    @admin.display(description='Variantes')
    def images_count(self, obj: Banner) -> int:
        return obj.images.count()


@admin.register(BannerImage)
class BannerImageAdmin(HiddenFieldsAdminMixin, BaseAdmin):
    """Standalone image editor. In practice most editing is done inline
    on the Banner. Kept for searchability / bulk swap."""

    admin_only_fields = ('min_viewport_width',)
    list_display = ('banner', 'variant', 'min_viewport_width', 'width', 'height')
    list_filter = ('variant',)
    autocomplete_fields = ('banner',)
    search_fields = ('banner__title',)

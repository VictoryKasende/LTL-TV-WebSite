"""Admin for the red announcement bar."""
from __future__ import annotations

from django.contrib import admin

from apps.common.admin import HistoryAdmin

from .forms import AnnouncementAdminForm
from .models import Announcement


@admin.register(Announcement)
class AnnouncementAdmin(HistoryAdmin):
    form = AnnouncementAdminForm
    list_display = (
        'message', 'is_active', 'is_active_now_display',
        'cta_label', 'starts_at', 'ends_at',
    )
    list_filter = ('is_active',)
    search_fields = ('message', 'cta_label')
    ordering = ('-created_at',)
    date_hierarchy = 'starts_at'
    fieldsets = (
        ('Message', {'fields': ('message',)}),
        ('Bouton (optionnel)', {'fields': ('cta_label', 'cta_url')}),
        ('Planification', {'fields': ('is_active', 'starts_at', 'ends_at')}),
    )

    @admin.display(description='Diffusion actuelle', boolean=True)
    def is_active_now_display(self, obj: Announcement) -> bool:
        return obj.is_active_now

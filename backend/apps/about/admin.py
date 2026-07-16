"""Admin for the « À propos » domain.

``AboutPage`` is a singleton — the changelist redirects straight to
the (only) change form, and add/delete are disabled once it exists.
"""
from __future__ import annotations

from django.contrib import admin
from django.shortcuts import redirect
from django.urls import reverse
from django.utils.html import format_html

from apps.common.admin import BaseAdmin, HistoryAdmin, SeoFieldsetAdminMixin
from apps.common.permissions import is_full_site_admin

from .models import AboutPage, CoreValue, TeamMember


@admin.register(AboutPage)
class AboutPageAdmin(SeoFieldsetAdminMixin, HistoryAdmin):
    fieldsets = (
        ('Mission & vision', {'fields': ('mission', 'vision')}),
        ('Histoire', {'fields': ('history_text', 'founded_year', 'cover')}),
        ('Référencement Google (optionnel)', {
            'classes': ('collapse',),
            'fields': ('meta_title', 'meta_description', 'og_image', 'canonical_url'),
        }),
    )

    def has_add_permission(self, request):
        return not AboutPage.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        obj = AboutPage.load()
        return redirect(reverse('admin:about_aboutpage_change', args=[obj.pk]))


@admin.register(CoreValue)
class CoreValueAdmin(BaseAdmin):
    list_display = ('title', 'icon', 'order')
    list_editable = ('order',)
    search_fields = ('title', 'description')
    ordering = ('order', 'title')

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        # The real help text names the lucide-react icon library — only
        # meaningful to whoever built the frontend. Everyone else just
        # needs to know it's optional.
        icon_field = form.base_fields.get('icon')
        if icon_field and not is_full_site_admin(request.user):
            icon_field.help_text = 'Facultatif — laisse vide si tu ne sais pas quoi mettre.'
        return form


@admin.register(TeamMember)
class TeamMemberAdmin(HistoryAdmin):
    list_display = ('full_name', 'role', 'category', 'is_active', 'order', 'photo_preview')
    list_filter = ('category', 'is_active')
    list_editable = ('order',)
    search_fields = ('full_name', 'role', 'bio', 'email')
    ordering = ('category', 'order', 'full_name')
    fieldsets = (
        ('Identité', {'fields': ('full_name', 'role', 'category', 'photo')}),
        ('Biographie', {'fields': ('bio',)}),
        ('Contact public', {'fields': ('email', 'phone')}),
        ('Réseaux sociaux', {
            'fields': ('facebook_url', 'instagram_url', 'twitter_url',
                       'linkedin_url', 'youtube_url'),
        }),
        ('Affichage', {'fields': ('is_active', 'order')}),
    )

    @admin.display(description='Photo')
    def photo_preview(self, obj: TeamMember) -> str:
        if not obj.photo:
            return '—'
        return format_html(
            '<img src="{}" style="max-width:44px;max-height:44px;'
            'border-radius:50%;object-fit:cover" />',
            obj.photo.url,
        )

"""Admin for testimonials — moderation-first UI."""
from __future__ import annotations

from django.contrib import admin
from django.utils import timezone
from django.utils.html import format_html
from simple_history.admin import SimpleHistoryAdmin

from .models import Testimonial


@admin.register(Testimonial)
class TestimonialAdmin(SimpleHistoryAdmin):
    list_display = (
        'author_name', 'status_badge', 'country', 'city',
        'is_featured', 'created_at', 'photo_thumb',
    )
    list_filter = ('status', 'is_featured', 'country', 'is_photo_public')
    list_editable = ('is_featured',)
    search_fields = (
        'author_name', 'author_email', 'author_phone',
        'country', 'city', 'title', 'story',
    )
    readonly_fields = (
        'photo_preview', 'moderated_by', 'moderated_at',
        'submitted_ip', 'submitted_user_agent', 'created_at', 'updated_at',
    )
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'
    fieldsets = (
        ('Auteur', {'fields': ('author_name', 'author_email', 'author_phone')}),
        ('Localisation', {'fields': ('country', 'city')}),
        ('Contenu', {'fields': ('title', 'story_short', 'story')}),
        ('Média', {'fields': ('photo', 'photo_preview', 'is_photo_public')}),
        ('Modération', {
            'fields': ('status', 'moderation_note',
                       'moderated_by', 'moderated_at'),
        }),
        ('Affichage', {'fields': ('is_featured', 'order')}),
        ('Audit', {
            'classes': ('collapse',),
            'fields': ('submitted_ip', 'submitted_user_agent',
                       'created_at', 'updated_at'),
        }),
    )
    actions = ['action_approve', 'action_reject', 'action_archive',
               'action_feature', 'action_unfeature']

    # --- Column decorators ---------------------------------------
    @admin.display(description='Statut', ordering='status')
    def status_badge(self, obj: Testimonial) -> str:
        palette = {
            'pending':  ('#F5C24E', 'En attente'),
            'approved': ('#3D803D', 'Approuvé'),
            'rejected': ('#E23737', 'Rejeté'),
            'archived': ('#707070', 'Archivé'),
        }
        color, label = palette.get(obj.status, ('#707070', obj.status))
        return format_html(
            '<span style="display:inline-block;padding:3px 8px;border-radius:10px;'
            'background:{}22;color:{};font-weight:600;font-size:11px">{}</span>',
            color, color, label,
        )

    @admin.display(description='Photo')
    def photo_thumb(self, obj: Testimonial) -> str:
        if not obj.photo:
            return '—'
        return format_html(
            '<img src="{}" style="width:40px;height:40px;object-fit:cover;'
            'border-radius:20px" />',
            obj.photo.url,
        )

    @admin.display(description='Aperçu photo')
    def photo_preview(self, obj: Testimonial | None) -> str:
        if not obj or not obj.photo:
            return '—'
        return format_html(
            '<img src="{}" style="max-width:220px;border-radius:8px" />',
            obj.photo.url,
        )

    # --- Bulk actions --------------------------------------------
    def _bulk_moderate(self, request, queryset, method_name: str, label: str):
        count = 0
        for obj in queryset:
            getattr(obj, method_name)(by=request.user)
            count += 1
        self.message_user(request, f'{count} témoignage(s) {label}.')

    @admin.action(description='Approuver les témoignages sélectionnés')
    def action_approve(self, request, queryset):
        self._bulk_moderate(request, queryset, 'approve', 'approuvé(s)')

    @admin.action(description='Rejeter les témoignages sélectionnés')
    def action_reject(self, request, queryset):
        self._bulk_moderate(request, queryset, 'reject', 'rejeté(s)')

    @admin.action(description='Archiver les témoignages sélectionnés')
    def action_archive(self, request, queryset):
        self._bulk_moderate(request, queryset, 'archive', 'archivé(s)')

    @admin.action(description='Mettre en avant')
    def action_feature(self, request, queryset):
        count = queryset.update(is_featured=True)
        self.message_user(request, f'{count} témoignage(s) mis en avant.')

    @admin.action(description='Retirer de la mise en avant')
    def action_unfeature(self, request, queryset):
        count = queryset.update(is_featured=False)
        self.message_user(request, f'{count} témoignage(s) retiré(s) de la mise en avant.')

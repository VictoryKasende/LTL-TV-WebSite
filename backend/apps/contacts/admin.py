"""Admin for contacts — workflow + replies."""
from __future__ import annotations

from django.contrib import admin
from django.utils.html import format_html
from simple_history.admin import SimpleHistoryAdmin

from .models import ContactMessage, ContactReply


class ContactReplyInline(admin.StackedInline):
    model = ContactReply
    extra = 0
    fields = ('body', 'author', 'is_sent', 'sent_at', 'created_at')
    readonly_fields = ('author', 'is_sent', 'sent_at', 'created_at')


@admin.register(ContactMessage)
class ContactMessageAdmin(SimpleHistoryAdmin):
    inlines = [ContactReplyInline]
    list_display = (
        'name', 'email', 'category', 'priority_badge', 'status_badge',
        'assigned_to', 'created_at',
    )
    list_filter = ('status', 'priority', 'category', 'assigned_to')
    search_fields = ('name', 'email', 'phone', 'subject', 'message')
    autocomplete_fields = ('assigned_to', 'handled_by')
    readonly_fields = (
        'submitted_ip', 'submitted_user_agent', 'referrer',
        'read_at', 'handled_at', 'handled_by',
        'created_at', 'updated_at',
    )
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'
    fieldsets = (
        ('Expéditeur', {'fields': ('name', 'email', 'phone')}),
        ('Message', {'fields': ('subject', 'message')}),
        ('Classement', {'fields': ('category', 'priority', 'status')}),
        ('Attribution', {
            'fields': ('assigned_to', 'internal_notes'),
        }),
        ('Traitement', {
            'fields': ('read_at', 'handled_at', 'handled_by'),
        }),
        ('Audit', {
            'classes': ('collapse',),
            'fields': ('submitted_ip', 'submitted_user_agent', 'referrer',
                       'created_at', 'updated_at'),
        }),
    )
    actions = [
        'action_mark_read', 'action_mark_handled',
        'action_archive', 'action_mark_spam',
    ]

    @admin.display(description='Statut', ordering='status')
    def status_badge(self, obj: ContactMessage) -> str:
        palette = {
            'new':         ('#3D53EA', 'Nouveau'),
            'read':        ('#F5C24E', 'Lu'),
            'in_progress': ('#E85521', 'En traitement'),
            'handled':     ('#3D803D', 'Traité'),
            'archived':    ('#707070', 'Archivé'),
            'spam':        ('#E23737', 'Spam'),
        }
        color, label = palette.get(obj.status, ('#707070', obj.status))
        return format_html(
            '<span style="display:inline-block;padding:3px 8px;border-radius:10px;'
            'background:{}22;color:{};font-weight:600;font-size:11px">{}</span>',
            color, color, label,
        )

    @admin.display(description='Priorité', ordering='priority')
    def priority_badge(self, obj: ContactMessage) -> str:
        palette = {
            'low':    ('#707070', '↓ Basse'),
            'normal': ('#3D53EA', '↔ Normale'),
            'high':   ('#E85521', '↑ Haute'),
            'urgent': ('#E23737', '⚡ Urgente'),
        }
        color, label = palette.get(obj.priority, ('#707070', obj.priority))
        return format_html(
            '<span style="color:{};font-weight:600">{}</span>',
            color, label,
        )

    def _bulk(self, request, queryset, action_name, verb):
        count = 0
        for obj in queryset:
            method = getattr(obj, action_name)
            if action_name in ('mark_read', 'mark_handled'):
                method(by=request.user)
            else:
                method()
            count += 1
        self.message_user(request, f'{count} message(s) {verb}.')

    @admin.action(description='Marquer comme lus')
    def action_mark_read(self, request, queryset):
        self._bulk(request, queryset, 'mark_read', 'marqué(s) comme lu(s)')

    @admin.action(description='Marquer comme traités')
    def action_mark_handled(self, request, queryset):
        self._bulk(request, queryset, 'mark_handled', 'traité(s)')

    @admin.action(description='Archiver')
    def action_archive(self, request, queryset):
        self._bulk(request, queryset, 'archive', 'archivé(s)')

    @admin.action(description='Marquer comme spam')
    def action_mark_spam(self, request, queryset):
        self._bulk(request, queryset, 'mark_spam', 'marqué(s) comme spam')


@admin.register(ContactReply)
class ContactReplyAdmin(admin.ModelAdmin):
    list_display = ('message', 'author', 'is_sent', 'sent_at', 'created_at')
    list_filter = ('is_sent',)
    search_fields = ('body', 'message__name', 'message__email')
    readonly_fields = ('created_at', 'updated_at')
    autocomplete_fields = ('message', 'author')

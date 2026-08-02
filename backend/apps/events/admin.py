"""Admin for events + registrations."""
from __future__ import annotations

from django.contrib import admin

from apps.common.admin import AuditFieldsetAdminMixin, HiddenFieldsAdminMixin, HistoryAdmin

from .models import Event, EventRegistration


@admin.register(Event)
class EventAdmin(HiddenFieldsAdminMixin, HistoryAdmin):
    admin_only_fields = ('slug',)
    list_display = (
        'title', 'start_date', 'end_date', 'daily_time',
        'is_active', 'is_registration_open', 'registrations_count',
    )
    list_filter = ('is_active', 'is_registration_open')
    search_fields = ('title', 'subtitle')
    prepopulated_fields = {'slug': ('title',)}
    ordering = ('-start_date',)
    date_hierarchy = 'start_date'
    fieldsets = (
        ('Titre', {'fields': ('title', 'slug', 'subtitle')}),
        ('Planification', {'fields': ('start_date', 'end_date', 'daily_time')}),
        ('Détails', {'fields': ('meeting_url', 'conditions')}),
        ('Inscriptions', {'fields': ('is_active', 'is_registration_open')}),
    )

    @admin.display(description='Inscrits')
    def registrations_count(self, obj: Event) -> int:
        return obj.registrations.count()


@admin.register(EventRegistration)
class EventRegistrationAdmin(HiddenFieldsAdminMixin, AuditFieldsetAdminMixin, HistoryAdmin):
    list_display = ('first_name', 'last_name', 'email', 'phone', 'event', 'created_at')
    list_filter = ('event',)
    search_fields = ('first_name', 'last_name', 'email', 'phone')
    autocomplete_fields = ('event',)
    readonly_fields = (
        'submitted_ip', 'submitted_user_agent', 'referrer',
        'created_at', 'updated_at',
    )
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'
    fieldsets = (
        ('Événement', {'fields': ('event',)}),
        ('Inscrit', {
            'fields': ('first_name', 'last_name', 'gender', 'email', 'phone', 'country'),
        }),
        ('Motivation', {'fields': ('motivation', 'accepted_conditions')}),
        ('Suivi interne', {'fields': ('internal_notes',)}),
        ('Audit', {
            'classes': ('collapse',),
            'fields': ('submitted_ip', 'submitted_user_agent', 'referrer',
                       'created_at', 'updated_at'),
        }),
    )

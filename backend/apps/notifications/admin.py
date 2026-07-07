"""Admin for Web Push subscriptions and campaigns."""
from __future__ import annotations

from django.contrib import admin, messages
from django.utils.html import format_html

from .models import PushCampaign, PushSubscription
from .tasks import send_campaign


@admin.register(PushSubscription)
class PushSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('endpoint_short', 'user', 'is_active_dot',
                    'locale', 'last_seen_at', 'failed_count')
    list_filter = ('is_active', 'locale')
    search_fields = ('endpoint', 'user__username', 'user__email', 'user_agent')
    readonly_fields = ('endpoint', 'p256dh_key', 'auth_key', 'user_agent',
                       'last_seen_at', 'unsubscribed_at',
                       'failed_count', 'last_failure_at', 'last_failure_status',
                       'created_at', 'updated_at')
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'

    @admin.display(description='Endpoint')
    def endpoint_short(self, obj: PushSubscription) -> str:
        return (obj.endpoint or '')[:70] + '…' if len(obj.endpoint or '') > 70 else obj.endpoint

    @admin.display(description='Actif')
    def is_active_dot(self, obj: PushSubscription) -> str:
        color = '#3D803D' if obj.is_active else '#E23737'
        return format_html(
            '<span style="display:inline-block;width:10px;height:10px;'
            'border-radius:5px;background:{}"></span>',
            color,
        )


@admin.register(PushCampaign)
class PushCampaignAdmin(admin.ModelAdmin):
    list_display = ('title', 'status_badge', 'trigger_type', 'audience',
                    'target_count', 'delivered_count', 'failed_count',
                    'click_count', 'sent_at')
    list_filter = ('status', 'trigger_type', 'audience')
    search_fields = ('title', 'body', 'trigger_ref')
    readonly_fields = ('status', 'target_count', 'delivered_count',
                       'failed_count', 'click_count', 'sent_at',
                       'created_by', 'created_at', 'updated_at')
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'
    fieldsets = (
        ('Contenu de la notification', {
            'fields': ('title', 'body', 'icon', 'image', 'url'),
        }),
        ('Ciblage', {'fields': ('audience',)}),
        ('Origine', {'fields': ('trigger_type', 'trigger_ref')}),
        ('Planification', {'fields': ('scheduled_at',)}),
        ('Statut & stats', {
            'classes': ('collapse',),
            'fields': ('status', 'sent_at', 'target_count', 'delivered_count',
                       'failed_count', 'click_count'),
        }),
        ('Métadonnées', {
            'classes': ('collapse',),
            'fields': ('created_by', 'created_at', 'updated_at'),
        }),
    )
    actions = ['action_send']

    @admin.display(description='Statut', ordering='status')
    def status_badge(self, obj: PushCampaign) -> str:
        palette = {
            'draft':     ('#707070', 'Brouillon'),
            'scheduled': ('#3D53EA', 'Programmée'),
            'sending':   ('#F5C24E', 'Envoi'),
            'sent':      ('#3D803D', 'Envoyée'),
            'failed':    ('#E23737', 'Échec'),
        }
        color, label = palette.get(obj.status, ('#707070', obj.status))
        return format_html(
            '<span style="display:inline-block;padding:3px 8px;border-radius:10px;'
            'background:{}22;color:{};font-weight:600;font-size:11px">{}</span>',
            color, color, label,
        )

    @admin.action(description='Envoyer maintenant (async)')
    def action_send(self, request, queryset):
        n = 0
        for campaign in queryset:
            if campaign.status in {
                PushCampaign.Status.DRAFT,
                PushCampaign.Status.SCHEDULED,
                PushCampaign.Status.FAILED,
            }:
                send_campaign.delay(campaign.pk)
                n += 1
        self.message_user(request, f'{n} campagne(s) mise(s) en file d\'envoi.',
                          level=messages.SUCCESS)

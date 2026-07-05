"""Reusable admin mixins."""
from __future__ import annotations

from django.contrib import admin
from django.utils import timezone


class SoftDeleteAdminMixin:
    """Show soft-deleted rows in admin + expose ``restore``/``hard_delete``
    actions. Requires the model to inherit ``SoftDeleteModel``."""

    def get_queryset(self, request):
        return self.model.all_objects.get_queryset()

    actions = ['restore_selected', 'hard_delete_selected']

    @admin.action(description='Restaurer les éléments sélectionnés')
    def restore_selected(self, request, queryset):
        for obj in queryset:
            obj.restore()
        self.message_user(request, f'{queryset.count()} élément(s) restauré(s).')

    @admin.action(description='Supprimer définitivement (irréversible)')
    def hard_delete_selected(self, request, queryset):
        count = queryset.count()
        for obj in queryset:
            obj.hard_delete()
        self.message_user(request, f'{count} élément(s) supprimé(s) définitivement.')


class PublishAdminMixin:
    """Adds bulk publish / archive actions. Requires ``PublishableModel``."""

    actions = ['publish_selected', 'archive_selected']

    @admin.action(description='Publier maintenant')
    def publish_selected(self, request, queryset):
        for obj in queryset:
            obj.publish()
        self.message_user(request, f'{queryset.count()} élément(s) publié(s).')

    @admin.action(description='Archiver')
    def archive_selected(self, request, queryset):
        for obj in queryset:
            obj.archive()
        self.message_user(request, f'{queryset.count()} élément(s) archivé(s).')

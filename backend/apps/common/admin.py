"""Reusable admin base classes and mixins."""
from __future__ import annotations

from django.contrib import admin
from django.utils import timezone
from simple_history.admin import SimpleHistoryAdmin
from unfold.admin import ModelAdmin as UnfoldModelAdmin
from unfold.admin import StackedInline as UnfoldStackedInline
from unfold.admin import TabularInline as UnfoldTabularInline

from apps.common.permissions import is_full_site_admin


class BaseAdmin(UnfoldModelAdmin):
    """Every project admin should inherit from this (or a subclass).
    Gives us Unfold's rich styling out of the box."""


SEO_FIELDSET_LABEL = 'Référencement Google (optionnel)'
AUDIT_FIELDSET_LABEL = 'Audit'


class HiddenFieldsetsAdminMixin:
    """Hides entire named fieldsets from every group except ``Admin`` (the
    CEO / full-site group). Subclasses set ``admin_only_fieldset_labels``."""

    admin_only_fieldset_labels: tuple[str, ...] = ()

    def get_fieldsets(self, request, obj=None):
        fieldsets = super().get_fieldsets(request, obj)
        if is_full_site_admin(request.user) or not self.admin_only_fieldset_labels:
            return fieldsets
        hidden = set(self.admin_only_fieldset_labels)
        return tuple((label, opts) for label, opts in fieldsets if label not in hidden)


class SeoFieldsetAdminMixin(HiddenFieldsetsAdminMixin):
    """Hides the optional SEO fieldset from every group except ``Admin``
    (the CEO / full-site group) — scoped staff (émissions, articles...)
    don't need canonical URLs / OG images cluttering their form."""

    admin_only_fieldset_labels = (SEO_FIELDSET_LABEL,)


class AuditFieldsetAdminMixin(HiddenFieldsetsAdminMixin):
    """Hides the raw audit-trail fieldset (submitted IP, user agent...)
    from every group except ``Admin`` — non-technical moderators have no
    use for it."""

    admin_only_fieldset_labels = (AUDIT_FIELDSET_LABEL,)


class HiddenFieldsAdminMixin:
    """Hides purely technical field names from every group except
    ``Admin`` (the CEO / full-site group). Subclasses set
    ``admin_only_fields`` — e.g. an auto-generated ``slug`` a
    non-technical editor never needs to touch."""

    admin_only_fields: tuple[str, ...] = ()

    # Fields that stay visible for everyone but drop the autocomplete
    # (search-as-you-type) widget down to a plain dropdown for non-Admin —
    # for a related model non-Admin has no permission on at all (e.g.
    # "Émission" for the Émissions group, which only manages Series/Episode
    # content). A plain <select> doesn't need view permission to populate;
    # Django's autocomplete AJAX endpoint does, and 403s without it.
    admin_only_autocomplete_fields: tuple[str, ...] = ()

    def get_fieldsets(self, request, obj=None):
        fieldsets = super().get_fieldsets(request, obj)
        if is_full_site_admin(request.user) or not self.admin_only_fields:
            return fieldsets
        hidden = set(self.admin_only_fields)
        return tuple(
            (label, {**opts, 'fields': tuple(f for f in opts['fields'] if f not in hidden)})
            for label, opts in fieldsets
        )

    def get_prepopulated_fields(self, request, obj=None):
        # Drop entries whose target field (e.g. "slug") was just hidden —
        # otherwise the changeform's prepopulate JS errors looking up a
        # field that isn't in the form.
        prepopulated = super().get_prepopulated_fields(request, obj)
        if is_full_site_admin(request.user) or not self.admin_only_fields:
            return prepopulated
        hidden = set(self.admin_only_fields)
        return {k: v for k, v in prepopulated.items() if k not in hidden}

    def get_autocomplete_fields(self, request):
        fields = super().get_autocomplete_fields(request)
        if is_full_site_admin(request.user) or not self.admin_only_autocomplete_fields:
            return fields
        hidden = set(self.admin_only_autocomplete_fields)
        return tuple(f for f in fields if f not in hidden)


class HistoryAdmin(UnfoldModelAdmin, SimpleHistoryAdmin):
    """Unfold styling + simple_history revision viewer."""


class BaseTabularInline(UnfoldTabularInline):
    """Unfold-styled TabularInline."""


class BaseStackedInline(UnfoldStackedInline):
    """Unfold-styled StackedInline."""


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

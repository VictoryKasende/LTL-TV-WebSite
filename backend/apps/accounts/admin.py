from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import (
    AdminPasswordChangeForm,
    ReadOnlyPasswordHashWidget,
    UserChangeForm,
    UserCreationForm,
)
from django.contrib.auth.models import Group
from django.forms.widgets import CheckboxSelectMultiple
from django.utils.safestring import mark_safe
from django.utils.translation import gettext_lazy as _
from unfold.widgets import INPUT_CLASSES

from apps.common.admin import BaseAdmin
from apps.common.permissions import GROUP_ADMIN, GROUP_EDITOR, GROUP_MODERATOR, is_full_site_admin

from .models import User

# API-only roles (public write API, see apps.common.permissions) aren't
# admin-panel groups and don't belong in the "Groupe" picker for
# non-technical staff — hidden from everyone except the full-site Admin.
API_ONLY_GROUPS = (GROUP_EDITOR, GROUP_MODERATOR)

SIMPLE_USERNAME_HELP_TEXT = 'Identifiant unique du compte (sans espace).'


def _style_password_fields(form, *field_names):
    """Applies Unfold's input classes to password fields declared directly
    on a form (not derived from a model field), which Unfold's usual
    ``formfield_for_dbfield`` styling hook never sees."""
    for field_name in field_names:
        field = form.fields.get(field_name)
        if field:
            field.widget.attrs['class'] = ' '.join(INPUT_CLASSES)


class SimplePasswordWidget(ReadOnlyPasswordHashWidget):
    """Drops the raw algorithm/iterations/salt/hash breakdown Django shows
    by default — meaningless (and a little alarming) to non-technical
    staff. Keeps only a plain confirmation + the "change password" link,
    added back via the field's help_text."""

    def get_context(self, name, value, attrs):
        context = super().get_context(name, value, attrs)
        context['summary'] = [{'label': 'Mot de passe défini.'}]
        return context


class SimpleUserChangeForm(UserChangeForm):
    """Replaces Django's technical password/username help text with plain
    language a non-technical admin can act on."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        password = self.fields.get('password')
        if password:
            password.widget = SimplePasswordWidget()
            password.help_text = mark_safe('Pour le modifier, <a href="../password/">clique ici</a>.')
        username = self.fields.get('username')
        if username:
            username.help_text = SIMPLE_USERNAME_HELP_TEXT


class SimpleUserCreationForm(UserCreationForm):
    """Same plain-language username help text on the "Add user" form."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        username = self.fields.get('username')
        if username:
            username.help_text = SIMPLE_USERNAME_HELP_TEXT
        _style_password_fields(self, 'password1', 'password2')


class SimplePasswordChangeForm(AdminPasswordChangeForm):
    """Styles the standalone "change password" page (``.../password/``)
    the same way — its password1/password2 fields have the same
    not-derived-from-a-model-field issue as the "Add user" form."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        _style_password_fields(self, 'password1', 'password2')


@admin.register(User)
class CustomUserAdmin(BaseAdmin, UserAdmin):
    form = SimpleUserChangeForm
    add_form = SimpleUserCreationForm
    change_password_form = SimplePasswordChangeForm
    list_display = ('email', 'display_name_admin', 'group_names', 'is_staff', 'is_active')
    list_filter = ('is_active', 'is_staff', 'groups')
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('-date_joined',)

    # Simplified vs. Django's default UserAdmin: no raw permission checkbox
    # list (`user_permissions`, hundreds of entries) and no `is_superuser`
    # toggle here — access is granted entirely through the named groups
    # below, which non-technical staff can actually understand.
    fieldsets = (
        (_('Identifiants de connexion'), {'fields': ('email', 'username', 'password')}),
        (_('Informations personnelles'), {'fields': ('first_name', 'last_name', 'phone', 'avatar', 'bio')}),
        (_('Accès'), {
            'fields': ('is_active', 'is_staff', 'groups'),
            'description': (
                "« Actif » désactivé bloque toute connexion. « Accès à l'administration » "
                "doit être coché pour que la personne puisse se connecter à cette interface. "
                "Le groupe détermine ce qu'elle peut voir et modifier une fois connectée."
            ),
        }),
        (_('Dates importantes'), {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (_('Identifiants de connexion'), {
            'fields': ('email', 'username', 'password1', 'password2', 'is_active', 'is_staff', 'groups'),
        }),
    )
    readonly_fields = ('last_login', 'date_joined')

    def formfield_for_manytomany(self, db_field, request, **kwargs):
        if db_field.name == 'groups':
            # A plain checkbox list reads far better than Django's JS
            # dual-listbox widget for a handful of choices, and avoids the
            # dual-listbox's asset-loading quirks under Unfold's theme.
            kwargs['widget'] = CheckboxSelectMultiple()
            if not is_full_site_admin(request.user):
                # A scoped group (e.g. "Comptes & À propos") can create
                # users and assign them to a group, but never to "Admin"
                # (full-site access) or the API-only roles — only the
                # CEO's Admin group can hand out full-site control.
                kwargs['queryset'] = Group.objects.exclude(name__in=(GROUP_ADMIN, *API_ONLY_GROUPS))
        return super().formfield_for_manytomany(db_field, request, **kwargs)

    @admin.display(description=_('Nom'))
    def display_name_admin(self, obj):
        return obj.display_name

    @admin.display(description=_('Groupe(s)'))
    def group_names(self, obj):
        return ', '.join(obj.groups.values_list('name', flat=True)) or '—'

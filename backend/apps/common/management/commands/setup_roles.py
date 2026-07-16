"""Create the default LTL TV roles.

Two separate permission systems coexist on purpose:

- ``Admin`` / ``Editor`` / ``Moderator`` gate the public site's write API
  (see ``apps.common.permissions``) — unchanged here.
- The groups below gate the Django admin panel itself: which models a
  staff member can see and edit at ``/admin/``. A user still needs
  ``is_staff=True`` (checked separately, per user, in "Add user") to log
  into the admin at all — group membership alone isn't enough.

``Admin`` is intentionally the *only* group with full-site access (every
app, every model) — it's reserved for the CEO / site owner. Every other
admin-panel group is scoped to a handful of models and must NOT have
"Admin"/"Administration" in its name, so nobody mistakes a scoped group
for full control.

Idempotent: safe to run on every deploy. The GitHub Actions deploy step
calls it after ``migrate``.
"""
from django.apps import apps as django_apps
from django.conf import settings
from django.contrib.auth.models import Group, Permission
from django.core.management.base import BaseCommand

API_ROLES = ('Admin', 'Editor', 'Moderator')

# Groups renamed since a previous run: old name -> new name. Renaming in
# place (rather than dropping the old dict key) keeps any user already
# assigned to the group instead of silently losing their access.
RENAMED_GROUPS = {
    'Administration — Utilisateurs & À propos': 'Comptes & À propos',
}

# Scoped admin-panel groups: display name -> list of (app_label, [ModelNames], mode).
# Historical* models (django-simple-history) get view-only access, so the
# "Historique" button on each record works without granting extra editing.
SCOPED_ADMIN_GROUPS = {
    'Comptes & À propos': [
        # 'view' only, on purpose: this group creates users and assigns
        # them to an existing group, but must not be able to invent new
        # groups (e.g. a clone of "Admin" with full-site permissions) —
        # that would be a privilege-escalation path. Only the CEO's Admin
        # group may define/edit groups themselves.
        ('auth', ['Group'], 'view'),
        ('accounts', ['User'], 'full'),
        ('about', ['AboutPage', 'CoreValue', 'TeamMember'], 'full'),
        ('about', ['HistoricalAboutPage', 'HistoricalTeamMember'], 'view'),
    ],
    'Émissions — Émissions, séries & épisodes': [
        # 'Show' (l'émission elle-même) et 'Category' restent réservées à
        # l'Admin — ce groupe ne gère que le contenu (séries, épisodes),
        # pas la création des émissions/catégories. Il garde quand même le
        # champ "Émission" sur ses formulaires (menu déroulant simple, pas
        # de recherche) pour rattacher une série/épisode à une émission
        # existante — voir `admin_only_autocomplete_fields` côté admin.py.
        ('emissions', ['Series', 'Episode'], 'full'),
        ('emissions', ['HistoricalSeries', 'HistoricalEpisode'], 'view'),
    ],
    'Articles': [
        ('articles', ['Category', 'Article'], 'full'),
        ('articles', ['HistoricalArticle'], 'view'),
    ],
    'Programmes & bannières': [
        ('programmes', ['ProgramType', 'WeeklyProgram'], 'full'),
        ('programmes', ['HistoricalWeeklyProgram'], 'view'),
        ('banners', ['Banner', 'BannerImage'], 'full'),
        ('banners', ['HistoricalBanner'], 'view'),
    ],
    'Témoignages & contact': [
        ('temoignages', ['Testimonial'], 'full'),
        ('temoignages', ['HistoricalTestimonial'], 'view'),
        ('contacts', ['ContactMessage', 'ContactReply'], 'full'),
        ('contacts', ['HistoricalContactMessage'], 'view'),
    ],
}

# The single full-site group, reserved for the CEO. Built dynamically from
# every model in every local app (plus auth.Group) so it never drifts out of
# sync with new apps/models — unlike the scoped groups above, it shouldn't
# need hand-maintenance every time content is added to the site.
FULL_SITE_GROUP_NAME = 'Admin'

FULL_ACTIONS = ('add', 'change', 'delete', 'view')
VIEW_ACTIONS = ('view',)


class Command(BaseCommand):
    help = "Create LTL TV's API roles and admin-panel groups."

    def _permissions_for(self, app_label, model_names, mode):
        actions = FULL_ACTIONS if mode == 'full' else VIEW_ACTIONS
        codenames = [
            f'{action}_{model_name.lower()}'
            for model_name in model_names
            for action in actions
        ]
        return Permission.objects.filter(
            content_type__app_label=app_label,
            codename__in=codenames,
        )

    def _full_site_rules(self):
        """(app_label, [ModelNames], mode) for every model in every local
        app, full access except Historical* models which stay view-only."""
        rules = [('auth', ['Group'], 'full')]
        for app_name in settings.LOCAL_APPS:
            app_label = app_name.rsplit('.', 1)[-1]
            full_models, view_models = [], []
            for model in django_apps.get_app_config(app_label).get_models():
                if model.__name__.startswith('Historical'):
                    view_models.append(model.__name__)
                else:
                    full_models.append(model.__name__)
            if full_models:
                rules.append((app_label, full_models, 'full'))
            if view_models:
                rules.append((app_label, view_models, 'view'))
        return rules

    def _sync_group(self, group_name, rules):
        group, created = Group.objects.get_or_create(name=group_name)
        state = 'créé' if created else 'mis à jour'

        perms = Permission.objects.none()
        for app_label, model_names, mode in rules:
            perms |= self._permissions_for(app_label, model_names, mode)
        group.permissions.set(perms)

        self.stdout.write(f'  Groupe admin "{group_name}" — {state} ({perms.count()} permissions)')

    def handle(self, *args, **options):
        for old_name, new_name in RENAMED_GROUPS.items():
            old = Group.objects.filter(name=old_name).first()
            if old and not Group.objects.filter(name=new_name).exists():
                old.name = new_name
                old.save(update_fields=['name'])
                self.stdout.write(f'  Groupe renommé : "{old_name}" → "{new_name}"')

        for name in API_ROLES:
            _, created = Group.objects.get_or_create(name=name)
            state = 'créé' if created else 'existe déjà'
            self.stdout.write(f'  Rôle API "{name}" — {state}')

        self._sync_group(FULL_SITE_GROUP_NAME, self._full_site_rules())
        for group_name, rules in SCOPED_ADMIN_GROUPS.items():
            self._sync_group(group_name, rules)

        self.stdout.write(self.style.SUCCESS('Rôles et groupes prêts.'))
        self.stdout.write(
            "Rappel : ajouter un utilisateur à un de ces groupes ne suffit pas — "
            "il faut aussi cocher « Accès à l'administration » (is_staff) sur sa fiche pour "
            "qu'il puisse se connecter à /admin/. Le groupe « Admin » donne accès à tout le "
            "site — réserve-le au CEO / propriétaire du site."
        )

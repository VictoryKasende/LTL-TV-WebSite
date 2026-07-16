"""Role-based DRF permissions.

Roles map to Django Groups (created by ``manage.py setup_roles``).
Superusers always pass. Keep the checks cheap: one prefetched
groups list per request.

Usage in a viewset:

    class ArticleViewSet(viewsets.ModelViewSet):
        permission_classes = [ReadOnlyOrEditor]

    class TemoignageModerationViewSet(viewsets.ModelViewSet):
        permission_classes = [IsModerator]
"""
from __future__ import annotations

from rest_framework import permissions

GROUP_ADMIN = 'Admin'
GROUP_EDITOR = 'Editor'
GROUP_MODERATOR = 'Moderator'


def _has_group(user, names: tuple[str, ...]) -> bool:
    if not (user and user.is_authenticated):
        return False
    if user.is_superuser:
        return True
    # ``groups`` is a M2M — caching per-request via the User instance is fine.
    if not hasattr(user, '_cached_group_names'):
        user._cached_group_names = set(user.groups.values_list('name', flat=True))
    return bool(user._cached_group_names.intersection(names))


def is_full_site_admin(user) -> bool:
    """True for the CEO / full-site ``Admin`` group (or a superuser).

    Used across the Django admin (dashboard, SEO fieldsets, user-group
    assignment) to gate anything that only makes sense for the person who
    manages the whole site, as opposed to a group scoped to one content
    type."""
    return _has_group(user, (GROUP_ADMIN,))


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return _has_group(request.user, (GROUP_ADMIN,))


class IsEditor(permissions.BasePermission):
    def has_permission(self, request, view):
        return _has_group(request.user, (GROUP_ADMIN, GROUP_EDITOR))


class IsModerator(permissions.BasePermission):
    def has_permission(self, request, view):
        return _has_group(request.user, (GROUP_ADMIN, GROUP_MODERATOR))


class ReadOnlyOrEditor(permissions.BasePermission):
    """Public reads, Editor+ writes."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return _has_group(request.user, (GROUP_ADMIN, GROUP_EDITOR))


class ReadOnlyOrModerator(permissions.BasePermission):
    """Public reads, Moderator+ writes."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return _has_group(request.user, (GROUP_ADMIN, GROUP_MODERATOR))


class WriteOnlyOrAdmin(permissions.BasePermission):
    """Public POST only (submissions), Admin reads/updates.
    Used for the public testimonial / contact endpoints."""

    def has_permission(self, request, view):
        if request.method == 'POST':
            return True
        return _has_group(request.user, (GROUP_ADMIN,))

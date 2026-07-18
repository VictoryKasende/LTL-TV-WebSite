"""Custom admin-only pages not tied to a specific model."""
from __future__ import annotations

from django.contrib import admin
from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied
from django.shortcuts import render

from apps.common.management.commands.setup_roles import (
    FULL_SITE_GROUP_NAME,
    SCOPED_ADMIN_GROUPS,
)

# The six admin-panel groups a staff member can belong to (see setup_roles).
ADMIN_PANEL_GROUP_NAMES = (FULL_SITE_GROUP_NAME, *SCOPED_ADMIN_GROUPS.keys())


def _can_view_guide(user) -> bool:
    return bool(
        user.is_active and user.is_staff
        and (user.is_superuser or user.groups.filter(name__in=ADMIN_PANEL_GROUP_NAMES).exists())
    )


@login_required(login_url='admin:login')
def admin_guide_view(request):
    """Beginner-friendly, field-by-field walkthrough of every admin group.

    Restricted to staff belonging to one of the six admin-panel groups —
    the same audience the guide is written for.
    """
    if not _can_view_guide(request.user):
        raise PermissionDenied("Ce guide est réservé aux membres des groupes de l'administration.")

    context = {
        **admin.site.each_context(request),
        'title': "Guide de l'administration",
    }
    return render(request, 'admin/guide.html', context)

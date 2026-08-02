"""Admin form for Announcement: an internal-URL picker for ``cta_url``.

See ``apps.common.admin_widgets`` for the shared widget/suggestion list.
"""
from __future__ import annotations

from django import forms

from apps.common.admin_widgets import LinkURLWidget

from .models import Announcement


class AnnouncementAdminForm(forms.ModelForm):
    class Meta:
        model = Announcement
        fields = '__all__'
        widgets = {'cta_url': LinkURLWidget(list_id='announcement-cta-url-suggestions')}

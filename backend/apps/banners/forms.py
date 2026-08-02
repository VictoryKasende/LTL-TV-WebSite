"""Admin form for Banner: an internal-URL picker for ``link_url``.

See ``apps.common.admin_widgets`` for the shared widget/suggestion list.
"""
from __future__ import annotations

from django import forms

from apps.common.admin_widgets import LinkURLWidget

from .models import Banner


class BannerAdminForm(forms.ModelForm):
    class Meta:
        model = Banner
        fields = '__all__'
        widgets = {'link_url': LinkURLWidget(list_id='banner-link-url-suggestions')}

"""Admin form for Episode: a comma-separated names input for ``guests``,
stored as ``[{"name": "...", "role": ""}]`` — editors type ``Jean, Paul``
instead of writing raw JSON.
"""
from __future__ import annotations

from django import forms
from unfold.widgets import UnfoldAdminTextInputWidget

from .models import Episode


class GuestsField(forms.CharField):
    """Comma-separated names in the admin ↔ list of dicts in the DB."""

    widget = UnfoldAdminTextInputWidget

    def __init__(self, *args, **kwargs):
        kwargs.setdefault('required', False)
        kwargs.setdefault('help_text', 'Noms séparés par des virgules, ex. : Jean, Paul.')
        super().__init__(*args, **kwargs)

    def prepare_value(self, value):
        if isinstance(value, list):
            return ', '.join(
                guest.get('name', '') for guest in value
                if isinstance(guest, dict) and guest.get('name')
            )
        return super().prepare_value(value)

    def to_python(self, value):
        value = super().to_python(value)
        if not value:
            return []
        return [{'name': name.strip(), 'role': ''} for name in value.split(',') if name.strip()]


class EpisodeAdminForm(forms.ModelForm):
    guests = GuestsField(label='Invités')

    class Meta:
        model = Episode
        fields = '__all__'

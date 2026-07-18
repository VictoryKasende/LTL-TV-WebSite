"""Validators for banner fields."""
from __future__ import annotations

import re

from django.core.exceptions import ValidationError
from django.core.validators import URLValidator

_INTERNAL_PATH_RE = re.compile(r'^/\S*$')


def validate_internal_or_external_url(value: str) -> None:
    """Accepts either a site-relative internal path (``/programmes/…``)
    or a full external URL (``https://…``). Django's built-in
    ``URLField``/``URLValidator`` only accepts the latter, which is why
    a value like ``/programmes/prends-courage`` used to be rejected as
    "invalid" even though the frontend fully supports internal links.
    """
    if not value:
        return
    if value.startswith('/'):
        if not _INTERNAL_PATH_RE.match(value):
            raise ValidationError(
                'Chemin interne invalide : pas d\'espaces ni de retours à la ligne.'
            )
        return
    URLValidator(schemes=['http', 'https'])(value)

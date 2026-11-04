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


VIDEO_MAX_MB = 100


def validate_video_size(file) -> None:
    """Keeps the homepage carousel light — and under nginx's admin upload
    limit, so the editor gets a clear message instead of a bare 413."""
    if file and file.size > VIDEO_MAX_MB * 1024 * 1024:
        raise ValidationError(
            f'Vidéo trop lourde ({file.size / (1024 * 1024):.0f} Mo) : {VIDEO_MAX_MB} Mo maximum. '
            'Compressez-la (ex. HandBrake, préréglage « Fast 1080p30 ») puis réessayez.'
        )

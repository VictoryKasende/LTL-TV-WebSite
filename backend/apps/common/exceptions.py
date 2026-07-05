"""DRF exception handler that normalizes error responses.

Every error becomes one of:

    { "detail": "...", "code": "..." }
    { "detail": "Validation failed.", "code": "invalid", "errors": {...} }

Uncaught 5xx are logged via the standard ``django.request`` logger and
returned as an opaque envelope (no stack trace leaked to clients).
"""
from __future__ import annotations

import logging

from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_default_handler

logger = logging.getLogger('apps.common.exceptions')


def custom_exception_handler(exc, context):
    response = drf_default_handler(exc, context)

    if response is None:
        # Nothing DRF-shaped: an unhandled Python exception. Log + hide.
        logger.exception('Unhandled exception in view', extra={
            'view': getattr(context.get('view'), '__class__', type(None)).__name__,
        })
        return Response(
            {'detail': 'Une erreur interne est survenue.', 'code': 'server_error'},
            status=500,
        )

    data = response.data
    code = getattr(exc, 'default_code', 'error')

    # Simple { "detail": "..." } shape → keep as-is with code added.
    if isinstance(data, dict) and set(data.keys()) == {'detail'}:
        response.data = {'detail': str(data['detail']), 'code': code}
        return response

    # Validation errors → wrap in envelope so the client can locate fields.
    response.data = {
        'detail': 'Validation échouée.' if response.status_code == 400 else 'Requête invalide.',
        'code': code,
        'errors': data if isinstance(data, (dict, list)) else {'non_field_errors': [str(data)]},
    }
    return response

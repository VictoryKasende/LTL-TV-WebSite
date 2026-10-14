"""Request helpers shared by the public submission endpoints."""
from __future__ import annotations

from rest_framework.throttling import BaseThrottle


def client_ip(request) -> str | None:
    """Visitor IP as seen through our reverse proxy.

    Delegates to DRF's throttle identity so the IP we store on submissions is
    the very one rate limits are keyed on. With ``NUM_PROXIES = 1`` (nginx),
    DRF reads the *last* ``X-Forwarded-For`` entry — the one nginx appended —
    instead of the first one, which the client can forge freely.
    """
    return BaseThrottle().get_ident(request) or None

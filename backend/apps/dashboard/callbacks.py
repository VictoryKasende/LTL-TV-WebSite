"""Unfold dashboard callback.

Feeds the admin index template with a rich, novice-friendly overview
of the site's editorial state.
"""
from __future__ import annotations

from .stats import (
    content_kpis, moderation_alerts, publications_chart, recent_content,
)


def dashboard_callback(request, context: dict) -> dict:
    """Injected into ``admin/index.html`` by Unfold."""
    kpis = content_kpis()
    alerts = moderation_alerts()

    # Format KPI cards for the Unfold-styled template.
    cards = [
        {
            'title': k['label'],
            'metric': k['value'],
            'footer': (f'+{k["delta_7d"]} sur 7 jours' if k['delta_7d'] else '—'),
            'icon': k['icon'],
            'link': k['link'],
        }
        for k in kpis
    ]

    context.update({
        'ltl_kpi_cards': cards,
        'ltl_alerts': alerts,
        'ltl_recent': recent_content(6),
        'ltl_chart': publications_chart(30),
        'ltl_health_ok': not alerts,
    })
    return context

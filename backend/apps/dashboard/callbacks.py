"""Unfold dashboard callback.

Feeds the admin index template with a rich, novice-friendly overview
of the site's editorial state.
"""
from __future__ import annotations

from .stats import (
    content_kpis,
    moderation_alerts,
    moderation_gauges,
    publications_chart,
    recent_content,
)


def dashboard_callback(request, context: dict) -> dict:
    """Injected into ``admin/index.html`` by Unfold."""
    kpis = content_kpis()
    alerts = moderation_alerts()

    cards = [
        {
            'title': k['label'],
            'metric': k['value'],
            'delta': k['delta_7d'],
            'icon': k['icon'],
            'link': k['link'],
            'tone': k['tone'],
        }
        for k in kpis
    ]

    # Reshape the chart into a flat per-day list the template can iterate.
    chart = publications_chart(14)
    a_data = chart['series'][0]['data']
    e_data = chart['series'][1]['data']
    p_data = chart['series'][2]['data']
    combined_max = max([*a_data, *e_data, *p_data, 1])
    days = [
        {
            'label': label,
            'a': a_data[i], 'e': e_data[i], 'p': p_data[i],
            'a_pct': int(round(a_data[i] / combined_max * 100)),
            'e_pct': int(round(e_data[i] / combined_max * 100)),
            'p_pct': int(round(p_data[i] / combined_max * 100)),
        }
        for i, label in enumerate(chart['labels'])
    ]

    context.update({
        'ltl_kpi_cards': cards,
        'ltl_gauges': moderation_gauges(),
        'ltl_alerts': alerts,
        'ltl_recent': recent_content(8),
        'ltl_chart_days': days,
        'ltl_health_ok': not alerts,
    })
    return context

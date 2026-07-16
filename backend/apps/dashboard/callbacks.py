"""Unfold dashboard callback.

Feeds the admin index template with a rich, novice-friendly overview
of the site's editorial state.
"""
from __future__ import annotations

from apps.common.permissions import is_full_site_admin

from .stats import (
    content_kpis,
    moderation_alerts,
    moderation_gauges,
    publications_chart,
    recent_content,
)


def _visible(items, user, full_access):
    if full_access:
        return items
    return [item for item in items if user.has_perm(item['perm'])]


def dashboard_callback(request, context: dict) -> dict:
    """Injected into ``admin/index.html`` by Unfold.

    The ``Admin`` group (CEO / full-site access) sees every KPI, alert and
    gauge across the whole site. Every other group only sees the subset
    tied to models its own permissions cover — e.g. the "Témoignages &
    contact" group never sees article or émission KPIs. The cross-domain
    publications chart is Admin-only for the same reason.
    """
    full_access = is_full_site_admin(request.user)

    cards = [
        {
            'title': k['label'],
            'metric': k['value'],
            'delta': k['delta_7d'],
            'icon': k['icon'],
            'link': k['link'],
            'tone': k['tone'],
        }
        for k in _visible(content_kpis(), request.user, full_access)
    ]

    alerts = _visible(moderation_alerts(), request.user, full_access)

    days = []
    if full_access:
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
        'ltl_gauges': _visible(moderation_gauges(), request.user, full_access),
        'ltl_alerts': alerts,
        'ltl_recent': _visible(recent_content(8), request.user, full_access),
        'ltl_chart_days': days,
        'ltl_health_ok': not alerts,
    })
    return context

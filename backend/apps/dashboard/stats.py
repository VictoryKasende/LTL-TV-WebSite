"""Reusable dashboard statistics.

Single source of truth used by both:
- The Django admin dashboard (``callbacks.dashboard_callback``)
- The DRF endpoint ``GET /api/v1/dashboard/stats/`` (future React consumer)

Every function returns plain Python dicts / lists so they can be JSON-serialized
directly.
"""
from __future__ import annotations

from datetime import timedelta

from django.utils import timezone


def _now():
    return timezone.now()


def _delta(now, days: int):
    return now - timedelta(days=days)


# ---------------------------------------------------------------------------
# Content KPIs
# ---------------------------------------------------------------------------
def content_kpis() -> list[dict]:
    """Compact list of KPI cards. Each item:

        {"label": "...", "value": 123, "delta_7d": 5, "icon": "article",
         "link": "/admin/articles/article/", "tone": "primary"}
    """
    from apps.articles.models import Article
    from apps.emissions.models import Episode, Show
    from apps.programmes.models import WeeklyProgram
    from apps.temoignages.models import Testimonial
    from apps.contacts.models import ContactMessage
    from apps.notifications.models import PushSubscription

    now = _now()
    week_ago = _delta(now, 7)

    return [
        {
            'label': 'Articles publiés',
            'value': Article.objects.filter(status='published').count(),
            'delta_7d': Article.objects.filter(
                status='published', published_at__gte=week_ago).count(),
            'icon': 'article',
            'link': '/admin/articles/article/?status__exact=published',
            'tone': 'primary',
        },
        {
            'label': 'Épisodes publiés',
            'value': Episode.objects.filter(status='published').count(),
            'delta_7d': Episode.objects.filter(
                status='published', published_at__gte=week_ago).count(),
            'icon': 'video_library',
            'link': '/admin/emissions/episode/?status__exact=published',
            'tone': 'primary',
        },
        {
            'label': 'Émissions actives',
            'value': Show.objects.filter(status='published').count(),
            'delta_7d': 0,
            'icon': 'live_tv',
            'link': '/admin/emissions/show/',
            'tone': 'primary',
        },
        {
            'label': 'Programmes à venir',
            'value': WeeklyProgram.objects.published().upcoming().count(),
            'delta_7d': WeeklyProgram.objects.published().filter(
                date__gte=now.date(), date__lte=now.date() + timedelta(days=7)).count(),
            'icon': 'calendar_month',
            'link': '/admin/programmes/weeklyprogram/',
            'tone': 'primary',
        },
        {
            'label': 'Témoignages approuvés',
            'value': Testimonial.objects.filter(status='approved').count(),
            'delta_7d': Testimonial.objects.filter(
                status='approved', moderated_at__gte=week_ago).count(),
            'icon': 'reviews',
            'link': '/admin/temoignages/testimonial/?status__exact=approved',
            'tone': 'success',
        },
        {
            'label': 'Abonnés push',
            'value': PushSubscription.objects.filter(is_active=True).count(),
            'delta_7d': PushSubscription.objects.filter(
                is_active=True, created_at__gte=week_ago).count(),
            'icon': 'notifications_active',
            'link': '/admin/notifications/pushsubscription/',
            'tone': 'primary',
        },
    ]


# ---------------------------------------------------------------------------
# Attention (things needing human review)
# ---------------------------------------------------------------------------
def moderation_alerts() -> list[dict]:
    """Items requiring moderator action. Empty list = all clear."""
    from apps.temoignages.models import Testimonial
    from apps.contacts.models import ContactMessage

    alerts = []
    pending_t = Testimonial.objects.filter(status='pending').count()
    if pending_t:
        alerts.append({
            'label': f'{pending_t} témoignage(s) en attente de modération',
            'link': '/admin/temoignages/testimonial/?status__exact=pending',
            'tone': 'warning' if pending_t < 10 else 'danger',
            'icon': 'reviews',
            'count': pending_t,
        })

    new_contacts = ContactMessage.objects.filter(status='new').count()
    if new_contacts:
        alerts.append({
            'label': f'{new_contacts} nouveau(x) message(s) de contact',
            'link': '/admin/contacts/contactmessage/?status__exact=new',
            'tone': 'warning' if new_contacts < 10 else 'danger',
            'icon': 'mail',
            'count': new_contacts,
        })

    urgent = ContactMessage.objects.filter(
        priority='urgent', status__in=['new', 'read', 'in_progress'],
    ).count()
    if urgent:
        alerts.append({
            'label': f'{urgent} message(s) urgent(s) non traité(s)',
            'link': '/admin/contacts/contactmessage/?priority__exact=urgent',
            'tone': 'danger',
            'icon': 'priority_high',
            'count': urgent,
        })

    return alerts


# ---------------------------------------------------------------------------
# Recent activity (last N events, cross-domain)
# ---------------------------------------------------------------------------
def recent_content(limit: int = 6) -> list[dict]:
    """Last published pieces across all content types."""
    from apps.articles.models import Article
    from apps.emissions.models import Episode
    from apps.programmes.models import WeeklyProgram

    items = []
    for a in Article.objects.filter(status='published').order_by('-published_at')[:limit]:
        items.append({
            'kind': 'article',
            'title': a.title,
            'when': a.published_at.isoformat() if a.published_at else '',
            'link': f'/admin/articles/article/{a.pk}/change/',
            'icon': 'article',
        })
    for e in Episode.objects.filter(status='published').order_by('-published_at')[:limit]:
        items.append({
            'kind': 'episode',
            'title': f'{e.show.title} — {e.title}',
            'when': e.published_at.isoformat() if e.published_at else '',
            'link': f'/admin/emissions/episode/{e.pk}/change/',
            'icon': 'video_library',
        })
    for p in WeeklyProgram.objects.published().order_by('-published_at')[:limit]:
        items.append({
            'kind': 'programme',
            'title': p.title,
            'when': p.published_at.isoformat() if p.published_at else '',
            'link': f'/admin/programmes/weeklyprogram/{p.pk}/change/',
            'icon': 'calendar_month',
        })

    items.sort(key=lambda it: it['when'] or '', reverse=True)
    return items[:limit]


# ---------------------------------------------------------------------------
# Chart series (last 30 days publications, per day, per type)
# ---------------------------------------------------------------------------
def publications_chart(days: int = 30) -> dict:
    """Returns a series consumable by Chart.js / Recharts.

        {
          "labels": ["01/07", "02/07", ...],
          "series": [
            {"name": "Articles", "data": [1, 2, 0, ...]},
            {"name": "Épisodes", "data": [0, 0, 1, ...]},
            {"name": "Programmes", "data": [0, 1, 0, ...]}
          ]
        }
    """
    from django.db.models.functions import TruncDate
    from django.db.models import Count

    from apps.articles.models import Article
    from apps.emissions.models import Episode
    from apps.programmes.models import WeeklyProgram

    now = _now()
    start = _delta(now, days)

    def bucket(qs, date_field):
        rows = (
            qs.filter(**{f'{date_field}__gte': start})
              .annotate(d=TruncDate(date_field))
              .values('d')
              .annotate(n=Count('id'))
              .order_by('d')
        )
        return {r['d'].isoformat(): r['n'] for r in rows}

    articles_map = bucket(Article.objects.filter(status='published'), 'published_at')
    episodes_map = bucket(Episode.objects.filter(status='published'), 'published_at')
    programs_map = bucket(WeeklyProgram.objects.published(), 'published_at')

    from datetime import date, timedelta as _td
    labels: list[str] = []
    a_data: list[int] = []
    e_data: list[int] = []
    p_data: list[int] = []
    today = now.date()
    for i in range(days - 1, -1, -1):
        d: date = today - _td(days=i)
        iso = d.isoformat()
        labels.append(d.strftime('%d/%m'))
        a_data.append(articles_map.get(iso, 0))
        e_data.append(episodes_map.get(iso, 0))
        p_data.append(programs_map.get(iso, 0))

    return {
        'labels': labels,
        'series': [
            {'name': 'Articles',    'data': a_data},
            {'name': 'Épisodes',    'data': e_data},
            {'name': 'Programmes',  'data': p_data},
        ],
    }


# ---------------------------------------------------------------------------
# Gauges — health ratios (0-100)
# ---------------------------------------------------------------------------
def moderation_gauges() -> list[dict]:
    """Health gauges as % values, 0-100. Higher = healthier."""
    from apps.contacts.models import ContactMessage
    from apps.temoignages.models import Testimonial

    def _ratio(handled: int, total: int) -> int:
        return int(round(handled / total * 100)) if total else 100

    contacts_total = ContactMessage.objects.count()
    contacts_open = ContactMessage.objects.open().count()
    contacts_handled = contacts_total - contacts_open
    contacts_pct = _ratio(contacts_handled, contacts_total)

    testimonials_total = Testimonial.objects.count()
    testimonials_pending = Testimonial.objects.filter(status='pending').count()
    testimonials_processed = testimonials_total - testimonials_pending
    testimonials_pct = _ratio(testimonials_processed, testimonials_total)

    # Content freshness — how much was published in the last 30 days
    from apps.articles.models import Article
    fresh_articles = Article.objects.filter(
        status='published', published_at__gte=_delta(_now(), 30),
    ).count()
    total_articles = Article.objects.filter(status='published').count()
    freshness_pct = min(100, fresh_articles * 10) if total_articles else 0

    return [
        {
            'label': 'Contacts traités',
            'sublabel': f'{contacts_handled} / {contacts_total}',
            'value': contacts_pct,
            'tone': 'success' if contacts_pct >= 80 else 'warning' if contacts_pct >= 50 else 'danger',
        },
        {
            'label': 'Témoignages modérés',
            'sublabel': f'{testimonials_processed} / {testimonials_total}',
            'value': testimonials_pct,
            'tone': 'success' if testimonials_pct >= 80 else 'warning' if testimonials_pct >= 50 else 'danger',
        },
        {
            'label': 'Fraîcheur du contenu',
            'sublabel': f'{fresh_articles} article(s) publié(s) sur 30 jours',
            'value': freshness_pct,
            'tone': 'success' if freshness_pct >= 70 else 'warning' if freshness_pct >= 30 else 'danger',
        },
    ]


# ---------------------------------------------------------------------------
# Full aggregate — everything the dashboard needs, one call.
# ---------------------------------------------------------------------------
def full_snapshot() -> dict:
    return {
        'generated_at': _now().isoformat(),
        'kpi': content_kpis(),
        'gauges': moderation_gauges(),
        'alerts': moderation_alerts(),
        'recent': recent_content(6),
        'publications_chart': publications_chart(30),
    }

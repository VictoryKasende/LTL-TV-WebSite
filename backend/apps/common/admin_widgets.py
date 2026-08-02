"""Shared admin widget: an internal-URL picker for any ``link_url``-style
field (site-relative path or full external URL — see
``apps.banners.validators.validate_internal_or_external_url``).

Suggests every static page plus every published Show / WeeklyProgram /
Article / active Event as an HTML5 <datalist>, so an admin picks a
suggestion or types any URL, internal or external. Used by
``apps.banners.Banner.link_url`` and ``apps.announcements.Announcement.cta_url``.
"""
from __future__ import annotations

from django.utils.html import format_html, format_html_join
from unfold.widgets import UnfoldAdminTextInputWidget

STATIC_INTERNAL_URLS = [
    ('/', 'Accueil'),
    ('/emissions', 'Émissions — liste'),
    ('/programmes', 'Grille des programmes'),
    ('/articles', 'Articles — liste'),
    ('/temoignages', 'Témoignages'),
    ('/a-propos', 'À propos'),
    ('/contact', 'Contact'),
]


def internal_url_choices() -> list[tuple[str, str]]:
    """Every internal page a link can point to: static routes plus
    published Shows / WeeklyPrograms / Articles and active Events."""
    from apps.articles.models import Article
    from apps.emissions.models import Show
    from apps.events.models import Event
    from apps.programmes.models import WeeklyProgram

    choices = list(STATIC_INTERNAL_URLS)
    choices += [
        (f'/evenements/{slug}', f'Événement — {title}')
        for slug, title in Event.objects.filter(is_active=True)
            .order_by('-start_date').values_list('slug', 'title')
    ]
    choices += [
        (f'/emissions/{slug}', f'Émission — {title}')
        for slug, title in Show.objects.published().order_by('title').values_list('slug', 'title')
    ]
    choices += [
        (f'/programmes/{slug}', f'Programme — {title}')
        for slug, title in WeeklyProgram.objects.published()
            .order_by('-date').values_list('slug', 'title')
    ]
    choices += [
        (f'/articles/{slug}', f'Article — {title}')
        for slug, title in Article.objects.published()
            .order_by('-published_at').values_list('slug', 'title')
    ]
    return choices


class LinkURLWidget(UnfoldAdminTextInputWidget):
    """An Unfold-styled text input paired with a <datalist> of internal
    pages, so typing/pasting an external URL still works unchanged."""

    def __init__(self, attrs=None, list_id: str = 'link-url-suggestions'):
        self.list_id = list_id
        merged = {'list': self.list_id, 'placeholder': '/programmes/mon-emission ou https://…'}
        merged.update(attrs or {})
        super().__init__(merged)

    def render(self, name, value, attrs=None, renderer=None):
        input_html = super().render(name, value, attrs, renderer)
        options = format_html_join(
            '', '<option value="{}">{}</option>',
            internal_url_choices(),
        )
        return format_html('{}<datalist id="{}">{}</datalist>', input_html, self.list_id, options)

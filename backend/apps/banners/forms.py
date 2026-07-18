"""Admin form for Banner: an internal-URL picker for ``link_url``.

``link_url`` accepts either an internal site-relative path or a full
external URL (see ``validate_internal_or_external_url``). To make the
internal case easy to fill in correctly, the widget below suggests every
static page plus every published Show / WeeklyProgram / Article as an
HTML5 <datalist> — the admin can pick a suggestion or type any URL,
internal or external.
"""
from __future__ import annotations

from django import forms
from django.utils.html import format_html, format_html_join
from unfold.widgets import UnfoldAdminTextInputWidget

from .models import Banner

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
    """Every internal page a banner can link to: static routes plus
    published Shows / WeeklyPrograms / Articles."""
    from apps.articles.models import Article
    from apps.emissions.models import Show
    from apps.programmes.models import WeeklyProgram

    choices = list(STATIC_INTERNAL_URLS)
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

    LIST_ID = 'banner-link-url-suggestions'

    def __init__(self, attrs=None):
        merged = {'list': self.LIST_ID, 'placeholder': '/programmes/mon-emission ou https://…'}
        merged.update(attrs or {})
        super().__init__(merged)

    def render(self, name, value, attrs=None, renderer=None):
        input_html = super().render(name, value, attrs, renderer)
        options = format_html_join(
            '', '<option value="{}">{}</option>',
            internal_url_choices(),
        )
        return format_html('{}<datalist id="{}">{}</datalist>', input_html, self.LIST_ID, options)


class BannerAdminForm(forms.ModelForm):
    class Meta:
        model = Banner
        fields = '__all__'
        widgets = {'link_url': LinkURLWidget()}

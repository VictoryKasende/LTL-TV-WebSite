"""Sanitize article HTML from CKEditor before the public site renders it.

The site injects ``content_html`` as raw HTML, so anything that could run
in a reader's browser must go (<script>, on* handlers, javascript: links…).
What the editor legitimately produces must survive, though: font colors
and sizes, alignment, highlights, tables, image layout, embedded videos,
to-do lists. nh3's defaults drop ``style``/``class`` entirely, hence the
allowlists below; ``style`` is filtered property by property.
"""
from __future__ import annotations

import re

import nh3

ALLOWED_TAGS = set(nh3.ALLOWED_TAGS) | {'iframe', 'input', 'label', 'tfoot'}

ALLOWED_ATTRIBUTES = {
    **{tag: set(attrs) for tag, attrs in nh3.ALLOWED_ATTRIBUTES.items()},
    '*': {'class', 'style', 'title', 'lang', 'dir'},
    'a': {'href', 'hreflang', 'target'},
    'img': {'src', 'alt', 'width', 'height', 'srcset', 'sizes', 'loading'},
    'ol': {'start', 'reversed', 'type'},
    'div': {'data-oembed-url'},
    'iframe': {
        'src', 'width', 'height', 'allow', 'allowfullscreen', 'frameborder',
        'title', 'loading', 'referrerpolicy',
    },
    'input': {'type', 'checked', 'disabled'},
}

# Formatting properties CKEditor writes inline (fonts, colors, alignment,
# indent, table/cell properties, image sizes, media-embed wrapper).
ALLOWED_STYLE_PROPERTIES = {
    'color', 'background-color', 'background',
    'font-family', 'font-size', 'font-weight', 'font-style',
    'text-align', 'text-decoration', 'text-indent', 'line-height', 'vertical-align',
    'margin-left', 'margin-right', 'padding', 'padding-left', 'padding-right',
    'padding-top', 'padding-bottom',
    'width', 'height', 'max-width', 'aspect-ratio', 'float',
    'border', 'border-collapse', 'border-color', 'border-style', 'border-width',
    'border-top', 'border-right', 'border-bottom', 'border-left',
    'list-style-type', 'display', 'page-break-after',
    'position', 'top', 'left',
}
# Anything able to load or run something.
_UNSAFE_STYLE_VALUE = re.compile(r'url\s*\(|expression|javascript:|@import|[\\<>]', re.I)

# Players CKEditor's media embed produces.
ALLOWED_IFRAME_SRC = re.compile(
    r'^https://(www\.)?(youtube\.com|youtube-nocookie\.com)/embed/'
    r'|^https://player\.vimeo\.com/video/'
    r'|^https://(www\.)?dailymotion\.com/embed/'
    r'|^https://open\.spotify\.com/embed/'
)
_CLASS_CHARS = re.compile(r'[^\w\- ]')


def _clean_style(value: str) -> str | None:
    kept = []
    for declaration in value.split(';'):
        prop, sep, val = declaration.partition(':')
        prop, val = prop.strip().lower(), val.strip()
        if sep and prop in ALLOWED_STYLE_PROPERTIES and val and not _UNSAFE_STYLE_VALUE.search(val):
            kept.append(f'{prop}:{val}')
    return ';'.join(kept) or None


def _attribute_filter(tag: str, attr: str, value: str) -> str | None:
    if attr == 'style':
        return _clean_style(value)
    if attr == 'class':
        return _CLASS_CHARS.sub('', value) or None
    if tag == 'iframe' and attr == 'src':
        return value if ALLOWED_IFRAME_SRC.match(value) else None
    if tag == 'input' and attr == 'type':
        return value if value == 'checkbox' else None
    return value


def clean_article_html(html: str) -> str:
    return nh3.clean(
        html,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        attribute_filter=_attribute_filter,
    )

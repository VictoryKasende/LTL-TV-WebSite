"""YouTube URL helpers.

Turn any of the URL formats YouTube uses into its 11-character video ID:

    >>> extract_youtube_id('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    'dQw4w9WgXcQ'
    >>> extract_youtube_id('https://youtu.be/dQw4w9WgXcQ?t=15')
    'dQw4w9WgXcQ'
    >>> extract_youtube_id('https://youtube.com/shorts/dQw4w9WgXcQ')
    'dQw4w9WgXcQ'
    >>> extract_youtube_id('not a youtube url')  # returns None
"""
from __future__ import annotations

import re
from urllib.parse import parse_qs, urlparse

_ID_RE = re.compile(r'^[A-Za-z0-9_-]{11}$')
_YOUTUBE_HOSTS = {'youtube.com', 'm.youtube.com', 'music.youtube.com'}
_SHORT_HOSTS = {'youtu.be'}


def extract_youtube_id(url: str | None) -> str | None:
    """Return the 11-char video ID, or ``None`` if the URL is not a
    recognizable YouTube video URL."""
    if not url:
        return None
    try:
        parsed = urlparse(url)
    except ValueError:
        return None

    host = parsed.netloc.lower().removeprefix('www.')
    path = parsed.path or '/'
    candidate: str = ''

    if host in _SHORT_HOSTS:
        candidate = path.strip('/').split('/', 1)[0]
    elif host in _YOUTUBE_HOSTS:
        if path == '/watch':
            candidate = (parse_qs(parsed.query).get('v') or [''])[0]
        else:
            parts = path.strip('/').split('/')
            # /embed/{id}, /shorts/{id}, /live/{id}, /v/{id}
            if len(parts) >= 2 and parts[0] in {'embed', 'shorts', 'live', 'v'}:
                candidate = parts[1]

    return candidate if _ID_RE.match(candidate) else None


def youtube_thumbnail_url(video_id: str, quality: str = 'maxresdefault') -> str:
    """Return the thumbnail URL for a video id.

    Quality can be ``maxresdefault`` (1280×720, widescreen, absent for
    very old / private uploads), ``sddefault`` (640×480), ``hqdefault``
    (480×360 with letterboxing), ``mqdefault`` (320×180), or
    ``default`` (120×90).
    """
    if not video_id:
        return ''
    return f'https://img.youtube.com/vi/{video_id}/{quality}.jpg'


def youtube_embed_url(video_id: str) -> str:
    """Return the ``/embed/`` URL used inside iframes."""
    return f'https://www.youtube.com/embed/{video_id}' if video_id else ''

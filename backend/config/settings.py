"""Django settings for the LTL TV project."""
from __future__ import annotations

from pathlib import Path
from datetime import timedelta

import dj_database_url
from decouple import config, Csv

BASE_DIR = Path(__file__).resolve().parent.parent

# ---------------------------------------------------------------------------
# Security
# ---------------------------------------------------------------------------
SECRET_KEY = config('SECRET_KEY', default='change-me-in-production')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1', cast=Csv())
# The frontend's SSR fetches hit the backend over the internal Docker network
# using the service name below (see frontend `INTERNAL_API_URL` /
# `NEXT_PUBLIC_API_URL`) — that Host header must be allowed regardless of what
# public domains are configured via ALLOWED_HOSTS, or every server-rendered
# page silently loses its data (DisallowedHost -> 400 -> apiGet() -> None).
if 'backend' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append('backend')

# Hard fail if we boot in production with the placeholder secret.
if not DEBUG and SECRET_KEY == 'change-me-in-production':
    raise RuntimeError(
        'SECRET_KEY is still the placeholder — refusing to boot in production.',
    )

# ---------------------------------------------------------------------------
# Applications
# ---------------------------------------------------------------------------
DJANGO_APPS = [
    # Unfold MUST come before django.contrib.admin to override its templates.
    'unfold',
    'unfold.contrib.filters',
    'unfold.contrib.forms',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'cloudinary',
    'cloudinary_storage',
    'django_filters',
    'drf_spectacular',
    'simple_history',
    'taggit',
]

LOCAL_APPS = [
    'apps.common',
    'apps.accounts',
    'apps.emissions',
    'apps.banners',
    'apps.programmes',
    'apps.temoignages',
    'apps.articles',
    'apps.contacts',
    'apps.notifications',
    'apps.about',
    'apps.dashboard',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'simple_history.middleware.HistoryRequestMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
DATABASES = {
    'default': dj_database_url.config(
        default=config('DATABASE_URL', default='sqlite:///db.sqlite3'),
        conn_max_age=600,
    )
}

# ---------------------------------------------------------------------------
# Cache & Celery (Redis)
# ---------------------------------------------------------------------------
REDIS_URL = config('REDIS_URL', default='redis://redis:6379/0')

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': REDIS_URL,
    }
}

# Tests never touch Redis — swap to in-memory. Also disables DRF
# throttling side-effects during the suite.
import sys as _sys  # noqa: E402
if 'test' in _sys.argv:
    CACHES = {'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}}

CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'

# Run tasks synchronously in tests (no broker needed).
import sys as _sys2  # noqa: E402
if 'test' in _sys2.argv:
    CELERY_TASK_ALWAYS_EAGER = True
    CELERY_TASK_EAGER_PROPAGATES = True

# ---------------------------------------------------------------------------
# Password validation
# ---------------------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
     'OPTIONS': {'min_length': 10}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

AUTH_USER_MODEL = 'accounts.User'

# ---------------------------------------------------------------------------
# I18N
# ---------------------------------------------------------------------------
LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ---------------------------------------------------------------------------
# Static & media
# ---------------------------------------------------------------------------
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ---------------------------------------------------------------------------
# Cloudinary
# ---------------------------------------------------------------------------
CLOUDINARY_URL = config('CLOUDINARY_URL', default='')
if CLOUDINARY_URL:
    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'

# ---------------------------------------------------------------------------
# REST Framework
# ---------------------------------------------------------------------------
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_PAGINATION_CLASS': 'apps.common.pagination.StandardPagination',
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.ScopedRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '60/min',
        'user': '2000/day',
        'auth': '10/min',
        'contact': '5/hour',
        'testimonial': '3/hour',
    },
    'EXCEPTION_HANDLER': 'apps.common.exceptions.custom_exception_handler',
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'AUTH_HEADER_TYPES': ('Bearer',),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,   # add token blacklist app if we want revocation
}

# ---------------------------------------------------------------------------
# drf-spectacular (OpenAPI)
# ---------------------------------------------------------------------------
SPECTACULAR_SETTINGS = {
    'TITLE': 'LTL TV — API',
    'DESCRIPTION': (
        'API publique et d\'administration de LTL TV. '
        'Voir `/api/docs/` (Swagger UI) et `/api/redoc/` (ReDoc).'
    ),
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'CONTACT': {'email': 'contact@ltltv.com'},
    'LICENSE': {'name': 'Proprietary'},
    'COMPONENT_SPLIT_REQUEST': True,
    'SCHEMA_PATH_PREFIX': r'/api/v[0-9]',
    'ENUM_NAME_OVERRIDES': {},
    'TAGS': [
        {'name': 'Auth',        'description': 'Login, refresh, register.'},
        {'name': 'Accounts',    'description': 'Profil utilisateur.'},
        {'name': 'Programmes',  'description': 'Programmes hebdomadaires.'},
        {'name': 'Émissions',   'description': 'Shows YouTube & épisodes.'},
        {'name': 'Témoignages', 'description': 'Soumission et lecture.'},
        {'name': 'Articles',    'description': 'Articles et catégories.'},
        {'name': 'Contacts',    'description': 'Messages de contact.'},
        {'name': 'Bannières',   'description': 'Carousel dynamique.'},
    ],
}

# ---------------------------------------------------------------------------
# CORS / CSRF
# ---------------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:3000,https://ltltv.com,https://www.ltltv.com',
    cast=Csv(),
)
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = config(
    'CSRF_TRUSTED_ORIGINS',
    default='http://localhost:3000,https://ltltv.com,https://www.ltltv.com',
    cast=Csv(),
)

# ---------------------------------------------------------------------------
# Behind a reverse proxy (nginx) that terminates TLS
# ---------------------------------------------------------------------------
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True

if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = False
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

# ---------------------------------------------------------------------------
# Logging (JSON in prod, human-friendly in dev)
# ---------------------------------------------------------------------------
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'json': {'()': 'apps.common.logging.JsonFormatter'},
        'plain': {
            'format': '{levelname:<8} {asctime} {name} — {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'plain' if DEBUG else 'json',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {'handlers': ['console'], 'level': 'INFO', 'propagate': False},
        'django.request': {'handlers': ['console'], 'level': 'WARNING', 'propagate': False},
        'django.security': {'handlers': ['console'], 'level': 'WARNING', 'propagate': False},
        'apps':  {'handlers': ['console'], 'level': 'INFO', 'propagate': False},
    },
}

# ---------------------------------------------------------------------------
# Sentry (activated only if SENTRY_DSN is set)
# ---------------------------------------------------------------------------
SENTRY_DSN = config('SENTRY_DSN', default='')
if SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    from sentry_sdk.integrations.celery import CeleryIntegration
    from sentry_sdk.integrations.logging import LoggingIntegration

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[
            DjangoIntegration(),
            CeleryIntegration(),
            LoggingIntegration(level=None, event_level=None),  # capture via handlers only
        ],
        traces_sample_rate=config('SENTRY_TRACES_SAMPLE_RATE', default=0.05, cast=float),
        send_default_pii=False,
        environment=config('SENTRY_ENV', default='development' if DEBUG else 'production'),
        release=config('SENTRY_RELEASE', default=''),
    )

# ---------------------------------------------------------------------------
# Web Push (VAPID)
# ---------------------------------------------------------------------------
# Generate a key pair with `manage.py generate_vapid_keys` then paste
# the three lines into backend/.env on the VPS.
# The private key is stored base64-encoded in the env var; we decode
# it here so pywebpush gets the original PEM.
_vapid_private_b64 = config('VAPID_PRIVATE_KEY', default='')
if _vapid_private_b64:
    import base64 as _b64
    try:
        _vapid_pem = _b64.b64decode(_vapid_private_b64).decode('ascii')
        # pywebpush's Vapid.from_string() expects the DER form, base64url-encoded
        # without padding — not PEM armor. Convert here so generate_vapid_keys'
        # PEM output (human-transportable) still works at runtime.
        from cryptography.hazmat.primitives import serialization as _ser
        _vapid_key = _ser.load_pem_private_key(_vapid_pem.encode(), password=None)
        _vapid_der = _vapid_key.private_bytes(
            encoding=_ser.Encoding.DER,
            format=_ser.PrivateFormat.PKCS8,
            encryption_algorithm=_ser.NoEncryption(),
        )
        VAPID_PRIVATE_KEY = _b64.urlsafe_b64encode(_vapid_der).rstrip(b'=').decode('ascii')
    except Exception:
        # Assume the value is already usable as-is (test fixtures, etc.)
        VAPID_PRIVATE_KEY = _vapid_private_b64
else:
    VAPID_PRIVATE_KEY = ''
VAPID_PUBLIC_KEY = config('VAPID_PUBLIC_KEY', default='')
VAPID_EMAIL = config('VAPID_EMAIL', default='contact@ltltv.com')

# ---------------------------------------------------------------------------
# Unfold admin theme
# ---------------------------------------------------------------------------
from django.templatetags.static import static  # noqa: E402
from django.urls import reverse_lazy  # noqa: E402
from django.utils.translation import gettext_lazy as _  # noqa: E402

UNFOLD = {
    'SITE_TITLE': 'LTL TV — Administration',
    'SITE_HEADER': 'LTL·TV',
    'SITE_SUBHEADER': 'Administration éditoriale',
    'SITE_URL': '/',
    'SITE_SYMBOL': 'live_tv',
    'SITE_ICON': {
        'light': lambda request: static('logo-ltl-blue.svg'),
        'dark':  lambda request: static('logo-ltl-white.svg'),
    },
    'SITE_LOGO': {
        'light': lambda request: static('logo-ltl-blue.svg'),
        'dark':  lambda request: static('logo-ltl-white.svg'),
    },
    'SHOW_HISTORY': True,
    'SHOW_VIEW_ON_SITE': True,
    'SHOW_BACK_BUTTON': True,
    'BORDER_RADIUS': '8px',
    'COLORS': {
        'base': {
            '50':  '250 250 250',
            '100': '244 244 245',
            '200': '228 228 231',
            '300': '212 212 216',
            '400': '161 161 170',
            '500': '113 113 122',
            '600': '82 82 91',
            '700': '61 62 73',
            '800': '44 44 40',
            '900': '36 36 40',
            '950': '15 17 20',
        },
        'primary': {
            '50':  '238 240 255',
            '100': '216 221 255',
            '200': '176 186 255',
            '300': '132 146 255',
            '400': '92 110 245',
            '500': '61 83 234',
            '600': '45 64 208',
            '700': '33 40 112',
            '800': '27 32 88',
            '900': '20 22 64',
            '950': '15 16 45',
        },
        'font': {
            'subtle-light': '113 113 122',
            'subtle-dark': '156 163 175',
            'default-light': '44 44 44',
            'default-dark': '244 244 245',
            'important-light': '33 40 112',
            'important-dark': '255 255 255',
        },
    },
    'EXTENSIONS': {
        'modeltranslation': {'flags': {}},
    },
    'DASHBOARD_CALLBACK': 'apps.dashboard.callbacks.dashboard_callback',
    'SIDEBAR': {
        'show_search': True,
        'show_all_applications': False,
        'navigation': [
            {
                'title': _('Vue d\'ensemble'),
                'separator': True,
                'items': [
                    {'title': _('Tableau de bord'), 'icon': 'dashboard',
                     'link': reverse_lazy('admin:index')},
                    {'title': _('Utilisateurs'), 'icon': 'group',
                     'link': reverse_lazy('admin:accounts_user_changelist'),
                     'permission': lambda r: r.user.has_perm('accounts.view_user')},
                ],
            },
            {
                'title': _('Contenu'),
                'separator': True,
                'items': [
                    {'title': _('Émissions'), 'icon': 'live_tv',
                     'link': reverse_lazy('admin:emissions_show_changelist'),
                     'permission': lambda r: r.user.has_perm('emissions.view_show')},
                    {'title': _('Séries d\'enseignement'), 'icon': 'video_stable',
                     'link': reverse_lazy('admin:emissions_series_changelist'),
                     'permission': lambda r: r.user.has_perm('emissions.view_series')},
                    {'title': _('Épisodes'), 'icon': 'video_library',
                     'link': reverse_lazy('admin:emissions_episode_changelist'),
                     'permission': lambda r: r.user.has_perm('emissions.view_episode')},
                    {'title': _('Catégories émissions'), 'icon': 'category',
                     'link': reverse_lazy('admin:emissions_category_changelist'),
                     'permission': lambda r: r.user.has_perm('emissions.view_category')},
                    {'title': _('Articles'), 'icon': 'article',
                     'link': reverse_lazy('admin:articles_article_changelist'),
                     'permission': lambda r: r.user.has_perm('articles.view_article')},
                    {'title': _('Catégories articles'), 'icon': 'bookmark',
                     'link': reverse_lazy('admin:articles_category_changelist'),
                     'permission': lambda r: r.user.has_perm('articles.view_category')},
                ],
            },
            {
                'title': _('Diffusion'),
                'separator': True,
                'items': [
                    {'title': _('Programmes hebdo'), 'icon': 'calendar_month',
                     'link': reverse_lazy('admin:programmes_weeklyprogram_changelist'),
                     'permission': lambda r: r.user.has_perm('programmes.view_weeklyprogram')},
                    {'title': _('Types de programme'), 'icon': 'label',
                     'link': reverse_lazy('admin:programmes_programtype_changelist'),
                     'permission': lambda r: r.user.has_perm('programmes.view_programtype')},
                    {'title': _('Bannières carousel'), 'icon': 'view_carousel',
                     'link': reverse_lazy('admin:banners_banner_changelist'),
                     'permission': lambda r: r.user.has_perm('banners.view_banner')},
                ],
            },
            {
                'title': _('Modération'),
                'separator': True,
                'items': [
                    {'title': _('Témoignages'), 'icon': 'reviews',
                     'link': reverse_lazy('admin:temoignages_testimonial_changelist'),
                     'permission': lambda r: r.user.has_perm('temoignages.view_testimonial')},
                    {'title': _('Messages de contact'), 'icon': 'mail',
                     'link': reverse_lazy('admin:contacts_contactmessage_changelist'),
                     'permission': lambda r: r.user.has_perm('contacts.view_contactmessage')},
                    {'title': _('Réponses aux contacts'), 'icon': 'reply',
                     'link': reverse_lazy('admin:contacts_contactreply_changelist'),
                     'permission': lambda r: r.user.has_perm('contacts.view_contactreply')},
                ],
            },
            {
                'title': _('Notifications push'),
                'separator': True,
                'items': [
                    {'title': _('Campagnes'), 'icon': 'campaign',
                     'link': reverse_lazy('admin:notifications_pushcampaign_changelist'),
                     'permission': lambda r: r.user.has_perm('notifications.view_pushcampaign')},
                    {'title': _('Abonnés'), 'icon': 'notifications_active',
                     'link': reverse_lazy('admin:notifications_pushsubscription_changelist'),
                     'permission': lambda r: r.user.has_perm('notifications.view_pushsubscription')},
                ],
            },
            {
                'title': _('À propos'),
                'separator': True,
                'items': [
                    {'title': _('Page « À propos »'), 'icon': 'info',
                     'link': reverse_lazy('admin:about_aboutpage_changelist'),
                     'permission': lambda r: r.user.has_perm('about.view_aboutpage')},
                    {'title': _('Valeurs'), 'icon': 'diversity_3',
                     'link': reverse_lazy('admin:about_corevalue_changelist'),
                     'permission': lambda r: r.user.has_perm('about.view_corevalue')},
                    {'title': _('Équipe'), 'icon': 'groups',
                     'link': reverse_lazy('admin:about_teammember_changelist'),
                     'permission': lambda r: r.user.has_perm('about.view_teammember')},
                ],
            },
        ],
    },
}

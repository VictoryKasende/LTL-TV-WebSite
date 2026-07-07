"""Auto-create push campaigns on publish.

When an ``Article``, ``Episode`` or ``WeeklyProgram`` is saved with
``status=published`` AND ``is_featured=True``, we create a matching
``PushCampaign`` (idempotently via ``trigger_ref``) and dispatch it.

Editors keep control: unfeatured content never triggers a push.
"""
from __future__ import annotations

import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)


def _origin(instance) -> str:
    return f'{instance._meta.model_name}:{instance.pk}'


def _ensure_campaign_and_dispatch(*, title: str, body: str, url: str,
                                   image: str, trigger_type: str, trigger_ref: str) -> None:
    """Idempotently create a PushCampaign and dispatch it via Celery."""
    from .models import PushCampaign
    from .tasks import send_campaign

    if PushCampaign.objects.filter(trigger_ref=trigger_ref).exists():
        return  # already sent

    campaign = PushCampaign.objects.create(
        title=title[:100],
        body=body[:280],
        url=url,
        image=image,
        trigger_type=trigger_type,
        trigger_ref=trigger_ref,
    )
    try:
        send_campaign.delay(campaign.pk)
    except Exception:
        # Celery unreachable in dev — log but don't blow up the save().
        logger.exception('Could not enqueue push campaign %s', campaign.pk)


def _cover_url(cover) -> str:
    """Return the absolute URL of a Cloudinary or filesystem ImageField, or ''."""
    if not cover:
        return ''
    try:
        return cover.url
    except Exception:
        return ''


# --- Article -------------------------------------------------------
@receiver(post_save, sender='articles.Article')
def _push_on_article_published(sender, instance, created, **kwargs):
    if instance.status != 'published' or not instance.is_featured:
        return
    _ensure_campaign_and_dispatch(
        title=instance.title,
        body=(instance.excerpt or instance.subtitle or 'Nouvel article à découvrir.'),
        url=f'/articles/{instance.slug}',
        image=_cover_url(instance.cover),
        trigger_type='article',
        trigger_ref=_origin(instance),
    )


# --- Emissions.Episode ---------------------------------------------
@receiver(post_save, sender='emissions.Episode')
def _push_on_episode_published(sender, instance, created, **kwargs):
    if instance.status != 'published' or not instance.is_featured:
        return
    _ensure_campaign_and_dispatch(
        title=instance.title,
        body=(instance.excerpt or instance.subtitle or 'Nouvel épisode disponible.'),
        url=f'/programmes/{instance.show.slug}',
        image=_cover_url(instance.cover) or instance.thumbnail_url,
        trigger_type='episode',
        trigger_ref=_origin(instance),
    )


# --- Programmes.WeeklyProgram --------------------------------------
@receiver(post_save, sender='programmes.WeeklyProgram')
def _push_on_program_published(sender, instance, created, **kwargs):
    if instance.status != 'published' or not instance.is_featured:
        return
    when = f'{instance.date:%d/%m}'
    body = f'{when} · {instance.start_time:%H:%M}'
    if instance.location:
        body += f' · {instance.location}'
    _ensure_campaign_and_dispatch(
        title=instance.title,
        body=body,
        url=f'/programmes/{instance.slug}',
        image=_cover_url(instance.image),
        trigger_type='programme',
        trigger_ref=_origin(instance),
    )

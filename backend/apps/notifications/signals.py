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
from django.utils import timezone

logger = logging.getLogger(__name__)


def _origin(instance) -> str:
    return f'{instance._meta.model_name}:{instance.pk}'


def _ensure_campaign_and_dispatch(*, title: str, body: str, url: str, image: str,
                                   trigger_type: str, trigger_ref: str,
                                   publish_at=None) -> None:
    """Idempotently create a PushCampaign and dispatch it via Celery.

    Content scheduled for later (``publish_at`` in the future) isn't
    online yet — a click would 404 — so the push is queued for that
    moment instead. If the date moves before then, the queued push
    follows it (``send_campaign`` checks ``scheduled_at``)."""
    from .models import PushCampaign
    from .tasks import send_campaign

    scheduled_at = publish_at if publish_at and publish_at > timezone.now() else None
    campaign = PushCampaign.objects.filter(trigger_ref=trigger_ref).first()
    if campaign:
        if campaign.status != PushCampaign.Status.SCHEDULED or campaign.scheduled_at == scheduled_at:
            return  # already sent / queued for the right time
        campaign.scheduled_at = scheduled_at
        campaign.save(update_fields=['scheduled_at'])
    else:
        campaign = PushCampaign.objects.create(
            title=title[:100],
            body=body[:280],
            url=url,
            image=image,
            trigger_type=trigger_type,
            trigger_ref=trigger_ref,
            status=PushCampaign.Status.SCHEDULED if scheduled_at else PushCampaign.Status.DRAFT,
            scheduled_at=scheduled_at,
        )
    try:
        send_campaign.apply_async((campaign.pk,), eta=scheduled_at)
    except Exception:
        # Celery unreachable in dev — log but don't blow up the save().
        logger.exception('Could not enqueue push campaign %s', campaign.pk)


def episode_url(episode) -> str:
    """Same deep link the site uses everywhere to play an episode."""
    return f'/emissions/{episode.show.slug}?episode={episode.slug}&play=1'


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
        publish_at=instance.published_at,
    )


# --- Emissions.Episode ---------------------------------------------
@receiver(post_save, sender='emissions.Episode')
def _push_on_episode_published(sender, instance, created, **kwargs):
    if instance.status != 'published' or not instance.is_featured:
        return
    _ensure_campaign_and_dispatch(
        title=instance.title,
        body=(instance.excerpt or instance.subtitle or 'Nouvel épisode disponible.'),
        url=episode_url(instance),
        image=_cover_url(instance.cover) or instance.thumbnail_url,
        trigger_type='episode',
        trigger_ref=_origin(instance),
        publish_at=instance.published_at,
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
    # A programme airing an episode opens that episode, like the TV grid does.
    episode = instance.episode
    _ensure_campaign_and_dispatch(
        title=instance.title,
        body=body,
        url=episode_url(episode) if episode and episode.status == 'published'
            else f'/programmes/{instance.slug}',
        image=_cover_url(instance.image),
        trigger_type='programme',
        trigger_ref=_origin(instance),
        publish_at=instance.published_at,
    )

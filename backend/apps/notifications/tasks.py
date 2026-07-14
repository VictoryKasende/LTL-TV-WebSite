"""Celery tasks for Web Push delivery.

- ``send_push_to_subscription`` is atomic per subscription. On 410/404
  the endpoint is marked dead. On 5xx it retries with exponential backoff.
- ``send_campaign`` fans out ``send_push_to_subscription`` for every
  eligible subscriber.
"""
from __future__ import annotations

import json
import logging

from celery import shared_task
from django.conf import settings
from django.db.models import F
from django.utils import timezone
from pywebpush import WebPushException, webpush

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={'max_retries': 3},
    retry_backoff=True,
    retry_jitter=True,
)
def send_push_to_subscription(self, subscription_id: int, payload: dict,
                              campaign_id: int | None = None) -> str:
    """Send one push. Returns a short status string for logging."""
    from .models import PushCampaign, PushSubscription

    try:
        sub = PushSubscription.objects.get(pk=subscription_id, is_active=True)
    except PushSubscription.DoesNotExist:
        return 'skipped:inactive-or-missing'

    if not settings.VAPID_PRIVATE_KEY:
        logger.error('VAPID_PRIVATE_KEY not configured — cannot send push')
        return 'skipped:no-vapid-key'

    try:
        webpush(
            subscription_info=sub.to_web_push_dict(),
            data=json.dumps(payload),
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={'sub': f'mailto:{settings.VAPID_EMAIL}'},
            # pywebpush defaults to ttl=0, which WNS (Windows/Edge push) rejects
            # with "Ttl value conflicts with X-WNS-Cache-Policy" — give it a real TTL.
            ttl=60 * 60 * 4,
            timeout=10,
        )
    except WebPushException as e:
        status_code = e.response.status_code if e.response is not None else 0
        if status_code in (404, 410):
            # Endpoint permanently gone (user revoked, browser cleared).
            sub.mark_dead(status_code)
            if campaign_id:
                PushCampaign.objects.filter(pk=campaign_id).update(
                    failed_count=F('failed_count') + 1,
                )
            return f'dead:{status_code}'
        if status_code >= 500:
            # Push service transient error — let autoretry handle it.
            sub.note_failure(status_code)
            raise
        # 400 / 401 / 403 — bad payload / auth — don't retry, don't kill sub.
        logger.warning('Push refused for sub %s: %s', sub.pk, status_code)
        sub.note_failure(status_code)
        if campaign_id:
            PushCampaign.objects.filter(pk=campaign_id).update(
                failed_count=F('failed_count') + 1,
            )
        return f'refused:{status_code}'
    else:
        sub.last_seen_at = timezone.now()
        sub.save(update_fields=['last_seen_at'])
        if campaign_id:
            PushCampaign.objects.filter(pk=campaign_id).update(
                delivered_count=F('delivered_count') + 1,
            )
        return 'delivered'


@shared_task
def send_campaign(campaign_id: int) -> str:
    """Dispatch a campaign to every eligible subscriber."""
    from .models import PushCampaign

    try:
        campaign = PushCampaign.objects.get(pk=campaign_id)
    except PushCampaign.DoesNotExist:
        return 'missing'

    campaign.status = PushCampaign.Status.SENDING
    campaign.save(update_fields=['status'])

    payload = campaign.to_payload()
    subs = campaign.get_target_subscriptions()
    target_ids = list(subs.values_list('pk', flat=True))
    campaign.target_count = len(target_ids)

    for sub_id in target_ids:
        send_push_to_subscription.delay(sub_id, payload, campaign.pk)

    campaign.status = PushCampaign.Status.SENT
    campaign.sent_at = timezone.now()
    campaign.save(update_fields=['status', 'sent_at', 'target_count'])
    return f'dispatched:{len(target_ids)}'

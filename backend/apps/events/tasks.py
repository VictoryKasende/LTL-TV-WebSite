"""Celery tasks for the events module.

- ``send_event_registration_email`` sends the welcome email right after a
  visitor registers, off the request/response cycle.
"""
from __future__ import annotations

import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import translation
from django.utils.formats import date_format, time_format

logger = logging.getLogger(__name__)


def _format_event_dates(event) -> str:
    """Human-readable French date/time range, e.g. « le 12 août 2026 à 20h45 »
    or « du 12 au 16 août 2026 »."""
    with translation.override(settings.LANGUAGE_CODE):
        if event.end_date and event.end_date != event.start_date:
            text = (
                f"du {date_format(event.start_date, 'j F')} "
                f"au {date_format(event.end_date, 'j F Y')}"
            )
        else:
            text = f"le {date_format(event.start_date, 'j F Y')}"
        if event.daily_time:
            text += f" à {time_format(event.daily_time, 'H:i')}"
    return text


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={'max_retries': 3},
    retry_backoff=True,
    retry_jitter=True,
)
def send_event_registration_email(self, registration_id: int) -> str:
    """Send the welcome email for one ``EventRegistration``."""
    from .models import EventRegistration

    try:
        registration = EventRegistration.objects.select_related('event').get(pk=registration_id)
    except EventRegistration.DoesNotExist:
        return 'skipped:missing'

    if not settings.EMAIL_HOST_PASSWORD and settings.EMAIL_BACKEND.endswith('smtp.EmailBackend'):
        logger.error('EMAIL_HOST_PASSWORD not configured — cannot send registration email')
        return 'skipped:no-smtp-credentials'

    event = registration.event
    context = {
        'first_name': registration.first_name,
        'event_title': event.title,
        'event_subtitle': event.subtitle,
        'event_dates': _format_event_dates(event),
        'event_url': f'{settings.FRONTEND_URL.rstrip("/")}/evenements/{event.slug}',
        'site_url': settings.FRONTEND_URL,
    }

    subject = f'Inscription confirmée — {event.title}'
    text_body = render_to_string('emails/event_registration_welcome.txt', context)
    html_body = render_to_string('emails/event_registration_welcome.html', context)

    message = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[registration.email],
    )
    message.attach_alternative(html_body, 'text/html')
    message.send(fail_silently=False)
    return 'sent'

"""Tests for the notifications module.

Tasks run synchronously (CELERY_TASK_ALWAYS_EAGER) via the ``@override_settings``
decorator on the test class. Actual push sending is mocked so tests don't
need a running push service.
"""
from unittest.mock import MagicMock, patch

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.common.permissions import GROUP_ADMIN, GROUP_EDITOR

from .models import PushCampaign, PushSubscription

User = get_user_model()


VALID_SUB_PAYLOAD = {
    'endpoint': 'https://fcm.googleapis.com/fcm/send/AAAA-test-endpoint',
    'keys': {
        'p256dh': 'BAcW-x-p256dh-fake-key-value',
        'auth': 'auth-secret-fake',
    },
}


@override_settings(
    CELERY_TASK_ALWAYS_EAGER=True,
    CELERY_TASK_EAGER_PROPAGATES=True,
    VAPID_PUBLIC_KEY='fake-public-key',
    VAPID_PRIVATE_KEY='fake-private-key',
    VAPID_EMAIL='test@ltltv.com',
)
class PushSubscribeApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_subscribe_creates_row(self):
        r = self.client.post('/api/v1/notifications/subscribe/',
                             VALID_SUB_PAYLOAD, format='json')
        self.assertEqual(r.status_code, 201, r.content)
        self.assertTrue(r.json()['created'])
        sub = PushSubscription.objects.get()
        self.assertTrue(sub.is_active)
        self.assertEqual(sub.endpoint, VALID_SUB_PAYLOAD['endpoint'])

    def test_subscribe_is_idempotent(self):
        self.client.post('/api/v1/notifications/subscribe/',
                          VALID_SUB_PAYLOAD, format='json')
        r = self.client.post('/api/v1/notifications/subscribe/',
                             VALID_SUB_PAYLOAD, format='json')
        self.assertEqual(r.status_code, 200)
        self.assertFalse(r.json()['created'])
        self.assertEqual(PushSubscription.objects.count(), 1)

    def test_subscribe_missing_keys_returns_400(self):
        bad = {'endpoint': 'https://x.com/', 'keys': {'p256dh': 'x'}}  # no auth
        r = self.client.post('/api/v1/notifications/subscribe/', bad, format='json')
        self.assertEqual(r.status_code, 400)

    def test_unsubscribe(self):
        self.client.post('/api/v1/notifications/subscribe/',
                          VALID_SUB_PAYLOAD, format='json')
        r = self.client.post('/api/v1/notifications/unsubscribe/',
                             {'endpoint': VALID_SUB_PAYLOAD['endpoint']}, format='json')
        self.assertEqual(r.status_code, 200)
        sub = PushSubscription.objects.get()
        self.assertFalse(sub.is_active)

    def test_vapid_public_key_endpoint(self):
        r = self.client.get('/api/v1/notifications/vapid-public-key/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()['public_key'], 'fake-public-key')


@override_settings(
    CELERY_TASK_ALWAYS_EAGER=True,
    CELERY_TASK_EAGER_PROPAGATES=True,
    VAPID_PUBLIC_KEY='k',
    VAPID_PRIVATE_KEY='p',
    VAPID_EMAIL='t@t.com',
)
class PushCampaignAdminTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.editor = User.objects.create_user(
            username='ed', email='ed@x.com', password='StrongPass123', is_staff=True,
        )
        self.editor.groups.add(Group.objects.create(name=GROUP_EDITOR))

    def test_anon_cannot_create_campaign(self):
        r = self.client.post('/api/v1/notifications/campaigns/', {
            'title': 'X', 'body': 'y',
        }, format='json')
        self.assertIn(r.status_code, (401, 403))

    def test_editor_creates_campaign(self):
        self.client.force_authenticate(self.editor)
        r = self.client.post('/api/v1/notifications/campaigns/', {
            'title': 'Nouvelle émission ce soir',
            'body': 'Rendez-vous à 20h00 pour Prends Courage.',
            'url': '/programmes/prends-courage',
        }, format='json')
        self.assertEqual(r.status_code, 201, r.content)
        c = PushCampaign.objects.get()
        self.assertEqual(c.status, PushCampaign.Status.DRAFT)
        self.assertEqual(c.created_by, self.editor)

    @patch('apps.notifications.tasks.webpush')
    def test_send_action_dispatches(self, mock_webpush):
        # Create a subscription so send actually iterates
        PushSubscription.objects.create(
            endpoint='https://fcm.googleapis.com/fcm/send/ABC',
            p256dh_key='p', auth_key='a',
        )
        campaign = PushCampaign.objects.create(title='T', body='b')
        self.client.force_authenticate(self.editor)

        r = self.client.post(f'/api/v1/notifications/campaigns/{campaign.pk}/send/')
        self.assertEqual(r.status_code, 200)
        campaign.refresh_from_db()
        self.assertEqual(campaign.status, PushCampaign.Status.SENT)
        self.assertEqual(campaign.target_count, 1)
        self.assertEqual(campaign.delivered_count, 1)
        mock_webpush.assert_called_once()


@override_settings(
    CELERY_TASK_ALWAYS_EAGER=True,
    CELERY_TASK_EAGER_PROPAGATES=True,
    VAPID_PUBLIC_KEY='k',
    VAPID_PRIVATE_KEY='p',
    VAPID_EMAIL='t@t.com',
)
class PushDeliveryTests(TestCase):
    """Verify the individual send_push_to_subscription task behavior."""

    def setUp(self):
        self.sub = PushSubscription.objects.create(
            endpoint='https://fcm.googleapis.com/fcm/send/XYZ',
            p256dh_key='p', auth_key='a',
        )
        self.campaign = PushCampaign.objects.create(title='T', body='b')

    @patch('apps.notifications.tasks.webpush')
    def test_delivered_updates_stats(self, mock_webpush):
        from .tasks import send_push_to_subscription
        result = send_push_to_subscription(self.sub.pk, {'x': 1}, self.campaign.pk)
        self.assertEqual(result, 'delivered')
        self.campaign.refresh_from_db()
        self.assertEqual(self.campaign.delivered_count, 1)
        self.sub.refresh_from_db()
        self.assertTrue(self.sub.is_active)

    @patch('apps.notifications.tasks.webpush')
    def test_410_marks_dead(self, mock_webpush):
        from pywebpush import WebPushException
        response = MagicMock()
        response.status_code = 410
        mock_webpush.side_effect = WebPushException('gone', response=response)

        from .tasks import send_push_to_subscription
        result = send_push_to_subscription(self.sub.pk, {'x': 1}, self.campaign.pk)
        self.assertEqual(result, 'dead:410')
        self.sub.refresh_from_db()
        self.assertFalse(self.sub.is_active)
        self.campaign.refresh_from_db()
        self.assertEqual(self.campaign.failed_count, 1)


class PublishSignalTests(TestCase):
    """When Article/Episode/WeeklyProgram is published+featured, a campaign
    should be created idempotently."""

    def test_article_published_featured_triggers_campaign(self):
        from django.utils import timezone
        from apps.articles.models import Article
        Article.objects.create(
            title='Big news', content_md='hello',
            status=Article.Status.PUBLISHED,
            is_featured=True,
            published_at=timezone.now(),
        )
        campaigns = PushCampaign.objects.filter(trigger_type='article')
        self.assertEqual(campaigns.count(), 1)
        self.assertTrue(campaigns.first().trigger_ref.startswith('article:'))

    def test_article_not_featured_does_not_trigger(self):
        from django.utils import timezone
        from apps.articles.models import Article
        Article.objects.create(
            title='Silent', content_md='x',
            status=Article.Status.PUBLISHED,
            is_featured=False,
            published_at=timezone.now(),
        )
        self.assertEqual(PushCampaign.objects.count(), 0)

    def test_second_save_is_idempotent(self):
        from django.utils import timezone
        from apps.articles.models import Article
        a = Article.objects.create(
            title='Once', content_md='x',
            status=Article.Status.PUBLISHED, is_featured=True,
            published_at=timezone.now(),
        )
        a.title = 'Once (edited)'
        a.save()
        self.assertEqual(PushCampaign.objects.count(), 1)


class PushLinkTests(TestCase):
    """A notification must open the content it announces, never a 404."""

    def setUp(self):
        from apps.emissions.models import Episode, Show
        self.show = Show.objects.create(title='Prends Courage test', status=Show.Status.PUBLISHED)
        self.episode = Episode.objects.create(
            show=self.show, title='Épisode notif',
            youtube_url='https://youtu.be/dQw4w9WgXcQ',
            status=Episode.Status.PUBLISHED, is_featured=True,
        )

    def _campaign(self, trigger_type):
        return PushCampaign.objects.get(trigger_type=trigger_type)

    def test_episode_opens_on_its_show_page(self):
        self.assertEqual(
            self._campaign('episode').url,
            f'/emissions/{self.show.slug}?episode={self.episode.slug}&play=1',
        )

    def test_programme_airing_an_episode_opens_the_episode(self):
        from datetime import time
        from django.utils import timezone
        from apps.programmes.models import WeeklyProgram
        WeeklyProgram.objects.create(
            title='Diffusion', date=timezone.localdate(), start_time=time(20, 0),
            episode=self.episode, status=WeeklyProgram.Status.PUBLISHED, is_featured=True,
        )
        self.assertEqual(self._campaign('programme').url, self._campaign('episode').url)

    def test_programme_without_episode_opens_its_page(self):
        from datetime import time
        from django.utils import timezone
        from apps.programmes.models import WeeklyProgram
        wp = WeeklyProgram.objects.create(
            title='Culte', date=timezone.localdate(), start_time=time(10, 0),
            status=WeeklyProgram.Status.PUBLISHED, is_featured=True,
        )
        self.assertEqual(self._campaign('programme').url, f'/programmes/{wp.slug}')


class ScheduledPushTests(TestCase):
    """Content published for later is announced when it goes online."""

    def _article(self, when):
        from apps.articles.models import Article
        return Article.objects.create(
            title='Plus tard', content_md='x',
            status=Article.Status.PUBLISHED, is_featured=True, published_at=when,
        )

    @patch('apps.notifications.tasks.send_campaign.apply_async')
    def test_future_article_is_queued_for_its_publication_date(self, apply_async):
        from datetime import timedelta
        from django.utils import timezone
        when = timezone.now() + timedelta(days=2)
        self._article(when)
        campaign = PushCampaign.objects.get()
        self.assertEqual(campaign.status, PushCampaign.Status.SCHEDULED)
        self.assertEqual(campaign.scheduled_at, when)
        self.assertEqual(apply_async.call_args.kwargs['eta'], when)

    @patch('apps.notifications.tasks.send_campaign.apply_async')
    def test_rescheduling_moves_the_push(self, apply_async):
        from datetime import timedelta
        from django.utils import timezone
        article = self._article(timezone.now() + timedelta(days=2))
        later = timezone.now() + timedelta(days=5)
        article.published_at = later
        article.save()
        self.assertEqual(PushCampaign.objects.get().scheduled_at, later)
        self.assertEqual(apply_async.call_args.kwargs['eta'], later)

    def test_send_skips_early_and_repeated_runs(self):
        from datetime import timedelta
        from django.utils import timezone
        from .tasks import send_campaign
        early = PushCampaign.objects.create(
            title='t', body='b', status=PushCampaign.Status.SCHEDULED,
            scheduled_at=timezone.now() + timedelta(hours=1),
        )
        self.assertEqual(send_campaign(early.pk), 'not-yet')
        done = PushCampaign.objects.create(title='t', body='b', status=PushCampaign.Status.SENT)
        self.assertEqual(send_campaign(done.pk), 'already-sent')

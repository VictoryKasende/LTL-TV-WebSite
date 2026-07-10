"""Tests for the emissions domain.

Note: a data migration seeds 3 shows (prends-courage,
dans-les-profondeurs, rafraichissement). Tests use disjoint titles
to avoid slug collisions.
"""
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.exceptions import ValidationError
from django.test import TestCase
from rest_framework.test import APIClient

from apps.common.permissions import GROUP_EDITOR

from .models import Category, Episode, Series, Show
from .youtube import extract_youtube_id, youtube_embed_url, youtube_thumbnail_url

User = get_user_model()

VALID_ID = 'dQw4w9WgXcQ'


class YouTubeParserTests(TestCase):
    def test_watch_url(self):
        self.assertEqual(extract_youtube_id(f'https://www.youtube.com/watch?v={VALID_ID}'), VALID_ID)

    def test_youtu_be_with_query(self):
        self.assertEqual(extract_youtube_id(f'https://youtu.be/{VALID_ID}?t=15'), VALID_ID)

    def test_embed(self):
        self.assertEqual(extract_youtube_id(f'https://www.youtube.com/embed/{VALID_ID}'), VALID_ID)

    def test_shorts(self):
        self.assertEqual(extract_youtube_id(f'https://youtube.com/shorts/{VALID_ID}'), VALID_ID)

    def test_live(self):
        self.assertEqual(extract_youtube_id(f'https://www.youtube.com/live/{VALID_ID}'), VALID_ID)

    def test_m_youtube(self):
        self.assertEqual(extract_youtube_id(f'https://m.youtube.com/watch?v={VALID_ID}'), VALID_ID)

    def test_invalid(self):
        self.assertIsNone(extract_youtube_id('https://example.com/watch?v=xyz'))
        self.assertIsNone(extract_youtube_id(''))
        self.assertIsNone(extract_youtube_id(None))
        self.assertIsNone(extract_youtube_id('not a url'))
        self.assertIsNone(extract_youtube_id('https://youtu.be/short'))

    def test_thumbnail_url(self):
        self.assertEqual(
            youtube_thumbnail_url(VALID_ID),
            f'https://img.youtube.com/vi/{VALID_ID}/maxresdefault.jpg',
        )
        self.assertEqual(youtube_thumbnail_url(''), '')

    def test_embed_url(self):
        self.assertEqual(
            youtube_embed_url(VALID_ID),
            f'https://www.youtube.com/embed/{VALID_ID}',
        )


class ShowEpisodeModelTests(TestCase):
    def setUp(self):
        self.show = Show.objects.create(
            title='Test Show One', status=Show.Status.PUBLISHED,
        )

    def test_slug_auto(self):
        self.assertEqual(self.show.slug, 'test-show-one')

    def test_slug_unicode(self):
        s = Show.objects.create(title='Émission spéciale Été')
        self.assertEqual(s.slug, 'emission-speciale-ete')

    def test_slug_uniqueness_conflict(self):
        s = Show.objects.create(title='Test Show One')
        self.assertNotEqual(s.slug, self.show.slug)
        self.assertTrue(s.slug.startswith('test-show-one-'))

    def test_seed_shows_present(self):
        """The data migration should have created these three."""
        seeded = set(Show.objects.filter(
            slug__in=['prends-courage', 'dans-les-profondeurs', 'rafraichissement']
        ).values_list('slug', flat=True))
        self.assertEqual(seeded, {'prends-courage', 'dans-les-profondeurs', 'rafraichissement'})

    def test_published_manager_hides_drafts(self):
        Show.objects.create(title='Test Draft Show')
        published_slugs = set(Show.objects.published().values_list('slug', flat=True))
        self.assertIn('test-show-one', published_slugs)
        self.assertNotIn('test-draft-show', published_slugs)

    def test_episode_extracts_youtube_id_on_save(self):
        ep = Episode.objects.create(
            show=self.show, title='Épisode 1',
            youtube_url=f'https://youtu.be/{VALID_ID}',
        )
        self.assertEqual(ep.youtube_id, VALID_ID)
        self.assertEqual(ep.embed_url, f'https://www.youtube.com/embed/{VALID_ID}')
        self.assertIn('img.youtube.com', ep.thumbnail_url)

    def test_episode_view_count_atomic(self):
        ep = Episode.objects.create(
            show=self.show, title='View Count Test',
            youtube_url=f'https://youtu.be/{VALID_ID}',
        )
        ep.increment_views()
        ep.increment_views(by=3)
        ep.refresh_from_db()
        self.assertEqual(ep.view_count, 4)


class EmissionsApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.show_pub = Show.objects.create(
            title='Test API Published Show', status=Show.Status.PUBLISHED,
        )
        self.show_draft = Show.objects.create(title='Test API Secret Draft')
        self.ep = Episode.objects.create(
            show=self.show_pub, title='Test Episode One',
            youtube_url=f'https://youtu.be/{VALID_ID}',
            status=Episode.Status.PUBLISHED,
        )
        Category.objects.create(name='Enseignement')

    def test_anon_sees_published_but_not_drafts(self):
        r = self.client.get('/api/v1/emissions/shows/')
        self.assertEqual(r.status_code, 200)
        slugs = [s['slug'] for s in r.json()['results']]
        self.assertIn(self.show_pub.slug, slugs)
        self.assertNotIn(self.show_draft.slug, slugs)

    def test_anon_cannot_create_show(self):
        r = self.client.post('/api/v1/emissions/shows/', {'title': 'X'}, format='json')
        self.assertIn(r.status_code, (401, 403))

    def test_editor_can_create_show(self):
        editor = User.objects.create_user(
            username='ed', email='ed@x.com', password='StrongPass123',
            is_staff=True,
        )
        editor.groups.add(Group.objects.create(name=GROUP_EDITOR))
        self.client.force_authenticate(editor)
        r = self.client.post(
            '/api/v1/emissions/shows/',
            {'title': 'Nouveau Show CI'}, format='json',
        )
        self.assertEqual(r.status_code, 201, r.content)

    def test_episode_view_endpoint_increments(self):
        r = self.client.post(f'/api/v1/emissions/episodes/{self.ep.slug}/view/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()['view_count'], 1)

    def test_show_episodes_subroute(self):
        r = self.client.get(f'/api/v1/emissions/shows/{self.show_pub.slug}/episodes/')
        self.assertEqual(r.status_code, 200)
        body = r.json()
        results = body['results'] if 'results' in body else body
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['slug'], self.ep.slug)


class SeriesModelTests(TestCase):
    def setUp(self):
        self.show = Show.objects.create(title='Series Host Show', status=Show.Status.PUBLISHED)
        self.other_show = Show.objects.create(title='Other Series Show')

    def test_slug_auto(self):
        s = Series.objects.create(show=self.show, title='La foi qui déplace les montagnes')
        self.assertEqual(s.slug, 'la-foi-qui-deplace-les-montagnes')

    def test_episode_count(self):
        s = Series.objects.create(show=self.show, title='Série Compteur')
        self.assertEqual(s.episode_count, 0)
        Episode.objects.create(
            show=self.show, series=s, title='Ep 1',
            youtube_url=f'https://youtu.be/{VALID_ID}',
        )
        Episode.objects.create(
            show=self.show, series=s, title='Ep 2',
            youtube_url=f'https://youtu.be/{VALID_ID}',
        )
        self.assertEqual(s.episode_count, 2)

    def test_episode_series_from_other_show_is_invalid(self):
        s = Series.objects.create(show=self.other_show, title='Série Étrangère')
        ep = Episode(
            show=self.show, series=s, title='Ep Cross Show',
            youtube_url=f'https://youtu.be/{VALID_ID}',
        )
        with self.assertRaises(ValidationError):
            ep.full_clean()

    def test_episode_series_nullable(self):
        ep = Episode.objects.create(
            show=self.show, title='Standalone Ep',
            youtube_url=f'https://youtu.be/{VALID_ID}',
        )
        self.assertIsNone(ep.series)


class SeriesApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.show = Show.objects.create(title='Series API Show', status=Show.Status.PUBLISHED)
        self.series = Series.objects.create(
            show=self.show, title='Série API', status=Series.Status.PUBLISHED,
        )
        self.draft_series = Series.objects.create(show=self.show, title='Série Brouillon')
        self.ep1 = Episode.objects.create(
            show=self.show, series=self.series, episode_number=1, title='Ep API 1',
            youtube_url=f'https://youtu.be/{VALID_ID}', status=Episode.Status.PUBLISHED,
        )
        self.ep2 = Episode.objects.create(
            show=self.show, series=self.series, episode_number=2, title='Ep API 2',
            youtube_url=f'https://youtu.be/{VALID_ID}', status=Episode.Status.PUBLISHED,
        )

    def test_anon_sees_only_published_series(self):
        r = self.client.get('/api/v1/emissions/series/')
        self.assertEqual(r.status_code, 200)
        slugs = [s['slug'] for s in r.json()['results']]
        self.assertIn(self.series.slug, slugs)
        self.assertNotIn(self.draft_series.slug, slugs)

    def test_show_detail_series_route_wraps_episodes(self):
        r = self.client.get(f'/api/v1/emissions/shows/{self.show.slug}/series/')
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertEqual(len(body), 1)
        self.assertEqual(body[0]['slug'], self.series.slug)
        ep_slugs = [e['slug'] for e in body[0]['episodes']]
        self.assertEqual(ep_slugs, [self.ep1.slug, self.ep2.slug])

    def test_anon_cannot_create_series(self):
        r = self.client.post('/api/v1/emissions/series/', {
            'show': self.show.pk, 'title': 'X',
        }, format='json')
        self.assertIn(r.status_code, (401, 403))

    def test_episode_filter_by_series(self):
        Episode.objects.create(
            show=self.show, title='No Series Ep',
            youtube_url=f'https://youtu.be/{VALID_ID}', status=Episode.Status.PUBLISHED,
        )
        r = self.client.get(f'/api/v1/emissions/episodes/?series={self.series.slug}')
        self.assertEqual(r.status_code, 200)
        results = r.json()['results']
        self.assertEqual(len(results), 2)

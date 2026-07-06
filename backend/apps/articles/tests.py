from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient

from apps.common.permissions import GROUP_EDITOR

from .models import Article, Category

User = get_user_model()


class ArticleModelTests(TestCase):
    def test_markdown_rendered_on_save(self):
        a = Article.objects.create(
            title='Test',
            content_md='# Hello\n\nSome **bold** text.',
        )
        self.assertIn('<h1', a.content_html)
        self.assertIn('<strong>bold</strong>', a.content_html)

    def test_reading_time_ceils_up(self):
        # ~201 words → 2 minutes
        text = 'lorem ' * 201
        a = Article.objects.create(title='R', content_md=text)
        self.assertEqual(a.reading_time_minutes, 2)

    def test_reading_time_min_one_minute(self):
        a = Article.objects.create(title='S', content_md='Short.')
        self.assertEqual(a.reading_time_minutes, 1)

    def test_excerpt_auto_generated(self):
        a = Article.objects.create(title='E', content_md='One two three ' * 30)
        self.assertTrue(a.excerpt)
        self.assertLessEqual(len(a.excerpt), 280)

    def test_excerpt_preserved_if_provided(self):
        a = Article.objects.create(
            title='E2', content_md='blah blah blah', excerpt='Custom summary.',
        )
        self.assertEqual(a.excerpt, 'Custom summary.')

    def test_slug_unicode(self):
        a = Article.objects.create(title='Émission spéciale', content_md='x')
        self.assertEqual(a.slug, 'emission-speciale')

    def test_increment_views_atomic(self):
        a = Article.objects.create(title='V', content_md='x')
        a.increment_views()
        a.increment_views(by=5)
        a.refresh_from_db()
        self.assertEqual(a.view_count, 6)


class ArticleRelatedTests(TestCase):
    def setUp(self):
        self.cat_spi = Category.objects.create(name='Spiritualité')
        self.cat_soc = Category.objects.create(name='Société')
        pub = timezone.now() - timedelta(days=1)
        self.base = Article.objects.create(
            title='Base article', content_md='x',
            category=self.cat_spi,
            status=Article.Status.PUBLISHED, published_at=pub,
        )
        self.base.tags.add('foi', 'prière')

    def test_related_by_shared_tags(self):
        pub = timezone.now() - timedelta(days=1)
        a1 = Article.objects.create(
            title='Same tags', content_md='x',
            status=Article.Status.PUBLISHED, published_at=pub,
        )
        a1.tags.add('foi', 'prière')
        a2 = Article.objects.create(
            title='One tag', content_md='x',
            status=Article.Status.PUBLISHED, published_at=pub,
        )
        a2.tags.add('foi')
        related = self.base.get_related(limit=3)
        # a1 first (2 shared tags), then a2
        self.assertEqual([r.pk for r in related], [a1.pk, a2.pk])

    def test_related_fallback_to_category(self):
        pub = timezone.now() - timedelta(days=1)
        same_cat = Article.objects.create(
            title='Same cat, no tags', content_md='x',
            category=self.cat_spi,
            status=Article.Status.PUBLISHED, published_at=pub,
        )
        other_cat = Article.objects.create(
            title='Other cat', content_md='x',
            category=self.cat_soc,
            status=Article.Status.PUBLISHED, published_at=pub,
        )
        # Base has tags — related first tries tags. With no tag matches,
        # fills with category matches.
        related = self.base.get_related(limit=3)
        self.assertIn(same_cat, related)
        self.assertNotIn(other_cat, related)

    def test_related_excludes_drafts(self):
        Article.objects.create(
            title='Draft same tag', content_md='x',
        ).tags.add('foi')
        related = self.base.get_related(limit=3)
        for a in related:
            self.assertEqual(a.status, Article.Status.PUBLISHED)


class ArticleApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.cat = Category.objects.create(name='Spiritualité')
        pub = timezone.now() - timedelta(days=1)
        self.published = Article.objects.create(
            title='Published article',
            content_md='# Title\n\nSome content here.',
            category=self.cat,
            status=Article.Status.PUBLISHED, published_at=pub,
        )
        self.draft = Article.objects.create(
            title='Draft article', content_md='x',
        )

    def test_anon_list_hides_drafts(self):
        r = self.client.get('/api/v1/articles/')
        self.assertEqual(r.status_code, 200)
        slugs = [a['slug'] for a in r.json()['results']]
        self.assertIn(self.published.slug, slugs)
        self.assertNotIn(self.draft.slug, slugs)

    def test_anon_detail_includes_html(self):
        r = self.client.get(f'/api/v1/articles/{self.published.slug}/')
        self.assertEqual(r.status_code, 200)
        self.assertIn('content_html', r.json())
        self.assertIn('<h1', r.json()['content_html'])

    def test_anon_cannot_create(self):
        r = self.client.post('/api/v1/articles/', {
            'title': 'X', 'content_md': 'x',
        }, format='json')
        self.assertIn(r.status_code, (401, 403))

    def test_editor_can_create(self):
        editor = User.objects.create_user(
            username='ed', email='ed@x.com', password='StrongPass123', is_staff=True,
        )
        editor.groups.add(Group.objects.create(name=GROUP_EDITOR))
        self.client.force_authenticate(editor)
        r = self.client.post('/api/v1/articles/', {
            'title': 'Editor article',
            'content_md': '# Hello',
            'category': self.cat.pk,
        }, format='json')
        self.assertEqual(r.status_code, 201, r.content)
        a = Article.objects.get(title='Editor article')
        self.assertIn('<h1', a.content_html)
        self.assertEqual(a.author, editor)  # auto-assigned

    def test_view_endpoint_increments(self):
        r = self.client.post(f'/api/v1/articles/{self.published.slug}/view/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()['view_count'], 1)

    def test_related_endpoint(self):
        pub = timezone.now() - timedelta(days=1)
        other = Article.objects.create(
            title='Also spirituality', content_md='x',
            category=self.cat,
            status=Article.Status.PUBLISHED, published_at=pub,
        )
        r = self.client.get(f'/api/v1/articles/{self.published.slug}/related/')
        self.assertEqual(r.status_code, 200)
        slugs = [a['slug'] for a in r.json()]
        self.assertIn(other.slug, slugs)

    def test_filter_by_category(self):
        r = self.client.get('/api/v1/articles/?category=spiritualite')
        self.assertEqual(r.status_code, 200)
        slugs = [a['slug'] for a in r.json()['results']]
        self.assertIn(self.published.slug, slugs)

    def test_search(self):
        r = self.client.get('/api/v1/articles/?search=Published')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.json()['results']), 1)

    def test_category_articles_count(self):
        r = self.client.get(f'/api/v1/articles/categories/{self.cat.slug}/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()['articles_count'], 1)

    def test_scheduled_future_hidden_from_public(self):
        future = timezone.now() + timedelta(days=7)
        Article.objects.create(
            title='Future article', content_md='x',
            status=Article.Status.PUBLISHED, published_at=future,
        )
        r = self.client.get('/api/v1/articles/')
        slugs = [a['slug'] for a in r.json()['results']]
        self.assertNotIn('future-article', slugs)

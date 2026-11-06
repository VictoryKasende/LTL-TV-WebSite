"""Tests for the banners domain."""
from datetime import timedelta
from io import BytesIO

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone
from PIL import Image
from rest_framework.test import APIClient

from apps.common.permissions import GROUP_EDITOR

from .models import Banner, BannerImage

User = get_user_model()


def _tiny_png_bytes() -> bytes:
    buf = BytesIO()
    Image.new('RGB', (10, 10), color=(61, 83, 234)).save(buf, format='PNG')
    return buf.getvalue()


def _uploaded_png(name: str = 'banner.png') -> SimpleUploadedFile:
    return SimpleUploadedFile(name, _tiny_png_bytes(), content_type='image/png')


class BannerQuerysetTests(TestCase):
    def test_active_now_filters(self):
        now = timezone.now()
        past = Banner.objects.create(
            title='Past', alt_text='p',
            starts_at=now - timedelta(days=10), ends_at=now - timedelta(days=1),
        )
        current = Banner.objects.create(
            title='Current', alt_text='c',
            starts_at=now - timedelta(days=1), ends_at=now + timedelta(days=1),
        )
        future = Banner.objects.create(
            title='Future', alt_text='f',
            starts_at=now + timedelta(days=1),
        )
        disabled = Banner.objects.create(title='Disabled', alt_text='d', is_active=False)
        undated_active = Banner.objects.create(title='Always', alt_text='a')

        active_titles = set(Banner.objects.active_now().values_list('title', flat=True))
        self.assertEqual(active_titles, {'Current', 'Always'})

    def test_ends_at_strict_boundary(self):
        now = timezone.now()
        b = Banner.objects.create(
            title='EndsNow', alt_text='e',
            starts_at=now - timedelta(hours=1),
            ends_at=now,  # exactly now → should be excluded
        )
        self.assertNotIn(b, Banner.objects.active_now())

    def test_is_active_now_property(self):
        now = timezone.now()
        b = Banner.objects.create(
            title='B', alt_text='b',
            starts_at=now - timedelta(hours=1),
            ends_at=now + timedelta(hours=1),
        )
        self.assertTrue(b.is_active_now)
        b.is_active = False
        self.assertFalse(b.is_active_now)


class BannerImageTests(TestCase):
    def test_default_min_viewport_widths(self):
        banner = Banner.objects.create(title='X', alt_text='x')
        for variant, expected in [
            (BannerImage.Variant.MOBILE, 0),
            (BannerImage.Variant.TABLET, 768),
            (BannerImage.Variant.DESKTOP, 1280),
            (BannerImage.Variant.ULTRAWIDE, 1920),
        ]:
            bi = BannerImage.objects.create(
                banner=banner, variant=variant, image=_uploaded_png(),
            )
            self.assertEqual(bi.min_viewport_width, expected)

    def test_variant_unique_per_banner(self):
        from django.db import IntegrityError
        banner = Banner.objects.create(title='Y', alt_text='y')
        BannerImage.objects.create(
            banner=banner, variant=BannerImage.Variant.MOBILE, image=_uploaded_png(),
        )
        with self.assertRaises(IntegrityError):
            BannerImage.objects.create(
                banner=banner, variant=BannerImage.Variant.MOBILE, image=_uploaded_png(),
            )


class BannerVideoTests(TestCase):
    YT_ID = 'dQw4w9WgXcQ'

    def _video(self, **kwargs):
        return Banner.objects.create(
            kind=Banner.Kind.VIDEO, youtube_url=f'https://youtu.be/{self.YT_ID}', **kwargs,
        )

    def test_youtube_id_exposed_and_title_hidden(self):
        banner = self._video()
        self.assertEqual(banner.youtube_id, self.YT_ID)
        self.assertTrue(banner.title_is_auto)
        data = APIClient().get('/api/v1/banners/active/').json()[0]
        self.assertEqual(data['kind'], 'video')
        self.assertEqual(data['youtube_id'], self.YT_ID)
        self.assertEqual(data['public_title'], '')

    def test_image_banner_never_exposes_a_video(self):
        banner = self._video()
        banner.kind = Banner.Kind.IMAGE
        banner.save()
        self.assertEqual(banner.youtube_id, '')
        # The link is kept so switching back to video restores it.
        self.assertTrue(banner.youtube_url)

    def test_video_banner_requires_youtube_link(self):
        for url in ('', 'https://vimeo.com/123456'):
            with self.assertRaises(ValidationError):
                Banner(kind=Banner.Kind.VIDEO, youtube_url=url).full_clean()


class BannerAdminFormTests(TestCase):
    def setUp(self):
        admin_user = User.objects.create_superuser(
            username='root', email='root@x.com', password='StrongPass123',
        )
        self.client.force_login(admin_user)

    def _post(self, **fields):
        data = {
            'title': 'Annonce', 'alt_text': '', 'link_url': '', 'link_target': '_self',
            'is_active': 'on', 'order': '0', 'youtube_url': '',
            'images-TOTAL_FORMS': '1', 'images-INITIAL_FORMS': '0',
            'images-MIN_NUM_FORMS': '0', 'images-MAX_NUM_FORMS': '4',
            # What a browser really sends for the untouched blank slot: the
            # variant <select> has no empty option, so it posts the first one.
            'images-0-variant': 'mobile', 'images-0-image': '',
            **fields,
        }
        return self.client.post('/admin/banners/banner/add/', data)

    def test_video_banner_saves_without_any_image(self):
        r = self._post(kind='video', youtube_url='https://youtu.be/dQw4w9WgXcQ')
        self.assertEqual(r.status_code, 302, r.context and r.context['errors'])
        banner = Banner.objects.get()
        self.assertEqual(banner.kind, Banner.Kind.VIDEO)
        self.assertEqual(banner.images.count(), 0)

    def test_switching_image_banner_to_video_keeps_its_images(self):
        banner = Banner.objects.create(title='Ancienne')
        BannerImage.objects.create(
            banner=banner, variant=BannerImage.Variant.MOBILE, image=_uploaded_png(),
        )
        r = self.client.post(f'/admin/banners/banner/{banner.pk}/change/', {
            'kind': 'video', 'youtube_url': 'https://youtu.be/dQw4w9WgXcQ',
            'title': 'Ancienne', 'alt_text': '', 'link_url': '', 'link_target': '_self',
            'is_active': 'on', 'order': '0',
            # The browser still posts the (hidden) existing image row.
            'images-TOTAL_FORMS': '1', 'images-INITIAL_FORMS': '1',
            'images-MIN_NUM_FORMS': '0', 'images-MAX_NUM_FORMS': '4',
            'images-0-id': str(banner.images.get().pk), 'images-0-banner': str(banner.pk),
            'images-0-variant': 'mobile', 'images-0-image': '',
        })
        self.assertEqual(r.status_code, 302, r.context and r.context['errors'])
        banner.refresh_from_db()
        self.assertEqual(banner.kind, Banner.Kind.VIDEO)
        self.assertEqual(banner.images.count(), 1)

    def test_image_banner_requires_an_image(self):
        r = self._post(kind='image')
        self.assertEqual(r.status_code, 200)
        self.assertFalse(Banner.objects.exists())
        self.assertContains(r, 'Ajoutez au moins une image')


class BannerApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        now = timezone.now()

        self.current = Banner.objects.create(
            title='Current banner', alt_text='c',
            starts_at=now - timedelta(hours=1), ends_at=now + timedelta(hours=1),
            order=1,
        )
        BannerImage.objects.create(
            banner=self.current, variant=BannerImage.Variant.MOBILE,
            image=_uploaded_png('mobile.png'),
        )
        BannerImage.objects.create(
            banner=self.current, variant=BannerImage.Variant.DESKTOP,
            image=_uploaded_png('desktop.png'),
        )

        self.future = Banner.objects.create(
            title='Future banner', alt_text='f',
            starts_at=now + timedelta(days=1), order=2,
        )
        self.disabled = Banner.objects.create(
            title='Disabled banner', alt_text='d', is_active=False, order=3,
        )

    def test_active_endpoint_public(self):
        r = self.client.get('/api/v1/banners/active/')
        self.assertEqual(r.status_code, 200)
        titles = [b['title'] for b in r.json()]
        self.assertEqual(titles, ['Current banner'])

    def test_active_endpoint_returns_images(self):
        r = self.client.get('/api/v1/banners/active/')
        images = r.json()[0]['images']
        variants = {img['variant'] for img in images}
        self.assertEqual(variants, {'mobile', 'desktop'})

    def test_anon_cannot_list_all(self):
        r = self.client.get('/api/v1/banners/')
        # Read is allowed by ReadOnlyOrEditor → shows all banners
        self.assertEqual(r.status_code, 200)

    def test_anon_cannot_create(self):
        r = self.client.post('/api/v1/banners/', {'title': 'X', 'alt_text': 'x'}, format='json')
        self.assertIn(r.status_code, (401, 403))

    def test_editor_can_create(self):
        editor = User.objects.create_user(
            username='ed', email='ed@x.com', password='StrongPass123', is_staff=True,
        )
        editor.groups.add(Group.objects.create(name=GROUP_EDITOR))
        self.client.force_authenticate(editor)
        r = self.client.post(
            '/api/v1/banners/',
            {'title': 'New', 'alt_text': 'new', 'is_active': True},
            format='json',
        )
        self.assertEqual(r.status_code, 201, r.content)

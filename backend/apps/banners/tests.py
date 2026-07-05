"""Tests for the banners domain."""
from datetime import timedelta
from io import BytesIO

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
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

"""ViewSets for the testimonials module.

- Anonymous: GET (approved only), POST (creates in ``pending`` state).
- Moderator+: full CRUD + moderation actions (approve / reject / archive).
"""
from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.common.permissions import IsModerator

from .filters import TestimonialFilter
from .models import Testimonial
from .serializers import (
    TestimonialAdminSerializer,
    TestimonialPublicSerializer,
    TestimonialSubmissionSerializer,
)


def _client_ip(request) -> str | None:
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    if xff:
        return xff.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


@extend_schema(tags=['Témoignages'])
class TestimonialViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Public endpoint : GET approved, POST any."""

    queryset = Testimonial.objects.approved()
    lookup_field = 'slug'
    permission_classes = [permissions.AllowAny]
    filterset_fields = ('country', 'is_featured')
    search_fields = ('author_name', 'city', 'title', 'story')
    ordering_fields = ('created_at', 'is_featured')

    def get_serializer_class(self):
        if self.action == 'create':
            return TestimonialSubmissionSerializer
        return TestimonialPublicSerializer

    def get_throttles(self):
        # Public submissions get the strict `testimonial` scope (3/hour).
        if self.action == 'create':
            from rest_framework.throttling import ScopedRateThrottle
            self.throttle_scope = 'testimonial'
            return [ScopedRateThrottle()]
        return super().get_throttles()

    def create(self, request, *args, **kwargs):
        # Silent honeypot: return 201 without saving.
        if request.data.get('hp_field'):
            return Response(
                {'detail': 'Merci pour votre témoignage.'},
                status=status.HTTP_201_CREATED,
            )
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(
            submitted_ip=_client_ip(self.request),
            submitted_user_agent=(self.request.META.get('HTTP_USER_AGENT', '') or '')[:280],
        )


@extend_schema(tags=['Témoignages · Modération'])
class TestimonialAdminViewSet(viewsets.ModelViewSet):
    """Full CRUD + moderation for staff. Sees *all* testimonials."""

    queryset = Testimonial.objects.all().select_related('moderated_by')
    serializer_class = TestimonialAdminSerializer
    lookup_field = 'slug'
    permission_classes = [IsModerator]
    filterset_class = TestimonialFilter
    search_fields = ('author_name', 'city', 'country', 'title', 'story',
                     'author_email', 'author_phone')
    ordering_fields = ('created_at', 'moderated_at', 'is_featured')

    @extend_schema(summary='Approuver ce témoignage', request=None,
                   responses={200: TestimonialAdminSerializer})
    @action(detail=True, methods=['post'])
    def approve(self, request, slug=None):
        obj = self.get_object()
        obj.approve(by=request.user)
        return Response(self.get_serializer(obj).data)

    @extend_schema(summary='Rejeter ce témoignage', request=None,
                   responses={200: TestimonialAdminSerializer})
    @action(detail=True, methods=['post'])
    def reject(self, request, slug=None):
        obj = self.get_object()
        obj.reject(by=request.user, note=request.data.get('note', ''))
        return Response(self.get_serializer(obj).data)

    @extend_schema(summary='Archiver ce témoignage', request=None,
                   responses={200: TestimonialAdminSerializer})
    @action(detail=True, methods=['post'])
    def archive(self, request, slug=None):
        obj = self.get_object()
        obj.archive(by=request.user)
        return Response(self.get_serializer(obj).data)

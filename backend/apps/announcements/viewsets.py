"""Announcement ViewSet.

- Public read on ``/active/`` (the single announcement visible right now, or null).
- Full CRUD on ``/`` for Editor+ (Admin group inherits).
"""
from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.common.permissions import ReadOnlyOrEditor

from .models import Announcement
from .serializers import AnnouncementSerializer


@extend_schema(tags=['Annonces'])
class AnnouncementViewSet(viewsets.ModelViewSet):
    """CRUD for announcements. Anonymous users can only see ``active/``."""

    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    permission_classes = [ReadOnlyOrEditor]
    filterset_fields = ('is_active',)
    search_fields = ('message',)
    ordering_fields = ('created_at', 'starts_at', 'ends_at')

    @extend_schema(
        summary='Annonce active à l\'instant présent',
        description='Renvoie l\'annonce `is_active=True` la plus récente dont la fenêtre '
                    '`starts_at/ends_at` inclut maintenant, ou `null` s\'il n\'y en a aucune.',
        responses={200: AnnouncementSerializer},
    )
    @action(
        detail=False, methods=['get'], url_path='active',
        permission_classes=[permissions.AllowAny],
        pagination_class=None,
    )
    def active(self, request):
        announcement = Announcement.objects.active_now().order_by('-created_at').first()
        if announcement is None:
            return Response(None)
        return Response(self.get_serializer(announcement).data)

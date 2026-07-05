"""Banner ViewSets.

- Public read on ``/active/`` (only banners visible right now).
- Full CRUD on ``/`` for Editor+ (Admin group inherits).
"""
from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.common.permissions import ReadOnlyOrEditor

from .models import Banner
from .serializers import BannerSerializer


@extend_schema(tags=['Bannières'])
class BannerViewSet(viewsets.ModelViewSet):
    """CRUD for banners. Anonymous users can only see ``active/``."""

    queryset = Banner.objects.prefetch_related('images').all()
    serializer_class = BannerSerializer
    permission_classes = [ReadOnlyOrEditor]
    filterset_fields = ('is_active',)
    search_fields = ('title', 'alt_text')
    ordering_fields = ('order', 'created_at', 'starts_at', 'ends_at')

    @extend_schema(
        summary='Bannières actives à l\'instant présent',
        description='Renvoie uniquement les bannières `is_active=True` dont '
                    'la fenêtre `starts_at/ends_at` inclut maintenant, '
                    'triées par `order`. Pas de pagination — le carousel '
                    'consomme la liste entière.',
        responses={200: BannerSerializer(many=True)},
    )
    @action(
        detail=False, methods=['get'], url_path='active',
        permission_classes=[permissions.AllowAny],
        pagination_class=None,
    )
    def active(self, request):
        qs = (
            Banner.objects.active_now()
            .prefetch_related('images')
            .order_by('order', '-created_at')
        )
        ser = self.get_serializer(qs, many=True)
        return Response(ser.data)

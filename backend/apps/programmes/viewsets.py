"""ViewSets for the weekly programme calendar."""
from __future__ import annotations

from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.common.permissions import ReadOnlyOrEditor

from .filters import WeeklyProgramFilter
from .models import ProgramType, WeeklyProgram
from .serializers import (
    ProgramTypeSerializer,
    WeeklyProgramDetailSerializer,
    WeeklyProgramListSerializer,
)


def _staff(request) -> bool:
    return bool(request.user and request.user.is_authenticated and request.user.is_staff)


@extend_schema(tags=['Programmes hebdomadaires'])
class ProgramTypeViewSet(viewsets.ModelViewSet):
    """CRUD for program types (culte, formation, retraite…)."""

    queryset = ProgramType.objects.all()
    serializer_class = ProgramTypeSerializer
    lookup_field = 'slug'
    permission_classes = [ReadOnlyOrEditor]
    search_fields = ('name', 'description')
    ordering_fields = ('order', 'name')


@extend_schema(tags=['Programmes hebdomadaires'])
class WeeklyProgramViewSet(viewsets.ModelViewSet):
    """CRUD for weekly programs.

    Anonymous readers see published programs only.
    Staff / editors see everything (drafts + archived).
    """

    lookup_field = 'slug'
    filterset_class = WeeklyProgramFilter
    search_fields = ('title', 'description', 'responsable', 'location')
    ordering_fields = ('date', 'start_time', 'created_at')
    permission_classes = [ReadOnlyOrEditor]

    def get_queryset(self):
        qs = WeeklyProgram.objects.select_related('program_type')
        if not _staff(self.request):
            qs = qs.published()
        return qs

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return WeeklyProgramDetailSerializer
        return WeeklyProgramListSerializer

    @extend_schema(
        summary='Prochains programmes',
        description='Les N prochains événements publiés, triés par date + heure. '
                    'Utilisé côté frontend pour la vue « À venir ».',
        parameters=[
            OpenApiParameter('limit', int, description='Nombre max (défaut 20, plafond 50).'),
        ],
    )
    @action(
        detail=False, methods=['get'], url_path='upcoming',
        permission_classes=[permissions.AllowAny], pagination_class=None,
    )
    def upcoming(self, request):
        try:
            limit = min(int(request.query_params.get('limit', 20)), 50)
        except (TypeError, ValueError):
            limit = 20
        qs = (
            WeeklyProgram.objects.published().upcoming()
            .select_related('program_type')
            .order_by('date', 'start_time', 'order')[:limit]
        )
        ser = WeeklyProgramListSerializer(qs, many=True, context={'request': request})
        return Response(ser.data)

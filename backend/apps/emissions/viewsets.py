"""ViewSets for the emissions API.

Public read (anyone can GET) — writes gated by ``ReadOnlyOrEditor``.
Staff / editors can see drafts + archived; anonymous users only see
published items whose ``published_at`` is in the past.
"""
from __future__ import annotations

from django.db.models import Count, Prefetch, Q
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.common.permissions import ReadOnlyOrEditor

from .filters import EpisodeFilter, SeriesFilter, ShowFilter
from .models import Category, Episode, Series, Show
from .serializers import (
    CategorySerializer,
    EpisodeDetailSerializer,
    EpisodeListSerializer,
    SeriesSerializer,
    SeriesWithEpisodesSerializer,
    ShowDetailSerializer,
    ShowListSerializer,
)


def _staff(request) -> bool:
    return bool(request.user and request.user.is_authenticated and request.user.is_staff)


@extend_schema(tags=['Émissions'])
class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """List / retrieve emission categories."""

    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    permission_classes = [permissions.AllowAny]


@extend_schema(tags=['Émissions'])
class ShowViewSet(viewsets.ModelViewSet):
    """CRUD for the recurring shows."""

    lookup_field = 'slug'
    filterset_class = ShowFilter
    search_fields = ('title', 'tagline', 'description', 'host')
    ordering_fields = ('order', 'created_at', 'title')
    permission_classes = [ReadOnlyOrEditor]

    def get_queryset(self):
        qs = Show.objects.annotate(
            episodes_count=Count(
                'episodes',
                filter=Q(episodes__status='published'),
                distinct=True,
            ),
        ).prefetch_related('tags').order_by('order', '-created_at')
        if not _staff(self.request):
            qs = qs.published()
        return qs

    def get_serializer_class(self):
        return ShowDetailSerializer if self.action == 'retrieve' else ShowListSerializer

    @extend_schema(
        summary='Épisodes publiés d\'un show',
        parameters=[
            OpenApiParameter('ordering', str, description='Ex: `-aired_at`, `view_count`'),
        ],
    )
    @action(detail=True, methods=['get'], url_path='episodes')
    def list_episodes(self, request, slug=None):
        show = self.get_object()
        base = show.episodes if _staff(request) else show.episodes.published_or_scheduled()
        qs = (
            base
            .select_related('show')
            .prefetch_related('categories', 'tags')
        )
        page = self.paginate_queryset(qs)
        ser = EpisodeListSerializer(page or qs, many=True, context={'request': request})
        return self.get_paginated_response(ser.data) if page is not None else Response(ser.data)

    @extend_schema(
        summary='Épisodes du show, enveloppés par série d\'enseignement',
        description='Chaque série publiée avec ses épisodes publiés nichés dedans, '
                    'triés par numéro d\'épisode puis date de diffusion. '
                    'Utilisé par la page détail de l\'émission.',
        responses={200: SeriesWithEpisodesSerializer(many=True)},
    )
    @action(detail=True, methods=['get'], url_path='series')
    def list_series(self, request, slug=None):
        show = self.get_object()
        staff = _staff(request)
        series_qs = show.series.all() if staff else show.series.published()
        episodes_qs = Episode.objects.all() if staff else Episode.objects.published_or_scheduled()
        episodes_qs = (
            episodes_qs.select_related('show')
            .prefetch_related('categories', 'tags')
            .order_by('episode_number', 'aired_at')
        )
        series_qs = series_qs.prefetch_related(
            Prefetch('episodes', queryset=episodes_qs, to_attr='prefetched_episodes'),
        ).order_by('-starts_on', 'order', '-created_at')
        ser = SeriesWithEpisodesSerializer(series_qs, many=True, context={'request': request})
        return Response(ser.data)


@extend_schema(tags=['Émissions'])
class SeriesViewSet(viewsets.ModelViewSet):
    """CRUD for teaching series (grouping of episodes within a show)."""

    lookup_field = 'slug'
    filterset_class = SeriesFilter
    search_fields = ('title', 'theme', 'description')
    ordering_fields = ('order', 'starts_on', 'created_at')
    permission_classes = [ReadOnlyOrEditor]

    def get_queryset(self):
        qs = (
            Series.objects
            .select_related('show')
            .prefetch_related('episodes')
            .order_by('-starts_on', 'order', '-created_at')
        )
        if not _staff(self.request):
            qs = qs.published()
        return qs

    def get_serializer_class(self):
        return SeriesWithEpisodesSerializer if self.action == 'retrieve' else SeriesSerializer


@extend_schema(tags=['Émissions'])
class EpisodeViewSet(viewsets.ModelViewSet):
    """CRUD for individual YouTube episodes."""

    lookup_field = 'slug'
    filterset_class = EpisodeFilter
    search_fields = ('title', 'subtitle', 'excerpt', 'description', 'speaker')
    ordering_fields = ('aired_at', 'created_at', 'view_count')
    permission_classes = [ReadOnlyOrEditor]

    def get_queryset(self):
        qs = (
            Episode.objects
            .select_related('show')
            .prefetch_related('categories', 'tags')
        )
        if not _staff(self.request):
            qs = qs.published_or_scheduled()
        return qs

    def get_serializer_class(self):
        return EpisodeDetailSerializer if self.action == 'retrieve' else EpisodeListSerializer

    @extend_schema(
        summary='Incrémenter le compteur de vues',
        description='À appeler côté frontend quand la vidéo commence réellement '
                    'à jouer (bouton play). Increment atomique côté DB.',
        request=None,
        responses={200: {'type': 'object', 'properties': {'view_count': {'type': 'integer'}}}},
    )
    @action(
        detail=True, methods=['post'], url_path='view',
        permission_classes=[permissions.AllowAny],
    )
    def view(self, request, slug=None):
        ep = self.get_object()
        ep.increment_views()
        ep.refresh_from_db(fields=['view_count'])
        return Response({'view_count': ep.view_count})

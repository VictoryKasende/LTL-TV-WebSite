"""ViewSets for the emissions API.

Public read (anyone can GET) — writes gated by ``ReadOnlyOrEditor``.
Staff / editors can see drafts + archived; anonymous users only see
published items whose ``published_at`` is in the past.
"""
from __future__ import annotations

from django.db.models import Count, Prefetch, Q
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from apps.common.permissions import IsModerator, ReadOnlyOrEditor
from apps.common.request import client_ip

from .filters import EpisodeFilter, SeriesFilter, ShowFilter
from .models import Category, Episode, EpisodeComment, Series, Show
from .serializers import (
    CategorySerializer,
    EpisodeCommentAdminSerializer,
    EpisodeCommentPublicSerializer,
    EpisodeCommentSubmissionSerializer,
    EpisodeDetailSerializer,
    EpisodeListSerializer,
    SeriesSerializer,
    SeriesWithEpisodesSerializer,
    ShowDetailSerializer,
    ShowListSerializer,
)


def _staff(request) -> bool:
    return bool(request.user and request.user.is_authenticated and request.user.is_staff)


def _with_comment_count(qs):
    return qs.annotate(
        comment_count=Count(
            'comments',
            filter=Q(comments__status=EpisodeComment.Status.APPROVED),
            distinct=True,
        ),
    )


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
        qs = _with_comment_count(
            base
            .select_related('show')
            .prefetch_related('categories', 'tags'),
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
        episodes_qs = _with_comment_count(
            episodes_qs.select_related('show')
            .prefetch_related('categories', 'tags')
            .order_by('episode_number', 'aired_at'),
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
        return _with_comment_count(qs)

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

    @extend_schema(
        summary='Liker cet épisode', request=None,
        responses={200: {'type': 'object', 'properties': {'like_count': {'type': 'integer'}}}},
    )
    @action(
        detail=True, methods=['post'], url_path='like',
        permission_classes=[permissions.AllowAny],
    )
    def like(self, request, slug=None):
        ep = self.get_object()
        ep.increment_likes()
        ep.refresh_from_db(fields=['like_count'])
        return Response({'like_count': ep.like_count})

    @extend_schema(
        summary='Retirer son like', request=None,
        responses={200: {'type': 'object', 'properties': {'like_count': {'type': 'integer'}}}},
    )
    @action(
        detail=True, methods=['post'], url_path='unlike',
        permission_classes=[permissions.AllowAny],
    )
    def unlike(self, request, slug=None):
        ep = self.get_object()
        ep.decrement_likes()
        ep.refresh_from_db(fields=['like_count'])
        return Response({'like_count': ep.like_count})

    @extend_schema(
        summary='Commentaires de cet épisode',
        description='GET liste les commentaires approuvés. POST soumet un nouveau '
                    'commentaire anonyme, publié après modération.',
        request=EpisodeCommentSubmissionSerializer,
        responses={200: EpisodeCommentPublicSerializer(many=True), 201: EpisodeCommentPublicSerializer},
    )
    @action(detail=True, methods=['get', 'post'], url_path='comments',
            permission_classes=[permissions.AllowAny])
    def comments(self, request, slug=None):
        ep = self.get_object()

        if request.method == 'POST':
            # Silent honeypot: pretend it worked, never save.
            if request.data.get('hp_field'):
                return Response(
                    {'detail': 'Merci pour votre commentaire.'},
                    status=status.HTTP_201_CREATED,
                )
            serializer = EpisodeCommentSubmissionSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(
                episode=ep,
                submitted_ip=client_ip(request),
                submitted_user_agent=(request.META.get('HTTP_USER_AGENT', '') or '')[:280],
            )
            return Response(
                {'detail': 'Merci, votre commentaire sera visible après modération.'},
                status=status.HTTP_201_CREATED,
            )

        qs = ep.comments.filter(status=EpisodeComment.Status.APPROVED)
        page = self.paginate_queryset(qs)
        ser = EpisodeCommentPublicSerializer(page or qs, many=True)
        return self.get_paginated_response(ser.data) if page is not None else Response(ser.data)

    def get_throttles(self):
        if self.action in ('like', 'unlike'):
            self.throttle_scope = 'episode_like'
            return [ScopedRateThrottle()]
        if self.action == 'comments' and self.request.method == 'POST':
            self.throttle_scope = 'episode_comment'
            return [ScopedRateThrottle()]
        return super().get_throttles()


@extend_schema(tags=['Émissions · Modération'])
class EpisodeCommentAdminViewSet(viewsets.ModelViewSet):
    """Full CRUD + moderation for staff. Sees *all* comments."""

    queryset = EpisodeComment.objects.select_related('episode')
    serializer_class = EpisodeCommentAdminSerializer
    permission_classes = [IsModerator]
    filterset_fields = ('episode', 'status')
    search_fields = ('author_name', 'body')
    ordering_fields = ('created_at',)

    @extend_schema(summary='Approuver ce commentaire', request=None,
                   responses={200: EpisodeCommentAdminSerializer})
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        obj = self.get_object()
        obj.approve()
        return Response(self.get_serializer(obj).data)

    @extend_schema(summary='Rejeter ce commentaire', request=None,
                   responses={200: EpisodeCommentAdminSerializer})
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        obj = self.get_object()
        obj.reject(note=request.data.get('note', ''))
        return Response(self.get_serializer(obj).data)

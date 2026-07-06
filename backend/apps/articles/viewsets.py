"""ViewSets for the articles CMS.

- Anonymous: read published articles / list categories.
- Editor+: full CRUD + can see drafts / archived.
"""
from __future__ import annotations

from django.db.models import Count, Q
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.common.permissions import ReadOnlyOrEditor

from .filters import ArticleFilter
from .models import Article, Category
from .serializers import (
    ArticleDetailSerializer,
    ArticleListSerializer,
    ArticleWriteSerializer,
    CategorySerializer,
)


def _staff(request) -> bool:
    return bool(request.user and request.user.is_authenticated and request.user.is_staff)


@extend_schema(tags=['Articles'])
class CategoryViewSet(viewsets.ModelViewSet):
    """CRUD for categories. Anonymous reads; editors write."""

    queryset = Category.objects.annotate(
        articles_count=Count('articles', filter=Q(articles__status='published'), distinct=True),
    ).all()
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    permission_classes = [ReadOnlyOrEditor]
    search_fields = ('name', 'description')
    ordering_fields = ('order', 'name', 'articles_count')


@extend_schema(tags=['Articles'])
class ArticleViewSet(viewsets.ModelViewSet):
    """CRUD for articles."""

    lookup_field = 'slug'
    filterset_class = ArticleFilter
    search_fields = ('title', 'subtitle', 'excerpt', 'content_md',
                     'author__username', 'category__name')
    ordering_fields = ('published_at', 'created_at', 'view_count',
                       'reading_time_minutes')
    permission_classes = [ReadOnlyOrEditor]

    def get_queryset(self):
        qs = (
            Article.objects
            .select_related('author', 'category')
            .prefetch_related('tags')
        )
        if not _staff(self.request):
            qs = qs.published()
        return qs

    def get_serializer_class(self):
        if self.action in ('list',):
            return ArticleListSerializer
        if self.action == 'retrieve':
            return ArticleDetailSerializer
        # create / update / partial_update
        return ArticleWriteSerializer

    def perform_create(self, serializer):
        # Auto-assign the current user as author when none provided.
        if not serializer.validated_data.get('author') and self.request.user.is_authenticated:
            serializer.save(author=self.request.user)
        else:
            serializer.save()

    @extend_schema(
        summary='Articles apparentés',
        description='Renvoie jusqu\'à 3 articles proches par tags (score) '
                    'avec fallback catégorie, puis date.',
    )
    @action(
        detail=True, methods=['get'], url_path='related',
        permission_classes=[permissions.AllowAny], pagination_class=None,
    )
    def related(self, request, slug=None):
        obj = self.get_object()
        related = obj.get_related(limit=3)
        ser = ArticleListSerializer(related, many=True, context={'request': request})
        return Response(ser.data)

    @extend_schema(
        summary='Incrémenter le compteur de vues',
        description='À appeler côté frontend au chargement effectif de l\'article. '
                    'Increment atomique.',
        request=None,
        responses={200: {'type': 'object', 'properties': {'view_count': {'type': 'integer'}}}},
    )
    @action(
        detail=True, methods=['post'], url_path='view',
        permission_classes=[permissions.AllowAny],
    )
    def view(self, request, slug=None):
        obj = self.get_object()
        obj.increment_views()
        obj.refresh_from_db(fields=['view_count'])
        return Response({'view_count': obj.view_count})

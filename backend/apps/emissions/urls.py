from rest_framework.routers import DefaultRouter

from .viewsets import (
    CategoryViewSet,
    EpisodeCommentAdminViewSet,
    EpisodeViewSet,
    SeriesViewSet,
    ShowViewSet,
)

router = DefaultRouter()
router.register(r'shows',           ShowViewSet,               basename='emission-show')
router.register(r'series',          SeriesViewSet,             basename='emission-series')
router.register(r'episodes',        EpisodeViewSet,            basename='emission-episode')
router.register(r'categories',      CategoryViewSet,           basename='emission-category')
router.register(r'admin/comments',  EpisodeCommentAdminViewSet, basename='emission-comment-admin')

urlpatterns = router.urls

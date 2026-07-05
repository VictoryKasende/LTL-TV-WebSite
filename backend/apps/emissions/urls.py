from rest_framework.routers import DefaultRouter

from .viewsets import CategoryViewSet, EpisodeViewSet, ShowViewSet

router = DefaultRouter()
router.register(r'shows',      ShowViewSet,     basename='emission-show')
router.register(r'episodes',   EpisodeViewSet,  basename='emission-episode')
router.register(r'categories', CategoryViewSet, basename='emission-category')

urlpatterns = router.urls

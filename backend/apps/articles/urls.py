from rest_framework.routers import DefaultRouter

from .views import ArticleViewSet, CategoryViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'', ArticleViewSet, basename='article')

urlpatterns = router.urls

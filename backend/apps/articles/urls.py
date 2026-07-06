from rest_framework.routers import DefaultRouter

from .viewsets import ArticleViewSet, CategoryViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='article-category')
router.register(r'',           ArticleViewSet,  basename='article')

urlpatterns = router.urls

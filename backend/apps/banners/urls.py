from rest_framework.routers import DefaultRouter

from .viewsets import BannerViewSet

router = DefaultRouter()
router.register(r'', BannerViewSet, basename='banner')

urlpatterns = router.urls

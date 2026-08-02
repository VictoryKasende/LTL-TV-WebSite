from rest_framework.routers import DefaultRouter

from .viewsets import AnnouncementViewSet

router = DefaultRouter()
router.register(r'', AnnouncementViewSet, basename='announcement')

urlpatterns = router.urls

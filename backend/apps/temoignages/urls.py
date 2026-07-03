from rest_framework.routers import DefaultRouter

from .views import TemoignageViewSet

router = DefaultRouter()
router.register(r'', TemoignageViewSet, basename='temoignage')

urlpatterns = router.urls

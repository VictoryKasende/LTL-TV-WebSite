from rest_framework.routers import DefaultRouter

from .views import ProgrammeViewSet

router = DefaultRouter()
router.register(r'', ProgrammeViewSet, basename='programme')

urlpatterns = router.urls

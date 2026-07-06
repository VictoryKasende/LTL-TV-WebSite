from rest_framework.routers import DefaultRouter

from .viewsets import ProgramTypeViewSet, WeeklyProgramViewSet

router = DefaultRouter()
router.register(r'types', ProgramTypeViewSet, basename='program-type')
router.register(r'',      WeeklyProgramViewSet, basename='weekly-program')

urlpatterns = router.urls

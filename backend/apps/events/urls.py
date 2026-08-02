from rest_framework.routers import DefaultRouter

from .viewsets import EventRegistrationAdminViewSet, EventViewSet

router = DefaultRouter()
router.register(r'admin/registrations', EventRegistrationAdminViewSet, basename='event-registration-admin')
router.register(r'',                    EventViewSet,                  basename='event')

urlpatterns = router.urls

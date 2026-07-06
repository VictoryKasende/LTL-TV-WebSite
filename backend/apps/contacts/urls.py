from rest_framework.routers import DefaultRouter

from .viewsets import ContactAdminViewSet, ContactViewSet

router = DefaultRouter()
router.register(r'admin', ContactAdminViewSet, basename='contact-admin')
router.register(r'',      ContactViewSet,      basename='contact')

urlpatterns = router.urls

from rest_framework.routers import DefaultRouter

from .viewsets import TestimonialAdminViewSet, TestimonialViewSet

router = DefaultRouter()
router.register(r'admin', TestimonialAdminViewSet, basename='testimonial-admin')
router.register(r'',      TestimonialViewSet,      basename='testimonial')

urlpatterns = router.urls

from django.urls import path
from rest_framework.routers import DefaultRouter

from .viewsets import AboutPageView, CoreValueViewSet, TeamMemberViewSet

router = DefaultRouter()
router.register(r'values', CoreValueViewSet, basename='about-value')
router.register(r'team', TeamMemberViewSet, basename='about-team')

urlpatterns = [
    path('page/', AboutPageView.as_view(), name='about-page'),
] + router.urls

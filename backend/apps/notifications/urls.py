from django.urls import path
from rest_framework.routers import DefaultRouter

from .viewsets import (
    PushCampaignClickView,
    PushCampaignViewSet,
    PushSubscribeView,
    PushSubscriptionAdminViewSet,
    PushUnsubscribeView,
    VapidPublicKeyView,
)

router = DefaultRouter()
router.register(r'campaigns',     PushCampaignViewSet,          basename='push-campaign')
router.register(r'subscriptions', PushSubscriptionAdminViewSet, basename='push-subscription')

urlpatterns = [
    path('vapid-public-key/', VapidPublicKeyView.as_view(),      name='vapid-public-key'),
    path('subscribe/',        PushSubscribeView.as_view(),       name='push-subscribe'),
    path('unsubscribe/',      PushUnsubscribeView.as_view(),     name='push-unsubscribe'),
    path('campaigns/<int:pk>/click/', PushCampaignClickView.as_view(), name='push-campaign-click'),
] + router.urls

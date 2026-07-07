"""Web Push notifications endpoints.

Public:
  - GET  /notifications/vapid-public-key/
  - POST /notifications/subscribe/
  - POST /notifications/unsubscribe/
  - POST /notifications/campaigns/{id}/click/  (click tracking)

Admin (Editor+):
  - full CRUD /notifications/campaigns/
  - POST /notifications/campaigns/{id}/send/
  - POST /notifications/campaigns/{id}/test/
  - GET  /notifications/subscriptions/
"""
from __future__ import annotations

from django.conf import settings
from django.db.models import F
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import IsAdmin, ReadOnlyOrEditor

from .models import PushCampaign, PushSubscription
from .serializers import (
    PushCampaignSerializer,
    PushSubscribeSerializer,
    PushSubscriptionAdminSerializer,
    PushUnsubscribeSerializer,
)
from .tasks import send_campaign, send_push_to_subscription


@extend_schema(tags=['Notifications push'])
class VapidPublicKeyView(APIView):
    """Return the VAPID public key so the browser can build its subscription."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({'public_key': getattr(settings, 'VAPID_PUBLIC_KEY', '') or ''})


@extend_schema(tags=['Notifications push'])
class PushSubscribeView(APIView):
    """Register (or re-register) a browser push subscription.

    Idempotent: same endpoint → updates the row instead of duplicating."""

    permission_classes = [permissions.AllowAny]
    serializer_class = PushSubscribeSerializer

    def post(self, request):
        ser = PushSubscribeSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        sub, created = PushSubscription.objects.update_or_create(
            endpoint=data['endpoint'],
            defaults={
                'p256dh_key': data['keys']['p256dh'],
                'auth_key': data['keys']['auth'],
                'user': request.user if request.user.is_authenticated else None,
                'user_agent': (request.META.get('HTTP_USER_AGENT', '') or '')[:280],
                'locale': data.get('locale', 'fr'),
                'is_active': True,
                'last_seen_at': timezone.now(),
                'unsubscribed_at': None,
            },
        )
        return Response(
            {'created': created, 'id': sub.pk},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


@extend_schema(tags=['Notifications push'])
class PushUnsubscribeView(APIView):
    """Mark a subscription as inactive. Idempotent."""

    permission_classes = [permissions.AllowAny]
    serializer_class = PushUnsubscribeSerializer

    def post(self, request):
        ser = PushUnsubscribeSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        PushSubscription.objects.filter(
            endpoint=ser.validated_data['endpoint'],
        ).update(is_active=False, unsubscribed_at=timezone.now())
        return Response({'ok': True})


@extend_schema(tags=['Notifications push'])
class PushCampaignClickView(APIView):
    """Increment click counter — called by the service worker on notif click."""

    permission_classes = [permissions.AllowAny]

    def post(self, request, pk):
        PushCampaign.objects.filter(pk=pk).update(click_count=F('click_count') + 1)
        return Response({'ok': True})


@extend_schema(tags=['Notifications push · Administration'])
class PushCampaignViewSet(viewsets.ModelViewSet):
    """CRUD + send for campaigns."""

    queryset = PushCampaign.objects.select_related('created_by').all()
    serializer_class = PushCampaignSerializer
    permission_classes = [ReadOnlyOrEditor]
    filterset_fields = ('status', 'trigger_type', 'audience')
    search_fields = ('title', 'body', 'trigger_ref')
    ordering_fields = ('created_at', 'sent_at', 'delivered_count')

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(created_by=self.request.user)
        else:
            serializer.save()

    @extend_schema(summary='Envoyer la campagne (async, via Celery)',
                   request=None, responses={200: PushCampaignSerializer})
    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        campaign = self.get_object()
        if campaign.status not in {PushCampaign.Status.DRAFT,
                                   PushCampaign.Status.SCHEDULED,
                                   PushCampaign.Status.FAILED}:
            return Response(
                {'detail': f'Campagne dans un statut non envoyable : {campaign.status}.',
                 'code': 'invalid_state'},
                status=400,
            )
        send_campaign.delay(campaign.pk)
        campaign.refresh_from_db()
        return Response(self.get_serializer(campaign).data)

    @extend_schema(
        summary='Envoi de test (à l\'utilisateur qui appelle)',
        description='Envoie la notification uniquement aux abonnements liés '
                    'à l\'utilisateur courant — sans changer le statut de la campagne.',
        request=None, responses={200: {'type': 'object'}},
    )
    @action(detail=True, methods=['post'])
    def test(self, request, pk=None):
        campaign = self.get_object()
        if not request.user.is_authenticated:
            return Response({'detail': 'Auth requise.', 'code': 'auth_required'}, status=401)
        subs = PushSubscription.objects.active().filter(user=request.user)
        payload = campaign.to_payload()
        count = 0
        for sub_id in subs.values_list('pk', flat=True):
            send_push_to_subscription.delay(sub_id, payload)
            count += 1
        return Response({'sent': count})


@extend_schema(tags=['Notifications push · Administration'])
class PushSubscriptionAdminViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only listing / detail of subscriptions."""

    queryset = PushSubscription.objects.select_related('user').all()
    serializer_class = PushSubscriptionAdminSerializer
    permission_classes = [IsAdmin]
    filterset_fields = ('is_active', 'locale')
    search_fields = ('endpoint', 'user__username', 'user__email', 'user_agent')
    ordering_fields = ('created_at', 'last_seen_at')

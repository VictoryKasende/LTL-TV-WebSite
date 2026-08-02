"""ViewSets for the events module.

- Public: read active events, register to one (``/events/<slug>/register/``).
- Editor+: full CRUD on events.
- Moderator+: read registrations (``/events/admin/registrations/``).
"""
from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from apps.common.permissions import IsModerator, ReadOnlyOrEditor

from .models import Event, EventRegistration
from .serializers import (
    EventRegistrationAdminSerializer,
    EventRegistrationSubmissionSerializer,
    EventSerializer,
)


def _staff(request) -> bool:
    return bool(request.user and request.user.is_authenticated and request.user.is_staff)


def _client_ip(request) -> str | None:
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    if xff:
        return xff.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


@extend_schema(tags=['Événements'])
class EventViewSet(viewsets.ModelViewSet):
    """CRUD for events. Anonymous readers see active events only."""

    lookup_field = 'slug'
    serializer_class = EventSerializer
    permission_classes = [ReadOnlyOrEditor]
    filterset_fields = ('is_active', 'is_registration_open')
    search_fields = ('title', 'subtitle')
    ordering_fields = ('start_date', 'created_at')
    throttle_scope = None  # only the `register` action below sets this, via @action kwargs

    def get_queryset(self):
        qs = Event.objects.all()
        if not _staff(self.request):
            qs = qs.filter(is_active=True)
        return qs

    @extend_schema(
        summary='S\'inscrire à cet événement',
        description='Endpoint public. Body : prénom, nom, genre, email, téléphone, pays '
                    '(optionnel), motivation, `accepted_conditions` (doit être `true`).',
        request=EventRegistrationSubmissionSerializer,
        responses={201: EventRegistrationSubmissionSerializer},
    )
    @action(
        detail=True, methods=['post'], url_path='register',
        permission_classes=[permissions.AllowAny],
        throttle_scope='event_registration', throttle_classes=[ScopedRateThrottle],
    )
    def register(self, request, slug=None):
        event = self.get_object()

        # Silent honeypot: return 201 without saving.
        if request.data.get('hp_field'):
            return Response(
                {'detail': 'Merci pour votre inscription.'},
                status=status.HTTP_201_CREATED,
            )

        if not event.is_active or not event.is_registration_open:
            return Response(
                {'detail': 'Les inscriptions pour cet événement sont fermées.', 'code': 'closed'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = EventRegistrationSubmissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        if EventRegistration.objects.filter(event=event, email__iexact=email).exists():
            return Response(
                {
                    'detail': 'Vous êtes déjà inscrit(e) à cet événement avec cet email.',
                    'code': 'duplicate',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer.save(
            event=event,
            submitted_ip=_client_ip(request),
            submitted_user_agent=(request.META.get('HTTP_USER_AGENT', '') or '')[:280],
            referrer=(request.META.get('HTTP_REFERER', '') or '')[:280],
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Événements · Administration'])
class EventRegistrationAdminViewSet(viewsets.ModelViewSet):
    """Read/manage registrations. Moderator+."""

    queryset = EventRegistration.objects.select_related('event')
    serializer_class = EventRegistrationAdminSerializer
    permission_classes = [IsModerator]
    filterset_fields = ('event',)
    search_fields = ('first_name', 'last_name', 'email', 'phone')
    ordering_fields = ('created_at',)

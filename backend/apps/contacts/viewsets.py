"""ViewSets for the contacts module.

- Anonymous: POST only (submit a new message).
- Moderator+: full CRUD + workflow actions (read / handle / archive / spam / assign / reply).
"""
from __future__ import annotations

from drf_spectacular.utils import OpenApiRequest, extend_schema
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from apps.common.permissions import IsModerator

from .filters import ContactMessageFilter
from .models import ContactMessage, ContactReply
from .serializers import (
    ContactAdminSerializer,
    ContactReplySerializer,
    ContactSubmissionSerializer,
)


def _client_ip(request) -> str | None:
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    if xff:
        return xff.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


@extend_schema(tags=['Contacts'])
class ContactViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    """Public POST endpoint (submit a message). No public GET."""

    queryset = ContactMessage.objects.none()
    serializer_class = ContactSubmissionSerializer
    permission_classes = [permissions.AllowAny]
    throttle_scope = 'contact'
    throttle_classes = [ScopedRateThrottle]

    def create(self, request, *args, **kwargs):
        # Silent honeypot: return 201 without saving.
        if request.data.get('hp_field'):
            return Response(
                {'detail': 'Merci pour votre message.'},
                status=status.HTTP_201_CREATED,
            )
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(
            submitted_ip=_client_ip(self.request),
            submitted_user_agent=(self.request.META.get('HTTP_USER_AGENT', '') or '')[:280],
            referrer=(self.request.META.get('HTTP_REFERER', '') or '')[:280],
        )


@extend_schema(tags=['Contacts · Administration'])
class ContactAdminViewSet(viewsets.ModelViewSet):
    """Full CRUD + workflow for staff."""

    queryset = (
        ContactMessage.objects.all()
        .select_related('assigned_to', 'handled_by')
        .prefetch_related('replies__author')
    )
    serializer_class = ContactAdminSerializer
    permission_classes = [IsModerator]
    filterset_class = ContactMessageFilter
    search_fields = ('name', 'email', 'phone', 'subject', 'message')
    ordering_fields = ('created_at', 'priority', 'status', 'read_at', 'handled_at')

    # --- Workflow actions ------------------------------------------
    @extend_schema(summary='Marquer comme lu', request=None,
                   responses={200: ContactAdminSerializer})
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        obj = self.get_object()
        obj.mark_read(by=request.user)
        return Response(self.get_serializer(obj).data)

    @extend_schema(summary='Marquer comme en traitement', request=None,
                   responses={200: ContactAdminSerializer})
    @action(detail=True, methods=['post'])
    def mark_in_progress(self, request, pk=None):
        obj = self.get_object()
        obj.mark_in_progress(by=request.user)
        return Response(self.get_serializer(obj).data)

    @extend_schema(summary='Marquer comme traité', request=None,
                   responses={200: ContactAdminSerializer})
    @action(detail=True, methods=['post'])
    def mark_handled(self, request, pk=None):
        obj = self.get_object()
        obj.mark_handled(by=request.user)
        return Response(self.get_serializer(obj).data)

    @extend_schema(summary='Archiver', request=None,
                   responses={200: ContactAdminSerializer})
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        obj = self.get_object()
        obj.archive()
        return Response(self.get_serializer(obj).data)

    @extend_schema(summary='Marquer comme spam', request=None,
                   responses={200: ContactAdminSerializer})
    @action(detail=True, methods=['post'])
    def mark_spam(self, request, pk=None):
        obj = self.get_object()
        obj.mark_spam()
        return Response(self.get_serializer(obj).data)

    @extend_schema(
        summary='Assigner à un membre',
        description='Body : `{"user_id": <int>}` (ou vide pour désassigner).',
    )
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        obj = self.get_object()
        user_id = request.data.get('user_id')
        if user_id is None or user_id == '':
            obj.assigned_to = None
        else:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                obj.assigned_to = User.objects.get(pk=user_id)
            except User.DoesNotExist:
                return Response(
                    {'detail': 'Utilisateur introuvable.', 'code': 'not_found'},
                    status=404,
                )
        obj.save(update_fields=['assigned_to'])
        return Response(self.get_serializer(obj).data)

    @extend_schema(
        summary='Ajouter une réponse',
        description='Body : `{"body": "<texte>"}`. Créé une `ContactReply` liée. '
                    'L\'envoi email réel se fait dans une phase séparée.',
        responses={201: ContactReplySerializer},
    )
    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        obj = self.get_object()
        body = (request.data.get('body') or '').strip()
        if not body:
            return Response(
                {'detail': 'Le corps de la réponse est requis.', 'code': 'required'},
                status=400,
            )
        reply = ContactReply.objects.create(
            message=obj, author=request.user, body=body,
        )
        # Auto-transition to in_progress if still new/read.
        if obj.status in {ContactMessage.Status.NEW, ContactMessage.Status.READ}:
            obj.mark_in_progress(by=request.user)
        return Response(ContactReplySerializer(reply).data, status=201)

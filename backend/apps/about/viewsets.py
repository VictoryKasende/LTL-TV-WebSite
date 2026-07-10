"""Views for the « À propos » domain.

- ``AboutPageView`` — singleton, GET public / PATCH+PUT Editor+.
- ``CoreValueViewSet`` / ``TeamMemberViewSet`` — public read, Editor+ write.
"""
from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import ReadOnlyOrEditor

from .models import AboutPage, CoreValue, TeamMember
from .serializers import AboutPageSerializer, CoreValueSerializer, TeamMemberSerializer


def _staff(request) -> bool:
    return bool(request.user and request.user.is_authenticated and request.user.is_staff)


@extend_schema(tags=['À propos'])
class AboutPageView(APIView):
    """Singleton — mission / vision / histoire de LTL·TV."""

    permission_classes = [ReadOnlyOrEditor]

    def get(self, request):
        return Response(AboutPageSerializer(AboutPage.load()).data)

    def patch(self, request):
        obj = AboutPage.load()
        ser = AboutPageSerializer(obj, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)

    def put(self, request):
        return self.patch(request)


@extend_schema(tags=['À propos'])
class CoreValueViewSet(viewsets.ModelViewSet):
    """CRUD for the core values displayed on the « À propos » page."""

    queryset = CoreValue.objects.all()
    serializer_class = CoreValueSerializer
    permission_classes = [ReadOnlyOrEditor]
    pagination_class = None
    search_fields = ('title', 'description')
    ordering_fields = ('order', 'title')

    def get_queryset(self):
        return super().get_queryset().order_by('order', 'title')


@extend_schema(tags=['À propos'])
class TeamMemberViewSet(viewsets.ModelViewSet):
    """CRUD for team members. Anonymous users only see active members."""

    queryset = TeamMember.objects.all()
    serializer_class = TeamMemberSerializer
    permission_classes = [ReadOnlyOrEditor]
    filterset_fields = ('category', 'is_active')
    search_fields = ('full_name', 'role', 'bio')
    ordering_fields = ('order', 'full_name', 'created_at')

    def get_queryset(self):
        qs = super().get_queryset().order_by('category', 'order', 'full_name')
        if not _staff(self.request):
            qs = qs.filter(is_active=True)
        return qs

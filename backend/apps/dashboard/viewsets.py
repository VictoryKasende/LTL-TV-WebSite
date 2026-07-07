"""DRF endpoint exposing dashboard stats — for a future React admin app."""
from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import IsAdmin, IsEditor

from . import stats


@extend_schema(tags=['Tableau de bord'])
class DashboardStatsView(APIView):
    """Full dashboard snapshot in one call.

    Response shape::

        {
          "generated_at": "2026-07-07T…",
          "kpi": [{label, value, delta_7d, icon, link, tone}, …],
          "alerts": [{label, link, tone, icon, count}, …],
          "recent": [{kind, title, when, link, icon}, …],
          "publications_chart": {labels: […], series: [{name, data}, …]}
        }
    """

    permission_classes = [IsEditor]

    def get(self, request):
        return Response(stats.full_snapshot())


@extend_schema(tags=['Tableau de bord'])
class DashboardKpiView(APIView):
    """Lightweight endpoint — only the KPI cards. Faster."""

    permission_classes = [IsEditor]

    def get(self, request):
        return Response({'kpi': stats.content_kpis()})


@extend_schema(tags=['Tableau de bord'])
class DashboardAlertsView(APIView):
    """Only moderation alerts — for a notification bell in the top bar."""

    permission_classes = [IsEditor]

    def get(self, request):
        return Response({'alerts': stats.moderation_alerts()})

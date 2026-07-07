from django.urls import path

from .viewsets import DashboardAlertsView, DashboardKpiView, DashboardStatsView

urlpatterns = [
    path('stats/',   DashboardStatsView.as_view(),   name='dashboard-stats'),
    path('kpi/',     DashboardKpiView.as_view(),     name='dashboard-kpi'),
    path('alerts/',  DashboardAlertsView.as_view(),  name='dashboard-alerts'),
]

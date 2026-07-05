"""django-filter FilterSets for the emissions endpoints."""
from __future__ import annotations

import django_filters

from .models import Episode, Show


class ShowFilter(django_filters.FilterSet):
    is_featured = django_filters.BooleanFilter()
    status = django_filters.CharFilter()
    tag = django_filters.CharFilter(field_name='tags__name', lookup_expr='iexact')

    class Meta:
        model = Show
        fields = ('is_featured', 'status', 'tag')


class EpisodeFilter(django_filters.FilterSet):
    show = django_filters.CharFilter(field_name='show__slug', lookup_expr='iexact')
    category = django_filters.CharFilter(field_name='categories__slug', lookup_expr='iexact')
    tag = django_filters.CharFilter(field_name='tags__name', lookup_expr='iexact')
    is_featured = django_filters.BooleanFilter()
    aired_after = django_filters.DateTimeFilter(field_name='aired_at', lookup_expr='gte')
    aired_before = django_filters.DateTimeFilter(field_name='aired_at', lookup_expr='lte')
    speaker = django_filters.CharFilter(field_name='speaker', lookup_expr='icontains')

    class Meta:
        model = Episode
        fields = (
            'show', 'category', 'tag', 'is_featured',
            'aired_after', 'aired_before', 'speaker',
        )

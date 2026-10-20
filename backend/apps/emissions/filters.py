"""django-filter FilterSets for the emissions endpoints."""
from __future__ import annotations

import django_filters
from django.db.models import Q
from django.utils import timezone

from .models import Episode, Series, Show


class ShowFilter(django_filters.FilterSet):
    is_featured = django_filters.BooleanFilter()
    status = django_filters.CharFilter()
    tag = django_filters.CharFilter(field_name='tags__name', lookup_expr='iexact')

    class Meta:
        model = Show
        fields = ('is_featured', 'status', 'tag')


class SeriesFilter(django_filters.FilterSet):
    show = django_filters.CharFilter(field_name='show__slug', lookup_expr='iexact')
    status = django_filters.CharFilter()
    is_featured = django_filters.BooleanFilter()

    class Meta:
        model = Series
        fields = ('show', 'status', 'is_featured')


class EpisodeFilter(django_filters.FilterSet):
    show = django_filters.CharFilter(field_name='show__slug', lookup_expr='iexact')
    series = django_filters.CharFilter(field_name='series__slug', lookup_expr='iexact')
    category = django_filters.CharFilter(field_name='categories__slug', lookup_expr='iexact')
    tag = django_filters.CharFilter(field_name='tags__name', lookup_expr='iexact')
    is_featured = django_filters.BooleanFilter()
    aired_after = django_filters.DateTimeFilter(field_name='aired_at', lookup_expr='gte')
    aired_before = django_filters.DateTimeFilter(field_name='aired_at', lookup_expr='lte')
    speaker = django_filters.CharFilter(field_name='speaker', lookup_expr='icontains')
    # ``?available=true`` — playable now on the site, i.e. leaves out episodes
    # scheduled for a future ``published_at`` (shown elsewhere as locked).
    available = django_filters.BooleanFilter(method='filter_available')

    class Meta:
        model = Episode
        fields = (
            'show', 'series', 'category', 'tag', 'is_featured',
            'aired_after', 'aired_before', 'speaker', 'available',
        )

    def filter_available(self, queryset, name, value):
        if value is None:
            return queryset
        now_or_unset = Q(published_at__isnull=True) | Q(published_at__lte=timezone.now())
        return queryset.filter(now_or_unset) if value else queryset.exclude(now_or_unset)

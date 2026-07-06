import django_filters

from .models import WeeklyProgram


class WeeklyProgramFilter(django_filters.FilterSet):
    date = django_filters.DateFilter()
    date_from = django_filters.DateFilter(field_name='date', lookup_expr='gte')
    date_to = django_filters.DateFilter(field_name='date', lookup_expr='lte')
    program_type = django_filters.CharFilter(
        field_name='program_type__slug', lookup_expr='iexact',
    )
    mode = django_filters.CharFilter()
    is_featured = django_filters.BooleanFilter()

    class Meta:
        model = WeeklyProgram
        fields = ('date', 'date_from', 'date_to', 'program_type', 'mode', 'is_featured')

import django_filters

from .models import ContactMessage


class ContactMessageFilter(django_filters.FilterSet):
    status = django_filters.CharFilter()
    category = django_filters.CharFilter()
    priority = django_filters.CharFilter()
    assigned_to = django_filters.NumberFilter()
    is_assigned = django_filters.BooleanFilter(
        field_name='assigned_to', lookup_expr='isnull', exclude=True,
    )
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = ContactMessage
        fields = ('status', 'category', 'priority', 'assigned_to',
                  'is_assigned', 'created_after', 'created_before')

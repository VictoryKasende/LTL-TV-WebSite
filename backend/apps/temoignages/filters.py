import django_filters

from .models import Testimonial


class TestimonialFilter(django_filters.FilterSet):
    status = django_filters.CharFilter()
    country = django_filters.CharFilter(lookup_expr='iexact')
    city = django_filters.CharFilter(lookup_expr='icontains')
    is_featured = django_filters.BooleanFilter()

    class Meta:
        model = Testimonial
        fields = ('status', 'country', 'city', 'is_featured')

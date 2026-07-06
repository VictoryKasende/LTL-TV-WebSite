import django_filters

from .models import Article


class ArticleFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(field_name='category__slug', lookup_expr='iexact')
    tag = django_filters.CharFilter(field_name='tags__name', lookup_expr='iexact')
    author = django_filters.CharFilter(field_name='author__username', lookup_expr='iexact')
    is_featured = django_filters.BooleanFilter()
    published_after = django_filters.DateTimeFilter(field_name='published_at', lookup_expr='gte')
    published_before = django_filters.DateTimeFilter(field_name='published_at', lookup_expr='lte')

    class Meta:
        model = Article
        fields = ('category', 'tag', 'author', 'is_featured',
                  'published_after', 'published_before')

from rest_framework import viewsets

from .models import Programme
from .serializers import ProgrammeSerializer


class ProgrammeViewSet(viewsets.ModelViewSet):
    queryset = Programme.objects.filter(is_published=True)
    serializer_class = ProgrammeSerializer
    lookup_field = 'slug'

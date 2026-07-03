from rest_framework import mixins, permissions, viewsets

from .models import Temoignage
from .serializers import TemoignageSerializer


class TemoignageViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Public reads only approved témoignages ; anyone can submit."""

    queryset = Temoignage.objects.filter(is_approved=True)
    serializer_class = TemoignageSerializer
    permission_classes = [permissions.AllowAny]

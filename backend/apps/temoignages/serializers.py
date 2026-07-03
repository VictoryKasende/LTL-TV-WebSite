from rest_framework import serializers

from .models import Temoignage


class TemoignageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Temoignage
        fields = '__all__'
        read_only_fields = ('id', 'is_approved', 'created_at')

from rest_framework import serializers

from .models import ProgramType, WeeklyProgram


class ProgramTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgramType
        fields = ('id', 'name', 'slug', 'description', 'color', 'icon', 'order')
        read_only_fields = ('id', 'slug')


class WeeklyProgramListSerializer(serializers.ModelSerializer):
    """Compact serializer for calendar / grid views."""

    program_type = ProgramTypeSerializer(read_only=True)
    program_type_id = serializers.PrimaryKeyRelatedField(
        write_only=True, queryset=ProgramType.objects.all(),
        source='program_type', required=False, allow_null=True,
    )
    is_upcoming = serializers.BooleanField(read_only=True)
    is_online_accessible = serializers.BooleanField(read_only=True)
    thumbnail_url = serializers.CharField(read_only=True)
    embed_url = serializers.CharField(read_only=True)

    class Meta:
        model = WeeklyProgram
        fields = (
            'id', 'slug',
            'date', 'start_time', 'end_time',
            'title', 'description', 'responsable',
            'program_type', 'program_type_id',
            'mode', 'location', 'meeting_url',
            'image', 'youtube_url', 'youtube_id', 'thumbnail_url', 'embed_url', 'order',
            'status', 'published_at', 'is_featured',
            'is_upcoming', 'is_online_accessible',
        )
        read_only_fields = (
            'id', 'slug', 'youtube_id', 'thumbnail_url', 'embed_url',
            'is_upcoming', 'is_online_accessible',
        )


class WeeklyProgramDetailSerializer(WeeklyProgramListSerializer):
    class Meta(WeeklyProgramListSerializer.Meta):
        fields = WeeklyProgramListSerializer.Meta.fields + (
            'description', 'address', 'latitude', 'longitude',
            'meta_title', 'meta_description', 'og_image', 'canonical_url',
            'created_at', 'updated_at',
        )

from rest_framework import serializers

from .models import Banner, BannerImage


class BannerImageSerializer(serializers.ModelSerializer):
    """One image variant. Frontend feeds this into a ``<source>``."""

    class Meta:
        model = BannerImage
        fields = (
            'id', 'variant', 'image',
            'width', 'height', 'min_viewport_width',
        )
        read_only_fields = ('id', 'width', 'height')


class BannerSerializer(serializers.ModelSerializer):
    """One carousel slide with all its image variants."""

    images = BannerImageSerializer(many=True, read_only=True)
    is_active_now = serializers.BooleanField(read_only=True)
    public_title = serializers.CharField(read_only=True)

    class Meta:
        model = Banner
        fields = (
            'id',
            'title',            # internal — kept for admin/debug, not for display
            'public_title',     # what the frontend should actually show visitors
            'link_url', 'link_target',
            'alt_text',
            'is_active', 'starts_at', 'ends_at',
            'order',
            'images',
            'is_active_now',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'is_active_now', 'created_at', 'updated_at')

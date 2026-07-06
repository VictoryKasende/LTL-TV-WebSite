"""Serializers for the testimonials module.

Three distinct shapes:

- ``TestimonialSubmissionSerializer`` — anonymous POST endpoint. Accepts
  both new (``author_name``, ``city``, ``story``) and legacy (``author``,
  ``location``, ``message``) field names so the existing frontend form
  keeps working without changes.
- ``TestimonialPublicSerializer`` — read shape for /list/ and /retrieve/
  by anonymous users. Hides private fields (email, phone, IP, notes).
- ``TestimonialAdminSerializer`` — full shape for Moderator+ users.
"""
from __future__ import annotations

from rest_framework import serializers

from .models import Testimonial


class TestimonialSubmissionSerializer(serializers.ModelSerializer):
    """POST-only. Supports both new and legacy field names."""

    author = serializers.CharField(source='author_name', required=False)
    location = serializers.CharField(source='city', required=False, allow_blank=True)
    message = serializers.CharField(source='story', required=False)

    hp_field = serializers.CharField(
        required=False, allow_blank=True, write_only=True,
        help_text='Champ anti-bot. Laissez vide.',
    )

    class Meta:
        model = Testimonial
        fields = (
            'author', 'author_name', 'author_email', 'author_phone',
            'country', 'city', 'location',
            'title', 'story', 'message', 'story_short',
            'photo', 'is_photo_public',
            'hp_field',
        )
        extra_kwargs = {
            'author_name':     {'required': False},
            'story':           {'required': False},
            'city':            {'required': False, 'allow_blank': True},
        }

    def validate(self, attrs):
        # `source=` on optional fields still populates attrs — normalize.
        if not attrs.get('author_name'):
            raise serializers.ValidationError({
                'author_name': 'Ce champ est obligatoire.',
            })
        if not attrs.get('story'):
            raise serializers.ValidationError({
                'story': 'Ce champ est obligatoire.',
            })
        attrs.pop('hp_field', None)  # never persisted
        return attrs


class TestimonialPublicSerializer(serializers.ModelSerializer):
    """Public read shape. Hides all admin / private fields."""

    photo = serializers.SerializerMethodField()

    class Meta:
        model = Testimonial
        fields = (
            'id', 'slug',
            'author_name', 'country', 'city',
            'title', 'story_short', 'story',
            'photo', 'is_featured',
            'created_at',
        )
        read_only_fields = fields

    def get_photo(self, obj: Testimonial):
        # Respect consent: no photo URL if is_photo_public=False.
        photo = obj.display_photo
        if not photo:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(photo.url) if request else photo.url


class TestimonialAdminSerializer(serializers.ModelSerializer):
    """Full shape for moderators / admins."""

    moderated_by_name = serializers.CharField(source='moderated_by.username', read_only=True)

    class Meta:
        model = Testimonial
        fields = (
            'id', 'slug',
            'author_name', 'author_email', 'author_phone',
            'country', 'city',
            'title', 'story_short', 'story',
            'photo', 'is_photo_public',
            'status', 'moderation_note',
            'moderated_by', 'moderated_by_name', 'moderated_at',
            'is_featured', 'order',
            'submitted_ip', 'submitted_user_agent',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'slug', 'submitted_ip', 'submitted_user_agent',
            'moderated_by_name', 'created_at', 'updated_at',
        )

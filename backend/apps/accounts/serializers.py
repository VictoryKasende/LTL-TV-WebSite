from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(read_only=True)
    display_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'phone', 'avatar', 'bio',
            'is_email_verified', 'display_name', 'role', 'date_joined',
        )
        read_only_fields = ('id', 'is_email_verified', 'display_name', 'role', 'date_joined')


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=10, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'phone')

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

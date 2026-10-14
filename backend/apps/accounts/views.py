from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

from .serializers import RegisterSerializer, UserSerializer

User = get_user_model()


class AuthThrottleMixin:
    """Strict ``auth`` rate limit (10/min) — slows down credential stuffing."""

    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'


class ThrottledTokenObtainPairView(AuthThrottleMixin, TokenObtainPairView):
    pass


class ThrottledTokenRefreshView(AuthThrottleMixin, TokenRefreshView):
    pass


class ThrottledTokenVerifyView(AuthThrottleMixin, TokenVerifyView):
    pass


class RegisterView(AuthThrottleMixin, generics.CreateAPIView):
    """Self-service sign-up. Closed unless ``ALLOW_PUBLIC_REGISTRATION`` is on:
    the public site has no account area, staff accounts are created in the
    admin."""

    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        if not settings.ALLOW_PUBLIC_REGISTRATION:
            raise PermissionDenied('Les inscriptions publiques sont fermées.')
        return super().create(request, *args, **kwargs)


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

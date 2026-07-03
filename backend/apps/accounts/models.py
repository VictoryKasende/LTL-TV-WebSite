from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Extends the default Django user with a couple of profile fields."""

    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=32, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self) -> str:
        return self.email or self.username

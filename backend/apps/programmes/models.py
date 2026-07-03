from django.db import models
from django.utils.text import slugify


class Programme(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    description = models.TextField(blank=True)
    host = models.CharField(max_length=120, blank=True)
    schedule = models.CharField(max_length=120, blank=True,
                                help_text='Ex : Lundi 20h, Samedi 18h30')
    cover = models.ImageField(upload_to='programmes/', blank=True, null=True)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)[:220]
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.title

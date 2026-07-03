from django.db import models


class Temoignage(models.Model):
    author = models.CharField(max_length=120)
    location = models.CharField(max_length=120, blank=True)
    message = models.TextField()
    photo = models.ImageField(upload_to='temoignages/', blank=True, null=True)
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f'{self.author} — {self.created_at:%Y-%m-%d}'

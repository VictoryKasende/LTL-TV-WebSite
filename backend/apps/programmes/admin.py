from django.contrib import admin

from .models import Programme


@admin.register(Programme)
class ProgrammeAdmin(admin.ModelAdmin):
    list_display = ('title', 'host', 'schedule', 'is_published', 'created_at')
    list_filter = ('is_published',)
    search_fields = ('title', 'host')
    prepopulated_fields = {'slug': ('title',)}

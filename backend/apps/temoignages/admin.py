from django.contrib import admin

from .models import Temoignage


@admin.register(Temoignage)
class TemoignageAdmin(admin.ModelAdmin):
    list_display = ('author', 'location', 'is_approved', 'created_at')
    list_filter = ('is_approved',)
    search_fields = ('author', 'message')
    actions = ['approve_selected']

    @admin.action(description='Approuver les témoignages sélectionnés')
    def approve_selected(self, request, queryset):
        queryset.update(is_approved=True)

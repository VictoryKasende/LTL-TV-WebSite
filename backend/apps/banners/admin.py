"""Admin for banners: inline image variants + preview."""
from __future__ import annotations

from django.contrib import admin
from django.core.exceptions import ValidationError
from django.forms.models import BaseInlineFormSet
from django.utils.html import format_html

from apps.common.admin import BaseAdmin, BaseStackedInline, HiddenFieldsAdminMixin, HistoryAdmin

from .forms import BannerAdminForm
from .models import Banner, BannerImage


class BannerImageFormSet(BaseInlineFormSet):
    """An image banner needs at least one image; a video banner needs none
    (its images section is hidden — see banner_kind.js)."""

    # For a video banner the formset holds no forms at all, so the hidden
    # images section is neither validated nor saved (existing images stay
    # untouched). Otherwise its blank slot — whose variant <select> always
    # posts a value — fails validation with an error nobody can see.
    def _is_video_banner(self) -> bool:
        return self.instance.kind == Banner.Kind.VIDEO

    def initial_form_count(self):
        return 0 if self._is_video_banner() else super().initial_form_count()

    def total_form_count(self):
        return 0 if self._is_video_banner() else super().total_form_count()

    def clean(self):
        super().clean()
        if self.instance.kind != Banner.Kind.IMAGE:
            return
        has_image = any(
            form.cleaned_data.get('image') and not form.cleaned_data.get('DELETE')
            for form in self.forms
            if hasattr(form, 'cleaned_data')
        )
        if not has_image:
            raise ValidationError(
                'Ajoutez au moins une image (ou choisissez le type « Vidéo YouTube »).'
            )


class BannerImageInline(HiddenFieldsAdminMixin, BaseStackedInline):
    # Technique, auto-calculé selon la variante si laissé vide (voir
    # BannerImage.save()) — réservé à l'Admin.
    admin_only_fields = ('min_viewport_width',)
    model = BannerImage
    formset = BannerImageFormSet
    extra = 1
    max_num = 4  # one per Variant
    fields = ('variant', 'image', 'preview', 'min_viewport_width', 'width', 'height')
    readonly_fields = ('preview', 'width', 'height')

    def get_extra(self, request, obj=None, **kwargs):
        # On the add page (obj is None) there are no images yet, so show
        # one blank slot to get started. On the change page, once a banner
        # already has at least one image, don't add a free extra blank
        # slot on every visit — the admin clicks "Ajouter un objet Image
        # de bannière supplémentaire" themselves when they actually want one.
        if obj and obj.images.exists():
            return 0
        return super().get_extra(request, obj, **kwargs)

    @admin.display(description='Aperçu')
    def preview(self, obj: BannerImage | None) -> str:
        if not obj or not getattr(obj, 'image', None):
            return '—'
        return format_html(
            '<img src="{}" style="max-width:360px;max-height:180px;'
            'border-radius:6px;object-fit:contain;background:#0f1114" />',
            obj.image.url,
        )


@admin.register(Banner)
class BannerAdmin(HistoryAdmin):
    form = BannerAdminForm
    inlines = [BannerImageInline]
    list_display = (
        'title', 'kind', 'is_active', 'is_active_now_display',
        'starts_at', 'ends_at', 'order', 'images_count',
    )
    list_filter = ('kind', 'is_active')
    list_editable = ('order',)
    search_fields = ('title', 'alt_text')
    ordering = ('order', '-created_at')
    date_hierarchy = 'starts_at'
    radio_fields = {'kind': admin.HORIZONTAL}
    fieldsets = (
        ('Type de bannière', {
            'fields': ('kind',),
            'description': 'Une bannière est soit une image, soit une vidéo YouTube. '
                          'Pour mettre une vidéo en avant, donnez-lui le plus petit ordre '
                          'd\'affichage afin qu\'elle passe en premier.',
        }),
        ('Titre et texte alternatif', {
            'fields': ('title', 'alt_text'),
            'description': 'Le titre est affiché aux visiteurs sur la bannière. Laissé vide, '
                          'un nom de fichier est utilisé en interne pour organiser l\'admin '
                          'mais rien ne s\'affiche sur le carousel public.',
        }),
        ('Vidéo YouTube', {'fields': ('youtube_url',)}),
        ('Cible du clic', {'fields': ('link_url', 'link_target')}),
        ('Planification', {
            'fields': ('is_active', 'starts_at', 'ends_at', 'order'),
        }),
    )

    class Media:
        js = ('banners/admin/banner_kind.js',)

    @admin.display(description='Diffusion actuelle', boolean=True)
    def is_active_now_display(self, obj: Banner) -> bool:
        return obj.is_active_now

    @admin.display(description='Variantes')
    def images_count(self, obj: Banner) -> int:
        return obj.images.count()


@admin.register(BannerImage)
class BannerImageAdmin(HiddenFieldsAdminMixin, BaseAdmin):
    """Standalone image editor. In practice most editing is done inline
    on the Banner. Kept for searchability / bulk swap."""

    admin_only_fields = ('min_viewport_width',)
    list_display = ('banner', 'variant', 'min_viewport_width', 'width', 'height')
    list_filter = ('variant',)
    autocomplete_fields = ('banner',)
    search_fields = ('banner__title',)

"""Admin for the articles CMS."""
from __future__ import annotations

from django.contrib import admin
from django.utils.html import format_html

from apps.common.admin import BaseAdmin, HistoryAdmin, PublishAdminMixin

from .models import Article, Category


@admin.register(Category)
class CategoryAdmin(BaseAdmin):
    list_display = ('name', 'slug', 'articles_count_display',
                    'color_swatch', 'icon', 'order')
    list_editable = ('order',)
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name', 'description')
    ordering = ('order', 'name')
    fieldsets = (
        ('Contenu', {'fields': ('name', 'slug', 'description',
                                'cover', 'color', 'icon', 'order')}),
        ('SEO', {'classes': ('collapse',),
                 'fields': ('meta_title', 'meta_description')}),
    )

    @admin.display(description='Articles publiés')
    def articles_count_display(self, obj: Category) -> int:
        return obj.articles.filter(status=Article.Status.PUBLISHED).count()

    @admin.display(description='Couleur')
    def color_swatch(self, obj: Category) -> str:
        if not obj.color:
            return '—'
        return format_html(
            '<span style="display:inline-block;width:20px;height:20px;'
            'border-radius:4px;background:{};border:1px solid rgba(0,0,0,0.1)"></span> {}',
            obj.color, obj.color,
        )


@admin.register(Article)
class ArticleAdmin(PublishAdminMixin, HistoryAdmin):
    list_display = (
        'title', 'status', 'is_featured', 'category', 'author',
        'reading_time_minutes', 'view_count', 'published_at', 'cover_preview',
    )
    list_filter = ('status', 'is_featured', 'category', 'author', 'no_index')
    list_editable = ('is_featured',)
    search_fields = ('title', 'subtitle', 'excerpt', 'content_md',
                     'author__username', 'author__email')
    prepopulated_fields = {'slug': ('title',)}
    autocomplete_fields = ('author', 'category')
    date_hierarchy = 'published_at'
    readonly_fields = (
        'reading_time_minutes', 'view_count',
        'content_html_preview', 'cover_preview',
        'created_at', 'updated_at',
    )
    ordering = ('-published_at', '-created_at')
    fieldsets = (
        ('Titre & résumé', {
            'fields': ('title', 'slug', 'subtitle', 'excerpt'),
        }),
        ('Contenu (Markdown)', {
            'fields': ('content_md', 'content_html_preview'),
        }),
        ('Auteur & classement', {
            'fields': ('author', 'category'),
        }),
        ('Média', {
            'fields': ('cover', 'cover_preview', 'cover_alt', 'cover_credit'),
        }),
        ('Publication', {
            'fields': ('status', 'published_at', 'is_featured'),
        }),
        ('SEO', {
            'classes': ('collapse',),
            'fields': ('meta_title', 'meta_description', 'og_image',
                       'canonical_url', 'focus_keyword', 'no_index'),
        }),
        ('Statistiques', {
            'classes': ('collapse',),
            'fields': ('reading_time_minutes', 'view_count',
                       'created_at', 'updated_at'),
        }),
    )

    @admin.display(description='Aperçu HTML')
    def content_html_preview(self, obj: Article | None) -> str:
        if not obj or not obj.content_html:
            return '—'
        # Contain the preview so it doesn't blow up the admin layout.
        return format_html(
            '<div style="max-height:400px;overflow:auto;padding:12px;'
            'border:1px solid #ddd;border-radius:6px;background:#fafafa">{}</div>',
            obj.content_html,
        )

    @admin.display(description='Aperçu cover')
    def cover_preview(self, obj: Article | None) -> str:
        if not obj or not obj.cover:
            return '—'
        return format_html(
            '<img src="{}" style="max-width:220px;border-radius:8px" />',
            obj.cover.url,
        )

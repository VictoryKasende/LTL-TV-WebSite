"""Re-sanitize ``content_html`` for articles saved before it was cleaned.

``Article.save()`` now runs the content through nh3; rows written earlier
still hold the raw editor HTML, so rewrite them once here.
"""
import nh3
from django.db import migrations


def sanitize_existing(apps, schema_editor):
    Article = apps.get_model('articles', 'Article')
    for article in Article.objects.exclude(content_md='').only('pk', 'content_md'):
        Article.objects.filter(pk=article.pk).update(content_html=nh3.clean(article.content_md))


class Migration(migrations.Migration):

    dependencies = [
        ('articles', '0005_alter_article_content_html_alter_article_content_md_and_more'),
    ]

    operations = [
        migrations.RunPython(sanitize_existing, migrations.RunPython.noop),
    ]

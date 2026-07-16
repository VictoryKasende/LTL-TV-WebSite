import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, ArrowLeft, ArrowUpRight, BookOpen } from 'lucide-react';
import Container from '../../../components/ui/Container';
import { apiGet, getArticles, type Article } from '../../../lib/api';

export const revalidate = 60;

type Params = { params: { slug: string } };

export async function generateMetadata({ params }: Params) {
  const article = await apiGet<Article>(`/articles/${params.slug}/`);
  if (!article) return { title: 'Article introuvable' };
  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `/articles/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      publishedTime: article.published_at ?? undefined,
      authors: article.author?.display_name ? [article.author.display_name] : undefined,
      images: article.cover ? [{ url: article.cover }] : undefined,
    },
  };
}

const fmt = (iso: string | null) => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }); }
  catch { return ''; }
};

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

export default async function ArticleDetailPage({ params }: Params) {
  const article = await apiGet<Article>(`/articles/${params.slug}/`);
  if (!article) notFound();

  const related = article.category
    ? (await getArticles(`?category=${article.category.slug}&page_size=3`))?.results
        .filter((a) => a.slug !== article.slug)
        .slice(0, 2) ?? []
    : [];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: article.title,
            description: article.excerpt,
            image: article.cover ? [article.cover] : undefined,
            datePublished: article.published_at ?? undefined,
            author: article.author?.display_name
              ? { '@type': 'Person', name: article.author.display_name }
              : undefined,
            publisher: {
              '@type': 'Organization',
              name: 'LTL TV',
              logo: { '@type': 'ImageObject', url: 'https://ltltv.com/notification-icon-512.png' },
            },
            mainEntityOfPage: { '@type': 'WebPage', '@id': `https://ltltv.com/articles/${article.slug}` },
          }),
        }}
      />

      <header className="bg-white">
        <Container size="narrow" className="pt-10 md:pt-14 pb-6">
          <Link href="/articles" className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-brand-700 transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" />
            Tous les articles
          </Link>

          {article.category && (
            <span
              className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-bold mb-4"
              style={{ color: article.category.color }}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: article.category.color }} />
              {article.category.name}
            </span>
          )}
          <h1 className="font-bold text-display-lg text-ink-800 leading-[1.05]">{article.title}</h1>
          {article.excerpt && (
            <p className="mt-5 text-xl text-ink-500 leading-relaxed max-w-2xl">{article.excerpt}</p>
          )}

          <div className="mt-8 pt-6 border-t border-paper-300 flex items-center gap-3">
            {article.author?.avatar ? (
              <img src={article.author.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-terracotta flex items-center justify-center text-sm font-bold text-brand-900">
                {initials(article.author?.display_name || 'LTL')}
              </div>
            )}
            <div className="text-sm text-ink-500">
              {article.author?.display_name && <span className="font-semibold text-ink-800">{article.author.display_name}</span>}
              <div className="flex items-center gap-2 mt-0.5">
                {article.published_at && (
                  <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{fmt(article.published_at)}</span>
                )}
                {article.reading_time_minutes > 0 && (
                  <>
                    <span className="opacity-40">·</span>
                    <span>{article.reading_time_minutes} min de lecture</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </Container>
      </header>

      {article.cover && (
        <div className="max-w-4xl mx-auto px-6 md:px-10 pb-2">
          <img
            src={article.cover}
            alt={article.cover_alt || ''}
            className="w-full aspect-video object-cover rounded-lg"
          />
          {article.cover_credit && (
            <p className="mt-2 text-right text-xs text-ink-400">{article.cover_credit}</p>
          )}
        </div>
      )}

      <section className="bg-white py-10 md:py-14">
        <Container size="narrow">
          {article.content_html ? (
            <article
              className="prose-editorial mx-auto"
              dangerouslySetInnerHTML={{ __html: article.content_html }}
            />
          ) : (
            <p className="italic text-ink-500">Contenu à venir.</p>
          )}

          {article.tags.length > 0 && (
            <div className="max-w-[44rem] mx-auto mt-10 pt-6 border-t border-paper-300 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span key={tag} className="text-xs px-3 py-1.5 rounded-full bg-paper-100 text-ink-500">{tag}</span>
              ))}
            </div>
          )}
        </Container>
      </section>

      {related.length > 0 && (
        <section className="bg-paper-100 py-14 md:py-20">
          <Container>
            <p className="text-xs uppercase tracking-[0.18em] text-amber-500 font-bold mb-8">Continuer la lecture</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
              {related.map((a) => (
                <Link
                  key={a.id}
                  href={`/articles/${a.slug}`}
                  className="group flex flex-col overflow-hidden rounded-lg bg-white shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-brand-900">
                    {a.cover ? (
                      <img src={a.cover} alt={a.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="absolute inset-0 flex items-end p-5"><BookOpen className="h-9 w-9 text-white/40" strokeWidth={1.25} /></div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    {a.category && (
                      <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold" style={{ color: a.category.color }}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: a.category.color }} />
                        {a.category.name}
                      </span>
                    )}
                    <h3 className="font-bold text-lg text-ink-800 leading-snug group-hover:text-brand-700 transition-colors line-clamp-2">{a.title}</h3>
                    <span className="mt-auto pt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-500 group-hover:text-brand-600 transition-colors">
                      Lire l'article
                      <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}

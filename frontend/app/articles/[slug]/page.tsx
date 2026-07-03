import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, ArrowLeft, ArrowUpRight, User } from 'lucide-react';
import Container from '../../../components/ui/Container';
import { apiGet, type Article } from '../../../lib/api';

export const revalidate = 60;

type Params = { params: { slug: string } };

export async function generateMetadata({ params }: Params) {
  const article = await apiGet<Article>(`/articles/${params.slug}/`);
  if (!article) return { title: 'Article introuvable' };
  return {
    title: article.title,
    description: article.excerpt,
  };
}

const fmt = (iso: string | null) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  } catch { return ''; }
};

export default async function ArticleDetailPage({ params }: Params) {
  const article = await apiGet<Article>(`/articles/${params.slug}/`);
  if (!article) notFound();

  return (
    <>
      {/* Hero */}
      <section
        className="relative pt-24 pb-16 md:pt-32 md:pb-20 overflow-hidden"
        style={{
          background: article.cover
            ? undefined
            : 'linear-gradient(180deg, #0D1B2A 0%, #152238 100%)',
        }}
      >
        {article.cover && (
          <>
            <img src={article.cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-ink-900/70 via-ink-900/60 to-ink-900" />
          </>
        )}

        <Container size="narrow" className="relative">
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 text-sm text-cream-100/70 hover:text-gold-400 transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Tous les articles
          </Link>

          {article.category && (
            <span className="inline-flex items-center rounded bg-gold-500/10 border border-gold-500/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold-400 mb-6">
              {article.category.name}
            </span>
          )}

          <h1 className="font-serif text-display-lg font-medium text-cream-50 leading-tight">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="mt-6 text-xl text-cream-100/85 leading-relaxed font-serif italic">
              {article.excerpt}
            </p>
          )}

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-cream-100/70">
            {article.author_name && (
              <span className="inline-flex items-center gap-2">
                <User className="h-4 w-4 text-gold-400" />
                Par <span className="text-cream-50 font-medium">{article.author_name}</span>
              </span>
            )}
            {article.published_at && (
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gold-400" />
                {fmt(article.published_at)}
              </span>
            )}
          </div>
        </Container>
      </section>

      {/* Body */}
      <section className="bg-white py-20 md:py-24">
        <Container size="narrow">
          <article className="prose-editorial">
            {article.content
              ? article.content.split('\n').filter(Boolean).map((para, i) => <p key={i}>{para}</p>)
              : <p className="italic text-ink-500">Contenu à venir.</p>}
          </article>

          <div className="mt-16 pt-8 border-t border-cream-200">
            <Link
              href="/articles"
              className="group inline-flex items-center gap-2 text-sm font-medium text-ink-900 hover:text-gold-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              Retour aux articles
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}

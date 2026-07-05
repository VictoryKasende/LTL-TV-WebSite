import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, ArrowLeft, User } from 'lucide-react';
import Container from '../../../components/ui/Container';
import { apiGet, type Article } from '../../../lib/api';

export const revalidate = 60;

type Params = { params: { slug: string } };

export async function generateMetadata({ params }: Params) {
  const article = await apiGet<Article>(`/articles/${params.slug}/`);
  if (!article) return { title: 'Article introuvable' };
  return { title: article.title, description: article.excerpt };
}

const fmt = (iso: string | null) => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }); }
  catch { return ''; }
};

export default async function ArticleDetailPage({ params }: Params) {
  const article = await apiGet<Article>(`/articles/${params.slug}/`);
  if (!article) notFound();

  return (
    <>
      <section
        className="relative pt-16 pb-14 md:pt-20 md:pb-16 overflow-hidden text-white"
        style={{ background: article.cover ? undefined : 'linear-gradient(180deg, #212870 0%, #141640 100%)' }}
      >
        {article.cover && (
          <>
            <img src={article.cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-brand-900/70 via-brand-900/60 to-brand-900" />
          </>
        )}
        <Container size="narrow" className="relative">
          <Link href="/articles" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            Tous les articles
          </Link>
          {article.category && (
            <span className="inline-flex items-center rounded bg-brand-500/15 border border-brand-500/40 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-200 mb-5">
              {article.category.name}
            </span>
          )}
          <h1 className="font-bold text-display-lg leading-tight">{article.title}</h1>
          {article.excerpt && <p className="mt-5 text-xl text-white/85 leading-relaxed">{article.excerpt}</p>}
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/70">
            {article.author_name && (
              <span className="inline-flex items-center gap-2"><User className="h-4 w-4 text-brand-300" /> Par <span className="text-white font-medium">{article.author_name}</span></span>
            )}
            {article.published_at && (
              <span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4 text-brand-300" /> {fmt(article.published_at)}</span>
            )}
          </div>
        </Container>
      </section>

      <section className="bg-white py-14 md:py-20">
        <Container size="narrow">
          <article className="prose-editorial">
            {article.content
              ? article.content.split('\n').filter(Boolean).map((para, i) => <p key={i}>{para}</p>)
              : <p className="italic text-ink-500">Contenu à venir.</p>}
          </article>
          <div className="mt-12 pt-6 border-t border-paper-300">
            <Link href="/articles" className="group inline-flex items-center gap-2 text-sm font-medium text-ink-800 hover:text-brand-500 transition-colors">
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              Retour aux articles
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Calendar, ArrowUpRight, BookOpen, Newspaper } from 'lucide-react';
import Container from '../ui/Container';
import Spinner from '../ui/Spinner';
import { useResilientData } from '../../lib/useResilientData';
import type { Article, Paginated } from '../../lib/api';

const fmt = (iso: string | null) => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }); }
  catch { return ''; }
};

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

const GRADIENTS = [
  'linear-gradient(135deg, #212870 0%, #3D53EA 100%)',
  'linear-gradient(135deg, #141640 0%, #3D53EA 100%)',
  'linear-gradient(135deg, #212870 0%, #E85521 130%)',
  'linear-gradient(135deg, #3D53EA 0%, #F5C24E 130%)',
];

function Byline({ article }: { article: Article }) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-ink-500">
      {article.author?.avatar ? (
        <img src={article.author.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
      ) : (
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-400 to-terracotta flex items-center justify-center text-[11px] font-bold text-brand-900">
          {initials(article.author?.display_name || 'LTL')}
        </div>
      )}
      {article.author?.display_name && <span className="font-medium text-ink-800">{article.author.display_name}</span>}
      {article.published_at && (
        <>
          <span className="opacity-40">·</span>
          <span>{fmt(article.published_at)}</span>
        </>
      )}
      {article.reading_time_minutes > 0 && (
        <>
          <span className="opacity-40">·</span>
          <span>{article.reading_time_minutes} min de lecture</span>
        </>
      )}
    </div>
  );
}

export default function ArticlesListClient({ initialData }: { initialData: Paginated<Article> | null }) {
  const { data, retrying } = useResilientData(initialData, '/api/v1/articles/');
  const items = data?.results ?? [];
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const seen = new Map<string, { slug: string; name: string; color: string }>();
    for (const a of items) {
      if (a.category && !seen.has(a.category.slug)) {
        seen.set(a.category.slug, { slug: a.category.slug, name: a.category.name, color: a.category.color });
      }
    }
    return [...seen.values()];
  }, [items]);

  const filtered = activeCategory ? items.filter((a) => a.category?.slug === activeCategory) : items;
  const [featured, ...rest] = filtered;

  return (
    <>
      <header className="bg-white border-b border-paper-300">
        <Container className="py-14 md:py-16">
          <p className="text-xs uppercase tracking-[0.18em] text-amber-500 font-bold mb-2 inline-flex items-center gap-2">
            <Newspaper className="h-3.5 w-3.5" strokeWidth={2.5} />
            Le magazine LTL·TV
          </p>
          <h1 className="font-bold text-display-lg text-brand-700 leading-none mb-3">Articles</h1>
          <p className="text-lg text-ink-500 leading-relaxed max-w-xl mb-7">
            Réflexions, portraits et actualités par la rédaction — pour prolonger ce que vous regardez.
          </p>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  activeCategory === null ? 'bg-brand-700 text-white' : 'border border-paper-300 text-ink-500 hover:border-brand-500'
                }`}
              >
                Tout
              </button>
              {categories.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => setActiveCategory(c.slug)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    activeCategory === c.slug ? 'bg-brand-700 text-white' : 'border border-paper-300 text-ink-500 hover:border-brand-500'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: activeCategory === c.slug ? '#fff' : c.color }} />
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </Container>
      </header>

      <section className="bg-paper-100 py-14 md:py-20">
        <Container>
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center gap-3 py-12 text-ink-500">
              {retrying ? (
                <>
                  <Spinner size="sm" className="text-brand-500" />
                  Chargement…
                </>
              ) : (
                'Aucun article pour le moment.'
              )}
            </div>
          ) : (
            <>
              {featured && (
                <Link
                  href={`/articles/${featured.slug}`}
                  className="group grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-14 items-center pb-14 border-b border-paper-300"
                >
                  <div className="relative aspect-[4/3] rounded-lg overflow-hidden" style={{ background: GRADIENTS[0] }}>
                    {featured.cover ? (
                      <img src={featured.cover} alt={featured.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="h-20 w-20 text-white/25" strokeWidth={1} />
                      </div>
                    )}
                  </div>
                  <div>
                    {featured.category && (
                      <span
                        className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-bold mb-4"
                        style={{ color: featured.category.color }}
                      >
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: featured.category.color }} />
                        {featured.category.name}
                      </span>
                    )}
                    <h2 className="font-bold text-display-md text-ink-800 leading-tight group-hover:text-brand-700 transition-colors">
                      {featured.title}
                    </h2>
                    <p className="mt-4 text-lg text-ink-500 leading-relaxed">{featured.excerpt}</p>
                    <div className="mt-6"><Byline article={featured} /></div>
                    <span className="mt-6 inline-flex items-center gap-2 font-semibold text-brand-500 group-hover:text-brand-600 transition-colors">
                      Lire l'article
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </div>
                </Link>
              )}

              {rest.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                  {rest.map((a, i) => (
                    <Link
                      key={a.id}
                      href={`/articles/${a.slug}`}
                      className="group flex flex-col overflow-hidden rounded-lg bg-white shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden" style={{ background: a.cover ? undefined : GRADIENTS[(i + 1) % GRADIENTS.length] }}>
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
                        <p className="text-ink-500 text-sm leading-relaxed line-clamp-3">{a.excerpt}</p>
                        <div className="mt-auto pt-2 text-xs text-ink-500 inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {fmt(a.published_at)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </Container>
      </section>
    </>
  );
}

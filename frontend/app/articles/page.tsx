import Link from 'next/link';
import { Calendar, ArrowUpRight, BookOpen, Newspaper } from 'lucide-react';
import Container from '../../components/ui/Container';
import { getArticles } from '../../lib/api';

export const revalidate = 60;

export const metadata = {
  title: 'Articles',
  description: 'Réflexions, portraits et actualités par la rédaction de LTL TV.',
  alternates: { canonical: '/articles' },
};

const fmt = (iso: string | null) => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }); }
  catch { return ''; }
};

const GRADIENTS = [
  'linear-gradient(135deg, #212870 0%, #3D53EA 100%)',
  'linear-gradient(135deg, #141640 0%, #3D53EA 100%)',
  'linear-gradient(135deg, #212870 0%, #E85521 130%)',
  'linear-gradient(135deg, #3D53EA 0%, #F5C24E 130%)',
];

export default async function ArticlesPage() {
  const data = await getArticles();
  const items = data?.results ?? [];
  const [featured, ...rest] = items;

  return (
    <>
      <section className="bg-brand-700 text-white py-14 md:py-20 relative overflow-hidden">
        <Container className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-brand-200 mb-6">
            <Newspaper className="h-3 w-3" strokeWidth={2.5} />
            À lire
          </div>
          <h1 className="font-bold text-display-lg max-w-3xl">Réflexions, portraits, actualités.</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80 leading-relaxed">
            Les articles de la rédaction pour prolonger la réflexion.
          </p>
        </Container>
      </section>

      <section className="bg-paper-100 py-14 md:py-20">
        <Container>
          {featured && (
            <Link href={`/articles/${featured.slug}`} className="group grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-14 items-center">
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
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-xs uppercase tracking-[0.2em] text-brand-500 font-bold">À la une</span>
                  <div className="h-px w-10 bg-brand-500" />
                  {featured.category && <span className="text-xs uppercase tracking-wider text-ink-500">{featured.category.name}</span>}
                </div>
                <h2 className="font-bold text-display-md text-ink-800 leading-tight group-hover:text-brand-700 transition-colors">
                  {featured.title}
                </h2>
                <p className="mt-4 text-lg text-ink-500 leading-relaxed">{featured.excerpt}</p>
                <div className="mt-6 flex items-center gap-4 text-sm text-ink-500">
                  {featured.author?.display_name && <span>Par {featured.author.display_name}</span>}
                  {featured.published_at && (
                    <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{fmt(featured.published_at)}</span>
                  )}
                </div>
                <span className="mt-6 inline-flex items-center gap-2 font-semibold text-brand-500 group-hover:text-brand-600 transition-colors">
                  Lire l'article
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </Link>
          )}

          {rest.length > 0 && (
            <div className="pt-8 border-t border-paper-300">
              <p className="text-xs uppercase tracking-[0.2em] text-brand-500 font-bold mb-8">— Tous les articles</p>
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
                      {a.category && <span className="text-xs uppercase tracking-wider text-brand-500 font-bold">{a.category.name}</span>}
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
            </div>
          )}
        </Container>
      </section>
    </>
  );
}

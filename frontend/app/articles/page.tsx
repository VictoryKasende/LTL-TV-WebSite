import Link from 'next/link';
import { Calendar, ArrowUpRight, BookOpen, Newspaper } from 'lucide-react';
import Container from '../../components/ui/Container';
import { apiGet, type Paginated, type Article } from '../../lib/api';

export const revalidate = 60;

export const metadata = {
  title: 'Articles',
  description: 'Réflexions, portraits et actualités par la rédaction de LTL TV.',
};

const FALLBACK: Article[] = [
  { id: 1, slug: 'la-priere-au-quotidien', title: 'La prière au quotidien : trouver le temps de s\'arrêter', excerpt: 'Dans un monde qui court, apprendre à faire une pause change tout. Cinq idées simples pour retrouver ce rendez-vous intérieur.', content: '', cover: null, author_name: 'Rédaction LTL', category: { id: 1, name: 'Spiritualité', slug: 'spiritualite' }, published_at: '2026-06-24T09:00:00Z', created_at: '' },
  { id: 2, slug: 'jeunesse-et-esperance', title: 'Jeunesse et espérance : ce que nous apprend cette génération', excerpt: 'Portrait d\'une nouvelle génération qui cherche du sens et invente d\'autres façons de croire.', content: '', cover: null, author_name: 'Grâce Ilunga', category: { id: 2, name: 'Société', slug: 'societe' }, published_at: '2026-06-15T09:00:00Z', created_at: '' },
  { id: 3, slug: 'construire-la-paix', title: 'Construire la paix commence chez soi', excerpt: 'De la famille au quartier, un chemin patient qui commence par les gestes du quotidien.', content: '', cover: null, author_name: 'Jean-Paul Kalombo', category: { id: 3, name: 'Réflexion', slug: 'reflexion' }, published_at: '2026-06-08T09:00:00Z', created_at: '' },
  { id: 4, slug: 'louange-et-liberation', title: 'La louange, une école de libération intérieure', excerpt: 'Ce que la musique nous fait, ce qu\'elle dit de nous, ce qu\'elle change en nous.', content: '', cover: null, author_name: 'Rédaction LTL', category: { id: 4, name: 'Musique', slug: 'musique' }, published_at: '2026-06-01T09:00:00Z', created_at: '' },
  { id: 5, slug: 'famille-recomposee', title: 'Famille recomposée : construire ensemble sans effacer', excerpt: 'Comment inventer une nouvelle unité familiale en respectant les histoires de chacun.', content: '', cover: null, author_name: 'Ruth Mukendi', category: { id: 5, name: 'Famille', slug: 'famille' }, published_at: '2026-05-25T09:00:00Z', created_at: '' },
  { id: 6, slug: 'silence-et-attention', title: 'Le silence, cet allié négligé', excerpt: 'Redécouvrir la puissance des moments où l\'on ne dit rien.', content: '', cover: null, author_name: 'Émilie Nsamba', category: { id: 3, name: 'Réflexion', slug: 'reflexion' }, published_at: '2026-05-18T09:00:00Z', created_at: '' },
];

const fmt = (iso: string | null) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch { return ''; }
};

const GRADIENTS = [
  'linear-gradient(135deg, #0D1B2A 0%, #6C3D00 80%, #F5A623 130%)',
  'linear-gradient(135deg, #152238 0%, #F5A623 130%)',
  'linear-gradient(135deg, #0D1B2A 0%, #A76B08 100%)',
  'linear-gradient(135deg, #1B2637 0%, #F5A623 130%)',
];

export default async function ArticlesPage() {
  const data = await apiGet<Paginated<Article>>('/articles/');
  const items = data?.results?.length ? data.results : FALLBACK;
  const [featured, ...rest] = items;

  return (
    <>
      {/* Hero */}
      <section className="bg-ink-900 text-cream-50 pt-24 pb-20 md:pt-32 md:pb-28 relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(60% 60% at 20% 80%, rgba(245,166,35,0.12), transparent 70%)' }} />
        <Container className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-gold-400 mb-8">
            <Newspaper className="h-3 w-3" strokeWidth={2.5} />
            À lire
          </div>
          <h1 className="font-serif text-display-lg font-medium max-w-3xl">
            Réflexions, portraits, <span className="italic text-gold-400">actualités</span>.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-cream-100/80 leading-relaxed">
            Les articles de la rédaction pour prolonger la réflexion au-delà de
            l'antenne.
          </p>
        </Container>
      </section>

      {/* Featured + grid */}
      <section className="bg-cream-50 py-20 md:py-24">
        <Container>
          {/* Featured */}
          {featured && (
            <Link
              href={`/articles/${featured.slug}`}
              className="group grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16 md:mb-20 items-center"
            >
              <div
                className="relative aspect-[4/3] rounded-lg overflow-hidden"
                style={{ background: GRADIENTS[0] }}
              >
                {featured.cover ? (
                  <img src={featured.cover} alt={featured.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BookOpen className="h-20 w-20 text-gold-400/40" strokeWidth={1} />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-xs uppercase tracking-[0.2em] text-gold-600 font-semibold">À la une</span>
                  <div className="h-px w-12 bg-gold-500" />
                  {featured.category && (
                    <span className="text-xs uppercase tracking-wider text-ink-500">{featured.category.name}</span>
                  )}
                </div>
                <h2 className="font-serif text-display-md font-medium text-ink-900 leading-tight group-hover:text-gold-700 transition-colors">
                  {featured.title}
                </h2>
                <p className="mt-6 text-lg text-ink-600 leading-relaxed">{featured.excerpt}</p>
                <div className="mt-8 flex items-center gap-4 text-sm text-ink-500">
                  {featured.author_name && <span>Par {featured.author_name}</span>}
                  {featured.published_at && (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {fmt(featured.published_at)}
                    </span>
                  )}
                </div>
                <span className="mt-8 inline-flex items-center gap-2 font-medium text-ink-900 group-hover:text-gold-600 transition-colors">
                  Lire l'article
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </Link>
          )}

          {rest.length > 0 && (
            <div className="pt-8 border-t border-cream-200">
              <p className="text-xs uppercase tracking-[0.2em] text-gold-600 font-semibold mb-10">
                — Tous les articles
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {rest.map((a, i) => (
                  <Link
                    key={a.id}
                    href={`/articles/${a.slug}`}
                    className="group flex flex-col overflow-hidden rounded-lg bg-white shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
                  >
                    <div
                      className="relative aspect-[16/10] overflow-hidden"
                      style={{ background: a.cover ? undefined : GRADIENTS[(i + 1) % GRADIENTS.length] }}
                    >
                      {a.cover ? (
                        <img src={a.cover} alt={a.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      ) : (
                        <div className="absolute inset-0 flex items-end p-6">
                          <BookOpen className="h-10 w-10 text-gold-400/50" strokeWidth={1.25} />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-6">
                      {a.category && (
                        <span className="text-xs uppercase tracking-wider text-gold-600 font-semibold">
                          {a.category.name}
                        </span>
                      )}
                      <h3 className="font-serif text-xl font-medium text-ink-900 leading-snug group-hover:text-gold-700 transition-colors line-clamp-2">
                        {a.title}
                      </h3>
                      <p className="text-ink-600 text-sm leading-relaxed line-clamp-3">{a.excerpt}</p>
                      <div className="mt-auto pt-3 text-xs text-ink-500 inline-flex items-center gap-1.5">
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

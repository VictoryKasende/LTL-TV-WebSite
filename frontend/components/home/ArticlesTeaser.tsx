import Link from 'next/link';
import { Calendar, ArrowUpRight, BookOpen } from 'lucide-react';
import { apiGet, type Paginated, type Article } from '../../lib/api';
import SectionHeading from '../ui/SectionHeading';
import Container from '../ui/Container';

const FALLBACK: Article[] = [
  { id: 1, slug: 'la-priere-au-quotidien', title: 'La prière au quotidien : trouver le temps de s\'arrêter', excerpt: 'Dans un monde qui court, apprendre à faire une pause change tout. Cinq idées simples pour retrouver ce rendez-vous intérieur.', content: '', cover: null, author_name: 'Rédaction LTL', category: { id: 1, name: 'Spiritualité', slug: 'spiritualite' }, published_at: '2026-06-24T09:00:00Z', created_at: '' },
  { id: 2, slug: 'jeunesse-et-esperance', title: 'Jeunesse et espérance : ce que nous apprend cette génération', excerpt: 'Portrait d\'une nouvelle génération qui cherche du sens et invente d\'autres façons de croire.', content: '', cover: null, author_name: 'Grâce Ilunga', category: { id: 2, name: 'Société', slug: 'societe' }, published_at: '2026-06-15T09:00:00Z', created_at: '' },
  { id: 3, slug: 'construire-la-paix', title: 'Construire la paix commence chez soi', excerpt: 'De la famille au quartier — un chemin patient qui commence par les gestes du quotidien.', content: '', cover: null, author_name: 'Jean-Paul Kalombo', category: { id: 3, name: 'Réflexion', slug: 'reflexion' }, published_at: '2026-06-08T09:00:00Z', created_at: '' },
];

const fmt = (iso: string | null) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch { return ''; }
};

export default async function ArticlesTeaser() {
  const data = await apiGet<Paginated<Article>>('/articles/');
  const items = (data?.results?.length ? data.results : FALLBACK).slice(0, 3);
  const [featured, ...rest] = items;

  return (
    <section className="bg-cream-50 py-24 md:py-32">
      <Container>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          <SectionHeading
            index="03"
            eyebrow="À lire"
            title="Réflexions et actualités"
            description="Nos articles pour prolonger la réflexion au-delà de l'antenne."
          />
          <Link
            href="/articles"
            className="group inline-flex items-center gap-2 self-start text-sm font-medium text-ink-900 hover:text-gold-600 transition-colors"
          >
            Tous les articles
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Featured */}
          {featured && (
            <Link
              href={`/articles/${featured.slug}`}
              className="group lg:col-span-7 flex flex-col overflow-hidden rounded-lg bg-white shadow-card hover:shadow-card-hover transition-all duration-300"
            >
              <div
                className="relative aspect-[16/10] overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #6C3D00 80%, #F5A623 130%)' }}
              >
                {featured.cover ? (
                  <img src={featured.cover} alt={featured.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <div className="absolute inset-0 flex items-end p-8">
                    <BookOpen className="h-16 w-16 text-gold-400/50" strokeWidth={1} />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-4 p-8 md:p-10">
                {featured.category && (
                  <span className="inline-flex items-center gap-1.5 self-start rounded bg-gold-100 text-gold-700 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                    {featured.category.name}
                  </span>
                )}
                <h3 className="font-serif text-3xl md:text-4xl font-medium text-ink-900 leading-tight group-hover:text-gold-700 transition-colors">
                  {featured.title}
                </h3>
                <p className="text-ink-600 leading-relaxed">{featured.excerpt}</p>
                <div className="mt-auto pt-4 flex items-center gap-4 text-sm text-ink-500">
                  {featured.author_name && <span>Par {featured.author_name}</span>}
                  {featured.published_at && (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {fmt(featured.published_at)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )}

          {/* Rest */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {rest.map((a) => (
              <Link
                key={a.id}
                href={`/articles/${a.slug}`}
                className="group flex gap-5 rounded-lg bg-white p-5 shadow-card hover:shadow-card-hover transition-all duration-300"
              >
                <div
                  className="hidden sm:block h-24 w-24 shrink-0 rounded"
                  style={{ background: 'linear-gradient(135deg, #152238 0%, #F5A623 130%)' }}
                >
                  {a.cover && <img src={a.cover} alt="" className="h-full w-full object-cover rounded" />}
                </div>
                <div className="flex flex-col gap-2 min-w-0">
                  {a.category && (
                    <span className="text-xs font-semibold uppercase tracking-wider text-gold-600">
                      {a.category.name}
                    </span>
                  )}
                  <h4 className="font-serif text-xl font-medium text-ink-900 leading-snug group-hover:text-gold-700 transition-colors line-clamp-2">
                    {a.title}
                  </h4>
                  <p className="text-sm text-ink-500 mt-auto">
                    {fmt(a.published_at)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

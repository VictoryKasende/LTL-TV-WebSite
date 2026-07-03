import Link from 'next/link';
import { Clock, User, Radio } from 'lucide-react';
import Container from '../../components/ui/Container';
import { apiGet, type Paginated, type Programme } from '../../lib/api';

export const revalidate = 60;

export const metadata = {
  title: 'Programmes',
  description: 'La grille complète des programmes LTL TV : émissions, animateurs et horaires.',
};

const FALLBACK: Programme[] = [
  { id: 1, slug: 'lumiere-du-matin', title: 'Lumière du matin', host: 'Pasteur Élie Mbaya', schedule: 'Lundi — Vendredi · 07h00', description: 'Une méditation matinale pour bien commencer la journée, entre lecture, prière et réflexion.', cover: null, is_published: true, created_at: '' },
  { id: 2, slug: 'temoins-vivants', title: 'Témoins vivants', host: 'Grâce Ilunga', schedule: 'Samedi · 20h30', description: 'Chaque semaine, des rencontres avec ceux dont la vie a été transformée.', cover: null, is_published: true, created_at: '' },
  { id: 3, slug: 'debat-de-la-lumiere', title: 'Le débat de la lumière', host: 'Jean-Paul Kalombo', schedule: 'Dimanche · 18h00', description: 'Discussion et éclairage sur les grandes questions de société, avec des invités engagés.', cover: null, is_published: true, created_at: '' },
  { id: 4, slug: 'jeunesse-en-action', title: 'Jeunesse en action', host: 'Émilie Nsamba', schedule: 'Mercredi · 19h00', description: 'Un magazine pensé pour et par les jeunes : reportages, portraits, débats.', cover: null, is_published: true, created_at: '' },
  { id: 5, slug: 'famille-au-coeur', title: 'Famille au cœur', host: 'Ruth & David Mukendi', schedule: 'Vendredi · 20h00', description: 'Les enjeux du couple, de la parentalité et de la vie de famille abordés avec pudeur et humour.', cover: null, is_published: true, created_at: '' },
  { id: 6, slug: 'musique-et-louange', title: 'Musique et louange', host: 'Chorale LTL', schedule: 'Dimanche · 10h00', description: 'Un concentré de louange, avec les meilleurs artistes de la scène gospel francophone.', cover: null, is_published: true, created_at: '' },
];

const GRADIENTS = [
  'linear-gradient(135deg, #0D1B2A 0%, #F5A623 130%)',
  'linear-gradient(135deg, #1B2637 0%, #6C3D00 100%)',
  'linear-gradient(135deg, #152238 0%, #F5A623 130%)',
  'linear-gradient(135deg, #0D1B2A 0%, #A76B08 100%)',
];

export default async function ProgrammesPage() {
  const data = await apiGet<Paginated<Programme>>('/programmes/');
  const items = data?.results?.length ? data.results : FALLBACK;

  return (
    <>
      {/* Hero */}
      <section className="bg-ink-900 text-cream-50 pt-24 pb-20 md:pt-32 md:pb-28 relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(60% 60% at 80% 30%, rgba(245,166,35,0.15), transparent 70%)' }} />
        <Container className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-gold-400 mb-8">
            <Radio className="h-3 w-3" strokeWidth={2.5} />
            Notre grille
          </div>
          <h1 className="font-serif text-display-lg font-medium max-w-3xl">
            Nos <span className="italic text-gold-400">programmes</span> à l'antenne.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-cream-100/80 leading-relaxed">
            Retrouvez toutes nos émissions, leurs animateurs et leurs horaires de diffusion.
            LTL TV, en direct 24 heures sur 24.
          </p>
        </Container>
      </section>

      {/* Liste */}
      <section className="bg-cream-100 py-20 md:py-24">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {items.map((p, i) => (
              <Link
                key={p.id}
                href={`/programmes/${p.slug}`}
                className="group flex flex-col overflow-hidden rounded-lg bg-white shadow-card hover:shadow-card-hover transition-all duration-300 ease-out-editorial hover:-translate-y-1"
              >
                <div
                  className="relative aspect-[16/10] overflow-hidden"
                  style={{ background: p.cover ? undefined : GRADIENTS[i % GRADIENTS.length] }}
                >
                  {p.cover ? (
                    <img src={p.cover} alt={p.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="absolute inset-0 flex items-end p-6">
                      <span className="font-serif text-6xl font-medium italic text-cream-50/25 leading-none">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                  )}
                  {p.schedule && (
                    <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded bg-ink-900/85 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-gold-400">
                      <Clock className="h-3.5 w-3.5" strokeWidth={2.5} />
                      {p.schedule}
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-3 p-6">
                  {p.host && (
                    <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.15em] text-ink-500">
                      <User className="h-3.5 w-3.5" strokeWidth={2.5} />
                      {p.host}
                    </div>
                  )}
                  <h3 className="font-serif text-2xl font-medium text-ink-900 group-hover:text-gold-700 transition-colors">
                    {p.title}
                  </h3>
                  {p.description && (
                    <p className="text-ink-600 leading-relaxed line-clamp-3">{p.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}

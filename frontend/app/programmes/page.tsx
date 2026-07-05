import Link from 'next/link';
import { Clock, User, Radio } from 'lucide-react';
import Container from '../../components/ui/Container';
import { apiGet, type Paginated, type Programme } from '../../lib/api';

export const revalidate = 60;

export const metadata = {
  title: 'Grille TV',
  description: 'La grille complète des programmes LTL TV : émissions, animateurs et horaires.',
};

const FALLBACK: Programme[] = [
  { id: 1, slug: 'prends-courage',        title: 'Prends Courage',        host: 'Pasteur Élie Mbaya',    schedule: 'Lundi — Vendredi · 07h00', description: 'Une méditation matinale pour bien commencer la journée.', cover: null, is_published: true, created_at: '' },
  { id: 2, slug: 'dans-les-profondeurs',  title: 'Dans Les Profondeurs',  host: 'Grâce Ilunga',          schedule: 'Samedi · 20h30',            description: 'Enseignement approfondi de la Parole, verset par verset.', cover: null, is_published: true, created_at: '' },
  { id: 3, slug: 'rafraichissement',      title: 'Rafraîchissement Matinée', host: 'Chorale LTL',         schedule: 'Dimanche · 07h00',           description: 'Louange, prière et Parole pour bien démarrer le dimanche.', cover: null, is_published: true, created_at: '' },
  { id: 4, slug: 'live-zoom-guerison',    title: 'LIVE Zoom Guérison & Restauration', host: 'Dr Jonathan Odia', schedule: 'Mensuel · 18h00',    description: 'Rendez-vous mensuel de délivrance et d\'espérance.', cover: null, is_published: true, created_at: '' },
  { id: 5, slug: 'famille-au-coeur',      title: 'Famille au cœur',       host: 'Ruth & David Mukendi',  schedule: 'Vendredi · 20h00',          description: 'Les enjeux du couple, de la parentalité et de la vie de famille.', cover: null, is_published: true, created_at: '' },
  { id: 6, slug: 'jeunesse-en-action',    title: 'Jeunesse en action',    host: 'Émilie Nsamba',          schedule: 'Mercredi · 19h00',          description: 'Un magazine pensé pour et par les jeunes.', cover: null, is_published: true, created_at: '' },
];

const GRADIENTS = [
  'linear-gradient(135deg, #212870 0%, #3D53EA 100%)',
  'linear-gradient(135deg, #212870 0%, #E85521 130%)',
  'linear-gradient(135deg, #3D53EA 0%, #F5C24E 130%)',
  'linear-gradient(135deg, #141640 0%, #3D53EA 100%)',
];

export default async function ProgrammesPage() {
  const data = await apiGet<Paginated<Programme>>('/programmes/');
  const items = data?.results?.length ? data.results : FALLBACK;

  return (
    <>
      <section className="bg-brand-700 text-white py-14 md:py-20 relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(60% 60% at 80% 30%, rgba(61,83,234,0.4), transparent 70%)' }} />
        <Container className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-brand-200 mb-6">
            <Radio className="h-3 w-3" strokeWidth={2.5} />
            Grille TV
          </div>
          <h1 className="font-bold text-display-lg max-w-3xl">
            Nos programmes à l'antenne.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80 leading-relaxed">
            Retrouvez toutes nos émissions, leurs animateurs et leurs horaires.
            LTL TV, en direct 24 heures sur 24.
          </p>
        </Container>
      </section>

      <section className="bg-paper-100 py-14 md:py-20">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {items.map((p, i) => (
              <Link
                key={p.id}
                href={`/programmes/${p.slug}`}
                className="group flex flex-col overflow-hidden rounded-lg bg-white shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className="relative aspect-[16/10] overflow-hidden"
                  style={{ background: p.cover ? undefined : GRADIENTS[i % GRADIENTS.length] }}
                >
                  {p.cover && (
                    <img src={p.cover} alt={p.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  )}
                  {p.schedule && (
                    <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded bg-ink-900/85 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-brand-200">
                      <Clock className="h-3.5 w-3.5" strokeWidth={2.5} />
                      {p.schedule}
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  {p.host && (
                    <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-ink-500 font-semibold">
                      <User className="h-3.5 w-3.5" strokeWidth={2.5} />
                      {p.host}
                    </div>
                  )}
                  <h3 className="font-bold text-xl text-ink-800 group-hover:text-brand-700 transition-colors">
                    {p.title}
                  </h3>
                  {p.description && (
                    <p className="text-ink-500 leading-relaxed line-clamp-3 text-sm">{p.description}</p>
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

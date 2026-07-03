import Link from 'next/link';
import { Clock, User, ArrowUpRight } from 'lucide-react';
import { apiGet, type Paginated, type Programme } from '../../lib/api';
import SectionHeading from '../ui/SectionHeading';
import Container from '../ui/Container';

// fallback data so the section looks alive even before the CMS is populated
const FALLBACK: Programme[] = [
  { id: 1, slug: 'lumiere-du-matin', title: 'Lumière du matin', host: 'Pasteur Élie Mbaya', schedule: 'Lundi — Vendredi · 07h00', description: 'Une méditation matinale pour bien commencer la journée.', cover: null, is_published: true, created_at: '' },
  { id: 2, slug: 'temoins-vivants', title: 'Témoins vivants', host: 'Grâce Ilunga', schedule: 'Samedi · 20h30', description: 'Des rencontres avec ceux dont la vie a été transformée.', cover: null, is_published: true, created_at: '' },
  { id: 3, slug: 'debat-de-la-lumiere', title: 'Le débat de la lumière', host: 'Jean-Paul Kalombo', schedule: 'Dimanche · 18h00', description: 'Discussion et éclairage sur les questions d’actualité.', cover: null, is_published: true, created_at: '' },
];

const GRADIENTS = [
  'linear-gradient(135deg, #0D1B2A 0%, #1B2637 55%, #F5A623 130%)',
  'linear-gradient(135deg, #152238 0%, #6C3D00 100%)',
  'linear-gradient(135deg, #1B2637 0%, #F5A623 130%)',
];

export default async function ProgrammesTeaser() {
  const data = await apiGet<Paginated<Programme>>('/programmes/');
  const items = (data?.results?.length ? data.results : FALLBACK).slice(0, 3);

  return (
    <section className="bg-cream-100 py-24 md:py-32">
      <Container>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          <SectionHeading
            index="01"
            eyebrow="Notre grille"
            title="Programmes qui rassemblent"
            description="Chaque semaine, des rendez-vous pour nourrir la foi, l'esprit et le cœur — à l'antenne 24 heures sur 24."
          />
          <Link
            href="/programmes"
            className="group inline-flex items-center gap-2 self-start text-sm font-medium text-ink-900 hover:text-gold-600 transition-colors"
          >
            Voir toute la grille
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
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
                  <img
                    src={p.cover}
                    alt={p.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
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
                  <p className="text-ink-600 leading-relaxed line-clamp-3">
                    {p.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

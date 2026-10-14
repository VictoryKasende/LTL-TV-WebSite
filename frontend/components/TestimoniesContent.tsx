'use client';

import { useState } from 'react';
import Container from './ui/Container';
import Spinner from './ui/Spinner';
import { useResilientData } from '../lib/useResilientData';
import type { Paginated, Temoignage } from '../lib/api';

const AVATAR_GRADIENTS = [
  'from-brand-400 to-brand-700',
  'from-terracotta to-signal-500',
  'from-signal-400 to-terracotta',
  'from-brand-300 to-signal-500',
];

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function Card({ item, index }: { item: Temoignage; index: number }) {
  const place = [item.city, item.country].filter(Boolean).join(', ');
  const [expanded, setExpanded] = useState(false);
  // story_short is either auto-truncated from the story or written by the
  // team — either way, offer the full text whenever it says something more.
  const hasMore = !!item.story_short && item.story.trim() !== item.story_short.trim();
  return (
    <div
      className={`relative rounded-xl bg-white border p-6 flex flex-col gap-3.5 ${
        item.is_featured ? 'border-signal-500 ring-1 ring-signal-500' : 'border-paper-200'
      }`}
    >
      {item.is_featured && (
        <span className="absolute -top-2.5 left-5 rounded-full bg-signal-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5">
          À la une
        </span>
      )}
      <div className="flex items-center gap-3">
        {item.photo ? (
          <img
            src={item.photo}
            alt={item.author_name}
            className="h-11 w-11 rounded-full object-cover shrink-0"
          />
        ) : (
          <div
            className={`h-11 w-11 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length]} flex items-center justify-center font-bold text-sm text-white shrink-0`}
          >
            {initials(item.author_name)}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-bold text-sm text-ink-800 truncate">{item.author_name}</p>
          {place && <p className="text-xs text-ink-500 truncate">{place}</p>}
        </div>
      </div>
      {item.title && (
        <h3 className="font-bold text-ink-800 leading-snug">{item.title}</h3>
      )}
      <span aria-hidden className="font-serif text-3xl leading-none text-signal-500/60">&ldquo;</span>
      <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-line">
        {expanded ? item.story : (item.story_short || item.story)}
      </p>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="self-start text-sm font-semibold text-brand-600 hover:text-brand-800 transition-colors"
        >
          {expanded ? 'Réduire' : 'Lire la suite'}
        </button>
      )}
    </div>
  );
}

export default function TestimoniesContent({ initialData }: { initialData: Paginated<Temoignage> | null }) {
  const { data, retrying } = useResilientData(initialData, '/api/v1/temoignages/');
  const items = data?.results ?? [];
  const sorted = [...items].sort((a, b) => Number(b.is_featured) - Number(a.is_featured));

  return (
    <>
      <section className="bg-brand-700 text-white py-16 md:py-20">
        <Container size="narrow" className="text-center flex flex-col items-center gap-4">
          <h1 className="font-bold text-display-lg">Témoignages</h1>
          <p className="max-w-xl text-white/75 leading-relaxed">
            Des vies touchées par les émissions de LTL·TV, racontées par celles et ceux qui les vivent chaque semaine.
          </p>
          <a
            href="#partager"
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-signal-400 text-brand-900 font-bold px-6 py-3 text-sm hover:bg-signal-500 transition-colors"
          >
            Partager mon témoignage
          </a>
        </Container>
      </section>

      <section className="bg-cream py-16 md:py-20">
        <Container>
          <div className="flex items-end justify-between gap-6 flex-wrap mb-10">
            <h2 className="font-bold text-display-md text-brand-700">Ce qu'ils en disent</h2>
            {items.length > 0 && (
              <p className="text-sm text-ink-500">
                <span className="font-bold text-brand-700 tabular-nums">{items.length}</span>{' '}
                témoignage{items.length > 1 ? 's' : ''} partagé{items.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {sorted.length === 0 ? (
            <div className="flex items-center justify-center gap-3 py-12 text-ink-500">
              {retrying ? (
                <>
                  <Spinner size="sm" className="text-brand-500" />
                  Chargement…
                </>
              ) : (
                'Soyez le premier à partager votre histoire ci-dessous.'
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {sorted.map((item, index) => (
                <Card key={item.id} item={item} index={index} />
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}

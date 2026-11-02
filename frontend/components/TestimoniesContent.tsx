'use client';

import { useState } from 'react';
import Container from './ui/Container';
import Spinner from './ui/Spinner';
import { useResilientData } from '../lib/useResilientData';
import type { Paginated, Temoignage } from '../lib/api';

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function Card({ item }: { item: Temoignage }) {
  const place = [item.city, item.country].filter(Boolean).join(', ');
  const [expanded, setExpanded] = useState(false);
  // story_short is either auto-truncated from the story or written by the
  // team — either way, offer the full text whenever it says something more.
  const hasMore = !!item.story_short && item.story.trim() !== item.story_short.trim();
  const featured = item.is_featured;
  return (
    <figure
      className={`rounded p-6 md:p-7 flex flex-col ${
        featured ? 'bg-brand-700 text-white' : 'bg-white text-ink-800 shadow-card'
      }`}
    >
      {/* Fixed height: the display-font glyph leaves a tall empty box below it. */}
      <div className="h-8 flex items-start justify-between gap-4">
        <span
          aria-hidden
          className={`font-display text-6xl leading-[0.8] ${featured ? 'text-brand-300' : 'text-brand-500'}`}
        >
          &ldquo;
        </span>
        {featured && (
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-signal-300">
            À la une
          </span>
        )}
      </div>

      {item.title && (
        <h3 className="mt-4 font-bold text-lg leading-snug">{item.title}</h3>
      )}
      <blockquote
        className={`mt-3 leading-relaxed whitespace-pre-line ${featured ? 'text-white/85' : 'text-ink-700'}`}
      >
        {expanded ? item.story : (item.story_short || item.story)}
      </blockquote>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className={`mt-3 self-start text-sm font-bold underline underline-offset-4 transition-colors ${
            featured
              ? 'text-white decoration-white/40 hover:decoration-white'
              : 'text-brand-500 decoration-brand-500/40 hover:decoration-brand-500'
          }`}
        >
          {expanded ? 'Réduire' : 'Lire la suite'}
        </button>
      )}

      {/* Signature pinned to the bottom so authors line up across a row. */}
      <div className="flex-1 min-h-6" />
      <figcaption
        className={`pt-5 flex items-center gap-3 border-t ${featured ? 'border-white/15' : 'border-paper-200'}`}
      >
        {item.photo ? (
          <img
            src={item.photo}
            alt={item.author_name}
            className="h-10 w-10 rounded-full object-cover shrink-0"
          />
        ) : (
          <div
            className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
              featured ? 'bg-white text-brand-700' : 'bg-brand-700 text-white'
            }`}
          >
            {initials(item.author_name)}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-bold text-sm truncate">{item.author_name}</p>
          {place && (
            <p className={`text-xs truncate ${featured ? 'text-white/60' : 'text-ink-500'}`}>{place}</p>
          )}
        </div>
      </figcaption>
    </figure>
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

      <section className="bg-brand-50 py-16 md:py-20">
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
              {sorted.map((item) => (
                <Card key={item.id} item={item} />
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}

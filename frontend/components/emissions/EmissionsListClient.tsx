'use client';

import Link from 'next/link';
import { Clock, User } from 'lucide-react';
import Container from '../ui/Container';
import Spinner from '../ui/Spinner';
import { useResilientData } from '../../lib/useResilientData';
import type { Paginated, Show } from '../../lib/api';

const STATIC_LOGOS: Record<string, string> = {
  'prends-courage': '/logo-pc.svg',
  'dans-les-profondeurs': '/logo-dlp.svg',
  rafraichissement: '/logo-raf.svg',
};

function ShowCard({ show }: { show: Show }) {
  const logo = show.logo ?? STATIC_LOGOS[show.slug];

  // Exact proportions lifted from the mockup (396×166 assembly box): the
  // photo is full-height and left-anchored, the colour panel is anchored to
  // the bottom-right and sits partly behind it — never stacked vertically,
  // at any viewport width.
  return (
    <Link
      href={`/emissions/${show.slug}`}
      className="group relative block w-full aspect-[396/166] sm:aspect-[3/1] md:aspect-[7/2] lg:aspect-[4/1]"
    >
      <div className="absolute left-0 top-0 h-full w-[39.4%] z-10 overflow-hidden rounded-bl-[6px]">
        {show.host_photo ? (
          <img
            src={show.host_photo}
            alt={show.host}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-paper-200">
            <User className="h-8 w-8 text-ink-300" strokeWidth={1.5} />
          </div>
        )}
      </div>

      <div
        className="absolute left-[16.4%] top-[12%] h-[88%] w-[83.6%] overflow-hidden rounded-[17px] text-white shadow-card transition-shadow duration-300 group-hover:shadow-card-hover"
        style={{ backgroundColor: show.color }}
      >
        {show.default_schedule && (
          <div className="absolute top-[6%] right-[4%] inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-black/20 backdrop-blur-sm px-2 sm:px-3 py-0.5 sm:py-1.5 text-[8px] sm:text-[11px] md:text-xs font-semibold text-white shadow-sm">
            <Clock className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 shrink-0" strokeWidth={2.5} />
            {show.default_schedule}
          </div>
        )}

        <div
          className="flex h-full flex-col justify-between"
          style={{ paddingLeft: 'calc(22.98% + 0.5rem)', paddingRight: '5%', paddingTop: '9%', paddingBottom: '7%' }}
        >
          <div className="min-w-0">
            <h3 className="font-bold text-sm sm:text-xl md:text-2xl lg:text-3xl leading-tight truncate">{show.title}</h3>
            {show.tagline && (
              <p className="mt-0.5 sm:mt-2 text-[9px] sm:text-sm md:text-base text-white/85 leading-snug line-clamp-2">{show.tagline}</p>
            )}
          </div>

          <div className="flex items-end justify-between gap-2 min-w-0">
            {show.host && (
              <div className="min-w-0">
                <p className="text-[7px] sm:text-[11px] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-white/60 font-bold">Animateur</p>
                <p className="font-semibold text-[9px] sm:text-base truncate">{show.host}</p>
              </div>
            )}
            {logo && (
              <img
                src={logo}
                alt=""
                className="max-h-4 sm:max-h-12 md:max-h-16 max-w-[40px] sm:max-w-[110px] md:max-w-[140px] object-contain shrink-0"
              />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function EmissionsListClient({ initialData }: { initialData: Paginated<Show> | null }) {
  const { data, retrying } = useResilientData(initialData, '/api/v1/emissions/shows/');
  const shows = data?.results ?? [];

  return (
    <section className="bg-paper-100 py-14 md:py-20">
      <Container>
        {shows.length === 0 ? (
          <div className="flex items-center justify-center gap-3 py-12 text-ink-500">
            {retrying ? (
              <>
                <Spinner size="sm" className="text-brand-500" />
                Chargement…
              </>
            ) : (
              'Aucune émission pour le moment.'
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {shows.map((show) => <ShowCard key={show.id} show={show} />)}
          </div>
        )}
      </Container>
    </section>
  );
}

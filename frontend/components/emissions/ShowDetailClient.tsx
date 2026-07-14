'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Play, ChevronDown, ChevronRight, Calendar, User } from 'lucide-react';
import type { Episode, Series, Show } from '../../lib/api';

function fmtDuration(seconds: number): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function relativeTime(iso: string | null): string {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return 'Il y a 1 jour';
  if (days < 7) return `Il y a ${days} jours`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return 'Il y a 1 semaine';
  if (weeks < 5) return `Il y a ${weeks} semaines`;
  const months = Math.floor(days / 30);
  return months <= 1 ? 'Il y a 1 mois' : `Il y a ${months} mois`;
}

const fmtDate = (iso: string | null) => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }); }
  catch { return ''; }
};

export default function ShowDetailClient({
  show, series, standalone, initialEpisode,
}: {
  show: Show;
  series: Series[];
  standalone: Episode[];
  initialEpisode: Episode | null;
}) {
  const topRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState<Episode | null>(initialEpisode);
  const [isPlaying, setIsPlaying] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest'>('recent');
  const [visibleCount, setVisibleCount] = useState(4);

  const sortedStandalone = useMemo(() => {
    const copy = [...standalone];
    copy.sort((a, b) => {
      const ta = a.aired_at ? new Date(a.aired_at).getTime() : 0;
      const tb = b.aired_at ? new Date(b.aired_at).getTime() : 0;
      return sortOrder === 'recent' ? tb - ta : ta - tb;
    });
    return copy;
  }, [standalone, sortOrder]);

  function selectEpisode(ep: Episode) {
    setPlaying(ep);
    setIsPlaying(true);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function toggleSeries(id: number) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const heroImage = playing?.cover || playing?.thumbnail_url || show.host_photo || show.cover || '';

  return (
    <div ref={topRef}>
      <div className="bg-ink-900">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-3">
          <Link href="/emissions" className="text-sm text-white/70 hover:text-white transition-colors">
            ← Toutes les émissions
          </Link>
        </div>
      </div>

      {playing && (
        <div className="flex items-center gap-3 px-6 md:px-10 py-3" style={{ backgroundColor: show.color }}>
          <div className="h-11 w-11 sm:h-12 sm:w-12 shrink-0 rounded overflow-hidden bg-black/20">
            {(show.host_photo || playing.thumbnail_url) && (
              <img src={show.host_photo || playing.thumbnail_url} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-wide text-white/70 truncate">{show.title}</p>
            <h2 className="font-bold text-white text-sm sm:text-base leading-snug line-clamp-1">{playing.title}</h2>
            <div className="mt-1.5 h-px bg-white/25" />
          </div>
          {playing.duration_seconds > 0 && (
            <span className="text-white/80 text-xs shrink-0 hidden sm:block">{fmtDuration(playing.duration_seconds)}</span>
          )}
          <button
            type="button"
            onClick={() => setIsPlaying(true)}
            aria-label="Lire l'épisode"
            className="shrink-0 h-9 w-9 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25 transition-colors"
          >
            <Play className="h-4 w-4 fill-current ml-0.5" />
          </button>
        </div>
      )}

      <div className="relative h-64 sm:h-80 md:h-96 overflow-hidden" style={{ backgroundColor: show.color }}>
        {isPlaying && playing?.embed_url ? (
          <iframe
            src={`${playing.embed_url}?autoplay=1`}
            title={playing.title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <>
            {heroImage && (
              <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-ink-900/60 to-transparent" />
            {playing && (
              <button
                type="button"
                onClick={() => setIsPlaying(true)}
                aria-label="Lire l'épisode"
                className="absolute inset-0 flex items-center justify-center group"
              >
                <span className="h-16 w-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Play className="h-6 w-6 text-ink-900 fill-current ml-1" />
                </span>
              </button>
            )}
            {show.logo && (
              <img src={show.logo} alt="" className="absolute bottom-4 right-4 h-20 w-20 object-contain opacity-90" />
            )}
          </>
        )}
      </div>

      {show.description && (
        <div className="bg-ink-900 text-white px-6 md:px-10 py-8 md:py-10">
          <div className="max-w-6xl mx-auto">
            <h3 className="font-bold text-lg mb-3">Description</h3>
            <p className="text-white/85 leading-relaxed max-w-3xl">{show.description}</p>
          </div>
        </div>
      )}

      <section className="bg-white py-10 md:py-14">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="flex items-center justify-between mb-6 gap-4">
            <h2 className="font-bold text-2xl md:text-3xl text-ink-800">Épisodes</h2>
            {standalone.length > 1 && (
              <div className="relative shrink-0">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'recent' | 'oldest')}
                  className="appearance-none rounded border border-paper-300 bg-white pl-3 pr-9 py-2 text-sm font-semibold text-ink-700 focus:outline-none focus:border-brand-500"
                >
                  <option value="recent">Plus récents</option>
                  <option value="oldest">Plus anciens</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
              </div>
            )}
          </div>

          {series.length > 0 && (
            <div className="mb-8 divide-y divide-paper-200 border-y border-paper-200">
              {series.map((s) => (
                <div key={s.id}>
                  <button
                    type="button"
                    onClick={() => toggleSeries(s.id)}
                    className="w-full flex items-center justify-between py-4 text-left"
                  >
                    <span className="font-semibold text-ink-800">Série : {s.title}</span>
                    <ChevronRight
                      className={`h-4 w-4 text-ink-400 shrink-0 transition-transform ${expanded[s.id] ? 'rotate-90' : ''}`}
                    />
                  </button>
                  {expanded[s.id] && (
                    <div className="pb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                      {(s.episodes ?? []).map((ep) => (
                        <button
                          key={ep.id}
                          type="button"
                          onClick={() => selectEpisode(ep)}
                          className="group flex flex-col overflow-hidden rounded-lg bg-white shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 text-left"
                        >
                          <div className="relative aspect-video overflow-hidden bg-brand-900">
                            {(ep.cover || ep.thumbnail_url) && (
                              <img
                                src={ep.cover ?? ep.thumbnail_url}
                                alt={ep.title}
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                              />
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-brand-900/0 group-hover:bg-brand-900/30 transition-colors">
                              <Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity fill-current" />
                            </div>
                            {ep.episode_number && (
                              <span className="absolute top-2 left-2 rounded bg-ink-900/85 text-amber-400 text-xs font-bold px-2 py-1">
                                Épisode {ep.episode_number}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-1 flex-col gap-1.5 p-4">
                            <h4 className="font-bold text-ink-800 leading-snug group-hover:text-brand-700 transition-colors line-clamp-2">
                              {ep.title}
                            </h4>
                            {ep.speaker && (
                              <span className="inline-flex items-center gap-1.5 text-xs text-ink-500">
                                <User className="h-3 w-3" /> {ep.speaker}
                              </span>
                            )}
                            {ep.aired_at && (
                              <span className="inline-flex items-center gap-1.5 text-xs text-ink-400">
                                <Calendar className="h-3 w-3" /> {fmtDate(ep.aired_at)}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {sortedStandalone.length > 0 && (
            <ul className="flex flex-col divide-y divide-paper-200 border-y border-paper-200">
              {sortedStandalone.slice(0, visibleCount).map((ep) => (
                <li key={ep.id}>
                  <button
                    type="button"
                    onClick={() => selectEpisode(ep)}
                    className="group w-full flex items-center gap-4 py-4 text-left hover:bg-paper-100 -mx-2 px-2 rounded transition-colors"
                  >
                    <div className="relative shrink-0 h-16 w-24 md:h-20 md:w-32 rounded overflow-hidden bg-brand-900">
                      {(ep.cover || ep.thumbnail_url) && (
                        <img src={ep.cover ?? ep.thumbnail_url} alt={ep.title} className="absolute inset-0 h-full w-full object-cover" />
                      )}
                      {ep.is_featured && (
                        <span className="absolute top-1 left-1 inline-flex items-center gap-1 rounded bg-amber-400 text-ink-900 text-[9px] font-bold px-1 py-0.5 uppercase">
                          Live
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-ink-800 leading-snug group-hover:text-brand-700 transition-colors line-clamp-2">
                        {ep.title}
                      </h3>
                      <p className="text-xs md:text-sm text-ink-500 mt-1">{relativeTime(ep.aired_at)}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {visibleCount < sortedStandalone.length && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount(sortedStandalone.length)}
                className="inline-flex items-center justify-center rounded bg-ink-900 text-white font-semibold text-sm px-16 py-3.5 hover:bg-ink-800 transition-colors w-full max-w-md"
              >
                Plus
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

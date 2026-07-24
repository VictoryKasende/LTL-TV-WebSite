'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Play, ChevronDown, ChevronRight, ChevronLeft, Calendar, User, Lock } from 'lucide-react';
import type { Episode, Series, Show } from '../../lib/api';
import VideoEmbed from '../VideoEmbed';
import AudioPlayer from '../AudioPlayer';

const AUDIO_ONLY_SHOWS = new Set(['rafraichissement']);

type SortOrder = 'recent' | 'oldest' | 'popular' | 'published';

const STANDALONE_PAGE_SIZE = 6;
const SERIES_PAGE_SIZE = 5;

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

const fmtAvailableDate = (iso: string | null) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return ''; }
};

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-center gap-2">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label="Page précédente"
        className="h-9 w-9 shrink-0 flex items-center justify-center rounded border border-paper-300 text-ink-700 disabled:opacity-40 disabled:cursor-not-allowed hover:border-brand-500 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-xs sm:text-sm text-ink-600 font-medium px-1 whitespace-nowrap">
        Page {page} / {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        aria-label="Page suivante"
        className="h-9 w-9 shrink-0 flex items-center justify-center rounded border border-paper-300 text-ink-700 disabled:opacity-40 disabled:cursor-not-allowed hover:border-brand-500 transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

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
  const [sortOrder, setSortOrder] = useState<SortOrder>('recent');
  const [standalonePage, setStandalonePage] = useState(1);
  const [seriesPage, setSeriesPage] = useState(1);

  const sortedStandalone = useMemo(() => {
    const copy = [...standalone];
    const time = (iso: string | null) => (iso ? new Date(iso).getTime() : 0);
    copy.sort((a, b) => {
      switch (sortOrder) {
        case 'oldest': return time(a.aired_at) - time(b.aired_at);
        case 'popular': return b.view_count - a.view_count;
        case 'published': return time(b.published_at) - time(a.published_at);
        default: return time(b.aired_at) - time(a.aired_at);
      }
    });
    return copy;
  }, [standalone, sortOrder]);

  useEffect(() => { setStandalonePage(1); }, [sortOrder]);

  const standaloneTotalPages = Math.ceil(sortedStandalone.length / STANDALONE_PAGE_SIZE) || 1;
  const visibleStandalone = sortedStandalone.slice(
    (standalonePage - 1) * STANDALONE_PAGE_SIZE,
    standalonePage * STANDALONE_PAGE_SIZE,
  );

  const seriesTotalPages = Math.ceil(series.length / SERIES_PAGE_SIZE) || 1;
  const visibleSeries = series.slice(
    (seriesPage - 1) * SERIES_PAGE_SIZE,
    seriesPage * SERIES_PAGE_SIZE,
  );

  const isAudioShow = AUDIO_ONLY_SHOWS.has(show.slug);

  function selectEpisode(ep: Episode) {
    if (ep.is_locked) return;
    setPlaying(ep);
    setIsPlaying(true);
    // Audio shows keep a persistent docked player, so browsing the list
    // shouldn't yank the page back to the top like it does for video.
    if (!isAudioShow) {
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
        <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 md:px-10 py-3" style={{ backgroundColor: show.color }}>
          <div className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded overflow-hidden bg-black/20">
            {(show.host_photo || playing.thumbnail_url) && (
              <img src={show.host_photo || playing.thumbnail_url} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-wide text-white/70 truncate">{show.title}</p>
            <h2 className="font-bold text-white text-xs sm:text-base leading-snug line-clamp-1">{playing.title}</h2>
            <div className="mt-1.5 h-px bg-white/25" />
          </div>
          {playing.duration_seconds > 0 && (
            <span className="text-white/80 text-xs shrink-0 hidden sm:block">{fmtDuration(playing.duration_seconds)}</span>
          )}
          <button
            type="button"
            onClick={() => !playing.is_locked && setIsPlaying(true)}
            disabled={playing.is_locked}
            aria-label={playing.is_locked ? 'Épisode pas encore disponible' : "Lire l'épisode"}
            className="shrink-0 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25 transition-colors disabled:opacity-60 disabled:hover:bg-white/15"
          >
            {playing.is_locked ? <Lock className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
          </button>
        </div>
      )}

      <div className="relative h-56 sm:h-80 md:h-96 overflow-hidden" style={{ backgroundColor: show.color }}>
        {isPlaying && playing?.embed_url ? (
          isAudioShow ? (
            <AudioPlayer
              key={playing.id}
              episode={playing}
              artwork={heroImage}
              showTitle={show.title}
              queue={sortedStandalone}
              onSelect={selectEpisode}
            />
          ) : (
            <VideoEmbed key={playing.id} src={`${playing.embed_url}?autoplay=1`} title={playing.title} />
          )
        ) : (
          <>
            {heroImage && (
              <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-ink-900/60 to-transparent" />
            {playing && (
              <button
                type="button"
                onClick={() => !playing.is_locked && setIsPlaying(true)}
                disabled={playing.is_locked}
                aria-label={playing.is_locked ? 'Épisode pas encore disponible' : "Lire l'épisode"}
                className="absolute inset-0 flex items-center justify-center group"
              >
                <span className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-105 transition-transform">
                  {playing.is_locked ? (
                    <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-ink-900" />
                  ) : (
                    <Play className="h-5 w-5 sm:h-6 sm:w-6 text-ink-900 fill-current ml-1" />
                  )}
                </span>
              </button>
            )}
            {playing?.is_locked && playing.published_at && (
              <p className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 text-white text-xs sm:text-sm font-medium capitalize">
                Disponible le {fmtAvailableDate(playing.published_at)}
              </p>
            )}
            {show.logo && (
              <img src={show.logo} alt="" className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 h-14 w-14 sm:h-20 sm:w-20 object-contain opacity-90" />
            )}
          </>
        )}
      </div>

      {show.description && (
        <div className="bg-ink-900 text-white px-4 sm:px-6 md:px-10 py-6 sm:py-8 md:py-10">
          <div className="max-w-6xl mx-auto">
            <h3 className="font-bold text-lg mb-3">Description</h3>
            <p className="text-white/85 leading-relaxed max-w-3xl">{show.description}</p>
          </div>
        </div>
      )}

      <section className="bg-white py-8 sm:py-10 md:py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
            <h2 className="font-bold text-2xl md:text-3xl text-ink-800">Épisodes</h2>
            {standalone.length > 1 && (
              <div className="relative shrink-0 self-start sm:self-auto">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                  className="appearance-none rounded border border-paper-300 bg-white pl-3 pr-9 py-2 text-sm font-semibold text-ink-700 focus:outline-none focus:border-brand-500"
                >
                  <option value="recent">Plus récents</option>
                  <option value="oldest">Plus anciens</option>
                  <option value="popular">Plus vus</option>
                  <option value="published">Récemment publiés</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
              </div>
            )}
          </div>

          {series.length > 0 && (
            <div className="mb-8">
              <div className="divide-y divide-paper-200 border-y border-paper-200">
                {visibleSeries.map((s) => (
                  <div key={s.id}>
                    <button
                      type="button"
                      onClick={() => toggleSeries(s.id)}
                      className="w-full flex items-center justify-between gap-3 py-4 text-left"
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
                            aria-disabled={ep.is_locked}
                            className={`group flex flex-col overflow-hidden rounded-lg bg-white shadow-card transition-all duration-300 text-left ${
                              ep.is_locked ? 'cursor-default' : 'hover:shadow-card-hover hover:-translate-y-1'
                            }`}
                          >
                            <div className="relative aspect-video overflow-hidden bg-brand-900">
                              {(ep.cover || ep.thumbnail_url) && (
                                <img
                                  src={ep.cover ?? ep.thumbnail_url}
                                  alt={ep.title}
                                  className={`h-full w-full object-cover transition-transform duration-700 ${ep.is_locked ? '' : 'group-hover:scale-105'}`}
                                />
                              )}
                              {ep.is_locked ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-ink-900/55">
                                  <Lock className="h-7 w-7 text-white" />
                                </div>
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-brand-900/0 group-hover:bg-brand-900/30 transition-colors">
                                  <Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity fill-current" />
                                </div>
                              )}
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
                              {ep.is_locked ? (
                                ep.published_at && (
                                  <span className="text-xs font-medium text-red-600 capitalize">
                                    Disponible le {fmtAvailableDate(ep.published_at)}
                                  </span>
                                )
                              ) : (
                                ep.aired_at && (
                                  <span className="inline-flex items-center gap-1.5 text-xs text-ink-400">
                                    <Calendar className="h-3 w-3" /> {fmtDate(ep.aired_at)}
                                  </span>
                                )
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <Pagination page={seriesPage} totalPages={seriesTotalPages} onChange={setSeriesPage} />
            </div>
          )}

          {sortedStandalone.length > 0 && (
            <div>
              <ul className="flex flex-col divide-y divide-paper-200 border-y border-paper-200">
                {visibleStandalone.map((ep) => (
                  <li key={ep.id}>
                    <button
                      type="button"
                      onClick={() => selectEpisode(ep)}
                      aria-disabled={ep.is_locked}
                      className={`group w-full flex items-center gap-3 sm:gap-4 py-4 text-left -mx-2 px-2 rounded transition-colors ${
                        ep.is_locked ? 'cursor-default' : 'hover:bg-paper-100'
                      }`}
                    >
                      <div className="relative shrink-0 h-14 w-20 sm:h-20 sm:w-32 rounded overflow-hidden bg-brand-900">
                        {(ep.cover || ep.thumbnail_url) && (
                          <img src={ep.cover ?? ep.thumbnail_url} alt={ep.title} className="absolute inset-0 h-full w-full object-cover" />
                        )}
                        {ep.is_locked ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-ink-900/55">
                            <Lock className="h-5 w-5 text-white" />
                          </div>
                        ) : ep.is_featured && (
                          <span className="absolute top-1 left-1 inline-flex items-center gap-1 rounded bg-amber-400 text-ink-900 text-[9px] font-bold px-1 py-0.5 uppercase">
                            Live
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base text-ink-800 leading-snug group-hover:text-brand-700 transition-colors line-clamp-2">
                          {ep.title}
                        </h3>
                        {ep.is_locked ? (
                          ep.published_at && (
                            <p className="text-xs md:text-sm font-medium text-red-600 mt-1 capitalize">
                              Disponible le {fmtAvailableDate(ep.published_at)}
                            </p>
                          )
                        ) : (
                          <p className="text-xs md:text-sm text-ink-500 mt-1">{relativeTime(ep.aired_at)}</p>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              <Pagination page={standalonePage} totalPages={standaloneTotalPages} onChange={setStandalonePage} />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

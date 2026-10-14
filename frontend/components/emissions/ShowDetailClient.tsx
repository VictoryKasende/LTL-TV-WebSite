'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Play, ChevronDown, ChevronRight, ChevronLeft, Lock, Heart, MessageCircle } from 'lucide-react';
import type { Episode, Series, Show } from '../../lib/api';
import VideoPlayer from '../VideoPlayer';
import EpisodeEngagement from './EpisodeEngagement';
import EpisodeEndPrompt from './EpisodeEndPrompt';
import { AudioPlayerExpanded } from '../AudioPlayer';
import { useAudioPlayerContext } from '../../lib/AudioPlayerContext';
import EqBars from '../EqBars';

const AUDIO_ONLY_SHOWS = new Set(['rafraichissement']);

type SortOrder = 'recent' | 'oldest' | 'popular' | 'published';

const STANDALONE_PAGE_SIZE = 6;

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

const fmtAvailableDate = (iso: string | null) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return ''; }
};

const fmtAiredDate = (iso: string | null) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return ''; }
};

function fmtDuration(seconds: number): string {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h ? `${h} h ${String(m).padStart(2, '0')}` : `${m} min`;
}

function fmtSeriesRange(start: string | null, end: string | null): string {
  const fmt = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
    } catch { return ''; }
  };
  if (!start) return '';
  const a = fmt(start);
  const b = end ? fmt(end) : '';
  return b && b !== a ? `${a} – ${b}` : a;
}

function GroupHeading({ title, count, children }: { title: string; count: number; children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <h3 className="text-xs sm:text-sm uppercase tracking-[0.18em] font-bold text-ink-500">
        {title} <span className="text-ink-400 tabular-nums">({count})</span>
      </h3>
      {children}
    </div>
  );
}

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

function EpisodeRow({
  ep, onSelect, active, showEpisodeNumber = false,
}: {
  ep: Episode;
  onSelect: (ep: Episode) => void;
  active: boolean;
  showEpisodeNumber?: boolean;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(ep)}
        aria-disabled={ep.is_locked}
        className={`group w-full flex items-center gap-3 sm:gap-4 py-4 text-left -mx-2 px-2 rounded transition-colors ${
          ep.is_locked ? 'cursor-default' : 'hover:bg-paper-100'
        } ${active ? 'bg-brand-50' : ''}`}
      >
        <div className="relative shrink-0 h-14 w-20 sm:h-20 sm:w-32 rounded overflow-hidden bg-brand-900">
          {(ep.cover || ep.thumbnail_url) && (
            <img src={ep.cover ?? ep.thumbnail_url} alt={ep.title} className="absolute inset-0 h-full w-full object-cover" />
          )}
          {ep.is_locked && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink-900/55">
              <Lock className="h-5 w-5 text-white" />
            </div>
          )}
          {showEpisodeNumber && ep.episode_number && !ep.is_locked && (
            <span className="absolute top-1 left-1 rounded bg-ink-900/85 text-signal-400 text-[10px] font-bold px-1.5 py-0.5">
              EP {ep.episode_number}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm sm:text-base text-ink-800 leading-snug group-hover:text-brand-700 transition-colors line-clamp-2">
              {ep.title}
            </h3>
            {active && <EqBars barClassName="bg-brand-600" className="shrink-0" />}
          </div>
          {ep.is_locked ? (
            ep.published_at && (
              <p className="text-xs md:text-sm font-medium text-red-600 mt-1 capitalize">
                Disponible le {fmtAvailableDate(ep.published_at)}
              </p>
            )
          ) : (
            <>
              <p className="text-xs md:text-sm text-ink-500 mt-1">
                {ep.speaker ? `${ep.speaker} · ` : ''}{relativeTime(ep.aired_at)}
              </p>
              {(ep.like_count > 0 || ep.comment_count > 0) && (
                <div className="flex items-center gap-3 mt-1 text-xs text-ink-400">
                  {ep.like_count > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Heart className="h-3 w-3" /> {ep.like_count}
                    </span>
                  )}
                  {ep.comment_count > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" /> {ep.comment_count}
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </button>
    </li>
  );
}

export default function ShowDetailClient({
  show, series, standalone, initialEpisode, episodeExplicit = false, autoplay = false,
}: {
  show: Show;
  series: Series[];
  standalone: Episode[];
  initialEpisode: Episode | null;
  episodeExplicit?: boolean;
  // `?play=1` alongside `?episode=` — start playback on arrival (links from
  // the home page's "À suivre" list) instead of waiting for the play button.
  autoplay?: boolean;
}) {
  const audioCtx = useAudioPlayerContext();
  const router = useRouter();
  const pathname = usePathname();
  const topRef = useRef<HTMLDivElement>(null);
  const isAudioShow = AUDIO_ONLY_SHOWS.has(show.slug);
  const audioAlreadyPlayingHere = isAudioShow && audioCtx.track?.ctx.showSlug === show.slug;
  // If this show's episode is already playing globally (e.g. the visitor navigated
  // back here while listening), pick up the page's local UI state from it instead
  // of resetting to the server-rendered default.
  const [playing, setPlaying] = useState<Episode | null>(() => (
    audioAlreadyPlayingHere ? audioCtx.track!.episode : initialEpisode
  ));
  const [isPlaying, setIsPlaying] = useState(() => audioAlreadyPlayingHere);
  // Whether the visitor actually picked an episode (click, or a `?episode=`
  // deep link) as opposed to the page just defaulting to the first one.
  // Gates the hero image/description: the show's own host photo + blurb
  // until then, the episode's own once it's genuinely "selected".
  const [episodeSelected, setEpisodeSelected] = useState(() => (
    episodeExplicit || audioAlreadyPlayingHere
  ));
  const [showEndPrompt, setShowEndPrompt] = useState(false);
  // The list endpoint only carries the short excerpt — pull the episode's
  // full description for the info panel once it's actually selected.
  const [episodeDetail, setEpisodeDetail] = useState<{ slug: string; description: string } | null>(null);
  useEffect(() => {
    if (!episodeSelected || !playing) return;
    let cancelled = false;
    fetch(`/api/v1/emissions/episodes/${playing.slug}/`, { headers: { Accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Episode | null) => {
        if (!cancelled && data) setEpisodeDetail({ slug: data.slug, description: data.description ?? '' });
      })
      .catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episodeSelected, playing?.slug]);
  // Every series is listed; only the one holding the current episode starts
  // open (falling back to the first series), so the page stays scannable.
  const [expanded, setExpanded] = useState<Record<number, boolean>>(() => {
    const current = playing?.series && series.find((s) => s.id === playing.series);
    const target = current || series.find((s) => (s.episodes?.length ?? 0) > 0);
    return target ? { [target.id]: true } : {};
  });
  const [sortOrder, setSortOrder] = useState<SortOrder>('recent');
  const [standalonePage, setStandalonePage] = useState(1);

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

  // Only series that actually have a visible episode get a section at all.
  const seriesWithEpisodes = useMemo(
    () => series.filter((s) => (s.episodes?.length ?? 0) > 0),
    [series],
  );

  // Continuous-playback queue for prev/next and auto-advance: every episode
  // of the show, series-grouped ones first, then standalone ones.
  const episodeQueue = useMemo(() => {
    const seriesEpisodes = seriesWithEpisodes.flatMap((s) => s.episodes ?? []);
    return [...seriesEpisodes, ...sortedStandalone];
  }, [seriesWithEpisodes, sortedStandalone]);

  // Keeps `?episode=slug` in sync with what's playing so the URL stays
  // shareable/bookmarkable without a full page navigation. `push` (not
  // `replace`) so the browser back button steps back through watched
  // episodes, matching how a "watch page" is expected to behave.
  function syncEpisodeUrl(ep: Episode, mode: 'push' | 'replace') {
    const current = new URLSearchParams(window.location.search);
    if (current.get('episode') === ep.slug) return;
    current.set('episode', ep.slug);
    const url = `${pathname}?${current.toString()}`;
    if (mode === 'push') router.push(url, { scroll: false });
    else router.replace(url, { scroll: false });
  }

  // On first mount, make sure the URL reflects an already-selected episode
  // (deep link, or audio resumed from the global player) — without adding a
  // history entry for a navigation the user didn't actually make. The
  // default auto-picked episode deliberately does *not* get pushed into the
  // URL: until the visitor actually chooses something, the page is about
  // the show, not any one episode.
  useEffect(() => {
    if (autoplay && playing && !audioAlreadyPlayingHere) {
      selectEpisode(playing);
      // Drop `play=1` so a reload or a shared link opens paused like any
      // other deep link.
      const params = new URLSearchParams(window.location.search);
      params.delete('play');
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    } else if (episodeSelected && playing) {
      syncEpisodeUrl(playing, 'replace');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Audio shows auto-advance (or stop) inside AudioPlayerContext itself —
  // `justEndedId` flips to this episode's id only when there was nothing
  // left to advance to, same "genuinely finished" condition as VideoPlayer's
  // `onEpisodeEnd`.
  useEffect(() => {
    if (isAudioShow && playing && audioCtx.justEndedId === playing.id) {
      setShowEndPrompt(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioCtx.justEndedId]);

  function selectEpisode(ep: Episode) {
    if (ep.is_locked) return;
    setPlaying(ep);
    setIsPlaying(true);
    setEpisodeSelected(true);
    setShowEndPrompt(false);
    if (ep.series) setExpanded((prev) => ({ ...prev, [ep.series!]: true }));
    syncEpisodeUrl(ep, 'push');
    if (isAudioShow) {
      // Hands off to the site-wide player so playback survives navigating
      // away from this page — see lib/AudioPlayerContext.tsx.
      audioCtx.play(ep, {
        showTitle: show.title,
        showSlug: show.slug,
        showHostPhoto: show.host_photo,
        showCover: show.cover,
        queue: episodeQueue,
      });
    } else {
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function toggleSeries(id: number) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // Before the visitor has actually picked an episode, the hero shows the
  // show's own identity (host photo) rather than whichever episode happens
  // to be the default pick.
  const heroImage = episodeSelected
    ? (playing?.cover || playing?.thumbnail_url || show.host_photo || show.cover || '')
    : (show.host_photo || show.cover || '');

  // Once an episode is picked, the info panel is entirely about that episode
  // — never the show's blurb, even when the episode has no text of its own.
  const showingEpisode = episodeSelected && !!playing;
  const fullDescription = episodeDetail && episodeDetail.slug === playing?.slug ? episodeDetail.description : '';
  const episodeText = fullDescription || playing?.excerpt || playing?.subtitle || '';
  const episodeMeta = playing ? [
    playing.series_title && `Série : ${playing.series_title}`,
    playing.episode_number && `Épisode ${playing.episode_number}`,
    playing.speaker,
    fmtAiredDate(playing.aired_at),
    fmtDuration(playing.duration_seconds),
  ].filter(Boolean).join(' · ') : '';
  const guests = (playing?.guests ?? [])
    .map((g) => (g.role ? `${g.name} (${g.role})` : g.name))
    .join(', ');

  return (
    <div ref={topRef}>
      <div className="bg-ink-900">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-3">
          <Link href="/emissions" className="text-sm text-white/70 hover:text-white transition-colors">
            ← Toutes les émissions
          </Link>
        </div>
      </div>

      <div
        className={`relative overflow-hidden ${isAudioShow && isPlaying && playing?.embed_url ? '' : 'h-56 sm:h-80 md:h-96'}`}
        style={{ backgroundColor: show.color }}
      >
        {isPlaying && playing?.embed_url ? (
          isAudioShow ? (
            <AudioPlayerExpanded />
          ) : (
            <VideoPlayer
              key={playing.id}
              episode={playing}
              queue={episodeQueue}
              onSelect={selectEpisode}
              showColor={show.color}
              onEpisodeEnd={() => setShowEndPrompt(true)}
            />
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
                onClick={() => selectEpisode(playing)}
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

        {showEndPrompt && playing && (
          <EpisodeEndPrompt episode={playing} onClose={() => setShowEndPrompt(false)} />
        )}
      </div>

      {showingEpisode ? (
        <div className="bg-ink-900 text-white px-4 sm:px-6 md:px-10 py-6 sm:py-8 md:py-10">
          <div className="max-w-6xl mx-auto">
            <p className="text-[11px] uppercase tracking-wider font-bold text-signal-400 mb-2">
              {isPlaying ? 'En cours de lecture' : 'Épisode sélectionné'}
            </p>
            <h3 className="font-bold text-xl md:text-2xl leading-snug">{playing!.title}</h3>
            {episodeMeta && <p className="text-xs sm:text-sm text-white/55 mt-1.5">{episodeMeta}</p>}
            {guests && <p className="text-sm text-white/70 mt-1">Avec {guests}</p>}
            {episodeText && (
              <p className="mt-4 text-white/85 leading-relaxed max-w-3xl whitespace-pre-line">{episodeText}</p>
            )}
          </div>
        </div>
      ) : show.description && (
        <div className="bg-ink-900 text-white px-4 sm:px-6 md:px-10 py-6 sm:py-8 md:py-10">
          <div className="max-w-6xl mx-auto">
            <h3 className="font-bold text-lg mb-1">Description</h3>
            <p className="text-white/85 leading-relaxed max-w-3xl">{show.description}</p>
          </div>
        </div>
      )}

      {episodeSelected && playing && (
        <EpisodeEngagement key={playing.id} episode={playing} />
      )}

      <section className="bg-white py-8 sm:py-10 md:py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10">
          <h2 className="font-bold text-2xl md:text-3xl text-ink-800 mb-6 md:mb-8">Épisodes</h2>

          {seriesWithEpisodes.length > 0 && (
            <div className="mb-10 md:mb-12">
              <GroupHeading title="Séries d'enseignement" count={seriesWithEpisodes.length} />
              <div className="flex flex-col gap-3">
                {seriesWithEpisodes.map((s) => {
                  const open = !!expanded[s.id];
                  const episodes = s.episodes ?? [];
                  const thumb = s.cover || episodes[0]?.cover || episodes[0]?.thumbnail_url || '';
                  const containsCurrent = !!playing && episodes.some((ep) => ep.id === playing.id);
                  const meta = [
                    `${episodes.length} épisode${episodes.length > 1 ? 's' : ''}`,
                    fmtSeriesRange(s.starts_on, s.ends_on),
                  ].filter(Boolean).join(' · ');
                  return (
                    <div
                      key={s.id}
                      className={`rounded-lg border bg-white overflow-hidden transition-colors ${
                        open ? 'border-brand-300 shadow-sm' : 'border-paper-200 hover:border-paper-300'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSeries(s.id)}
                        aria-expanded={open}
                        className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 text-left"
                      >
                        <div className="relative shrink-0 h-14 w-20 sm:h-16 sm:w-28 rounded overflow-hidden bg-brand-900">
                          {thumb && <img src={thumb} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] uppercase tracking-wider font-bold text-brand-500">Série</p>
                          <h3 className="font-semibold text-ink-800 leading-snug line-clamp-2">{s.title}</h3>
                          <p className="text-xs sm:text-sm text-ink-500 mt-0.5">
                            {meta}
                            {containsCurrent && !open && <span className="text-brand-600 font-semibold"> · En cours</span>}
                          </p>
                        </div>
                        <ChevronDown
                          className={`h-5 w-5 text-ink-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {open && (
                        <div className="border-t border-paper-200 px-3 sm:px-4">
                          {s.theme && <p className="pt-3 text-sm text-ink-500 italic">{s.theme}</p>}
                          <ul className="flex flex-col divide-y divide-paper-200">
                            {episodes.map((ep) => (
                              <EpisodeRow
                                key={ep.id}
                                ep={ep}
                                onSelect={selectEpisode}
                                active={isAudioShow
                                  ? audioCtx.playing && audioCtx.track?.episode.id === ep.id
                                  : isPlaying && playing?.id === ep.id}
                                showEpisodeNumber
                              />
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {sortedStandalone.length > 0 && (
            <div>
              <GroupHeading
                title={seriesWithEpisodes.length > 0 ? 'Autres épisodes' : 'Tous les épisodes'}
                count={sortedStandalone.length}
              >
                {standalone.length > 1 && (
                  <div className="relative shrink-0">
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                      aria-label="Trier les épisodes"
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
              </GroupHeading>
              <ul className="flex flex-col divide-y divide-paper-200 border-y border-paper-200">
                {visibleStandalone.map((ep) => (
                  <EpisodeRow
                    key={ep.id}
                    ep={ep}
                    onSelect={selectEpisode}
                    active={isAudioShow
                      ? audioCtx.playing && audioCtx.track?.episode.id === ep.id
                      : isPlaying && playing?.id === ep.id}
                  />
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

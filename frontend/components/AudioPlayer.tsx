'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, Rewind, FastForward, Share2, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Episode } from '../lib/api';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytApiPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve) => {
    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prevReady?.();
      resolve();
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);
  });
  return ytApiPromise;
}

function fmtTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const SPEEDS = [1, 1.25, 1.5, 2];

// Plays a YouTube video's audio track only: the iframe stays off-screen and is
// driven entirely through the IFrame Player API; only custom controls are shown.
function useAudioPlayer(videoId: string, autoplay: boolean, fallbackDuration = 0) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(fallbackDuration);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setCurrent(0);
    setDuration(fallbackDuration);
    setSpeed(1);

    loadYouTubeApi().then(() => {
      if (cancelled || !containerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: { autoplay: autoplay ? 1 : 0, controls: 0, disablekb: 1, playsinline: 1 },
        events: {
          onReady: (e: any) => {
            if (cancelled) return;
            setReady(true);
            const d = e.target.getDuration();
            if (d) setDuration(d);
            if (autoplay) e.target.playVideo();
          },
          onStateChange: (e: any) => {
            if (cancelled) return;
            setPlaying(e.data === window.YT.PlayerState.PLAYING);
            const d = e.target.getDuration();
            if (d) setDuration(d);
          },
        },
      });
    });

    const interval = setInterval(() => {
      const p = playerRef.current;
      if (p?.getCurrentTime) setCurrent(p.getCurrentTime());
    }, 500);

    return () => {
      cancelled = true;
      clearInterval(interval);
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, autoplay]);

  function toggle() {
    const p = playerRef.current;
    if (!p) return;
    if (playing) p.pauseVideo();
    else p.playVideo();
  }

  function skip(delta: number) {
    const p = playerRef.current;
    if (!p) return;
    const t = Math.max(0, Math.min(duration, p.getCurrentTime() + delta));
    p.seekTo(t, true);
    setCurrent(t);
  }

  function seekTo(t: number) {
    playerRef.current?.seekTo(t, true);
    setCurrent(t);
  }

  function cycleSpeed() {
    const idx = SPEEDS.indexOf(speed);
    const next = SPEEDS[(idx + 1) % SPEEDS.length];
    playerRef.current?.setPlaybackRate?.(next);
    setSpeed(next);
  }

  return { containerRef, ready, playing, current, duration, speed, toggle, skip, seekTo, cycleSpeed };
}

function Waveform({
  current, duration, onSeek, bars = 56, className = '',
}: {
  current: number; duration: number; onSeek: (t: number) => void; bars?: number; className?: string;
}) {
  const heights = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < bars; i++) {
      const h = 6 + Math.abs(Math.sin(i * 0.34) * 10) + Math.abs(Math.sin(i * 0.09) * 8) + (i % 7 === 0 ? 4 : 0);
      arr.push(Math.min(28, Math.max(4, h)));
    }
    return arr;
  }, [bars]);

  const ratio = duration > 0 ? current / duration : 0;
  const playedCount = Math.round(bars * ratio);

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const r = (e.clientX - rect.left) / rect.width;
    onSeek(Math.min(duration, Math.max(0, duration * r)));
  }

  return (
    <div
      className={`flex items-center gap-[2px] cursor-pointer ${className}`}
      onClick={handleClick}
      role="slider"
      aria-label="Progression de la lecture"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(current)}
      tabIndex={0}
    >
      {heights.map((h, i) => (
        <span
          key={i}
          className={`flex-1 min-w-[2px] rounded-sm transition-colors ${i < playedCount ? 'bg-amber-400' : 'bg-white/25'}`}
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  );
}

export default function AudioPlayer({
  episode, artwork, showTitle, queue, onSelect,
}: {
  episode: Episode;
  artwork?: string;
  showTitle: string;
  queue: Episode[];
  onSelect: (ep: Episode) => void;
}) {
  const player = useAudioPlayer(episode.youtube_id, true, episode.duration_seconds);
  const rootRef = useRef<HTMLDivElement>(null);
  const [docked, setDocked] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(([entry]) => setDocked(!entry.isIntersecting), { threshold: 0 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!docked) setSheetOpen(false);
  }, [docked]);

  const idx = queue.findIndex((e) => e.id === episode.id);
  const prevEp = idx > 0 ? queue[idx - 1] : null;
  const nextEp = idx >= 0 && idx < queue.length - 1 ? queue[idx + 1] : null;
  const canPrev = !!prevEp && !prevEp.is_locked;
  const canNext = !!nextEp && !nextEp.is_locked;

  async function share() {
    const url = `https://youtu.be/${episode.youtube_id}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: episode.title, url });
      } catch {
        // user cancelled share sheet — nothing to do
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
    }
  }

  function renderExpanded({ compact = false }: { compact?: boolean } = {}) {
    const artSize = compact ? 'h-24 w-24' : 'h-28 w-28 sm:h-36 sm:w-36';
    return (
      <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 px-6 py-6 h-full">
        {artwork && (
          <div className={`${artSize} shrink-0 overflow-hidden rounded-xl shadow-lg`}>
            <img src={artwork} alt="" className="h-full w-full object-cover" />
          </div>
        )}

        <div className="text-center px-4">
          <p className="text-[10px] uppercase tracking-wide text-white/60 mb-1">{showTitle}</p>
          <h2 className="font-bold text-white text-sm sm:text-base leading-snug line-clamp-2">{episode.title}</h2>
          {episode.speaker && <p className="mt-1 text-xs sm:text-sm text-white/70">{episode.speaker}</p>}
        </div>

        <div className="w-full max-w-md flex items-center gap-2 text-xs text-white/70">
          <span className="tabular-nums w-10 shrink-0">{fmtTime(player.current)}</span>
          <Waveform current={player.current} duration={player.duration} onSeek={player.seekTo} className="flex-1 h-8" />
          <span className="tabular-nums w-10 shrink-0 text-right">{fmtTime(player.duration)}</span>
        </div>

        <div className="flex items-center gap-5 sm:gap-6">
          <button
            type="button"
            onClick={() => canPrev && prevEp && onSelect(prevEp)}
            disabled={!canPrev}
            aria-label="Épisode précédent"
            className="text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button type="button" onClick={() => player.skip(-15)} aria-label="Reculer de 15 secondes" className="text-white flex flex-col items-center gap-0.5">
            <Rewind className="h-6 w-6" />
            <span className="text-[9px] font-bold">15</span>
          </button>
          <button
            type="button"
            onClick={player.toggle}
            disabled={!player.ready}
            aria-label={player.playing ? 'Pause' : 'Lecture'}
            className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-white text-ink-900 disabled:opacity-50 transition-transform hover:scale-105"
          >
            {player.playing ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current ml-0.5" />}
          </button>
          <button type="button" onClick={() => player.skip(30)} aria-label="Avancer de 30 secondes" className="text-white flex flex-col items-center gap-0.5">
            <FastForward className="h-6 w-6" />
            <span className="text-[9px] font-bold">30</span>
          </button>
          <button
            type="button"
            onClick={() => canNext && nextEp && onSelect(nextEp)}
            disabled={!canNext}
            aria-label="Épisode suivant"
            className="text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={player.cycleSpeed}
            className="rounded-full bg-white/10 border border-white/20 px-3.5 py-1.5 text-xs font-bold text-white tabular-nums"
          >
            {player.speed}×
          </button>
          <button type="button" onClick={share} aria-label="Partager" className="text-white/90">
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div ref={rootRef} className="absolute inset-0">
        <div ref={player.containerRef} className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true" />
        {renderExpanded()}
      </div>

      {/* Docked bar: appears once the hero player has scrolled out of view. */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 bg-[#14152B] border-t border-white/10 transition-transform duration-300 motion-reduce:transition-none ${
          docked ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="h-[3px] bg-white/15">
          <div
            className="h-full bg-amber-400"
            style={{ width: `${player.duration > 0 ? (player.current / player.duration) * 100 : 0}%` }}
          />
        </div>

        {/* Compact bar — mobile: tap to expand the full sheet. */}
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="md:hidden w-full flex items-center gap-3 px-4 py-2.5 text-left"
        >
          {artwork && <img src={artwork} alt="" className="h-10 w-10 rounded shrink-0 object-cover" />}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{episode.title}</p>
            <p className="text-xs text-white/60 truncate">{episode.speaker || showTitle}</p>
          </div>
          <span
            onClick={(e) => { e.stopPropagation(); player.toggle(); }}
            role="button"
            tabIndex={0}
            aria-label={player.playing ? 'Pause' : 'Lecture'}
            className="shrink-0 h-9 w-9 rounded-full bg-white flex items-center justify-center text-ink-900"
          >
            {player.playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
          </span>
        </button>

        {/* Full row — desktop: every control inline, no need to expand. */}
        <div className="hidden md:grid grid-cols-[1fr_auto_1fr] items-center gap-6 px-6 py-3">
          <div className="flex items-center gap-3 min-w-0">
            {artwork && <img src={artwork} alt="" className="h-10 w-10 rounded shrink-0 object-cover" />}
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{episode.title}</p>
              <p className="text-xs text-white/60 truncate">
                {episode.speaker || showTitle} · {fmtTime(player.current)} / {fmtTime(player.duration)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button type="button" onClick={() => canPrev && prevEp && onSelect(prevEp)} disabled={!canPrev} aria-label="Épisode précédent" className="text-white/80 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => player.skip(-15)} aria-label="Reculer de 15 secondes" className="text-white/80 hover:text-white">
              <Rewind className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={player.toggle}
              disabled={!player.ready}
              aria-label={player.playing ? 'Pause' : 'Lecture'}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink-900 disabled:opacity-50"
            >
              {player.playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
            </button>
            <button type="button" onClick={() => player.skip(30)} aria-label="Avancer de 30 secondes" className="text-white/80 hover:text-white">
              <FastForward className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => canNext && nextEp && onSelect(nextEp)} disabled={!canNext} aria-label="Épisode suivant" className="text-white/80 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-3 justify-end">
            <button type="button" onClick={player.cycleSpeed} className="rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-bold text-white tabular-nums">
              {player.speed}×
            </button>
            <button type="button" onClick={share} aria-label="Partager" className="text-white/80 hover:text-white">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile full-screen sheet, opened from the compact docked bar. */}
      <div
        className={`md:hidden fixed inset-0 z-50 bg-gradient-to-b from-brand-500 to-brand-900 transition-transform duration-300 motion-reduce:transition-none ${
          sheetOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 pt-4">
          <button type="button" onClick={() => setSheetOpen(false)} aria-label="Réduire" className="text-white p-2">
            <ChevronDown className="h-5 w-5" />
          </button>
          <span className="text-[11px] uppercase tracking-wide text-white/60">En cours de lecture</span>
          <span className="w-9" />
        </div>
        {renderExpanded({ compact: true })}
      </div>
    </>
  );
}

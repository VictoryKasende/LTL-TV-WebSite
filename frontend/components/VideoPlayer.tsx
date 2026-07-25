'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Maximize2 } from 'lucide-react';
import type { Episode } from '../lib/api';
import { loadYouTubeApi } from '../lib/youtubeAudio';
import Spinner from './ui/Spinner';

const COUNTDOWN_SECONDS = 5;
const RING_CIRCUMFERENCE = 2 * Math.PI * 17;

function adjacent(queue: Episode[], episode: Episode) {
  const idx = queue.findIndex((e) => e.id === episode.id);
  const prevEp = idx > 0 ? queue[idx - 1] : null;
  const nextEp = idx >= 0 && idx < queue.length - 1 ? queue[idx + 1] : null;
  return { prevEp, nextEp };
}

// Visible YouTube player (native controls) for video shows, enhanced with a
// scroll-linked floating mini-player and an autoplay-next prompt between
// episodes of the same show — see the PiP/autoplay proposal for video shows.
export default function VideoPlayer({
  episode, queue, onSelect, showColor,
}: {
  episode: Episode;
  queue: Episode[];
  onSelect: (ep: Episode) => void;
  showColor: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  const [ready, setReady] = useState(false);
  const [docked, setDocked] = useState(false);
  const [closed, setClosed] = useState(false);
  const [ended, setEnded] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  const { nextEp } = adjacent(queue, episode);
  const canAutoAdvance = !!nextEp && !nextEp.is_locked;

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setEnded(false);
    setClosed(false);
    setCountdown(COUNTDOWN_SECONDS);

    loadYouTubeApi().then(() => {
      if (cancelled || !containerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: episode.youtube_id,
        playerVars: { autoplay: 1, controls: 1, playsinline: 1 },
        events: {
          onReady: (e: any) => {
            if (cancelled) return;
            setReady(true);
            e.target.playVideo();
          },
          onStateChange: (e: any) => {
            if (cancelled) return;
            if (e.data === window.YT.PlayerState.ENDED) setEnded(true);
            else if (e.data === window.YT.PlayerState.PLAYING) setEnded(false);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episode.id]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const obs = new IntersectionObserver(([entry]) => setDocked(!entry.isIntersecting), { threshold: 0 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!ended || !canAutoAdvance) return undefined;
    if (countdown <= 0) {
      onSelect(nextEp as Episode);
      return undefined;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ended, countdown, canAutoAdvance]);

  function closePip() {
    playerRef.current?.pauseVideo?.();
    setClosed(true);
  }

  function expandBack() {
    wrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const showFloating = docked && !closed;
  const artwork = nextEp?.cover || nextEp?.thumbnail_url || '';

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <div
        className={
          showFloating
            ? 'fixed z-40 bottom-4 right-4 w-[220px] sm:w-[260px] aspect-video rounded-lg overflow-hidden shadow-2xl ring-1 ring-black/20 transition-opacity duration-200'
            : 'absolute inset-0'
        }
      >
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-brand-900 z-0">
            <Spinner size="lg" className="text-white/60" />
          </div>
        )}
        <div ref={containerRef} className="absolute inset-0 h-full w-full" />

        {showFloating && (
          <div className="absolute top-0 inset-x-0 flex justify-end gap-1 p-1.5 bg-gradient-to-b from-black/60 to-transparent">
            <button
              type="button"
              onClick={expandBack}
              aria-label="Revenir en haut"
              className="h-6 w-6 rounded bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={closePip}
              aria-label="Fermer le mini-lecteur"
              className="h-6 w-6 rounded bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {ended && canAutoAdvance && nextEp && !showFloating && (
          <div className="absolute inset-0 z-10 bg-black/85 flex items-center justify-center p-4 sm:p-6">
            <div className="flex items-center gap-4 max-w-md text-white">
              <div className="relative h-16 w-28 sm:h-20 sm:w-32 shrink-0 rounded overflow-hidden" style={{ backgroundColor: showColor }}>
                {artwork && <img src={artwork} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                  <svg viewBox="0 0 40 40" className="h-9 w-9 sm:h-10 sm:w-10 -rotate-90">
                    <circle cx="20" cy="20" r="17" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                    <circle
                      cx="20" cy="20" r="17" fill="none" stroke="#F5C24E" strokeWidth="3" strokeLinecap="round"
                      strokeDasharray={RING_CIRCUMFERENCE}
                      strokeDashoffset={RING_CIRCUMFERENCE * (1 - countdown / COUNTDOWN_SECONDS)}
                      style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                  </svg>
                  <span className="absolute text-sm font-bold">{countdown}</span>
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wide text-white/60 mb-1">Lecture automatique</p>
                <h4 className="font-bold text-sm sm:text-base leading-snug line-clamp-2">{nextEp.title}</h4>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => onSelect(nextEp)}
                    className="rounded-full bg-amber-400 text-ink-900 text-xs font-bold px-3.5 py-1.5 hover:bg-amber-300 transition-colors"
                  >
                    Regarder maintenant
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnded(false)}
                    className="rounded-full bg-white/15 text-white text-xs font-semibold px-3.5 py-1.5 hover:bg-white/25 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

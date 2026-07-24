'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Rewind, FastForward, Share2 } from 'lucide-react';

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

// Plays a YouTube video's audio track only: the iframe is rendered off-screen
// and controlled via the IFrame Player API, with a custom audio-player UI on top.
export default function AudioEmbed({
  videoId,
  title,
  artwork,
  speaker,
  autoplay = true,
}: {
  videoId: string;
  title: string;
  artwork?: string;
  speaker?: string;
  autoplay?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let cancelled = false;

    loadYouTubeApi().then(() => {
      if (cancelled || !containerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: { autoplay: autoplay ? 1 : 0, controls: 0, disablekb: 1, playsinline: 1 },
        events: {
          onReady: (e: any) => {
            if (cancelled) return;
            setReady(true);
            setDuration(e.target.getDuration());
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
  }, [videoId, autoplay]);

  function togglePlay() {
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

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const t = Number(e.target.value);
    playerRef.current?.seekTo(t, true);
    setCurrent(t);
  }

  async function share() {
    const url = `https://youtu.be/${videoId}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled share sheet — nothing to do
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
    }
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 sm:gap-4 px-6 py-6">
      <div ref={containerRef} className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true" />

      {artwork && (
        <div className="h-28 w-28 sm:h-36 sm:w-36 shrink-0 overflow-hidden rounded-xl shadow-lg">
          <img src={artwork} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      <div className="text-center px-4">
        <h2 className="font-bold text-white text-sm sm:text-base leading-snug line-clamp-2">{title}</h2>
        {speaker && <p className="mt-1 text-xs sm:text-sm text-white/70">{speaker}</p>}
      </div>

      <div className="w-full max-w-md flex items-center gap-2 text-xs text-white/70">
        <span>{fmtTime(current)}</span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={current}
          onChange={seek}
          className="flex-1 accent-white"
          aria-label="Progression de la lecture"
        />
        <span>{fmtTime(duration)}</span>
      </div>

      <div className="flex items-center gap-6 sm:gap-8">
        <button type="button" onClick={() => skip(-10)} aria-label="Reculer de 10 secondes" className="text-white">
          <Rewind className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={togglePlay}
          disabled={!ready}
          aria-label={playing ? 'Pause' : 'Lecture'}
          className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-white text-ink-900 disabled:opacity-50 transition-transform hover:scale-105"
        >
          {playing ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current ml-0.5" />}
        </button>
        <button type="button" onClick={() => skip(10)} aria-label="Avancer de 10 secondes" className="text-white">
          <FastForward className="h-6 w-6" />
        </button>
        <button type="button" onClick={share} aria-label="Partager" className="text-white/90 ml-2">
          <Share2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

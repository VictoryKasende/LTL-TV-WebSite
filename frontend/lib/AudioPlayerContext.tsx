'use client';

import {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from 'react';
import type { Episode } from './api';
import { loadYouTubeApi, SPEEDS } from './youtubeAudio';

export type AudioQueueContext = {
  showTitle: string;
  showSlug: string;
  showHostPhoto?: string | null;
  showCover?: string | null;
  queue: Episode[];
};

type Track = { episode: Episode; ctx: AudioQueueContext };

export function artworkFor(episode: Episode, ctx: AudioQueueContext): string {
  return episode.cover || episode.thumbnail_url || ctx.showHostPhoto || ctx.showCover || '';
}

function adjacentEpisodes(track: Track | null) {
  if (!track) return { prevEp: null as Episode | null, nextEp: null as Episode | null };
  const idx = track.ctx.queue.findIndex((e) => e.id === track.episode.id);
  const prevEp = idx > 0 ? track.ctx.queue[idx - 1] : null;
  const nextEp = idx >= 0 && idx < track.ctx.queue.length - 1 ? track.ctx.queue[idx + 1] : null;
  return { prevEp, nextEp };
}

type AudioPlayerContextValue = {
  track: Track | null;
  artwork: string;
  ready: boolean;
  playing: boolean;
  current: number;
  duration: number;
  speed: number;
  heroVisible: boolean;
  setHeroVisible: (v: boolean) => void;
  canPrev: boolean;
  canNext: boolean;
  play: (episode: Episode, ctx: AudioQueueContext) => void;
  toggle: () => void;
  skip: (delta: number) => void;
  seekTo: (t: number) => void;
  cycleSpeed: () => void;
  selectPrev: () => void;
  selectNext: () => void;
  share: () => void;
};

const AudioPlayerCtx = createContext<AudioPlayerContextValue | null>(null);

export function useAudioPlayerContext() {
  const ctx = useContext(AudioPlayerCtx);
  if (!ctx) throw new Error('useAudioPlayerContext must be used within AudioPlayerProvider');
  return ctx;
}

// Owns a single YouTube IFrame Player instance, mounted once at the app root so
// audio keeps playing across client-side navigation instead of dying with the page
// that started it. Only the audio track is used — see components/AudioPlayer.tsx.
export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const trackRef = useRef<Track | null>(null);

  const [track, setTrack] = useState<Track | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [heroVisible, setHeroVisible] = useState(false);

  trackRef.current = track;

  const play = useCallback((episode: Episode, ctx: AudioQueueContext) => {
    if (episode.is_locked) return;
    setTrack({ episode, ctx });
  }, []);

  const { prevEp, nextEp } = adjacentEpisodes(track);
  const canPrev = !!prevEp && !prevEp.is_locked;
  const canNext = !!nextEp && !nextEp.is_locked;

  function selectPrev() {
    if (canPrev && prevEp && track) play(prevEp, track.ctx);
  }
  function selectNext() {
    if (canNext && nextEp && track) play(nextEp, track.ctx);
  }

  function handleEnded() {
    const t = trackRef.current;
    if (!t) return;
    const { nextEp: n } = adjacentEpisodes(t);
    const upNext = n && !n.is_locked ? n : t.ctx.queue.find((e) => !e.is_locked) ?? null;
    if (upNext && upNext.id !== t.episode.id) play(upNext, t.ctx);
  }

  // (Re)mount the YT player whenever the selected episode changes.
  useEffect(() => {
    if (!track) return undefined;
    let cancelled = false;
    setReady(false);
    setCurrent(0);
    setDuration(track.episode.duration_seconds || 0);
    setSpeed(1);

    loadYouTubeApi().then(() => {
      if (cancelled || !containerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: track.episode.youtube_id,
        playerVars: { autoplay: 1, controls: 0, disablekb: 1, playsinline: 1 },
        events: {
          onReady: (e: any) => {
            if (cancelled) return;
            setReady(true);
            const d = e.target.getDuration();
            if (d) setDuration(d);
            e.target.playVideo();
          },
          onStateChange: (e: any) => {
            if (cancelled) return;
            setPlaying(e.data === window.YT.PlayerState.PLAYING);
            const d = e.target.getDuration();
            if (d) setDuration(d);
            if (e.data === window.YT.PlayerState.ENDED) handleEnded();
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
  }, [track?.episode.id]);

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

  async function share() {
    if (!track) return;
    const url = `https://youtu.be/${track.episode.youtube_id}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: track.episode.title, url });
      } catch {
        // user cancelled share sheet — nothing to do
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
    }
  }

  const artwork = track ? artworkFor(track.episode, track.ctx) : '';

  // Lock-screen / notification controls, so playback survives the visitor
  // switching apps or locking their phone.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    if (!track) {
      navigator.mediaSession.metadata = null;
      return;
    }
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.episode.title,
      artist: track.episode.speaker || track.ctx.showTitle,
      album: track.ctx.showTitle,
      artwork: artwork ? [{ src: artwork, sizes: '512x512', type: 'image/jpeg' }] : [],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.episode.id, artwork]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
  }, [playing]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator) || !track) return undefined;
    navigator.mediaSession.setActionHandler('play', toggle);
    navigator.mediaSession.setActionHandler('pause', toggle);
    navigator.mediaSession.setActionHandler('seekbackward', () => skip(-15));
    navigator.mediaSession.setActionHandler('seekforward', () => skip(30));
    navigator.mediaSession.setActionHandler('seekto', (details: any) => {
      if (details?.seekTime != null) seekTo(details.seekTime);
    });
    navigator.mediaSession.setActionHandler('previoustrack', canPrev ? selectPrev : null);
    navigator.mediaSession.setActionHandler('nexttrack', canNext ? selectNext : null);
    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('seekforward', null);
      navigator.mediaSession.setActionHandler('seekto', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.episode.id, playing, duration, canPrev, canNext]);

  const value: AudioPlayerContextValue = {
    track, artwork, ready, playing, current, duration, speed, heroVisible, setHeroVisible,
    canPrev, canNext, play, toggle, skip, seekTo, cycleSpeed, selectPrev, selectNext, share,
  };

  return (
    <AudioPlayerCtx.Provider value={value}>
      {children}
      <div ref={containerRef} className="fixed -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true" />
    </AudioPlayerCtx.Provider>
  );
}

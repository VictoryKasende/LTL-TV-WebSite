'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, ArrowUpRight, Pause, Play, Volume2, VolumeX,
} from 'lucide-react';
import Spinner from '../ui/Spinner';
import { useResilientData } from '../../lib/useResilientData';
import { loadYouTubeApi } from '../../lib/youtubeAudio';
import type { Banner } from '../../lib/api';

const AUTOPLAY_MS = 4000;
const SWIPE_THRESHOLD = 50;
const VIDEO_CONTROL_CLASS =
  'h-9 w-9 md:h-11 md:w-11 inline-flex items-center justify-center rounded-full bg-brand-900/40 backdrop-blur-sm border border-white/20 text-white/90 hover:bg-white/20 hover:text-white transition-colors';

function pickImage(banner: Banner, variant: 'desktop' | 'mobile'): string | null {
  return banner.images.find((i) => i.variant === variant)?.image
    ?? banner.images[0]?.image
    ?? null;
}

/** A YouTube announcement filling its carousel slide: autoplays (with
 *  sound when the browser allows it) only while its slide is visible,
 *  restarting from the top each time, and reports the end so the carousel
 *  can move on. */
function YouTubeSlide({
  videoId, active, muted, userPaused, loop, poster, title, onEnded, onSoundBlocked,
}: {
  videoId: string;
  active: boolean;
  muted: boolean;
  userPaused: boolean;
  loop: boolean;
  poster: string | null;
  title: string;
  onEnded: () => void;
  onSoundBlocked: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  // The poster covers YouTube's title bar / spinner until frames actually play.
  const [started, setStarted] = useState(false);
  // Don't load YouTube for a slide nobody has reached yet.
  const [wanted, setWanted] = useState(active);
  const latest = useRef({ active, muted, userPaused, onEnded, onSoundBlocked });
  latest.current = { active, muted, userPaused, onEnded, onSoundBlocked };

  useEffect(() => { if (active) setWanted(true); }, [active]);

  useEffect(() => {
    if (!wanted || !hostRef.current) return undefined;
    let cancelled = false;
    // YT.Player swaps its target for an iframe: give it a node React doesn't own.
    const target = document.createElement('div');
    hostRef.current.appendChild(target);
    loadYouTubeApi().then(() => {
      if (cancelled) return;
      playerRef.current = new window.YT.Player(target, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 0, mute: latest.current.muted ? 1 : 0, controls: 0, disablekb: 1, playsinline: 1,
          modestbranding: 1, rel: 0, fs: 0, iv_load_policy: 3,
          ...(loop ? { loop: 1, playlist: videoId } : {}),
        },
        events: {
          onReady: () => setReady(true),
          onStateChange: (e: { data: number }) => {
            if (e.data === window.YT.PlayerState.PLAYING) setStarted(true);
            if (e.data === window.YT.PlayerState.ENDED && latest.current.active) latest.current.onEnded();
          },
          // Private / deleted / embedding disabled: skip rather than stall the carousel.
          onError: () => { if (latest.current.active) latest.current.onEnded(); },
        },
      });
    });
    const host = hostRef.current;
    return () => {
      cancelled = true;
      playerRef.current?.destroy?.();
      playerRef.current = null;
      host.innerHTML = '';
      setReady(false);
    };
  }, [wanted, videoId, loop]);

  // Coming into view: restart from the top. Leaving: stop.
  useEffect(() => {
    const player = playerRef.current;
    if (!ready || !player) return;
    if (active) player.seekTo(0, true);
    else player.pauseVideo();
  }, [active, ready]);

  // Play / pause button.
  useEffect(() => {
    const player = playerRef.current;
    if (!ready || !player || !active) return;
    if (userPaused) player.pauseVideo(); else player.playVideo();
  }, [active, ready, userPaused]);

  useEffect(() => {
    const player = playerRef.current;
    if (!ready || !player) return;
    if (muted) {
      player.mute();
      // Muting is also the fallback when sound was blocked: start playing.
      if (latest.current.active && !latest.current.userPaused) player.playVideo();
    } else {
      player.unMute();
    }
  }, [muted, ready]);

  // Browsers refuse to autoplay with sound until the visitor has interacted
  // with the site: the video just doesn't start. Detect that and let the
  // carousel fall back to muted (sound comes back on the first tap).
  useEffect(() => {
    const player = playerRef.current;
    if (!ready || !player || !active || muted || userPaused) return undefined;
    let tries = 0;
    const id = setInterval(() => {
      const state = player.getPlayerState?.();
      const S = window.YT.PlayerState;
      if (state === S.PLAYING || state === S.ENDED) { clearInterval(id); return; }
      if (state === S.BUFFERING && ++tries < 6) return;
      if (++tries >= 2) {
        clearInterval(id);
        latest.current.onSoundBlocked();
      }
    }, 800);
    return () => clearInterval(id);
  }, [active, ready, muted, userPaused]);

  return (
    <div className="absolute inset-0 overflow-hidden [container-type:size]" aria-label={title} role="img">
      {/* Scaled to cover the slide like object-cover (the slide itself is
          16:9 for videos, so nothing is cropped unless the screen is very
          short). Clicks pass through to the slide. */}
      <div
        ref={hostRef}
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[max(100cqw,177.78cqh)] h-[max(100cqh,56.25cqw)]"
      />
      <img
        src={poster ?? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
        alt=""
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
          started ? 'opacity-0' : 'opacity-100'
        }`}
      />
    </div>
  );
}

export default function BannerCarousel({ initialData }: { initialData: Banner[] | null }) {
  const { data, retrying } = useResilientData(initialData, '/api/v1/banners/active/');
  const banners = data ?? [];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // Videos start with sound; if the browser blocks that, they play muted
  // and the sound comes on at the visitor's first tap / click / key press.
  const [muted, setMuted] = useState(false);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const [videoPaused, setVideoPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const count = banners.length;
  const activeIsVideo = !!banners[index]?.youtube_id;

  useEffect(() => { setVideoPaused(false); }, [index]);

  const onSoundBlocked = useCallback(() => {
    setSoundBlocked(true);
    setMuted(true);
  }, []);

  useEffect(() => {
    if (!soundBlocked) return undefined;
    function unmuteOnFirstGesture(e: Event) {
      // The sound button handles its own click.
      if ((e.target as Element | null)?.closest?.('[data-sound-toggle]')) return;
      setSoundBlocked(false);
      setMuted(false);
    }
    const events = ['pointerdown', 'keydown'] as const;
    events.forEach((t) => window.addEventListener(t, unmuteOnFirstGesture, { once: true }));
    return () => events.forEach((t) => window.removeEventListener(t, unmuteOnFirstGesture));
  }, [soundBlocked]);

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);
  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  // Image slides advance on a timer; a video slide advances when the video
  // ends (see YouTubeSlide's onEnded), so an announcement is seen in full.
  useEffect(() => {
    if (count < 2 || paused || activeIsVideo) return;
    const id = setTimeout(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearTimeout(id);
  }, [count, paused, activeIsVideo, index]);

  useEffect(() => {
    if (count < 2) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [count, next, prev]);

  if (count === 0) {
    if (retrying) {
      return (
        <div className="flex items-center justify-center gap-3 py-20 text-white bg-brand-900">
          <Spinner size="sm" className="text-white" />
          Chargement…
        </div>
      );
    }

    return (
      <div className="relative bg-hero-rays text-white">
        <div className="relative px-6 md:px-14 py-20 md:py-28 text-center">
          <img
            src="/logo-ltl-white.svg"
            alt="LTL TV"
            className="h-7 md:h-8 w-auto mx-auto mb-8 opacity-95"
          />
          <h1 className="font-display tracking-tight text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.9]">
            ANNONCER <span className="text-signal-400">L&apos;ÉVANGILE</span>
            <br className="hidden md:block" />
            PAR LES MÉDIAS
          </h1>
          <p className="mt-6 max-w-xl mx-auto text-sm md:text-base text-white/85 leading-relaxed">
            Émissions, LIVE Zoom et YouTube — chaque semaine, avec vous.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full overflow-hidden bg-brand-900 text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const delta = e.changedTouches[0].clientX - touchStartX.current;
        if (delta > SWIPE_THRESHOLD) prev();
        else if (delta < -SWIPE_THRESHOLD) next();
        touchStartX.current = null;
      }}
    >
      {/* A video slide takes the video's own 16:9 shape on every screen
          (capped so it never overflows a short viewport); image slides
          keep their per-breakpoint band. */}
      <div
        className={`relative w-full transition-[aspect-ratio] duration-500 ${
          activeIsVideo
            ? 'aspect-video max-h-[calc(100svh-7rem)]'
            : 'aspect-[3/4] sm:aspect-[16/10] md:aspect-[16/7] lg:aspect-[21/8]'
        }`}
      >
        <div aria-hidden className="absolute inset-0 bg-hero-rays" />

        {banners.map((banner, i) => {
          const desktop = pickImage(banner, 'desktop');
          const mobile = pickImage(banner, 'mobile');
          const isLive = /live/i.test(banner.public_title);
          const active = i === index;

          return (
            <div
              key={banner.id}
              aria-hidden={!active}
              className={`absolute inset-0 transition-opacity duration-700 ease-out-editorial ${
                active ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none'
              }`}
            >
              {banner.youtube_id ? (
                <YouTubeSlide
                  videoId={banner.youtube_id}
                  active={active}
                  muted={muted}
                  userPaused={active && videoPaused}
                  loop={count < 2}
                  poster={desktop ?? mobile}
                  title={banner.alt_text || banner.public_title || 'Vidéo d\'annonce LTL·TV'}
                  onEnded={next}
                  onSoundBlocked={onSoundBlocked}
                />
              ) : (desktop || mobile) && (
                <picture>
                  {desktop && <source media="(min-width: 768px)" srcSet={desktop} />}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mobile ?? desktop ?? ''}
                    alt={banner.alt_text || banner.public_title || 'Bannière LTL·TV'}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </picture>
              )}
              {banner.youtube_id ? (
                // Keep the ad readable: only shade the bottom, and only when
                // there's a title or button to sit on it.
                (banner.public_title || banner.link_url) && (
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-900/85 via-brand-900/10 to-transparent" />
                )
              ) : (
                <div className="absolute inset-0 bg-gradient-to-t from-brand-900/95 via-brand-900/40 to-brand-900/5" />
              )}

              <div
                className={`relative h-full flex flex-col items-center justify-end md:justify-center px-6 md:px-14 md:pb-0 text-center ${
                  banner.youtube_id ? 'pb-12' : 'pb-16'
                }`}
              >
                {isLive && (
                  <div className="inline-flex items-center gap-2 text-signal-400 uppercase tracking-[0.15em] text-sm md:text-base font-bold mb-3">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inset-0 rounded-full bg-live animate-pulse-dot" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-live" />
                    </span>
                    LIVE
                  </div>
                )}

                {banner.public_title && (
                  <h1
                    className={`font-display tracking-tight leading-[0.95] max-w-3xl text-balance ${
                      banner.youtube_id ? 'text-[clamp(1.5rem,6vw,4.5rem)]' : 'text-[clamp(2rem,6vw,4.5rem)]'
                    }`}
                  >
                    {banner.public_title}
                  </h1>
                )}

                {banner.link_url && (
                  <Link
                    href={banner.link_url}
                    target={banner.link_target === '_blank' ? '_blank' : undefined}
                    rel={banner.link_target === '_blank' ? 'noopener noreferrer' : undefined}
                    className={`inline-flex items-center gap-2 rounded-full bg-white text-brand-700 font-bold text-sm hover:bg-signal-400 transition-colors ${
                      banner.youtube_id ? 'mt-3 md:mt-6 px-4 py-2 md:px-6 md:py-3' : 'mt-6 px-6 py-3'
                    }`}
                  >
                    Découvrir
                    <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {activeIsVideo && (
        <div className="absolute z-20 bottom-3 right-3 md:bottom-6 md:right-8 flex items-center gap-2">
          <button
            type="button"
            aria-label={videoPaused ? 'Lire la vidéo' : 'Mettre la vidéo en pause'}
            onClick={() => setVideoPaused((p) => !p)}
            className={VIDEO_CONTROL_CLASS}
          >
            {videoPaused ? <Play className="h-4 w-4 md:h-5 md:w-5 translate-x-px" /> : <Pause className="h-4 w-4 md:h-5 md:w-5" />}
          </button>
          <button
            type="button"
            data-sound-toggle
            aria-label={muted ? 'Activer le son' : 'Couper le son'}
            aria-pressed={!muted}
            onClick={() => { setSoundBlocked(false); setMuted((m) => !m); }}
            className={VIDEO_CONTROL_CLASS}
          >
            {muted ? <VolumeX className="h-4 w-4 md:h-5 md:w-5" /> : <Volume2 className="h-4 w-4 md:h-5 md:w-5" />}
          </button>
        </div>
      )}

      {count > 1 && (
        <>
          <div className="absolute bottom-5 md:bottom-7 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                aria-label={`Aller à la diapositive ${i + 1}`}
                aria-current={i === index}
                onClick={() => go(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? 'w-8 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label="Précédent"
            onClick={prev}
            className="hidden md:inline-flex absolute z-20 left-4 lg:left-8 top-1/2 -translate-y-1/2 h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/85 hover:bg-white/20 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Suivant"
            onClick={next}
            className="hidden md:inline-flex absolute z-20 right-4 lg:right-8 top-1/2 -translate-y-1/2 h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/85 hover:bg-white/20 hover:text-white transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
}

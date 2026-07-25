'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Play, Pause, Volume2, VolumeX, Expand, Shrink, Share2, X, Maximize2, Loader2,
} from 'lucide-react';
import type { Episode } from '../lib/api';
import { loadYouTubeApi, fmtTime, SPEEDS } from '../lib/youtubeAudio';

const COUNTDOWN_SECONDS = 5;
const RING_CIRCUMFERENCE = 2 * Math.PI * 17;
const HIDE_DELAY = 2500;

function adjacent(queue: Episode[], episode: Episode) {
  const idx = queue.findIndex((e) => e.id === episode.id);
  const prevEp = idx > 0 ? queue[idx - 1] : null;
  const nextEp = idx >= 0 && idx < queue.length - 1 ? queue[idx + 1] : null;
  return { prevEp, nextEp };
}

// Fully custom-controlled YouTube player (native chrome hidden) for video
// shows, enhanced with a scroll-linked floating mini-player and an
// autoplay-next prompt between episodes of the same show.
export default function VideoPlayer({
  episode, queue, onSelect, showColor,
}: {
  episode: Episode;
  queue: Episode[];
  onSelect: (ep: Episode) => void;
  showColor: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draggingRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(episode.duration_seconds || 0);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  const [docked, setDocked] = useState(false);
  const [closed, setClosed] = useState(false);
  const [ended, setEnded] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  const { nextEp } = adjacent(queue, episode);
  const canAutoAdvance = !!nextEp && !nextEp.is_locked;

  // Mount / remount the (chromeless) YT player whenever the episode changes.
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setPlaying(false);
    setCurrent(0);
    setDuration(episode.duration_seconds || 0);
    setMuted(false);
    setSpeed(1);
    setEnded(false);
    setClosed(false);
    setCountdown(COUNTDOWN_SECONDS);

    loadYouTubeApi().then(() => {
      if (cancelled || !containerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: episode.youtube_id,
        playerVars: {
          autoplay: 1, controls: 0, disablekb: 1, playsinline: 1, modestbranding: 1, rel: 0,
          fs: 0, iv_load_policy: 3, cc_load_policy: 0,
        },
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
            const st = e.data;
            setPlaying(st === window.YT.PlayerState.PLAYING);
            const d = e.target.getDuration();
            if (d) setDuration(d);
            if (st === window.YT.PlayerState.ENDED) setEnded(true);
            else if (st === window.YT.PlayerState.PLAYING) setEnded(false);
          },
        },
      });
    });

    const interval = setInterval(() => {
      const p = playerRef.current;
      if (p?.getCurrentTime && !draggingRef.current) setCurrent(p.getCurrentTime());
    }, 500);

    return () => {
      cancelled = true;
      clearInterval(interval);
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episode.id]);

  // Scroll-linked floating mini-player.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const obs = new IntersectionObserver(([entry]) => setDocked(!entry.isIntersecting), { threshold: 0 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Autoplay-next countdown.
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

  // Auto-hide controls while playing and idle.
  function wakeControls() {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (playing) hideTimerRef.current = setTimeout(() => setControlsVisible(false), HIDE_DELAY);
  }
  useEffect(() => {
    wakeControls();
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  useEffect(() => {
    function onFsChange() { setFullscreen(!!document.fullscreenElement); }
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  function toggle() {
    const p = playerRef.current;
    if (!p) return;
    if (playing) p.pauseVideo();
    else p.playVideo();
  }

  function toggleMute() {
    const p = playerRef.current;
    if (!p) return;
    if (muted) { p.unMute(); setMuted(false); } else { p.mute(); setMuted(true); }
  }

  function cycleSpeed() {
    const idx = SPEEDS.indexOf(speed);
    const next = SPEEDS[(idx + 1) % SPEEDS.length];
    playerRef.current?.setPlaybackRate?.(next);
    setSpeed(next);
  }

  function seekToRatio(ratio: number) {
    const t = Math.min(duration, Math.max(0, duration * ratio));
    playerRef.current?.seekTo(t, true);
    setCurrent(t);
  }

  function ratioFromEvent(e: { clientX: number }, el: HTMLElement) {
    const rect = el.getBoundingClientRect();
    return Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
  }

  function onScrubPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    draggingRef.current = true;
    seekToRatio(ratioFromEvent(e, e.currentTarget));
    const track = e.currentTarget;
    function onMove(ev: PointerEvent) { seekToRatio(ratioFromEvent(ev, track)); }
    function onUp() {
      draggingRef.current = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  async function toggleFullscreen() {
    const el = stageRef.current;
    if (!el) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await el.requestFullscreen?.();
  }

  async function share() {
    const url = `https://youtu.be/${episode.youtube_id}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: episode.title, url }); } catch { /* cancelled */ }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
    }
  }

  function closePip() {
    playerRef.current?.pauseVideo?.();
    setClosed(true);
  }

  function expandBack() {
    wrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const showFloating = docked && !closed;
  const artwork = nextEp?.cover || nextEp?.thumbnail_url || '';
  const ratio = duration > 0 ? current / duration : 0;
  const showBigControls = !showFloating;

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <div
        className={
          showFloating
            ? 'fixed z-40 bottom-4 right-4 w-[220px] sm:w-[260px] aspect-video rounded-lg overflow-hidden shadow-2xl ring-1 ring-black/20 transition-opacity duration-200 bg-black'
            : 'absolute inset-0 bg-black'
        }
      >
        <div
          ref={stageRef}
          className="relative h-full w-full"
          onMouseMove={showBigControls ? wakeControls : undefined}
        >
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center bg-brand-900 z-0">
              <Loader2 className="h-8 w-8 text-white/70 animate-spin" />
            </div>
          )}
          <div ref={containerRef} className="absolute inset-0 h-full w-full pointer-events-none" />
          {/* Transparent hit layer so clicks toggle play instead of hitting the iframe. */}
          {showBigControls && (
            <button
              type="button"
              aria-label={playing ? 'Pause' : 'Lecture'}
              onClick={toggle}
              className="absolute inset-0 h-full w-full cursor-pointer"
            />
          )}

          {showFloating ? (
            <>
              <div className="absolute top-0 inset-x-0 flex justify-end gap-1 p-1.5 bg-gradient-to-b from-black/60 to-transparent z-20">
                <button type="button" onClick={expandBack} aria-label="Revenir en haut" className="h-6 w-6 rounded bg-black/50 text-white flex items-center justify-center hover:bg-black/70">
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={closePip} aria-label="Fermer le mini-lecteur" className="h-6 w-6 rounded bg-black/50 text-white flex items-center justify-center hover:bg-black/70">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <button
                type="button"
                onClick={toggle}
                aria-label={playing ? 'Pause' : 'Lecture'}
                className="absolute inset-0 flex items-center justify-center z-10"
              >
                <span className="h-9 w-9 rounded-full bg-white/85 flex items-center justify-center">
                  {playing ? <Pause className="h-4 w-4 text-ink-900 fill-current" /> : <Play className="h-4 w-4 text-ink-900 fill-current ml-0.5" />}
                </span>
              </button>
              <div className="absolute bottom-0 inset-x-0 h-[3px] bg-white/20 z-10">
                <div className="h-full bg-amber-400" style={{ width: `${ratio * 100}%` }} />
              </div>
            </>
          ) : (
            <>
              {/* Centered play/pause, visible when paused or controls are awake. */}
              <div
                className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 z-10 pointer-events-none ${
                  !playing || controlsVisible ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {!playing && ready && (
                  <span className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="h-5 w-5 sm:h-6 sm:w-6 text-ink-900 fill-current ml-1" />
                  </span>
                )}
              </div>

              {/* Custom control bar. */}
              <div
                className={`absolute bottom-0 inset-x-0 z-20 px-3 sm:px-4 pb-2.5 pt-8 bg-gradient-to-t from-black/85 to-transparent transition-opacity duration-200 ${
                  controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <div
                  className="group/scrub flex items-center gap-2 h-4 cursor-pointer"
                  onPointerDown={onScrubPointerDown}
                >
                  <div className="relative flex-1 h-1 rounded-full bg-white/25 group-hover/scrub:h-1.5 transition-all">
                    <div className="absolute inset-y-0 left-0 rounded-full bg-amber-400" style={{ width: `${ratio * 100}%` }} />
                    <div
                      className="absolute top-1/2 h-3 w-3 rounded-full bg-amber-400 shadow -translate-y-1/2 -translate-x-1/2"
                      style={{ left: `${ratio * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={toggle} aria-label={playing ? 'Pause' : 'Lecture'} className="text-white">
                      {playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
                    </button>
                    <button type="button" onClick={toggleMute} aria-label={muted ? 'Activer le son' : 'Couper le son'} className="text-white">
                      {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </button>
                    <span className="text-white/80 text-xs tabular-nums hidden sm:inline">
                      {fmtTime(current)} / {fmtTime(duration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button type="button" onClick={share} aria-label="Partager" className="text-white/85 hover:text-white">
                      <Share2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={cycleSpeed}
                      className="rounded bg-white/10 border border-white/20 px-2 py-0.5 text-xs font-bold text-white tabular-nums hover:bg-white/20"
                    >
                      {speed}×
                    </button>
                    <button type="button" onClick={toggleFullscreen} aria-label={fullscreen ? 'Quitter le plein écran' : 'Plein écran'} className="text-white">
                      {fullscreen ? <Shrink className="h-5 w-5" /> : <Expand className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {ended && canAutoAdvance && nextEp && !showFloating && (
            <div className="absolute inset-0 z-30 bg-black/85 flex items-center justify-center p-4 sm:p-6">
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
    </div>
  );
}

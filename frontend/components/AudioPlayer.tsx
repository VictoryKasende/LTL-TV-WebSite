'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Rewind, FastForward, Share2, ChevronDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useAudioPlayerContext } from '../lib/AudioPlayerContext';
import { fmtTime } from '../lib/youtubeAudio';
import Waveform from './Waveform';
import EqBars from './EqBars';

function playGlyph(ready: boolean, playing: boolean, size: string) {
  if (!ready) return <Loader2 className={`${size} animate-spin`} />;
  return playing ? <Pause className={`${size} fill-current`} /> : <Play className={`${size} fill-current ml-0.5`} />;
}

// The large "now playing" view: used inline in the show page hero, and reused
// (compact) inside the mobile full-screen sheet opened from the docked bar.
export function AudioPlayerExpanded({ compact = false }: { compact?: boolean }) {
  const ctx = useAudioPlayerContext();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (compact) return undefined;
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const obs = new IntersectionObserver(([entry]) => ctx.setHeroVisible(!!entry.isIntersecting), { threshold: 0 });
    obs.observe(el);
    return () => {
      obs.disconnect();
      ctx.setHeroVisible(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compact]);

  if (!ctx.track) return null;
  const { episode } = ctx.track;
  const artSize = compact ? 'h-24 w-24' : 'h-28 w-28 sm:h-36 sm:w-36';

  return (
    <div ref={rootRef} className={`flex flex-col items-center gap-4 sm:gap-5 px-6 ${compact ? 'py-6' : 'py-8 justify-center'}`}>
      {ctx.artwork && (
        <div className={`${artSize} shrink-0 overflow-hidden rounded-xl shadow-lg`}>
          <img src={ctx.artwork} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      <div className="text-center px-4">
        <p className="text-[10px] uppercase tracking-wide text-white/60 mb-1">{ctx.track.ctx.showTitle}</p>
        <h2 className="font-bold text-white text-sm sm:text-base leading-snug line-clamp-2">{episode.title}</h2>
        {episode.speaker && <p className="mt-1 text-xs sm:text-sm text-white/70">{episode.speaker}</p>}
      </div>

      <div className="w-full max-w-md flex items-center gap-2 text-xs text-white/70">
        <span className="tabular-nums w-10 shrink-0">{fmtTime(ctx.current)}</span>
        <Waveform current={ctx.current} duration={ctx.duration} onSeek={ctx.seekTo} className="flex-1 h-8" />
        <span className="tabular-nums w-10 shrink-0 text-right">{fmtTime(ctx.duration)}</span>
      </div>

      <div className="flex items-center gap-5 sm:gap-6">
        <button
          type="button"
          onClick={ctx.selectPrev}
          disabled={!ctx.canPrev}
          aria-label="Épisode précédent"
          className="text-white disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button type="button" onClick={() => ctx.skip(-15)} aria-label="Reculer de 15 secondes" className="text-white flex flex-col items-center gap-0.5">
          <Rewind className="h-6 w-6" />
          <span className="text-[9px] font-bold">15</span>
        </button>
        <button
          type="button"
          onClick={ctx.toggle}
          disabled={!ctx.ready}
          aria-label={ctx.playing ? 'Pause' : 'Lecture'}
          className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-white text-ink-900 disabled:opacity-80 transition-transform hover:scale-105"
        >
          {playGlyph(ctx.ready, ctx.playing, 'h-6 w-6')}
        </button>
        <button type="button" onClick={() => ctx.skip(30)} aria-label="Avancer de 30 secondes" className="text-white flex flex-col items-center gap-0.5">
          <FastForward className="h-6 w-6" />
          <span className="text-[9px] font-bold">30</span>
        </button>
        <button
          type="button"
          onClick={ctx.selectNext}
          disabled={!ctx.canNext}
          aria-label="Épisode suivant"
          className="text-white disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={ctx.cycleSpeed}
          className="rounded-full bg-white/10 border border-white/20 px-3.5 py-1.5 text-xs font-bold text-white tabular-nums transition-colors hover:bg-white/20"
        >
          {ctx.speed}×
        </button>
        <button type="button" onClick={ctx.share} aria-label="Partager" className="text-white/90 transition-colors hover:text-white">
          <Share2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

// Site-wide persistent player chrome: mounted once in the root layout so it
// survives client-side navigation. Renders nothing while nothing is playing.
export function GlobalAudioDock() {
  const ctx = useAudioPlayerContext();
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (ctx.heroVisible) setSheetOpen(false);
  }, [ctx.heroVisible]);

  useEffect(() => {
    if (!ctx.track) setSheetOpen(false);
  }, [ctx.track]);

  if (!ctx.track) return null;
  const { episode } = ctx.track;
  const docked = !ctx.heroVisible;
  const showTitle = ctx.track.ctx.showTitle;

  return (
    <>
      <div
        className={`fixed inset-x-0 bottom-0 z-40 bg-[#14152B] border-t border-white/10 transition-transform duration-300 motion-reduce:transition-none ${
          docked ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="h-[3px] bg-white/15">
          <div
            className="h-full bg-amber-400 transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${ctx.duration > 0 ? (ctx.current / ctx.duration) * 100 : 0}%` }}
          />
        </div>

        {/* Compact bar — mobile: tap to expand the full sheet. */}
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="md:hidden w-full flex items-center gap-3 px-4 py-2.5 text-left"
        >
          {ctx.artwork && <img src={ctx.artwork} alt="" className="h-10 w-10 rounded shrink-0 object-cover" />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-white truncate">{episode.title}</p>
              {ctx.playing && <EqBars className="shrink-0" />}
            </div>
            <p className="text-xs text-white/60 truncate">{episode.speaker || showTitle}</p>
          </div>
          <span
            onClick={(e) => { e.stopPropagation(); ctx.toggle(); }}
            role="button"
            tabIndex={0}
            aria-label={ctx.playing ? 'Pause' : 'Lecture'}
            className="shrink-0 h-9 w-9 rounded-full bg-white flex items-center justify-center text-ink-900"
          >
            {playGlyph(ctx.ready, ctx.playing, 'h-4 w-4')}
          </span>
        </button>

        {/* Full row — desktop: every control inline, no need to expand. */}
        <div className="hidden md:grid grid-cols-[1fr_auto_1fr] items-center gap-6 px-6 py-3">
          <div className="flex items-center gap-3 min-w-0">
            {ctx.artwork && <img src={ctx.artwork} alt="" className="h-10 w-10 rounded shrink-0 object-cover" />}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-white truncate">{episode.title}</p>
                {ctx.playing && <EqBars className="shrink-0" />}
              </div>
              <p className="text-xs text-white/60 truncate">
                {episode.speaker || showTitle} · {fmtTime(ctx.current)} / {fmtTime(ctx.duration)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button type="button" onClick={ctx.selectPrev} disabled={!ctx.canPrev} aria-label="Épisode précédent" className="text-white/80 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => ctx.skip(-15)} aria-label="Reculer de 15 secondes" className="text-white/80 hover:text-white transition-colors">
              <Rewind className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={ctx.toggle}
              disabled={!ctx.ready}
              aria-label={ctx.playing ? 'Pause' : 'Lecture'}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink-900 disabled:opacity-80"
            >
              {playGlyph(ctx.ready, ctx.playing, 'h-4 w-4')}
            </button>
            <button type="button" onClick={() => ctx.skip(30)} aria-label="Avancer de 30 secondes" className="text-white/80 hover:text-white transition-colors">
              <FastForward className="h-5 w-5" />
            </button>
            <button type="button" onClick={ctx.selectNext} disabled={!ctx.canNext} aria-label="Épisode suivant" className="text-white/80 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-3 justify-end">
            <button type="button" onClick={ctx.cycleSpeed} className="rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-bold text-white tabular-nums transition-colors hover:bg-white/20">
              {ctx.speed}×
            </button>
            <button type="button" onClick={ctx.share} aria-label="Partager" className="text-white/80 hover:text-white transition-colors">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile full-screen sheet, opened from the compact docked bar. */}
      <div
        className={`md:hidden fixed inset-0 z-50 bg-gradient-to-b from-brand-500 to-brand-900 flex flex-col transition-transform duration-300 motion-reduce:transition-none ${
          sheetOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 pt-4 shrink-0">
          <button type="button" onClick={() => setSheetOpen(false)} aria-label="Réduire" className="text-white p-2">
            <ChevronDown className="h-5 w-5" />
          </button>
          <span className="text-[11px] uppercase tracking-wide text-white/60">En cours de lecture</span>
          <span className="w-9" />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <AudioPlayerExpanded compact />
        </div>
      </div>
    </>
  );
}

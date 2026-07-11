'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import type { Banner } from '../../lib/api';

const AUTOPLAY_MS = 6500;
const SWIPE_THRESHOLD = 50;

function pickImage(banner: Banner, variant: 'desktop' | 'mobile'): string | null {
  return banner.images.find((i) => i.variant === variant)?.image
    ?? banner.images[0]?.image
    ?? null;
}

export default function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const count = banners.length;

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);
  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  useEffect(() => {
    if (count < 2 || paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [count, paused]);

  useEffect(() => {
    if (count < 2) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [count, next, prev]);

  if (count === 0) return null;

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
      <div className="relative w-full aspect-[3/4] sm:aspect-[16/10] md:aspect-[16/7] lg:aspect-[21/8]">
        <div aria-hidden className="absolute inset-0 bg-hero-rays" />

        {banners.map((banner, i) => {
          const desktop = pickImage(banner, 'desktop');
          const mobile = pickImage(banner, 'mobile');
          const isLive = /live/i.test(banner.title);
          const active = i === index;

          return (
            <div
              key={banner.id}
              aria-hidden={!active}
              className={`absolute inset-0 transition-opacity duration-700 ease-out-editorial ${
                active ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none'
              }`}
            >
              {(desktop || mobile) && (
                <picture>
                  {desktop && <source media="(min-width: 768px)" srcSet={desktop} />}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mobile ?? desktop ?? ''}
                    alt={banner.alt_text || banner.title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </picture>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-brand-900/95 via-brand-900/40 to-brand-900/5" />

              <div className="relative h-full flex flex-col items-center justify-end md:justify-center px-6 md:px-14 pb-16 md:pb-0 text-center">
                {isLive && (
                  <div className="inline-flex items-center gap-2 text-amber-400 uppercase tracking-[0.15em] text-sm md:text-base font-bold mb-3">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inset-0 rounded-full bg-live animate-pulse-dot" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-live" />
                    </span>
                    LIVE
                  </div>
                )}

                <h1 className="font-display tracking-tight text-[clamp(2rem,6vw,4.5rem)] leading-[0.95] max-w-3xl text-balance">
                  {banner.title}
                </h1>

                {banner.link_url && (
                  <Link
                    href={banner.link_url}
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-white text-brand-700 font-bold px-6 py-3 text-sm hover:bg-amber-400 transition-colors"
                  >
                    Découvrir
                    <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
                  </Link>
                )}
              </div>
            </div>
          );
        })}

        {/* LTL·TV wordmark, always on top of every slide */}
        <div className="absolute top-6 md:top-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <img src="/logo-ltl-white.svg" alt="LTL TV" className="h-6 md:h-7 w-auto opacity-95" />
        </div>
      </div>

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

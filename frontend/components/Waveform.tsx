'use client';

import { useMemo } from 'react';

export default function Waveform({
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

'use client';

import { useAudioPlayerContext } from '../lib/AudioPlayerContext';

// Reserves room for the global docked audio bar wherever it's actually shown,
// so it never covers page content (footer, pagination, etc.) underneath it.
export default function MainWithAudioPadding({ children }: { children: React.ReactNode }) {
  const ctx = useAudioPlayerContext();
  const padded = !!ctx.track && !ctx.heroVisible;
  return <main className={`flex-1 ${padded ? 'pb-16 md:pb-20' : ''}`}>{children}</main>;
}

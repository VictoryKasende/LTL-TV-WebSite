'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { useResilientData } from '../lib/useResilientData';
import type { Announcement } from '../lib/api';

const DISMISS_KEY_PREFIX = 'ltl-announcement-dismissed-';

export default function AnnouncementBar({ initialData }: { initialData: Announcement | null }) {
  const { data } = useResilientData(initialData, '/api/v1/announcements/active/');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!data) return;
    setDismissed(sessionStorage.getItem(`${DISMISS_KEY_PREFIX}${data.id}`) === '1');
  }, [data]);

  if (!data || !data.is_active_now || dismissed) return null;

  const { id, message, cta_label: ctaLabel, cta_url: ctaUrl } = data;
  // Duplicated so the -50% translateX loop is seamless regardless of text width.
  const looped = [message, message];

  return (
    <div className="relative bg-live text-white">
      <div className="flex items-center gap-3 pl-4 pr-11 py-2 sm:pl-6">
        <div className="min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
          <div className="flex w-max gap-16 whitespace-nowrap animate-marquee-slow motion-reduce:animate-none">
            {looped.map((text, i) => (
              <span key={i} className="text-xs sm:text-sm font-semibold tracking-wide">
                {text}
              </span>
            ))}
          </div>
        </div>

        {ctaUrl && ctaLabel && (
          <Link
            href={ctaUrl}
            className="shrink-0 rounded-full bg-amber-400 text-brand-800 font-semibold px-3.5 py-1.5 text-xs sm:text-sm hover:bg-amber-500 transition-colors"
          >
            {ctaLabel}
          </Link>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          sessionStorage.setItem(`${DISMISS_KEY_PREFIX}${id}`, '1');
          setDismissed(true);
        }}
        aria-label="Fermer cette annonce"
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-white/80 hover:text-white transition-colors"
      >
        <X className="h-4 w-4" strokeWidth={2.5} />
      </button>
    </div>
  );
}

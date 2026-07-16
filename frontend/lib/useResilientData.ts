'use client';

import { useEffect, useState } from 'react';
import { fixMediaUrls } from './api';

const RETRY_DELAYS_MS = [1000, 2000, 4000];

function isEmpty(data: unknown): boolean {
  if (data === null || data === undefined) return true;
  if (Array.isArray(data)) return data.length === 0;
  if (typeof data === 'object' && 'results' in (data as Record<string, unknown>)) {
    return ((data as { results: unknown[] }).results ?? []).length === 0;
  }
  return false;
}

function waitForOnline(): Promise<void> {
  if (typeof navigator === 'undefined' || navigator.onLine) return Promise.resolve();
  return new Promise((resolve) => {
    const onOnline = () => {
      window.removeEventListener('online', onOnline);
      resolve();
    };
    window.addEventListener('online', onOnline);
  });
}

/**
 * Re-fetches `path` client-side, with backoff, when `initialData` (rendered
 * server-side) came back empty — a transient backend/network blip during ISR
 * regeneration otherwise gets cached as "no data" for the whole revalidate
 * window. Waits for the `online` event first if the device is offline, which
 * matters most for installed PWAs used on flaky mobile connections.
 */
export function useResilientData<T>(initialData: T | null, path: string) {
  const [data, setData] = useState(initialData);
  const [retrying, setRetrying] = useState(isEmpty(initialData));

  useEffect(() => {
    if (!isEmpty(data)) return;
    let cancelled = false;

    async function attempt(round: number) {
      await waitForOnline();
      if (cancelled) return;
      try {
        const res = await fetch(path, { headers: { Accept: 'application/json' } });
        if (res.ok) {
          const json = fixMediaUrls((await res.json()) as T);
          if (!cancelled && !isEmpty(json)) {
            setData(json);
            setRetrying(false);
            return;
          }
        }
      } catch {
        // network error — fall through to retry/give-up below
      }
      if (cancelled) return;
      if (round < RETRY_DELAYS_MS.length) {
        setTimeout(() => attempt(round + 1), RETRY_DELAYS_MS[round]);
      } else {
        setRetrying(false);
      }
    }

    attempt(0);
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, retrying };
}

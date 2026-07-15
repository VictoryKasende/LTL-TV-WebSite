'use client';

import { useEffect } from 'react';

/** Registers the service worker unconditionally so the site is installable
 * (Chrome/Android "add to home screen") even for visitors who never
 * interact with the notification prompt. */
export default function PwaServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return null;
}

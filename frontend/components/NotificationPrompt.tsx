'use client';

import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import clsx from 'clsx';

function urlBase64ToUint8Array(base64Url: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0))).buffer;
}

export default function NotificationPrompt() {
  const [visible, setVisible] = useState(false);
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window) ||
      !('Notification' in window) ||
      Notification.permission !== 'default'
    ) {
      return;
    }
    const timer = setTimeout(() => {
      setVisible(true);
      requestAnimationFrame(() => setShown(true));
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  function close() {
    setShown(false);
    setTimeout(() => setVisible(false), 200);
  }

  async function accept() {
    setBusy(true);
    try {
      await navigator.serviceWorker.register('/sw.js');
      const res = await fetch('/api/v1/notifications/vapid-public-key/');
      const { public_key: publicKey } = await res.json();
      if (!publicKey) throw new Error('no-vapid-key');

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const json = subscription.toJSON();
      await fetch('/api/v1/notifications/subscribe/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys, locale: 'fr' }),
      });
    } catch {
      // Permission refusée ou abonnement impossible — on referme simplement.
    } finally {
      setBusy(false);
      close();
    }
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Activer les notifications"
      className={clsx(
        'fixed bottom-4 right-4 left-4 md:left-auto z-[60] md:max-w-sm rounded-xl bg-white shadow-[0_16px_40px_-12px_rgba(15,17,20,0.35)] border border-paper-300 p-5 transition-all duration-200 ease-out-editorial',
        shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none',
      )}
    >
      <button
        type="button"
        onClick={close}
        aria-label="Fermer"
        className="absolute top-3 right-3 text-ink-400 hover:text-ink-800 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3 pr-4">
        <div className="h-10 w-10 shrink-0 rounded-full bg-amber-400 flex items-center justify-center">
          <Bell className="h-5 w-5 text-brand-800" strokeWidth={2} />
        </div>
        <div>
          <p className="font-bold text-ink-800">Restez informés</p>
          <p className="mt-1 text-sm text-ink-500 leading-relaxed">
            Activez les notifications pour être averti des nouveaux programmes, émissions et articles de LTL TV.
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 justify-end">
        <button
          type="button"
          onClick={close}
          className="text-sm font-semibold text-ink-500 hover:text-ink-800 px-3 py-2 transition-colors"
        >
          Plus tard
        </button>
        <button
          type="button"
          onClick={accept}
          disabled={busy}
          className="text-sm font-semibold rounded-full bg-brand-700 text-white px-4 py-2 hover:bg-brand-800 transition-colors disabled:opacity-60 disabled:cursor-wait"
        >
          {busy ? 'Activation…' : 'Activer'}
        </button>
      </div>
    </div>
  );
}

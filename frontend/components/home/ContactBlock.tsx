'use client';

import { useState } from 'react';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function ContactBlock() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setError('');
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      name:    'Visiteur du site',
      email:   String(fd.get('email') ?? ''),
      message: String(fd.get('message') ?? ''),
      subject: 'Message depuis la home',
    };

    try {
      const res = await fetch('/api/v1/contacts/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.detail || 'Envoi impossible.');
      }
      setStatus('success');
      form.reset();
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Erreur inconnue.');
    }
  }

  return (
    <section className="bg-ink-900 text-white py-14 md:py-20">
      <div className="max-w-4xl mx-auto px-6 md:px-8">
        <h2 className="font-bold text-2xl md:text-3xl">Nous contacter</h2>

        {status === 'success' ? (
          <div className="mt-8 rounded-lg border border-brand-500/50 bg-brand-500/10 p-6 md:p-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-brand-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-lg font-semibold">Message reçu, merci.</p>
            <p className="mt-2 text-white/70">Nous vous répondrons dans les plus brefs délais.</p>
            <button
              type="button"
              onClick={() => setStatus('idle')}
              className="mt-4 text-sm font-medium text-brand-300 hover:text-brand-200 transition-colors"
            >
              Envoyer un autre message
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <textarea
              name="message"
              required
              rows={5}
              placeholder="Saisissez votre message…"
              className="w-full rounded-md bg-ink-700 border border-ink-700 text-white placeholder:text-white/40 px-5 py-4 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 transition-colors resize-none"
            />
            <input
              type="email"
              name="email"
              required
              placeholder="Quel est votre Email ?"
              className="w-full rounded-md bg-ink-700 border border-ink-700 text-white placeholder:text-white/40 px-5 py-4 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 transition-colors"
            />

            {status === 'error' && (
              <div className="flex items-center gap-2 text-sm text-red-200 bg-red-500/10 border border-red-500/30 rounded p-3">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-brand-500 text-white font-bold uppercase tracking-wide text-sm px-6 py-4 hover:bg-brand-600 transition-colors disabled:opacity-60 disabled:cursor-wait"
            >
              <Send className="h-4 w-4" strokeWidth={2.5} />
              {status === 'submitting' ? 'Envoi…' : 'Envoyer'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

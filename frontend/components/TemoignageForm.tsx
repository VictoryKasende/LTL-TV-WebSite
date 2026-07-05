'use client';

import { useState } from 'react';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function TemoignageForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string>('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setMessage('');
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch('/api/v1/temoignages/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || 'Une erreur est survenue.');
      }
      setStatus('success');
      form.reset();
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Erreur inconnue.');
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-lg bg-brand-50 border border-brand-500/40 p-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-brand-500 mx-auto mb-3" strokeWidth={1.5} />
        <p className="text-xl font-bold text-brand-700">Merci d'avoir partagé.</p>
        <p className="mt-2 text-ink-500 leading-relaxed">
          Votre témoignage a bien été envoyé. Il sera diffusé après validation
          par notre équipe.
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-5 text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors"
        >
          Partager un autre témoignage
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Votre prénom / nom" name="author" required placeholder="Sarah M." />
        <Field label="Votre ville (optionnel)" name="location" placeholder="Kinshasa" />
      </div>
      <Field label="Votre témoignage" name="message" required as="textarea" rows={7} placeholder="Partagez votre histoire…" />

      {status === 'error' && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="inline-flex items-center gap-2 rounded bg-brand-500 text-white font-semibold px-8 py-3.5 hover:bg-brand-600 transition-colors disabled:opacity-60 disabled:cursor-wait"
      >
        <Send className="h-4 w-4" strokeWidth={2} />
        {status === 'submitting' ? 'Envoi en cours…' : 'Envoyer mon témoignage'}
      </button>

      <p className="text-xs text-ink-500">
        Votre message sera relu par notre équipe avant diffusion.
      </p>
    </form>
  );
}

function Field({
  label, name, required, placeholder, as, rows,
}: {
  label: string; name: string; required?: boolean; placeholder?: string;
  as?: 'textarea'; rows?: number;
}) {
  const cls = 'w-full rounded border border-paper-300 bg-white px-4 py-3 text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-colors';
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-ink-800 mb-1.5">
        {label}{required && <span className="text-brand-500"> *</span>}
      </span>
      {as === 'textarea' ? (
        <textarea name={name} required={required} placeholder={placeholder} rows={rows} className={cls} />
      ) : (
        <input type="text" name={name} required={required} placeholder={placeholder} className={cls} />
      )}
    </label>
  );
}

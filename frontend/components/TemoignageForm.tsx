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
      <div className="rounded-lg bg-cream-50 border border-gold-500/40 p-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-gold-600 mx-auto mb-4" strokeWidth={1.5} />
        <p className="font-serif text-2xl text-ink-900 mb-2">Merci d'avoir partagé.</p>
        <p className="text-ink-600 leading-relaxed">
          Votre témoignage a bien été envoyé. Il sera diffusé après validation
          par notre équipe éditoriale.
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-6 text-sm font-medium text-gold-700 hover:text-gold-600 transition-colors"
        >
          Partager un autre témoignage
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field label="Votre prénom / nom" name="author" required placeholder="Sarah M." />
        <Field label="Votre ville (optionnel)" name="location" placeholder="Kinshasa" />
      </div>
      <Field
        label="Votre témoignage"
        name="message"
        required
        as="textarea"
        rows={7}
        placeholder="Partagez votre histoire, ce qui vous a marqué…"
      />

      {status === 'error' && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="inline-flex items-center gap-2 rounded bg-ink-900 text-cream-50 font-semibold px-8 py-4 hover:bg-ink-800 transition-colors disabled:opacity-60 disabled:cursor-wait"
      >
        <Send className="h-4 w-4" strokeWidth={2} />
        {status === 'submitting' ? 'Envoi en cours…' : 'Envoyer mon témoignage'}
      </button>

      <p className="text-xs text-ink-500">
        Votre message sera relu par notre équipe avant diffusion. Nous ne
        publions ni votre email ni votre numéro sans votre accord.
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
  const cls = 'w-full rounded border border-cream-300 bg-white px-4 py-3 text-ink-900 placeholder:text-ink-500/60 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-colors';
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ink-700 mb-2">
        {label}{required && <span className="text-gold-600"> *</span>}
      </span>
      {as === 'textarea' ? (
        <textarea name={name} required={required} placeholder={placeholder} rows={rows} className={cls} />
      ) : (
        <input type="text" name={name} required={required} placeholder={placeholder} className={cls} />
      )}
    </label>
  );
}

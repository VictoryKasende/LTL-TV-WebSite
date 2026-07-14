'use client';

import { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';
import { COUNTRIES } from '../lib/countries';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const CATEGORIES = [
  { value: 'testimony', label: 'Un témoignage' },
  { value: 'prayer_request', label: 'Une demande de prière' },
  { value: 'content_proposal', label: "Proposition d'un contenu" },
  { value: 'offer', label: 'Une offre' },
  { value: 'offering', label: 'Un don à faire' },
  { value: 'biblical_question', label: 'Une question biblique' },
  { value: 'feedback', label: 'Un feedback sur LTL TV' },
];

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string>('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setMessage('');
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch('/api/v1/contacts/', {
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
        <p className="text-xl font-bold text-brand-700">Message reçu, merci.</p>
        <p className="mt-2 text-ink-500 leading-relaxed">
          Nous vous répondrons dans les plus brefs délais.
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-5 text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors"
        >
          Envoyer un autre message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Select
        label="Le message concerne"
        name="category"
        required
        placeholder="Choisissez votre option"
        options={CATEGORIES}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Votre nom" name="name" required placeholder="Prénom Nom" />
        <Field label="Email" name="email" type="email" required placeholder="vous@exemple.com" />
      </div>

      <Field label="Votre message" name="message" required as="textarea" rows={6} placeholder="Votre message" />

      <Select
        label="Votre pays"
        name="country"
        placeholder="Pays"
        options={COUNTRIES.map((c) => ({ value: c, label: c }))}
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
        className="inline-flex items-center justify-center gap-2 w-full md:w-auto rounded bg-brand-500 text-white font-semibold px-8 py-3.5 hover:bg-brand-600 transition-colors disabled:opacity-60 disabled:cursor-wait"
      >
        <Send className="h-4 w-4" strokeWidth={2} />
        {status === 'submitting' ? 'Envoi…' : 'Envoyer'}
      </button>
    </form>
  );
}

function Field({
  label, name, required, placeholder, as, rows, type,
}: {
  label: string; name: string; required?: boolean; placeholder?: string;
  as?: 'textarea'; rows?: number; type?: string;
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
        <input type={type ?? 'text'} name={name} required={required} placeholder={placeholder} className={cls} />
      )}
    </label>
  );
}

function Select({
  label, name, required, placeholder, options,
}: {
  label: string; name: string; required?: boolean; placeholder?: string;
  options: { value: string; label: string }[];
}) {
  const cls = 'w-full appearance-none rounded border border-paper-300 bg-white px-4 py-3 pr-10 text-ink-800 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-colors';
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-ink-800 mb-1.5">
        {label}{required && <span className="text-brand-500"> *</span>}
      </span>
      <div className="relative">
        <select name={name} required={required} defaultValue="" className={cls}>
          <option value="" disabled>{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
      </div>
    </label>
  );
}

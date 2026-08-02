'use client';

import { useState } from 'react';
import { CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';
import { COUNTRIES } from '../../lib/countries';
import Spinner from '../ui/Spinner';
import type { Event } from '../../lib/api';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const inputCls = 'w-full rounded border border-paper-300 bg-white px-4 py-3 text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-colors';

export default function EventRegistrationForm({ event }: { event: Event }) {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string>('');
  const [conditionsOpen, setConditionsOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setMessage('');
    const form = e.currentTarget;
    const data = {
      ...Object.fromEntries(new FormData(form).entries()),
      accepted_conditions: accepted,
    };

    try {
      const res = await fetch(`/api/v1/events/${event.slug}/register/`, {
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
      setAccepted(false);
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Erreur inconnue.');
    }
  }

  if (!event.is_registration_open) {
    return (
      <div className="rounded-xl bg-white border border-paper-200 shadow-card p-8 text-center">
        <p className="text-lg font-bold text-ink-800">Les inscriptions sont fermées.</p>
        <p className="mt-2 text-ink-500 leading-relaxed">
          Les inscriptions pour cet événement ne sont plus ouvertes.
        </p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="rounded-xl bg-white border border-paper-200 shadow-card p-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-brand-500 mx-auto mb-3" strokeWidth={1.5} />
        <p className="text-xl font-bold text-brand-700">Inscription reçue, merci.</p>
        <p className="mt-2 text-ink-500 leading-relaxed">
          Votre inscription à « {event.title} » a bien été enregistrée.
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-5 text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors"
        >
          Inscrire une autre personne
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl bg-white border border-paper-200 shadow-card p-6 md:p-8 space-y-5"
    >
      <div>
        <span className="block text-sm font-semibold text-ink-800 mb-1.5">
          Votre nom<span className="text-brand-500"> *</span>
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input type="text" name="first_name" required placeholder="Prénom" className={inputCls} />
          <input type="text" name="last_name" required placeholder="Nom" className={inputCls} />
        </div>
      </div>

      <Select
        label="Genre"
        name="gender"
        required
        placeholder="Votre genre"
        options={[
          { value: 'Homme', label: 'Homme' },
          { value: 'Femme', label: 'Femme' },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Email" name="email" type="email" required placeholder="Email" />
        <Field label="Téléphone" name="phone" required placeholder="Votre numéro WhatsApp" />
      </div>

      <Select
        label="Votre pays"
        name="country"
        placeholder="Pays"
        options={COUNTRIES.map((c) => ({ value: c, label: c }))}
      />

      <Field
        label="Dites-nous quelques mots ce qui vous motive à participer à ce programme"
        name="motivation"
        required
        as="textarea"
        rows={4}
        placeholder="Votre message"
      />

      <div className="rounded-lg bg-paper-100 p-4 md:p-5">
        <p className="font-semibold text-ink-800 mb-1.5">Conditions de participation</p>
        {event.conditions && (
          <>
            <p className={conditionsOpen ? 'text-sm text-ink-500 leading-relaxed whitespace-pre-line' : 'text-sm text-ink-500 leading-relaxed whitespace-pre-line line-clamp-3'}>
              {event.conditions}
            </p>
            <button
              type="button"
              onClick={() => setConditionsOpen((v) => !v)}
              className="mt-1 text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors"
            >
              {conditionsOpen ? 'Voir moins' : 'Voir plus'}
            </button>
          </>
        )}

        <label className="mt-4 flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            required
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-paper-300 text-brand-500 focus:ring-brand-500/30"
          />
          <span className="text-sm text-ink-800">J&apos;accepte les conditions de participation</span>
        </label>
      </div>

      {status === 'error' && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting' || !accepted}
        className="inline-flex items-center justify-center gap-2 w-full rounded-full bg-[#009696] text-white font-semibold px-8 py-3.5 hover:bg-[#007a7a] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === 'submitting' && <Spinner size="sm" className="text-white" />}
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
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-ink-800 mb-1.5">
        {label}{required && <span className="text-brand-500"> *</span>}
      </span>
      {as === 'textarea' ? (
        <textarea name={name} required={required} placeholder={placeholder} rows={rows} className={inputCls} />
      ) : (
        <input type={type ?? 'text'} name={name} required={required} placeholder={placeholder} className={inputCls} />
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

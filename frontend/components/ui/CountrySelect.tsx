'use client';

import 'flag-icons/css/flag-icons.min.css';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { COUNTRIES } from '../../lib/countries';

export default function CountrySelect({
  label, name, required, placeholder = 'Pays', value, onChange,
}: {
  label: string; name: string; required?: boolean;
  placeholder?: string; value: string; onChange: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selected = COUNTRIES.find((c) => c.name === value) ?? null;
  const filtered = query.trim()
    ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()))
    : COUNTRIES;

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { setOpen(false); setQuery(''); }
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="block" ref={wrapperRef}>
      <span className="block text-sm font-semibold text-ink-800 mb-1.5">
        {label}{required && <span className="text-brand-500"> *</span>}
      </span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="w-full flex items-center justify-between gap-2 rounded border border-paper-300 bg-white px-4 py-3 text-left focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-colors"
        >
          <span className="flex items-center gap-2 min-w-0">
            {selected && <span className={`fi fi-${selected.code.toLowerCase()} rounded-sm shrink-0`} />}
            <span className={`truncate ${selected ? 'text-ink-800' : 'text-ink-400'}`}>
              {selected ? selected.name : placeholder}
            </span>
          </span>
          <ChevronDown className="h-4 w-4 text-ink-400 shrink-0" />
        </button>

        {open && (
          <div className="absolute z-20 mt-1.5 w-full rounded border border-paper-300 bg-white shadow-card overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 border-b border-paper-200 px-3 py-2">
              <Search className="h-4 w-4 text-ink-400 shrink-0" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un pays…"
                className="w-full text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none"
              />
            </div>
            <ul role="listbox" className="max-h-60 overflow-y-auto py-1">
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-sm text-ink-400">Aucun résultat.</li>
              )}
              {filtered.map((c) => (
                <li key={c.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={c.name === value}
                    onClick={() => {
                      onChange(c.name);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-paper-100 transition-colors ${
                      c.name === value ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-ink-800'
                    }`}
                  >
                    <span className={`fi fi-${c.code.toLowerCase()} rounded-sm shrink-0`} />
                    <span className="truncate">{c.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <input type="hidden" name={name} value={value} />
    </div>
  );
}

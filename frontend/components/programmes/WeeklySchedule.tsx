'use client';

import { useState } from 'react';
import Link from 'next/link';
import Spinner from '../ui/Spinner';
import { useResilientData } from '../../lib/useResilientData';
import type { Paginated, Programme } from '../../lib/api';

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export default function WeeklySchedule({
  initialData, weekStart,
}: { initialData: Paginated<Programme> | null; weekStart: string }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd = days[days.length - 1];
  const { data, retrying } = useResilientData(
    initialData,
    `/api/v1/programmes/?date_from=${weekStart}&date_to=${weekEnd}&ordering=date,start_time&page_size=100`,
  );
  const programmes = data?.results ?? [];
  const todayIso = new Date().toISOString().slice(0, 10);
  const [selected, setSelected] = useState(days.includes(todayIso) ? todayIso : days[0]);

  const byDate = programmes.reduce<Record<string, Programme[]>>((acc, p) => {
    (acc[p.date] ??= []).push(p);
    return acc;
  }, {});
  const items = [...(byDate[selected] ?? [])].sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <div className="rounded-lg overflow-hidden shadow-card">
      <div className="flex overflow-x-auto bg-ink-700">
        {days.map((d) => {
          const isSelected = d === selected;
          const dt = new Date(`${d}T00:00:00`);
          const weekday = dt.toLocaleDateString('fr-FR', { weekday: 'long' });
          const dayMonth = dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
          return (
            <button
              key={d}
              type="button"
              onClick={() => setSelected(d)}
              className={`flex-1 min-w-[100px] sm:min-w-[130px] px-3 sm:px-4 py-3 sm:py-4 text-left transition-colors ${
                isSelected ? 'bg-brand-500 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="block font-bold capitalize text-xs sm:text-sm">{weekday}</span>
              <span className="block text-[11px] sm:text-xs opacity-80">{dayMonth}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-white max-h-[560px] overflow-y-auto divide-y divide-paper-200">
        {items.length === 0 && programmes.length === 0 && retrying && (
          <div className="p-10 flex items-center justify-center gap-3 text-ink-500">
            <Spinner size="sm" className="text-brand-500" />
            Chargement…
          </div>
        )}
        {items.length === 0 && !(programmes.length === 0 && retrying) && (
          <p className="p-10 text-center text-ink-500">Aucun programme prévu ce jour.</p>
        )}
        {items.map((p) => (
          <Link
            key={p.id}
            href={`/programmes/${p.slug}`}
            className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-paper-100 transition-colors"
          >
            <div className="w-11 sm:w-14 shrink-0 text-xs sm:text-sm font-bold text-ink-800">
              {p.start_time.slice(0, 5)}
            </div>
            <div
              className="w-16 h-11 sm:w-24 sm:h-16 shrink-0 rounded overflow-hidden bg-paper-200"
              style={{ background: p.thumbnail_url ? undefined : (p.program_type?.color ?? '#3D53EA') }}
            >
              {p.thumbnail_url && (
                <img src={p.thumbnail_url} alt={p.title} className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-ink-900 uppercase text-xs sm:text-sm tracking-wide truncate">
                {p.title}
              </p>
              <p className="text-ink-500 text-xs sm:text-sm line-clamp-2 sm:truncate">
                {p.description || [p.program_type?.name, p.responsable].filter(Boolean).join(' — ')}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

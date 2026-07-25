'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Spinner from '../ui/Spinner';
import { useResilientData } from '../../lib/useResilientData';
import { fixMediaUrls } from '../../lib/api';
import type { Paginated, Programme } from '../../lib/api';

const MAX_WEEKS_AHEAD = 2;

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function fmtDuration(start: string, end: string | null): string {
  if (!end) return '';
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let minutes = (eh * 60 + em) - (sh * 60 + sm);
  if (minutes < 0) minutes += 24 * 60;
  if (minutes <= 0) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h${String(m).padStart(2, '0')}`;
  if (h > 0) return `${h}h`;
  return `${m} min`;
}

export default function WeeklySchedule({
  initialData, weekStart,
}: { initialData: Paginated<Programme> | null; weekStart: string }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [fetchedData, setFetchedData] = useState<Paginated<Programme> | null>(null);
  const [loading, setLoading] = useState(false);

  const currentWeekStart = addDays(weekStart, weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  const weekEnd = days[days.length - 1];

  // The current week is rendered from the server-fetched `initialData` (with
  // its own retry-on-empty resiliency); any other week is fetched client-side
  // on demand as the visitor navigates.
  const { data: currentWeekData, retrying } = useResilientData(
    initialData,
    `/api/v1/programmes/?date_from=${weekStart}&date_to=${addDays(weekStart, 6)}&ordering=date,start_time&page_size=100`,
  );

  useEffect(() => {
    if (weekOffset === 0) { setFetchedData(null); return undefined; }
    let cancelled = false;
    setLoading(true);
    fetch(
      `/api/v1/programmes/?date_from=${currentWeekStart}&date_to=${weekEnd}&ordering=date,start_time&page_size=100`,
      { headers: { Accept: 'application/json' } },
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (cancelled) return;
        setFetchedData(json ? fixMediaUrls(json as Paginated<Programme>) : { count: 0, next: null, previous: null, results: [] });
      })
      .catch(() => { if (!cancelled) setFetchedData({ count: 0, next: null, previous: null, results: [] }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset]);

  const data = weekOffset === 0 ? currentWeekData : fetchedData;
  const programmes = data?.results ?? [];
  const todayIso = new Date().toISOString().slice(0, 10);
  const [selected, setSelected] = useState(days.includes(todayIso) ? todayIso : days[0]);

  useEffect(() => {
    setSelected(days.includes(todayIso) ? todayIso : days[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset]);

  const byDate = programmes.reduce<Record<string, Programme[]>>((acc, p) => {
    (acc[p.date] ??= []).push(p);
    return acc;
  }, {});
  const items = [...(byDate[selected] ?? [])].sort((a, b) => a.start_time.localeCompare(b.start_time));

  const fmtRange = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  const canGoNext = weekOffset < MAX_WEEKS_AHEAD;
  const isCurrentWeek = weekOffset === 0;
  const showLoading = weekOffset === 0
    ? (items.length === 0 && programmes.length === 0 && retrying)
    : loading;

  return (
    <div className="rounded-lg overflow-hidden shadow-card">
      <div className="flex items-center justify-between gap-2 bg-ink-900 px-3 sm:px-4 py-2.5 sm:py-3">
        <button
          type="button"
          onClick={() => setWeekOffset((w) => w - 1)}
          aria-label="Semaine précédente"
          className="shrink-0 h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        <div className="min-w-0 text-center">
          <p className="text-white text-xs sm:text-sm font-bold truncate">
            {fmtRange(days[0])} – {fmtRange(days[6])}
          </p>
          {!isCurrentWeek && (
            <button
              type="button"
              onClick={() => setWeekOffset(0)}
              className="text-[10px] sm:text-xs text-brand-300 hover:text-brand-200 underline underline-offset-2 transition-colors"
            >
              Revenir à cette semaine
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => canGoNext && setWeekOffset((w) => w + 1)}
          disabled={!canGoNext}
          aria-label="Semaine suivante"
          className="shrink-0 h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>

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
        {showLoading && (
          <div className="p-10 flex items-center justify-center gap-3 text-ink-500">
            <Spinner size="sm" className="text-brand-500" />
            Chargement…
          </div>
        )}
        {items.length === 0 && !showLoading && (
          <p className="p-10 text-center text-ink-500">Aucun programme prévu ce jour.</p>
        )}
        {!showLoading && items.map((p) => {
          const duration = fmtDuration(p.start_time, p.end_time);
          return (
            <Link
              key={p.id}
              href={`/programmes/${p.slug}`}
              className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-paper-100 transition-colors"
            >
              <div className="w-11 sm:w-14 shrink-0 text-xs sm:text-sm font-bold text-ink-800">
                {p.start_time.slice(0, 5)}
                {duration && (
                  <span className="block text-[10px] sm:text-xs font-normal text-ink-400 whitespace-nowrap">{duration}</span>
                )}
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
                <p className="font-extrabold text-ink-900 text-xs sm:text-sm tracking-wide truncate">
                  {p.title}
                </p>
                <p className="text-ink-500 text-xs sm:text-sm line-clamp-2 sm:truncate">
                  {p.description || [p.program_type?.name, p.responsable].filter(Boolean).join(' — ')}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

import { Radio } from 'lucide-react';
import Container from '../../components/ui/Container';
import WeeklySchedule from '../../components/programmes/WeeklySchedule';
import { getProgrammes } from '../../lib/api';

export const revalidate = 60;

export const metadata = {
  title: 'Grille TV',
  description: 'La grille complète des programmes LTL TV : émissions, animateurs et horaires.',
  alternates: { canonical: '/programmes' },
};

function mondayOf(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return monday;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

export default async function ProgrammesPage() {
  const monday = mondayOf(new Date());
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const data = await getProgrammes(
    `?date_from=${iso(monday)}&date_to=${iso(sunday)}&ordering=date,start_time&page_size=100`,
  );

  return (
    <>
      <section className="bg-brand-700 text-white py-14 md:py-20 relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(60% 60% at 80% 30%, rgba(61,83,234,0.4), transparent 70%)' }} />
        <Container className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-brand-200 mb-6">
            <Radio className="h-3 w-3" strokeWidth={2.5} />
            Grille TV
          </div>
          <h1 className="font-bold text-display-lg max-w-3xl">
            Nos programmes à l'antenne.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80 leading-relaxed">
            Retrouvez toutes nos émissions, leurs animateurs et leurs horaires.
            LTL TV, en direct 24 heures sur 24.
          </p>
        </Container>
      </section>

      <section className="bg-paper-100 py-14 md:py-20">
        <Container>
          <WeeklySchedule initialData={data} weekStart={iso(monday)} />
        </Container>
      </section>
    </>
  );
}

import { notFound } from 'next/navigation';
import { CalendarDays } from 'lucide-react';
import Container from '../../../components/ui/Container';
import EventRegistrationForm from '../../../components/events/EventRegistrationForm';
import { getEvent } from '../../../lib/api';

export const revalidate = 60;

type Params = { params: { slug: string } };

function fmtDateRange(startIso: string, endIso: string | null): string {
  const start = new Date(`${startIso}T00:00:00`);
  if (!endIso || endIso === startIso) {
    return start.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }
  const end = new Date(`${endIso}T00:00:00`);
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const day = (d: Date) => d.toLocaleDateString('fr-FR', { day: '2-digit' });
  if (sameMonth) {
    const month = end.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    return `Du ${day(start)} - ${day(end)} ${month}`;
  }
  const startLabel = start.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const endLabel = end.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  return `Du ${startLabel} au ${endLabel}`;
}

function fmtTime(time: string | null): string {
  if (!time) return '';
  const [h, m] = time.split(':');
  return `${h}H${m}`;
}

export async function generateMetadata({ params }: Params) {
  const event = await getEvent(params.slug);
  if (!event) return { title: 'Événement introuvable' };
  return {
    title: event.title,
    description: event.subtitle || `Inscrivez-vous à « ${event.title} ».`,
    alternates: { canonical: `/evenements/${event.slug}` },
  };
}

export default async function EventPage({ params }: Params) {
  const event = await getEvent(params.slug);
  if (!event || !event.is_active) notFound();

  return (
    <section className="bg-paper-100 py-10 md:py-16">
      <Container size="narrow" className="space-y-6">
        <div className="rounded-xl bg-white border border-paper-200 shadow-card p-6 md:p-7">
          <p className="text-sm font-semibold text-ink-500 mb-2">
            Vous vous enregistrez à cet événement :
          </p>

          <div className="rounded-lg bg-paper-100 p-4 md:p-5">
            <span className="inline-block rounded-full bg-brand-100 text-brand-700 text-xs font-bold uppercase tracking-wide px-2.5 py-1 mb-2">
              Événement
            </span>
            <h1 className="font-bold text-xl md:text-2xl text-ink-900">{event.title}</h1>
            {event.subtitle && (
              <p className="mt-1 text-sm text-ink-500">{event.subtitle}</p>
            )}
            <div className="mt-3 flex items-center gap-2 text-sm text-ink-700">
              <CalendarDays className="h-4 w-4 text-brand-500 shrink-0" strokeWidth={2.5} />
              <span>
                <strong className="font-semibold">Date :</strong>{' '}
                {fmtDateRange(event.start_date, event.end_date)}
              </span>
            </div>
            {event.daily_time && (
              <p className="mt-1 text-sm text-ink-700">
                <strong className="font-semibold">Heure :</strong> {fmtTime(event.daily_time)}
              </p>
            )}
          </div>
        </div>

        <EventRegistrationForm event={event} />
      </Container>
    </section>
  );
}

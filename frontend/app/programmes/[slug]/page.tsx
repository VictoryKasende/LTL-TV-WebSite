import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, User, ArrowLeft, Radio, MapPin } from 'lucide-react';
import Container from '../../../components/ui/Container';
import { apiGet, type Programme } from '../../../lib/api';

export const revalidate = 60;

type Params = { params: { slug: string } };

const fmtDate = (iso: string) => {
  try { return new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' }); }
  catch { return iso; }
};
const fmtTime = (t: string) => t?.slice(0, 5) ?? '';

export async function generateMetadata({ params }: Params) {
  const programme = await apiGet<Programme>(`/programmes/${params.slug}/`);
  if (!programme) return { title: 'Programme introuvable' };
  return { title: programme.title, description: programme.description || `Programme ${programme.title} sur LTL TV.` };
}

export default async function ProgrammeDetailPage({ params }: Params) {
  const programme = await apiGet<Programme>(`/programmes/${params.slug}/`);
  if (!programme) notFound();

  return (
    <>
      <section
        className="relative bg-brand-700 text-white pt-16 pb-14 md:pt-20 md:pb-20 overflow-hidden"
        style={{ backgroundImage: programme.image ? undefined : 'linear-gradient(135deg, #212870 0%, #141640 55%, #3D53EA 100%)' }}
      >
        {programme.image && (
          <>
            <img src={programme.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
            <div className="absolute inset-0 bg-gradient-to-b from-brand-900/50 to-brand-900" />
          </>
        )}
        <Container className="relative">
          <Link href="/programmes" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            Toute la grille
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-brand-200 mb-5">
            <Radio className="h-3 w-3" strokeWidth={2.5} />
            {programme.program_type?.name ?? 'Programme'}
          </div>
          <h1 className="font-bold text-display-lg">{programme.title}</h1>
          <div className="mt-6 flex flex-wrap items-center gap-6 text-white/85">
            {programme.responsable && (
              <div className="inline-flex items-center gap-2"><User className="h-4 w-4 text-brand-300" /> <span className="font-medium">{programme.responsable}</span></div>
            )}
            <div className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-brand-300" /> {fmtDate(programme.date)} · {fmtTime(programme.start_time)}</div>
            {programme.location && (
              <div className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-brand-300" /> {programme.location}</div>
            )}
          </div>
        </Container>
      </section>

      <section className="bg-white py-14 md:py-20">
        <Container size="narrow">
          <article className="prose-editorial">
            {programme.description
              ? programme.description.split('\n').map((para, i) => <p key={i}>{para}</p>)
              : <p className="italic text-ink-500">Description à venir.</p>}
          </article>

          <div className="mt-12 pt-6 border-t border-paper-300">
            <Link href="/programmes" className="group inline-flex items-center gap-2 text-sm font-medium text-ink-800 hover:text-brand-500 transition-colors">
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              Retour à la grille
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}

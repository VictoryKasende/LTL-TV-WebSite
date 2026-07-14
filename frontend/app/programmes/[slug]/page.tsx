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
      <div className="bg-ink-900">
        <Container className="py-3">
          <Link href="/programmes" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Toute la grille
          </Link>
        </Container>
      </div>

      <div className="bg-ink-900">
        <div className="relative bg-brand-900 aspect-video w-full max-w-6xl mx-auto">
          {programme.embed_url ? (
            <iframe
              src={`${programme.embed_url}?autoplay=1`}
              title={programme.title}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          ) : (
            <>
              {programme.thumbnail_url && (
                <img src={programme.thumbnail_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-brand-900/40 to-brand-900/85">
                <p className="text-white/70 text-xs sm:text-sm">Vidéo à venir</p>
              </div>
            </>
          )}
        </div>
      </div>

      <section className="bg-brand-700 text-white py-6 sm:py-8 md:py-10">
        <Container>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-brand-200 mb-3 sm:mb-4">
            <Radio className="h-3 w-3" strokeWidth={2.5} />
            {programme.program_type?.name ?? 'Programme'}
          </div>
          <h1 className="font-bold text-display-md md:text-display-lg">{programme.title}</h1>
          <div className="mt-4 sm:mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-x-5 text-white/85 text-xs sm:text-sm">
            {programme.responsable && (
              <div className="inline-flex items-center gap-1.5 sm:gap-2"><User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-brand-300 shrink-0" /> <span className="font-medium">{programme.responsable}</span></div>
            )}
            <div className="inline-flex items-center gap-1.5 sm:gap-2"><Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-brand-300 shrink-0" /> {fmtDate(programme.date)} · {fmtTime(programme.start_time)}</div>
            {programme.location && (
              <div className="inline-flex items-center gap-1.5 sm:gap-2"><MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-brand-300 shrink-0" /> {programme.location}</div>
            )}
          </div>
        </Container>
      </section>

      <section className="bg-white py-8 sm:py-10 md:py-14">
        <Container size="narrow">
          <article className="prose-editorial">
            {programme.description
              ? programme.description.split('\n').map((para, i) => <p key={i}>{para}</p>)
              : <p className="italic text-ink-500">Description à venir.</p>}
          </article>
        </Container>
      </section>
    </>
  );
}

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, PlayCircle, Radio, User } from 'lucide-react';
import Container from '../../../components/ui/Container';
import { getEpisodes, getShow, getShowSeries, type Episode } from '../../../lib/api';

export const revalidate = 120;

type Params = { params: { slug: string } };

const fmtDate = (iso: string | null) => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }); }
  catch { return ''; }
};

export async function generateMetadata({ params }: Params) {
  const show = await getShow(params.slug);
  if (!show) return { title: 'Émission introuvable' };
  return { title: show.title, description: show.tagline || `${show.title} sur LTL·TV.` };
}

function EpisodeCard({ ep }: { ep: Episode }) {
  return (
    <a
      href={ep.youtube_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-lg bg-white shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
    >
      <div className="relative aspect-video overflow-hidden bg-brand-900">
        {(ep.cover || ep.thumbnail_url) && (
          <img
            src={ep.cover ?? ep.thumbnail_url}
            alt={ep.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-brand-900/0 group-hover:bg-brand-900/30 transition-colors">
          <PlayCircle className="h-10 w-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={1.5} />
        </div>
        {ep.episode_number && (
          <span className="absolute top-2 left-2 rounded bg-ink-900/85 text-amber-400 text-xs font-bold px-2 py-1">
            Épisode {ep.episode_number}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h4 className="font-bold text-ink-800 leading-snug group-hover:text-brand-700 transition-colors line-clamp-2">
          {ep.title}
        </h4>
        {ep.speaker && (
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-500">
            <User className="h-3 w-3" /> {ep.speaker}
          </span>
        )}
        {ep.aired_at && (
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-400">
            <Calendar className="h-3 w-3" /> {fmtDate(ep.aired_at)}
          </span>
        )}
      </div>
    </a>
  );
}

export default async function ShowDetailPage({ params }: Params) {
  const show = await getShow(params.slug);
  if (!show) notFound();

  const [series, episodesData] = await Promise.all([
    getShowSeries(params.slug),
    getEpisodes(`?show=${params.slug}&page_size=50`),
  ]);

  const allEpisodes = episodesData?.results ?? [];
  const standalone = allEpisodes.filter((ep) => !ep.series);

  return (
    <>
      <section
        className="relative text-white pt-16 pb-14 md:pt-20 md:pb-20 overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${show.color} 0%, #141640 70%)` }}
      >
        {show.cover && (
          <>
            <img src={show.cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-ink-900/70" />
          </>
        )}
        <Container className="relative">
          <Link href="/emissions" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            Toutes les émissions
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-brand-200 mb-5">
            <Radio className="h-3 w-3" strokeWidth={2.5} />
            Émission
          </div>
          <h1 className="font-bold text-display-lg">{show.title}</h1>
          {show.tagline && <p className="mt-4 max-w-2xl text-lg text-white/85 leading-relaxed">{show.tagline}</p>}
          <div className="mt-6 flex flex-wrap items-center gap-6 text-white/80 text-sm">
            {show.host && <span className="inline-flex items-center gap-2"><User className="h-4 w-4 text-brand-300" /> {show.host}</span>}
            {show.default_schedule && <span>{show.default_schedule}</span>}
          </div>
        </Container>
      </section>

      {show.description && (
        <section className="bg-white py-12 md:py-16">
          <Container size="narrow">
            <p className="text-lg text-ink-700 leading-relaxed">{show.description}</p>
          </Container>
        </section>
      )}

      {series && series.length > 0 && (
        <section className="bg-paper-100 py-12 md:py-16">
          <Container>
            {series.map((s) => (
              <div key={s.id} className="mb-14 last:mb-0">
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-[0.2em] text-brand-500 font-bold mb-2">
                    — Série · {s.episode_count} épisode{s.episode_count > 1 ? 's' : ''}
                  </p>
                  <h2 className="font-bold text-2xl md:text-3xl text-brand-700">{s.title}</h2>
                  {s.theme && <p className="mt-2 text-ink-500 leading-relaxed max-w-2xl">{s.theme}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {(s.episodes ?? []).map((ep) => <EpisodeCard key={ep.id} ep={ep} />)}
                </div>
              </div>
            ))}
          </Container>
        </section>
      )}

      {standalone.length > 0 && (
        <section className="bg-white py-12 md:py-16">
          <Container>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-500 font-bold mb-6">— Autres épisodes</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {standalone.map((ep) => <EpisodeCard key={ep.id} ep={ep} />)}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}

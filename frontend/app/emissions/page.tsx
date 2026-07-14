import Link from 'next/link';
import { Radio, User } from 'lucide-react';
import Container from '../../components/ui/Container';
import { getShows, type Show } from '../../lib/api';

export const revalidate = 300;

export const metadata = {
  title: 'Émissions',
  description: 'Toutes les émissions LTL·TV : animateurs, thèmes et horaires.',
};

function ShowCard({ show }: { show: Show }) {
  return (
    <Link
      href={`/emissions/${show.slug}`}
      className="group relative flex flex-col sm:flex-row overflow-hidden rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300"
      style={{ backgroundColor: show.color }}
    >
      <div className="h-40 w-full sm:h-auto sm:w-32 md:w-44 lg:w-52 shrink-0 overflow-hidden">
        {show.host_photo ? (
          <img
            src={show.host_photo}
            alt={show.host}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-black/10">
            <User className="h-10 w-10 text-white/40" strokeWidth={1.5} />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-center gap-2 sm:gap-3 p-5 sm:p-6 md:p-8 text-white min-w-0">
        <h3 className="font-bold text-xl sm:text-2xl md:text-3xl">{show.title}</h3>
        {show.tagline && (
          <p className="text-sm md:text-base text-white/85 leading-relaxed max-w-md">{show.tagline}</p>
        )}
        {show.host && (
          <div className="mt-1">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/60 font-bold">Animateur</p>
            <p className="font-semibold">{show.host}</p>
          </div>
        )}
      </div>

      {show.logo && (
        <div className="flex sm:hidden items-center justify-center pb-5 shrink-0">
          <img src={show.logo} alt="" className="max-h-12 max-w-[100px] object-contain" />
        </div>
      )}
      {show.logo && (
        <div className="hidden sm:flex items-center pr-6 md:pr-8 shrink-0">
          <img src={show.logo} alt="" className="max-h-16 max-w-[120px] object-contain" />
        </div>
      )}
    </Link>
  );
}

export default async function EmissionsPage() {
  const data = await getShows();
  const shows = data?.results ?? [];

  return (
    <>
      <section className="bg-brand-700 text-white py-14 md:py-20 relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(60% 60% at 20% 30%, rgba(61,83,234,0.4), transparent 70%)' }} />
        <Container className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-brand-200 mb-6">
            <Radio className="h-3 w-3" strokeWidth={2.5} />
            Émissions
          </div>
          <h1 className="font-bold text-display-lg max-w-3xl">Nos émissions.</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80 leading-relaxed">
            Découvrez les programmes phares de LTL·TV et leurs animateurs.
          </p>
        </Container>
      </section>

      <section className="bg-paper-100 py-14 md:py-20">
        <Container>
          <div className="flex flex-col gap-6">
            {shows.map((show) => <ShowCard key={show.id} show={show} />)}
          </div>
        </Container>
      </section>
    </>
  );
}

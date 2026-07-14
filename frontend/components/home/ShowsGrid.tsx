import Link from 'next/link';
import SectionHeading from '../ui/SectionHeading';
import { getShows, type Show } from '../../lib/api';

const STATIC_LOGOS: Record<string, string> = {
  'prends-courage': '/logo-pc.svg',
  'dans-les-profondeurs': '/logo-dlp.svg',
  rafraichissement: '/logo-raf.svg',
};

export default async function ShowsGrid() {
  const data = await getShows({ revalidate: 300 });
  const shows: Show[] = data?.results ?? [];

  if (shows.length === 0) return null;

  return (
    <section id="emissions" className="bg-paper-100 py-14 md:py-20">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <SectionHeading title="Émissions" href="/emissions" />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {shows.map((s) => {
            const logo = STATIC_LOGOS[s.slug] ?? s.logo;
            return (
              <Link
                key={s.slug}
                href={`/emissions/${s.slug}`}
                className="group relative flex items-center justify-center rounded-lg bg-white border border-paper-300 aspect-[4/3] p-6 overflow-hidden hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 ease-out-editorial"
                style={{ borderColor: `${s.color}30` }}
              >
                {logo ? (
                  <img
                    src={logo}
                    alt={s.title}
                    className="max-w-[75%] max-h-[75%] w-auto h-auto group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <span className="font-display text-2xl text-center" style={{ color: s.color }}>
                    {s.title}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/emissions"
            className="inline-flex items-center justify-center rounded border border-ink-800 text-ink-800 font-semibold text-sm px-12 py-3.5 hover:bg-ink-800 hover:text-white transition-colors"
          >
            EN SAVOIR
          </Link>
        </div>
      </div>
    </section>
  );
}

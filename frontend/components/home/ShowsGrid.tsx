import Link from 'next/link';
import SectionHeading from '../ui/SectionHeading';

type Show = {
  slug: string;
  logo: string;
  alt: string;
  accent: string;
};

const SHOWS: Show[] = [
  { slug: 'prends-courage',       logo: '/logo-pc.svg',  alt: 'Prends Courage',       accent: '#212870' },
  { slug: 'dans-les-profondeurs', logo: '/logo-dlp.svg', alt: 'Dans Les Profondeurs', accent: '#E85521' },
  { slug: 'rafraichissement',     logo: '/logo-raf.svg', alt: 'Rafraîchissement',     accent: '#3D53EA' },
];

export default function ShowsGrid() {
  return (
    <section id="emissions" className="bg-paper-100 py-14 md:py-20">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <SectionHeading title="Émissions" href="/programmes" />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {SHOWS.map((s) => (
            <Link
              key={s.slug}
              href={`/programmes/${s.slug}`}
              className="group flex items-center justify-center rounded-lg bg-white border border-paper-300 aspect-[4/3] p-6 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 ease-out-editorial"
              style={{ borderColor: `${s.accent}30` }}
            >
              <img
                src={s.logo}
                alt={s.alt}
                className="max-w-[75%] max-h-[75%] w-auto h-auto group-hover:scale-105 transition-transform duration-500"
              />
            </Link>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/programmes"
            className="inline-flex items-center justify-center rounded border border-ink-800 text-ink-800 font-semibold text-sm px-12 py-3.5 hover:bg-ink-800 hover:text-white transition-colors"
          >
            EN SAVOIR
          </Link>
        </div>
      </div>
    </section>
  );
}

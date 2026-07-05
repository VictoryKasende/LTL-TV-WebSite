import Link from 'next/link';
import SectionHeading from '../ui/SectionHeading';

type Episode = {
  id: number;
  slug: string;
  title: string;
  ago: string;
};

const FALLBACK: Episode[] = [
  { id: 1, slug: 'guerir-restaurer-delivrer',   title: 'Dieu veut Te Guérir / Restaurer / Délivrer avec Dr Jonathan Odia', ago: 'Il y a 2 jours' },
  { id: 2, slug: 'restauration-du-couple',      title: 'Restauration du couple selon les Écritures',                        ago: 'Il y a 4 jours' },
  { id: 3, slug: 'la-priere-quotidienne',       title: 'La prière quotidienne : arme du croyant',                           ago: 'Il y a 1 semaine' },
  { id: 4, slug: 'jeunes-et-appel-de-dieu',     title: 'Jeunes et appel de Dieu — trouver sa mission',                      ago: 'Il y a 1 semaine' },
];

export default function UpcomingShows() {
  return (
    <section className="bg-white py-10 md:py-14">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <SectionHeading title="À suivre" href="/programmes" />

        <ul className="flex flex-col divide-y divide-paper-200 border-y border-paper-200">
          {FALLBACK.map((ep) => (
            <li key={ep.id}>
              <Link
                href={`/programmes/${ep.slug}`}
                className="group flex items-center gap-4 py-4 md:py-5 hover:bg-paper-100 -mx-2 px-2 rounded transition-colors"
              >
                <div
                  className="relative shrink-0 h-16 w-24 md:h-20 md:w-32 rounded overflow-hidden"
                  style={{
                    background:
                      'linear-gradient(135deg, #212870 0%, #3D53EA 60%, #F5C24E 130%)',
                  }}
                >
                  <span className="absolute top-1 left-1 inline-flex items-center gap-1 rounded bg-amber-400 text-ink-900 text-[9px] font-bold px-1 py-0.5 uppercase">
                    <span className="h-1 w-1 rounded-full bg-live" />
                    Live
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-ink-800 leading-snug group-hover:text-brand-700 transition-colors line-clamp-2">
                    {ep.title}
                  </h3>
                  <p className="text-xs md:text-sm text-ink-500 mt-1">{ep.ago}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex justify-center">
          <Link
            href="/programmes"
            className="inline-flex items-center justify-center rounded bg-ink-900 text-white font-semibold text-sm px-16 py-3.5 hover:bg-ink-800 transition-colors w-full max-w-md"
          >
            Plus
          </Link>
        </div>
      </div>
    </section>
  );
}

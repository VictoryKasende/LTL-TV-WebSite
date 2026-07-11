import Link from 'next/link';
import { Radio } from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';
import { getEpisodes, type Episode } from '../../lib/api';

function relativeTime(iso: string | null): string {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return 'Il y a 1 jour';
  if (days < 7) return `Il y a ${days} jours`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return 'Il y a 1 semaine';
  if (weeks < 5) return `Il y a ${weeks} semaines`;
  const months = Math.floor(days / 30);
  return months <= 1 ? 'Il y a 1 mois' : `Il y a ${months} mois`;
}

const GRADIENT = 'linear-gradient(135deg, #212870 0%, #3D53EA 60%, #F5C24E 130%)';

export default async function UpcomingShows() {
  const data = await getEpisodes('?ordering=-aired_at&page_size=4');
  const episodes: Episode[] = data?.results ?? [];

  if (episodes.length === 0) return null;

  return (
    <section className="bg-white py-10 md:py-14">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <SectionHeading title="À suivre" href="/programmes" />

        <ul className="flex flex-col divide-y divide-paper-200 border-y border-paper-200">
          {episodes.map((ep) => (
            <li key={ep.id}>
              <Link
                href={`/emissions/${ep.show_slug}`}
                className="group flex items-center gap-4 py-4 md:py-5 hover:bg-paper-100 -mx-2 px-2 rounded transition-colors"
              >
                <div
                  className="relative shrink-0 h-16 w-24 md:h-20 md:w-32 rounded overflow-hidden"
                  style={{ background: GRADIENT }}
                >
                  {(ep.cover || ep.thumbnail_url) && (
                    <img
                      src={ep.cover ?? ep.thumbnail_url}
                      alt={ep.title}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                  {ep.is_featured && (
                    <span className="absolute top-1 left-1 inline-flex items-center gap-1 rounded bg-amber-400 text-ink-900 text-[9px] font-bold px-1 py-0.5 uppercase">
                      <span className="h-1 w-1 rounded-full bg-live" />
                      Live
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-brand-500 font-bold mb-0.5">
                    <Radio className="h-3 w-3" strokeWidth={2.5} />
                    {ep.show_title}
                  </div>
                  <h3 className="font-semibold text-ink-800 leading-snug group-hover:text-brand-700 transition-colors line-clamp-2">
                    {ep.title}
                  </h3>
                  <p className="text-xs md:text-sm text-ink-500 mt-1">{relativeTime(ep.aired_at)}</p>
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

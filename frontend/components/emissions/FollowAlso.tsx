import Link from 'next/link';
import type { Show } from '../../lib/api';

export default function FollowAlso({ shows }: { shows: Show[] }) {
  if (shows.length === 0) return null;

  return (
    <section className="bg-paper-100 py-10 md:py-14">
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <h2 className="font-bold text-xl md:text-2xl text-ink-800 mb-6">Suivez aussi</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
          {shows.map((s) => (
            <Link
              key={s.id}
              href={`/emissions/${s.slug}`}
              className="group relative aspect-[3/4] overflow-hidden rounded-lg"
              style={{ backgroundColor: s.color }}
            >
              {s.host_photo && (
                <img
                  src={s.host_photo}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              {s.logo && (
                <img src={s.logo} alt="" className="absolute bottom-3 right-3 h-12 w-12 object-contain" />
              )}
              <span className="absolute bottom-3 left-3 text-white font-bold text-sm max-w-[75%]">{s.title}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

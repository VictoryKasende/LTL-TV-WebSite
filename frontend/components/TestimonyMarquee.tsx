import clsx from 'clsx';
import type { Temoignage } from '../lib/api';

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function Card({ t, featured }: { t: Temoignage; featured: boolean }) {
  return (
    <blockquote
      className={clsx(
        'shrink-0 w-64 sm:w-72 md:w-80 rounded-xl p-5 md:p-6',
        featured
          ? 'bg-gradient-to-br from-brand-700 to-brand-900 text-white'
          : 'bg-white border border-paper-200 shadow-card',
      )}
    >
      {featured && (
        <span aria-hidden className="block font-serif text-3xl leading-none text-amber-400 mb-1.5">
          &ldquo;
        </span>
      )}
      <p className={clsx('leading-relaxed line-clamp-4', featured ? 'text-white/90' : 'text-ink-800')}>
        {t.story_short || t.story}
      </p>
      <footer
        className={clsx(
          'mt-4 pt-3 border-t flex items-center gap-3',
          featured ? 'border-white/15' : 'border-paper-200',
        )}
      >
        {t.photo ? (
          <img src={t.photo} alt={t.author_name} className="h-10 w-10 rounded-full object-cover shrink-0" />
        ) : (
          <div
            className={clsx(
              'h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0',
              featured
                ? 'bg-white/10 text-amber-400 border border-amber-400/50'
                : 'bg-gradient-to-br from-amber-400 to-terracotta text-brand-900',
            )}
          >
            {initials(t.author_name)}
          </div>
        )}
        <div className="min-w-0">
          <cite className={clsx('not-italic font-semibold block truncate', featured ? 'text-white' : 'text-ink-800')}>
            {t.author_name}
          </cite>
          {t.city && (
            <p className={clsx('text-sm truncate', featured ? 'text-white/55' : 'text-ink-500')}>{t.city}</p>
          )}
        </div>
      </footer>
    </blockquote>
  );
}

function Row({ items, direction }: { items: Temoignage[]; direction: 'slow' | 'fast' }) {
  if (items.length === 0) return null;
  // Duplicated once so the -50% translateX loops seamlessly regardless of row width.
  const looped = [...items, ...items];

  return (
    <div className="group overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
      <div
        className={clsx(
          'flex w-max gap-4 md:gap-5 will-change-transform group-hover:[animation-play-state:paused] motion-reduce:animate-none',
          direction === 'slow' ? 'animate-marquee-slow' : 'animate-marquee-fast',
        )}
      >
        {looped.map((t, i) => (
          <div key={`${t.id}-${i}`} aria-hidden={i >= items.length}>
            <Card t={t} featured={t.is_featured && i % 5 === 0} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TestimonyMarquee({ items }: { items: Temoignage[] }) {
  if (items.length === 0) return null;

  const rowA = items.filter((_, i) => i % 2 === 0);
  const rowB = items.filter((_, i) => i % 2 === 1);

  return (
    <div className="space-y-4 md:space-y-5" role="list" aria-label="Témoignages">
      <Row items={rowA} direction="slow" />
      {rowB.length > 0 && <Row items={rowB} direction="fast" />}
    </div>
  );
}

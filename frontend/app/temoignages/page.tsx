import Container from '../../components/ui/Container';
import TemoignageForm from '../../components/TemoignageForm';
import TestimonyMarquee from '../../components/TestimonyMarquee';
import { getTestimonials } from '../../lib/api';

export const revalidate = 60;

export const metadata = {
  title: 'Témoignage',
  description: 'Des histoires vraies, des vies transformées. Écoutez et partagez à votre tour.',
};

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default async function TemoignagesPage() {
  const data = await getTestimonials();
  const items = data?.results ?? [];
  const hero = items.find((t) => t.is_featured) ?? items[0];
  const wall = hero ? items.filter((t) => t.id !== hero.id) : items;

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-500 via-brand-700 to-brand-900 text-white py-20 md:py-28">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: 'radial-gradient(50% 60% at 82% 15%, rgba(245,166,35,0.25), transparent 70%)' }}
        />
        <Container size="narrow" className="relative text-center">
          <p className="inline-flex items-center gap-3 text-xs uppercase tracking-[0.22em] text-amber-400 font-bold mb-8">
            <span aria-hidden className="h-px w-10 bg-white/25" />
            Ils témoignent
            <span aria-hidden className="h-px w-10 bg-white/25" />
          </p>

          {hero ? (
            <>
              <p className="font-serif italic text-2xl md:text-4xl leading-snug text-balance">
                <span className="text-amber-400 not-italic">&ldquo;</span>
                {hero.story_short || hero.story}
                <span className="text-amber-400 not-italic">&rdquo;</span>
              </p>
              <div className="mt-8 flex items-center justify-center gap-3">
                {hero.photo ? (
                  <img
                    src={hero.photo}
                    alt={hero.author_name}
                    className="h-11 w-11 rounded-full object-cover border-2 border-white/30"
                  />
                ) : (
                  <div className="h-11 w-11 rounded-full bg-gradient-to-br from-amber-400 to-terracotta flex items-center justify-center font-bold text-brand-900 border-2 border-white/30">
                    {initials(hero.author_name)}
                  </div>
                )}
                <div className="text-left">
                  <p className="font-semibold text-sm">{hero.author_name}</p>
                  {hero.city && <p className="text-xs text-white/60">{hero.city}</p>}
                </div>
              </div>
            </>
          ) : (
            <h1 className="font-bold text-display-lg">Des histoires qui parlent au cœur.</h1>
          )}

          <p className="mt-10 max-w-xl mx-auto text-white/75 leading-relaxed">
            Chaque semaine, des femmes et des hommes partagent ce que Dieu a changé
            dans leur vie. Parcourez leurs histoires — et ajoutez la vôtre.
          </p>
          <a
            href="#partager"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-amber-400 text-brand-900 font-bold px-6 py-3 text-sm hover:bg-amber-500 transition-colors"
          >
            Partager mon témoignage
          </a>
        </Container>
      </section>

      <section className="bg-cream py-16 md:py-20 overflow-hidden">
        <Container>
          <div className="flex items-end justify-between gap-6 flex-wrap mb-10">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-amber-500 font-bold mb-2">
                Mur de témoignages
              </p>
              <h2 className="font-bold text-display-md text-brand-700">
                Des vies transformées, en leurs mots.
              </h2>
            </div>
            {items.length > 0 && (
              <p className="text-sm text-ink-500">
                <span className="font-bold text-brand-700 tabular-nums">{items.length}</span>{' '}
                témoignage{items.length > 1 ? 's' : ''} partagé{items.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {wall.length === 0 ? (
            <p className="text-ink-500 text-center py-12">
              Soyez le premier à partager votre histoire ci-dessous.
            </p>
          ) : (
            <TestimonyMarquee items={wall} />
          )}
        </Container>
      </section>

      <section id="partager" className="bg-white py-16 md:py-20">
        <Container size="narrow">
          <div className="mb-10 text-center md:text-left">
            <p className="text-xs uppercase tracking-[0.22em] text-amber-500 font-bold mb-3">— À votre tour</p>
            <h2 className="font-bold text-display-md text-brand-700">Partagez votre témoignage.</h2>
            <p className="mt-3 text-lg text-ink-500 leading-relaxed">
              Votre histoire peut encourager quelqu'un aujourd'hui. Chaque témoignage
              est relu par notre équipe avant d'être publié sur le mur.
            </p>
          </div>
          <TemoignageForm />
        </Container>
      </section>
    </>
  );
}

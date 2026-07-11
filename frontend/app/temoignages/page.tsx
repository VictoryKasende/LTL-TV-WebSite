import { MessageSquareHeart } from 'lucide-react';
import Container from '../../components/ui/Container';
import TemoignageForm from '../../components/TemoignageForm';
import { getTestimonials } from '../../lib/api';

export const revalidate = 60;

export const metadata = {
  title: 'Témoignage',
  description: 'Des histoires vraies, des vies transformées. Écoutez et partagez à votre tour.',
};

export default async function TemoignagesPage() {
  const data = await getTestimonials();
  const items = data?.results ?? [];

  return (
    <>
      <section className="bg-brand-700 text-white py-14 md:py-20 relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(60% 60% at 20% 80%, rgba(61,83,234,0.4), transparent 70%)' }} />
        <Container className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-brand-200 mb-6">
            <MessageSquareHeart className="h-3 w-3" strokeWidth={2.5} />
            Ils témoignent
          </div>
          <h1 className="font-bold text-display-lg max-w-3xl">
            Des histoires qui parlent au cœur.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80 leading-relaxed">
            Chaque semaine, des femmes et des hommes partagent ce qui a changé
            leur vie. Ajoutez la vôtre.
          </p>
        </Container>
      </section>

      <section className="bg-paper-100 py-14 md:py-20">
        <Container>
          <div className="columns-1 md:columns-2 lg:columns-3 gap-5 md:gap-6 [column-fill:_balance]">
            {items.map((t) => (
              <blockquote
                key={t.id}
                className="break-inside-avoid mb-5 md:mb-6 rounded-lg bg-white shadow-card p-6 md:p-7 hover:shadow-card-hover transition-shadow border border-paper-200"
              >
                <p className="text-lg leading-relaxed text-ink-800">{t.story_short || t.story}</p>
                <footer className="mt-5 pt-4 border-t border-paper-200 flex items-center gap-3">
                  {t.photo ? (
                    <img src={t.photo} alt={t.author_name} className="h-11 w-11 rounded-full object-cover" />
                  ) : (
                    <div className="h-11 w-11 rounded-full bg-brand-100 flex items-center justify-center font-bold text-brand-700">
                      {t.author_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <cite className="not-italic font-semibold text-ink-800 block">{t.author_name}</cite>
                    {t.city && <p className="text-sm text-ink-500">{t.city}</p>}
                  </div>
                </footer>
              </blockquote>
            ))}
          </div>
        </Container>
      </section>

      <section id="partager" className="bg-white py-14 md:py-20">
        <Container size="narrow">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.2em] text-brand-500 font-bold mb-3">— À votre tour</p>
            <h2 className="font-bold text-display-md text-brand-700">Partagez votre témoignage.</h2>
            <p className="mt-3 text-lg text-ink-500 leading-relaxed">
              Votre histoire peut encourager quelqu'un aujourd'hui. Écrivez-nous
              en quelques lignes.
            </p>
          </div>
          <TemoignageForm />
        </Container>
      </section>
    </>
  );
}

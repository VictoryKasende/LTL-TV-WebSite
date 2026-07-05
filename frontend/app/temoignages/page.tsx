import { MessageSquareHeart } from 'lucide-react';
import Container from '../../components/ui/Container';
import TemoignageForm from '../../components/TemoignageForm';
import { apiGet, type Paginated, type Temoignage } from '../../lib/api';

export const revalidate = 60;

export const metadata = {
  title: 'Témoignage',
  description: 'Des histoires vraies, des vies transformées. Écoutez et partagez à votre tour.',
};

const FALLBACK: Temoignage[] = [
  { id: 1, author: 'Sarah M.',        location: 'Kinshasa',   message: 'J\'ai découvert LTL TV un dimanche matin, et depuis, chaque émission est devenue pour moi une source de paix.', photo: null, created_at: '' },
  { id: 2, author: 'Emmanuel K.',     location: 'Lubumbashi', message: 'Les témoignages diffusés m\'ont donné le courage de partager le mien. Une famille bienveillante.', photo: null, created_at: '' },
  { id: 3, author: 'Marie-Claire N.', location: 'Goma',       message: 'Après une période difficile, j\'ai retrouvé espoir en écoutant Rafraîchissement Matinée.', photo: null, created_at: '' },
  { id: 4, author: 'David M.',        location: 'Bukavu',     message: 'Merci pour la qualité des programmes. Chaque semaine, quelque chose me touche et me fait réfléchir.', photo: null, created_at: '' },
  { id: 5, author: 'Esther W.',       location: 'Kinshasa',   message: 'Les Live Zoom du Dr Odia sont une bénédiction pour moi et ma famille.', photo: null, created_at: '' },
  { id: 6, author: 'Patrick B.',      location: 'Matadi',     message: 'La chorale du dimanche m\'a réconcilié avec la louange.', photo: null, created_at: '' },
];

export default async function TemoignagesPage() {
  const data = await apiGet<Paginated<Temoignage>>('/temoignages/');
  const items = data?.results?.length ? data.results : FALLBACK;

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
                <p className="text-lg leading-relaxed text-ink-800">{t.message}</p>
                <footer className="mt-5 pt-4 border-t border-paper-200 flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-brand-100 flex items-center justify-center font-bold text-brand-700">
                    {t.author.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <cite className="not-italic font-semibold text-ink-800 block">{t.author}</cite>
                    {t.location && <p className="text-sm text-ink-500">{t.location}</p>}
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

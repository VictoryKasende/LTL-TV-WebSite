import { Quote, MessageSquareHeart } from 'lucide-react';
import Container from '../../components/ui/Container';
import TemoignageForm from '../../components/TemoignageForm';
import { apiGet, type Paginated, type Temoignage } from '../../lib/api';

export const revalidate = 60;

export const metadata = {
  title: 'Témoignages',
  description: 'Des histoires vraies, des vies transformées. Écoutez et partagez à votre tour.',
};

const FALLBACK: Temoignage[] = [
  { id: 1, author: 'Sarah M.',       location: 'Kinshasa',   message: 'J\'ai découvert LTL TV un dimanche matin, et depuis, chaque émission est devenue pour moi une source de paix. Les paroles entendues m\'accompagnent au quotidien, dans les moments doux comme dans les tempêtes.', photo: null, created_at: '2026-05-01' },
  { id: 2, author: 'Emmanuel K.',    location: 'Lubumbashi', message: 'Les témoignages diffusés m\'ont donné le courage de partager le mien. C\'est plus qu\'une chaîne, c\'est une famille bienveillante que je regarde en famille.', photo: null, created_at: '2026-05-15' },
  { id: 3, author: 'Marie-Claire N.',location: 'Goma',       message: 'Après une période difficile, j\'ai retrouvé espoir en écoutant Lumière du matin. Un rendez-vous que je ne manque plus.', photo: null, created_at: '2026-06-02' },
  { id: 4, author: 'David M.',       location: 'Bukavu',     message: 'Merci pour la qualité des programmes. Chaque semaine, quelque chose me touche et me fait réfléchir. Continuez !', photo: null, created_at: '2026-06-10' },
  { id: 5, author: 'Esther W.',      location: 'Kinshasa',   message: 'Les débats sont respectueux, argumentés, et m\'aident à comprendre le monde autrement. C\'est rare et précieux.', photo: null, created_at: '2026-06-18' },
  { id: 6, author: 'Patrick B.',     location: 'Matadi',     message: 'La chorale du dimanche m\'a réconcilié avec la louange. Je chante avec ma famille toute la semaine !', photo: null, created_at: '2026-06-22' },
];

export default async function TemoignagesPage() {
  const data = await apiGet<Paginated<Temoignage>>('/temoignages/');
  const items = data?.results?.length ? data.results : FALLBACK;

  return (
    <>
      {/* Hero */}
      <section className="relative bg-ink-900 text-cream-50 pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden">
        <Quote
          aria-hidden
          className="pointer-events-none absolute -top-4 right-0 md:top-10 md:right-16 h-56 w-56 md:h-80 md:w-80 text-gold-500/10"
          strokeWidth={0.5}
          fill="currentColor"
        />
        <Container className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-gold-400 mb-8">
            <MessageSquareHeart className="h-3 w-3" strokeWidth={2.5} />
            Ils témoignent
          </div>
          <h1 className="font-serif text-display-lg font-medium max-w-3xl">
            Des <span className="italic text-gold-400">histoires</span> qui parlent au cœur.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-cream-100/80 leading-relaxed">
            Chaque semaine, des femmes et des hommes partagent ce qui a changé
            leur vie. Écoutez-les. Et, si vous le souhaitez, ajoutez votre voix.
          </p>
        </Container>
      </section>

      {/* Liste */}
      <section className="bg-cream-100 py-20 md:py-24">
        <Container>
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 md:gap-8 [column-fill:_balance]">
            {items.map((t) => (
              <blockquote
                key={t.id}
                className="break-inside-avoid mb-6 md:mb-8 rounded-lg bg-white shadow-card p-8 hover:shadow-card-hover transition-shadow"
              >
                <p className="font-serif text-xl leading-snug text-ink-900">
                  <span className="text-gold-500 mr-1">«</span>
                  {t.message}
                  <span className="text-gold-500 ml-1">»</span>
                </p>
                <footer className="mt-6 pt-5 border-t border-cream-200 flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-gold-100 flex items-center justify-center font-serif text-gold-700 font-semibold">
                    {t.author.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <cite className="not-italic font-medium text-ink-900 block">{t.author}</cite>
                    {t.location && <p className="text-sm text-ink-500">{t.location}</p>}
                  </div>
                </footer>
              </blockquote>
            ))}
          </div>
        </Container>
      </section>

      {/* Form */}
      <section id="partager" className="bg-white py-24 md:py-32">
        <Container size="narrow">
          <div className="mb-12">
            <div className="rule-gold mb-8" />
            <p className="text-xs uppercase tracking-[0.2em] text-gold-600 mb-4">
              — À votre tour
            </p>
            <h2 className="font-serif text-display-md font-medium text-ink-900">
              Partagez votre <span className="italic text-gold-600">témoignage</span>.
            </h2>
            <p className="mt-4 text-lg text-ink-600 leading-relaxed">
              Votre histoire peut encourager quelqu'un aujourd'hui. Écrivez-nous
              en quelques lignes — nous la relirons avec soin avant de la
              diffuser.
            </p>
          </div>
          <TemoignageForm />
        </Container>
      </section>
    </>
  );
}

import Container from '../../components/ui/Container';
import TemoignageForm from '../../components/TemoignageForm';
import TestimoniesContent from '../../components/TestimoniesContent';
import { getTestimonials } from '../../lib/api';

export const revalidate = 60;

export const metadata = {
  title: 'Témoignage',
  description: 'Des histoires vraies, des vies transformées. Écoutez et partagez à votre tour.',
  alternates: { canonical: '/temoignages' },
};

export default async function TemoignagesPage() {
  const data = await getTestimonials();

  return (
    <>
      <TestimoniesContent initialData={data} />

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

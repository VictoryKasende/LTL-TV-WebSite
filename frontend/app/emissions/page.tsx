import { Radio } from 'lucide-react';
import Container from '../../components/ui/Container';
import EmissionsListClient from '../../components/emissions/EmissionsListClient';
import { getShows } from '../../lib/api';

export const revalidate = 300;

export const metadata = {
  title: 'Émissions',
  description: 'Toutes les émissions LTL·TV : animateurs, thèmes et horaires.',
  alternates: { canonical: '/emissions' },
};

export default async function EmissionsPage() {
  const data = await getShows();

  return (
    <>
      <section className="bg-brand-700 text-white py-14 md:py-20 relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(60% 60% at 20% 30%, rgba(61,83,234,0.4), transparent 70%)' }} />
        <Container className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-brand-200 mb-6">
            <Radio className="h-3 w-3" strokeWidth={2.5} />
            Émissions
          </div>
          <h1 className="font-bold text-display-lg max-w-3xl">Nos émissions.</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80 leading-relaxed">
            Découvrez les programmes phares de LTL·TV et leurs animateurs.
          </p>
        </Container>
      </section>

      <EmissionsListClient initialData={data} />
    </>
  );
}

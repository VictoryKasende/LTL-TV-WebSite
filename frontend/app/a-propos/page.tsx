import { Info } from 'lucide-react';
import Container from '../../components/ui/Container';
import AboutContent from '../../components/about/AboutContent';
import { getAboutPage, getTeam, getValues } from '../../lib/api';

export const revalidate = 300;

export async function generateMetadata() {
  const about = await getAboutPage();
  const title = about?.meta_title || 'À propos';
  const description = about?.meta_description || 'Vision, mission, valeurs, histoire et équipe de LTL·TV.';
  return {
    title,
    description,
    alternates: { canonical: about?.canonical_url || '/a-propos' },
    openGraph: {
      title,
      description,
      images: (about?.og_image || about?.cover) ? [{ url: (about.og_image || about.cover) as string }] : undefined,
    },
  };
}

export default async function AboutPage() {
  const [about, values, team] = await Promise.all([
    getAboutPage(),
    getValues(),
    getTeam('?page_size=50'),
  ]);

  return (
    <>
      <section className="bg-brand-700 text-white py-14 md:py-20 relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(60% 60% at 80% 20%, rgba(61,83,234,0.4), transparent 70%)' }} />
        <Container className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-brand-200 mb-6">
            <Info className="h-3 w-3" strokeWidth={2.5} />
            À propos
          </div>
          <h1 className="font-bold text-display-lg max-w-3xl">Qui sommes-nous ?</h1>
        </Container>
      </section>

      <AboutContent initialAbout={about} initialValues={values} initialTeam={team} />
    </>
  );
}

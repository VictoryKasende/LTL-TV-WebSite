import { Newspaper } from 'lucide-react';
import Container from '../../components/ui/Container';
import ArticlesListClient from '../../components/articles/ArticlesListClient';
import { getArticles } from '../../lib/api';

export const revalidate = 60;

export const metadata = {
  title: 'Articles',
  description: 'Réflexions, portraits et actualités par la rédaction de LTL TV.',
  alternates: { canonical: '/articles' },
};

export default async function ArticlesPage() {
  const data = await getArticles();

  return (
    <>
      <section className="bg-brand-700 text-white py-14 md:py-20 relative overflow-hidden">
        <Container className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-brand-200 mb-6">
            <Newspaper className="h-3 w-3" strokeWidth={2.5} />
            À lire
          </div>
          <h1 className="font-bold text-display-lg max-w-3xl">Réflexions, portraits, actualités.</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80 leading-relaxed">
            Les articles de la rédaction pour prolonger la réflexion.
          </p>
        </Container>
      </section>

      <ArticlesListClient initialData={data} />
    </>
  );
}

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
  return <ArticlesListClient initialData={data} />;
}

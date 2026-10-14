import ArticlesListClient from '../../components/articles/ArticlesListClient';
import { getArticles } from '../../lib/api';
import { pageMetadata } from '../../lib/seo';

export const revalidate = 60;

export const metadata = pageMetadata({
  title: 'Articles',
  description: 'Réflexions, portraits et actualités par la rédaction de LTL TV.',
  path: '/articles',
});

export default async function ArticlesPage() {
  const data = await getArticles();
  return <ArticlesListClient initialData={data} />;
}

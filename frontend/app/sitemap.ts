import type { MetadataRoute } from 'next';
import { getArticles, getProgrammes, getShows } from '../lib/api';

// The backend isn't reachable during the isolated `docker build` stage, so the
// build-time render of this route sees empty data. Revalidate so the first
// real request (once the container is running, network reachable) refreshes it.
export const revalidate = 3600;

const BASE_URL = 'https://ltltv.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [shows, programmes, articles] = await Promise.all([
    getShows({ revalidate: 3600 }),
    getProgrammes('?page_size=500', { revalidate: 3600 }),
    getArticles('?page_size=500', { revalidate: 3600 }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/emissions`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/programmes`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/temoignages`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/articles`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/a-propos`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contact`, changeFrequency: 'monthly', priority: 0.4 },
  ];

  const showRoutes: MetadataRoute.Sitemap = (shows?.results ?? []).map((s) => ({
    url: `${BASE_URL}/emissions/${s.slug}`,
    lastModified: s.updated_at,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const programmeRoutes: MetadataRoute.Sitemap = (programmes?.results ?? []).map((p) => ({
    url: `${BASE_URL}/programmes/${p.slug}`,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  const articleRoutes: MetadataRoute.Sitemap = (articles?.results ?? []).map((a) => ({
    url: `${BASE_URL}/articles/${a.slug}`,
    lastModified: a.created_at,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...showRoutes, ...programmeRoutes, ...articleRoutes];
}

import { notFound } from 'next/navigation';
import ShowDetailClient from '../../../components/emissions/ShowDetailClient';
import FollowAlso from '../../../components/emissions/FollowAlso';
import { getEpisodes, getShow, getShowSeries, getShows } from '../../../lib/api';

export const revalidate = 120;

type Params = { params: { slug: string } };

export async function generateMetadata({ params }: Params) {
  const show = await getShow(params.slug);
  if (!show) return { title: 'Émission introuvable' };
  const title = show.meta_title || show.title;
  const description = show.meta_description || show.tagline || `${show.title} sur LTL·TV.`;
  const image = show.og_image || show.cover;
  return {
    title,
    description,
    alternates: { canonical: show.canonical_url || `/emissions/${show.slug}` },
    openGraph: {
      title,
      description,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function ShowDetailPage({ params }: Params) {
  const show = await getShow(params.slug);
  if (!show) notFound();

  const [series, episodesData, showsData] = await Promise.all([
    getShowSeries(params.slug),
    getEpisodes(`?show=${params.slug}&page_size=100`),
    getShows(),
  ]);

  const allEpisodes = episodesData?.results ?? [];
  const standalone = allEpisodes.filter((ep) => !ep.series);
  const initialEpisode = allEpisodes.find((ep) => !ep.is_locked) ?? null;
  const otherShows = (showsData?.results ?? []).filter((s) => s.slug !== show.slug);

  return (
    <>
      <ShowDetailClient
        show={show}
        series={series ?? []}
        standalone={standalone}
        initialEpisode={initialEpisode}
      />
      <FollowAlso shows={otherShows} />
    </>
  );
}

import { notFound } from 'next/navigation';
import ShowDetailClient from '../../../components/emissions/ShowDetailClient';
import FollowAlso from '../../../components/emissions/FollowAlso';
import { getEpisodes, getShow, getShowSeries, getShows } from '../../../lib/api';

export const revalidate = 120;

type Params = {
  params: { slug: string };
  searchParams: { episode?: string };
};

export async function generateMetadata({ params, searchParams }: Params) {
  const show = await getShow(params.slug);
  if (!show) return { title: 'Émission introuvable' };

  const episode = searchParams.episode
    ? (await getEpisodes(`?show=${params.slug}&page_size=100`))?.results
      .find((ep) => ep.slug === searchParams.episode)
    : null;

  const title = episode
    ? `${episode.title} · ${show.title}`
    : (show.meta_title || show.title);
  const description = episode
    ? (episode.excerpt || episode.subtitle || show.meta_description || show.tagline || `${show.title} sur LTL·TV.`)
    : (show.meta_description || show.tagline || `${show.title} sur LTL·TV.`);
  const image = episode ? (episode.cover || episode.thumbnail_url) : (show.og_image || show.cover);
  const canonical = episode
    ? `/emissions/${show.slug}?episode=${episode.slug}`
    : (show.canonical_url || `/emissions/${show.slug}`);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function ShowDetailPage({ params, searchParams }: Params) {
  const show = await getShow(params.slug);
  if (!show) notFound();

  const [series, episodesData, showsData] = await Promise.all([
    getShowSeries(params.slug),
    getEpisodes(`?show=${params.slug}&page_size=100`),
    getShows(),
  ]);

  const allEpisodes = episodesData?.results ?? [];
  const standalone = allEpisodes.filter((ep) => !ep.series);
  const requestedEpisode = searchParams.episode
    ? allEpisodes.find((ep) => ep.slug === searchParams.episode)
    : null;
  const initialEpisode = requestedEpisode ?? allEpisodes.find((ep) => !ep.is_locked) ?? null;
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

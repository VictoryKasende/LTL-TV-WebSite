import { notFound } from 'next/navigation';
import ShowDetailClient from '../../../components/emissions/ShowDetailClient';
import FollowAlso from '../../../components/emissions/FollowAlso';
import { getEpisodes, getShow, getShowSeries, getShows } from '../../../lib/api';

export const revalidate = 120;

type Params = { params: { slug: string } };

export async function generateMetadata({ params }: Params) {
  const show = await getShow(params.slug);
  if (!show) return { title: 'Émission introuvable' };
  return { title: show.title, description: show.tagline || `${show.title} sur LTL·TV.` };
}

export default async function ShowDetailPage({ params }: Params) {
  const show = await getShow(params.slug);
  if (!show) notFound();

  const [series, episodesData, showsData] = await Promise.all([
    getShowSeries(params.slug),
    getEpisodes(`?show=${params.slug}&page_size=50`),
    getShows(),
  ]);

  const allEpisodes = episodesData?.results ?? [];
  const standalone = allEpisodes.filter((ep) => !ep.series);
  const initialEpisode = allEpisodes[0] ?? null;
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

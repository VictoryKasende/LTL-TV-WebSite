import { getEpisodes } from '../../lib/api';
import UpcomingShowsClient from './UpcomingShowsClient';

export default async function UpcomingShows() {
  const data = await getEpisodes('?available=true&ordering=-site_published_at&page_size=24');
  return <UpcomingShowsClient initialData={data} />;
}

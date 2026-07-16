import { getEpisodes } from '../../lib/api';
import UpcomingShowsClient from './UpcomingShowsClient';

export default async function UpcomingShows() {
  const data = await getEpisodes('?ordering=-aired_at&page_size=4');
  return <UpcomingShowsClient initialData={data} />;
}

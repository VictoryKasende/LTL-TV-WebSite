import { getShows } from '../../lib/api';
import ShowsGridClient from './ShowsGridClient';

export default async function ShowsGrid() {
  const data = await getShows({ revalidate: 300 });
  return <ShowsGridClient initialData={data} />;
}

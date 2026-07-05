import FeaturedShow  from '../components/home/FeaturedShow';
import UpcomingShows from '../components/home/UpcomingShows';
import AboutBlock    from '../components/home/AboutBlock';
import ShowsGrid     from '../components/home/ShowsGrid';
import ContactBlock  from '../components/home/ContactBlock';

export const revalidate = 60;

export default function HomePage() {
  return (
    <>
      <FeaturedShow />
      <UpcomingShows />
      <AboutBlock />
      <ShowsGrid />
      <ContactBlock />
    </>
  );
}

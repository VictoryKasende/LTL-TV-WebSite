import { getActiveBanners } from '../../lib/api';
import BannerCarousel from './BannerCarousel';

export default async function FeaturedShow() {
  const banners = await getActiveBanners({ revalidate: 30 });

  return (
    <section className="relative bg-white">
      <BannerCarousel initialData={banners} />
    </section>
  );
}

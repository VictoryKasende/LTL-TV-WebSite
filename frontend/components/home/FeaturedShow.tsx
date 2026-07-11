import { getActiveBanners } from '../../lib/api';
import BannerCarousel from './BannerCarousel';

export default async function FeaturedShow() {
  const banners = (await getActiveBanners({ revalidate: 30 })) ?? [];

  if (banners.length > 0) {
    return (
      <section className="relative bg-white">
        <BannerCarousel banners={banners} />
      </section>
    );
  }

  return (
    <section className="relative bg-hero-rays text-white">
      <div className="relative px-6 md:px-14 py-20 md:py-28 text-center">
        <img
          src="/logo-ltl-white.svg"
          alt="LTL TV"
          className="h-7 md:h-8 w-auto mx-auto mb-8 opacity-95"
        />
        <h1 className="font-display tracking-tight text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.9]">
          ANNONCER <span className="text-amber-400">L&apos;ÉVANGILE</span>
          <br className="hidden md:block" />
          PAR LES MÉDIAS
        </h1>
        <p className="mt-6 max-w-xl mx-auto text-sm md:text-base text-white/85 leading-relaxed">
          Émissions, LIVE Zoom et YouTube — chaque semaine, avec vous.
        </p>
      </div>
    </section>
  );
}

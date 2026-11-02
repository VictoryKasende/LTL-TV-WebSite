import Link from 'next/link';

// Texte d'accroche fixe : la mission/vision complètes (page À propos) sont
// trop longues pour la home.
const MISSION =
  "LTL TV est une chaîne chrétienne focalisée à annoncer l'Évangile par les médias.";
const VISION =
  'Nous offrons des émissions chaque semaine et des programmes LIVE Zoom et YouTube.';

export default function AboutBlock() {
  return (
    <section id="about" className="bg-white py-14 md:py-20">
      <div className="max-w-3xl mx-auto px-6 md:px-8 text-center">
        <p className="text-lg md:text-2xl font-semibold text-ink-800 leading-relaxed">
          {MISSION}
        </p>
        <p className="mt-8 text-base md:text-lg text-ink-500 leading-relaxed">
          {VISION}{' '}
          <Link
            href="/a-propos"
            className="text-brand-500 font-semibold hover:text-brand-600 underline underline-offset-4 decoration-brand-500/40"
          >
            Plus
          </Link>
        </p>

        {/* Row des sous-marques */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
          <Link href="/emissions/dans-les-profondeurs" aria-label="Dans Les Profondeurs">
            <img src="/logo-dlp.svg" alt="Dans Les Profondeurs" className="h-8 md:h-9 w-auto" />
          </Link>
          <Link href="/emissions/prends-courage" aria-label="Prends Courage">
            <img src="/logo-pc.svg" alt="Prends Courage" className="h-9 md:h-10 w-auto" />
          </Link>
          <Link href="/emissions/rafraichissement" aria-label="Rafraîchissement">
            <img src="/logo-raf.svg" alt="Rafraîchissement" className="h-16 md:h-20 w-auto" />
          </Link>
        </div>
      </div>
    </section>
  );
}

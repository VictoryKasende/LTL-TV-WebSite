import { ChevronLeft, ChevronRight } from 'lucide-react';

const HOSTS = [
  { initial: 'F', name: 'FRANCK K.' },
  { initial: 'J', name: 'DOCTEUR JONATHAN ODIA' },
  { initial: 'I', name: 'ISRAEL K.' },
  { initial: 'N', name: 'NICOLE F.' },
  { initial: 'B', name: 'BERNIS M.' },
];

export default function FeaturedShow() {
  return (
    <section className="relative bg-white pt-6 md:pt-10">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="relative overflow-hidden rounded-lg md:rounded-xl bg-hero-rays text-white shadow-brand-glow">
          <div className="relative px-6 md:px-14 pt-10 md:pt-14 pb-10 md:pb-16">
            {/* logo LTL·tv centré en tête de card */}
            <div className="flex justify-center">
              <img src="/logo-ltl-white.svg" alt="LTL TV" className="h-6 md:h-7 w-auto opacity-95" />
            </div>

            {/* Portraits d'équipe : 2 en haut, 3 en bas */}
            <div className="mt-8 mx-auto max-w-md md:max-w-xl">
              <div className="grid grid-cols-2 gap-4 md:gap-5 mb-4 md:mb-5 px-6 md:px-10">
                {HOSTS.slice(0, 2).map((h) => (
                  <HostCard key={h.name} host={h} />
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 md:gap-4">
                {HOSTS.slice(2).map((h) => (
                  <HostCard key={h.name} host={h} />
                ))}
              </div>
            </div>

            {/* Titre LIVE ZOOM */}
            <div className="mt-10 text-center">
              <div className="inline-flex items-center gap-2 text-amber-400 uppercase tracking-[0.15em] text-sm md:text-base font-bold">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inset-0 rounded-full bg-live animate-pulse-dot" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-live" />
                </span>
                LIVE ZOOM
              </div>
              <h1 className="mt-3 font-display tracking-tight text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.9]">
                GUÉRISON <span className="text-amber-400">&amp;</span>
                <br className="hidden md:block" />
                <span className="bg-gradient-to-b from-brand-300 to-brand-500 bg-clip-text text-transparent">
                  RESTAURATION
                </span>
              </h1>
              <p className="mt-6 max-w-xl mx-auto text-sm md:text-base text-white/85 leading-relaxed">
                LIVE Restauration et Guérison —
                un rendez-vous mensuel de délivrance et d'espérance.
              </p>
            </div>

            {/* Carousel dots */}
            <div className="mt-8 flex items-center justify-center gap-2">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${i === 0 ? 'w-8 bg-white' : 'w-1.5 bg-white/40'}`}
                />
              ))}
            </div>
          </div>

          {/* Arrows */}
          <button
            aria-label="Précédent"
            className="hidden md:inline-flex absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur border border-white/20 text-white/80 hover:bg-white/20 hover:text-white transition"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            aria-label="Suivant"
            className="hidden md:inline-flex absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur border border-white/20 text-white/80 hover:bg-white/20 hover:text-white transition"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}

function HostCard({ host }: { host: { initial: string; name: string } }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative aspect-square w-full rounded-md md:rounded-lg overflow-hidden ring-2 ring-amber-400/60"
        style={{
          background: 'linear-gradient(160deg, #F5C24E 0%, #E85521 55%, #A53030 100%)',
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-white/60 text-4xl md:text-5xl">{host.initial}</span>
        </div>
      </div>
      <span className="text-[10px] md:text-xs font-bold tracking-wider text-white/90 text-center leading-tight">
        {host.name}
      </span>
    </div>
  );
}

import Link from 'next/link';
import { PlayCircle, ArrowRight } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-ink-900 text-cream-50">
      {/* Ambient gradient */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(60% 50% at 20% 20%, rgba(245,166,35,0.18), transparent 60%), radial-gradient(50% 60% at 90% 80%, rgba(13,27,42,0.9), transparent 70%)',
        }}
      />
      {/* Noise texture, subtle */}
      <div
        aria-hidden
        className="absolute inset-0 mix-blend-overlay opacity-[0.06]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22140%22 height=%22140%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%220.9%22/></svg>")',
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6 md:px-10 pt-24 pb-28 md:pt-32 md:pb-40">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-gold-400 mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-400 animate-pulse-dot" />
            En direct 24/7
          </div>

          <h1 className="font-serif font-medium text-display-xl">
            La chaîne qui{' '}
            <span className="italic text-gold-400">inspire</span>,<br />
            informe et transforme.
          </h1>

          <p className="mt-8 text-lg md:text-xl text-cream-100/80 leading-relaxed max-w-2xl">
            Découvrez nos programmes, écoutez des témoignages puissants,
            lisez des articles qui parlent au cœur. LTL TV, votre rendez-vous
            quotidien avec la lumière et la vie.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row gap-4">
            <Link
              href="/programmes"
              className="group inline-flex items-center justify-center gap-3 rounded bg-gold-500 text-ink-900 font-semibold px-8 py-4 hover:bg-gold-400 transition-all shadow-card hover:shadow-card-hover"
            >
              <PlayCircle className="h-5 w-5" strokeWidth={2} />
              Voir les programmes
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/temoignages"
              className="inline-flex items-center justify-center gap-2 rounded border border-cream-100/25 text-cream-50 font-medium px-8 py-4 hover:bg-cream-50/5 hover:border-cream-100/40 transition-colors"
            >
              Lire les témoignages
            </Link>
          </div>

          {/* Meta strip */}
          <dl className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-3xl">
            {[
              { k: 'Diffusion', v: '24 / 7' },
              { k: 'Programmes', v: '12+' },
              { k: 'Communauté', v: '10k+' },
              { k: 'Fondée', v: '2024' },
            ].map(({ k, v }) => (
              <div key={k} className="border-t border-cream-100/15 pt-4">
                <dt className="text-xs uppercase tracking-[0.15em] text-gold-400/80">{k}</dt>
                <dd className="mt-2 font-serif text-3xl font-medium text-cream-50">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Bottom rule */}
      <div className="relative border-t border-cream-100/10" />
    </section>
  );
}

import Link from 'next/link';
import { Quote, ArrowUpRight } from 'lucide-react';
import { apiGet, type Paginated, type Temoignage } from '../../lib/api';
import SectionHeading from '../ui/SectionHeading';
import Container from '../ui/Container';

const FALLBACK: Temoignage[] = [
  { id: 1, author: 'Sarah M.', location: 'Kinshasa', message: 'J\'ai découvert LTL TV un dimanche matin, et depuis, chaque émission est devenue pour moi une source de paix. Les paroles entendues m\'accompagnent au quotidien.', photo: null, created_at: '' },
  { id: 2, author: 'Emmanuel K.', location: 'Lubumbashi', message: 'Les témoignages diffusés m\'ont donné le courage de partager le mien. Une famille bienveillante que je regarde en famille.', photo: null, created_at: '' },
];

export default async function TemoignagesTeaser() {
  const data = await apiGet<Paginated<Temoignage>>('/temoignages/');
  const items = (data?.results?.length ? data.results : FALLBACK).slice(0, 2);

  return (
    <section className="relative bg-ink-900 text-cream-50 py-24 md:py-32 overflow-hidden">
      {/* Ornemental big serif quote */}
      <Quote
        aria-hidden
        className="pointer-events-none absolute -top-8 -right-8 md:top-8 md:right-16 h-48 w-48 md:h-72 md:w-72 text-gold-500/10"
        strokeWidth={0.5}
        fill="currentColor"
      />

      <Container>
        <SectionHeading
          tone="dark"
          index="02"
          eyebrow="Ils témoignent"
          title="Des voix qui portent la lumière"
          description="Derrière chaque histoire, une vie qui a basculé. Ces récits nous rappellent la force de l'espérance."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
          {items.map((t) => (
            <blockquote
              key={t.id}
              className="flex flex-col justify-between rounded-lg border border-cream-100/10 bg-cream-50/[0.02] p-8 md:p-10 backdrop-blur-sm hover:border-gold-500/30 transition-colors"
            >
              <p className="font-serif text-2xl md:text-3xl leading-snug text-cream-50">
                <span className="text-gold-400 mr-1">«</span>
                {t.message}
                <span className="text-gold-400 ml-1">»</span>
              </p>

              <footer className="mt-8 pt-6 border-t border-cream-100/10 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gold-500/20 flex items-center justify-center font-serif text-lg text-gold-400 font-medium">
                  {t.author.charAt(0).toUpperCase()}
                </div>
                <div>
                  <cite className="not-italic font-medium text-cream-50">{t.author}</cite>
                  {t.location && (
                    <p className="text-sm text-cream-100/60 mt-0.5">{t.location}</p>
                  )}
                </div>
              </footer>
            </blockquote>
          ))}
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Link
            href="/temoignages"
            className="group inline-flex items-center gap-2 rounded bg-gold-500 text-ink-900 font-semibold px-6 py-3 hover:bg-gold-400 transition-colors"
          >
            Lire tous les témoignages
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <Link
            href="/temoignages#partager"
            className="text-sm text-cream-100/70 hover:text-gold-400 transition-colors underline underline-offset-4 decoration-cream-100/30"
          >
            Partager mon propre témoignage →
          </Link>
        </div>
      </Container>
    </section>
  );
}

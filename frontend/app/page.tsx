import Link from 'next/link';
import { Mail, ArrowUpRight } from 'lucide-react';
import Hero from '../components/home/Hero';
import ProgrammesTeaser from '../components/home/ProgrammesTeaser';
import TemoignagesTeaser from '../components/home/TemoignagesTeaser';
import ArticlesTeaser from '../components/home/ArticlesTeaser';
import Container from '../components/ui/Container';

export const revalidate = 60;

export default function HomePage() {
  return (
    <>
      <Hero />
      <ProgrammesTeaser />
      <TemoignagesTeaser />
      <ArticlesTeaser />

      {/* CTA final */}
      <section className="bg-white py-24 md:py-32 border-t border-cream-200">
        <Container size="narrow" className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-50 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-gold-700 mb-8">
            Rejoignez-nous
          </div>
          <h2 className="font-serif text-display-lg font-medium text-ink-900">
            Une <span className="italic text-gold-600">question</span>, une prière,
            un projet ?
          </h2>
          <p className="mt-6 text-lg text-ink-600 leading-relaxed">
            Notre équipe est à votre écoute. Écrivez-nous et rejoignez la
            communauté LTL TV.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact"
              className="group inline-flex items-center gap-2 rounded bg-ink-900 text-cream-50 font-semibold px-8 py-4 hover:bg-ink-800 transition-colors"
            >
              <Mail className="h-5 w-5" strokeWidth={2} />
              Nous écrire
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <a
              href="mailto:contact@ltltv.com"
              className="text-ink-600 hover:text-gold-600 transition-colors font-medium"
            >
              contact@ltltv.com
            </a>
          </div>
        </Container>
      </section>
    </>
  );
}

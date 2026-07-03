import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, User, ArrowLeft, Radio, Share2 } from 'lucide-react';
import Container from '../../../components/ui/Container';
import { apiGet, type Programme } from '../../../lib/api';

export const revalidate = 60;

type Params = { params: { slug: string } };

export async function generateMetadata({ params }: Params) {
  const programme = await apiGet<Programme>(`/programmes/${params.slug}/`);
  if (!programme) return { title: 'Programme introuvable' };
  return {
    title: programme.title,
    description: programme.description || `Programme ${programme.title} sur LTL TV.`,
  };
}

export default async function ProgrammeDetailPage({ params }: Params) {
  const programme = await apiGet<Programme>(`/programmes/${params.slug}/`);
  if (!programme) notFound();

  return (
    <>
      {/* Hero */}
      <section
        className="relative bg-ink-900 text-cream-50 pt-24 pb-20 md:pt-32 md:pb-32 overflow-hidden"
        style={{
          backgroundImage: programme.cover ? undefined : 'linear-gradient(135deg, #0D1B2A 0%, #152238 55%, #6C3D00 100%)',
        }}
      >
        {programme.cover && (
          <>
            <img src={programme.cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
            <div className="absolute inset-0 bg-gradient-to-b from-ink-900/50 to-ink-900" />
          </>
        )}
        <Container className="relative">
          <Link
            href="/programmes"
            className="inline-flex items-center gap-2 text-sm text-cream-100/70 hover:text-gold-400 transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Toute la grille
          </Link>
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-gold-400 mb-6">
              <Radio className="h-3 w-3" strokeWidth={2.5} />
              Programme
            </div>
            <h1 className="font-serif text-display-lg font-medium">
              {programme.title}
            </h1>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-cream-100/80">
              {programme.host && (
                <div className="inline-flex items-center gap-2">
                  <User className="h-4 w-4 text-gold-400" strokeWidth={2} />
                  <span className="font-medium">{programme.host}</span>
                </div>
              )}
              {programme.schedule && (
                <div className="inline-flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gold-400" strokeWidth={2} />
                  <span>{programme.schedule}</span>
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* Body */}
      <section className="bg-white py-20 md:py-24">
        <Container size="narrow">
          <article className="prose-editorial">
            {programme.description ? (
              programme.description.split('\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))
            ) : (
              <p className="italic text-ink-500">Description à venir.</p>
            )}
          </article>

          <div className="mt-16 pt-8 border-t border-cream-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm text-ink-500">
              <Share2 className="h-4 w-4" />
              Partager cette émission
            </div>
            <Link
              href="/programmes"
              className="inline-flex items-center gap-2 text-sm font-medium text-ink-900 hover:text-gold-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la grille
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}

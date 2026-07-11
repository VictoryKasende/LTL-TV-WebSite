import { Award, Compass, HandHeart, Heart, HeartHandshake, ShieldCheck, Sparkles, Info } from 'lucide-react';
import Container from '../../components/ui/Container';
import { getAboutPage, getTeam, getValues, type CoreValue } from '../../lib/api';

export const revalidate = 300;

export const metadata = {
  title: 'À propos',
  description: 'Vision, mission, valeurs, histoire et équipe de LTL·TV.',
};

const ICONS: Record<string, typeof Heart> = {
  award: Award,
  heart: Heart,
  'shield-check': ShieldCheck,
  'hand-heart': HandHeart,
  'heart-handshake': HeartHandshake,
  compass: Compass,
};

function valueIcon(icon: CoreValue['icon']) {
  return ICONS[icon] ?? Sparkles;
}

export default async function AboutPage() {
  const [about, values, team] = await Promise.all([
    getAboutPage(),
    getValues(),
    getTeam('?page_size=50'),
  ]);

  const members = team?.results ?? [];

  return (
    <>
      <section className="bg-brand-700 text-white py-14 md:py-20 relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(60% 60% at 80% 20%, rgba(61,83,234,0.4), transparent 70%)' }} />
        <Container className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-brand-200 mb-6">
            <Info className="h-3 w-3" strokeWidth={2.5} />
            À propos
          </div>
          <h1 className="font-bold text-display-lg max-w-3xl">Qui sommes-nous ?</h1>
          {about?.mission && (
            <p className="mt-4 max-w-2xl text-lg text-white/80 leading-relaxed">{about.mission}</p>
          )}
        </Container>
      </section>

      {(about?.vision || about?.history_text) && (
        <section id="mission" className="bg-white py-14 md:py-20">
          <Container size="narrow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14">
              {about?.vision && (
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-brand-500 font-bold mb-3">— Vision</p>
                  <p className="text-lg text-ink-700 leading-relaxed">{about.vision}</p>
                </div>
              )}
              {about?.history_text && (
                <div id="histoire">
                  <p className="text-xs uppercase tracking-[0.2em] text-brand-500 font-bold mb-3">
                    — Histoire{about.founded_year ? ` · depuis ${about.founded_year}` : ''}
                  </p>
                  <p className="text-lg text-ink-700 leading-relaxed">{about.history_text}</p>
                </div>
              )}
            </div>
          </Container>
        </section>
      )}

      {values && values.length > 0 && (
        <section className="bg-paper-100 py-14 md:py-20">
          <Container>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-500 font-bold mb-3 text-center">— Nos valeurs</p>
            <h2 className="font-bold text-display-md text-brand-700 text-center mb-12">Ce qui nous porte.</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
              {values.map((v) => {
                const Icon = valueIcon(v.icon);
                return (
                  <div key={v.id} className="rounded-lg bg-white shadow-card p-6 md:p-7 text-center hover:shadow-card-hover transition-shadow">
                    <div className="h-12 w-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-6 w-6" strokeWidth={1.75} />
                    </div>
                    <h3 className="font-bold text-lg text-ink-800">{v.title}</h3>
                    {v.description && <p className="mt-2 text-sm text-ink-500 leading-relaxed">{v.description}</p>}
                  </div>
                );
              })}
            </div>
          </Container>
        </section>
      )}

      {members.length > 0 && (
        <section id="equipe" className="bg-white py-14 md:py-20">
          <Container>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-500 font-bold mb-3 text-center">— L&apos;équipe</p>
            <h2 className="font-bold text-display-md text-brand-700 text-center mb-12">Team LTL·TV.</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
              {members.map((m) => (
                <div key={m.id} className="text-center">
                  <div className="relative aspect-square w-full max-w-[180px] mx-auto rounded-full overflow-hidden bg-brand-100 mb-4">
                    {m.photo ? (
                      <img src={m.photo} alt={m.full_name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center font-display text-3xl text-brand-500">
                        {m.full_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-ink-800">{m.full_name}</h3>
                  {m.role && <p className="text-sm text-brand-500 font-medium">{m.role}</p>}
                  <p className="mt-1 text-xs uppercase tracking-wider text-ink-400">{m.category_display}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}

import { Info } from 'lucide-react';
import Container from '../../components/ui/Container';
import { getAboutPage, getTeam, getValues, type TeamMember } from '../../lib/api';

export const revalidate = 300;

export async function generateMetadata() {
  const about = await getAboutPage();
  const title = about?.meta_title || 'À propos';
  const description = about?.meta_description || 'Vision, mission, valeurs, histoire et équipe de LTL·TV.';
  return {
    title,
    description,
    alternates: { canonical: about?.canonical_url || '/a-propos' },
    openGraph: {
      title,
      description,
      images: (about?.og_image || about?.cover) ? [{ url: (about.og_image || about.cover) as string }] : undefined,
    },
  };
}

const CATEGORY_ORDER: TeamMember['category'][] = [
  'direction', 'coordination', 'pastorale', 'production', 'technique', 'communication', 'benevole',
];

const TILE_COLORS = ['#3D53EA', '#E85521'];
const HEADING_COLORS = ['#3D53EA', '#E85521'];

function groupByCategory(members: TeamMember[]) {
  const groups: { category: string; label: string; members: TeamMember[] }[] = [];
  for (const cat of CATEGORY_ORDER) {
    const inCat = members.filter((m) => m.category === cat);
    if (inCat.length > 0) {
      groups.push({ category: cat, label: inCat[0].category_display, members: inCat });
    }
  }
  return groups;
}

export default async function AboutPage() {
  const [about, values, team] = await Promise.all([
    getAboutPage(),
    getValues(),
    getTeam('?page_size=50'),
  ]);

  const members = team?.results ?? [];
  const groups = groupByCategory(members);
  let tileIndex = 0;

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
        </Container>
      </section>

      {(about?.vision || about?.mission) && (
        <section className="bg-white py-14 md:py-20">
          <Container size="narrow">
            <div className="rounded-lg bg-paper-100 p-6 md:p-10">
              <h2 className="font-bold text-2xl md:text-3xl text-ink-800 mb-4">Vision &amp; Mission</h2>
              {about?.vision && (
                <p className="text-lg text-ink-700 leading-relaxed">{about.vision}</p>
              )}
              {about?.mission && (
                <p className="mt-4 text-lg text-ink-700 leading-relaxed">{about.mission}</p>
              )}
            </div>
          </Container>
        </section>
      )}

      {values && values.length > 0 && (
        <section className="bg-white py-4 md:py-6">
          <Container size="narrow">
            <h2 className="font-bold text-2xl md:text-3xl text-ink-800 mb-4">Valeurs</h2>
            <p className="text-lg text-ink-700 leading-relaxed mb-6">
              Pour accomplir la mission que Dieu nous a donnée, voici les valeurs
              que nous nous efforçons de montrer dans tout ce que LTL TV produit :
            </p>
            <ul className="space-y-3">
              {values.map((v) => (
                <li key={v.id}>
                  <span className="font-semibold text-ink-800">{v.title}</span>
                  {v.description && (
                    <span className="block text-sm text-ink-500 leading-relaxed">{v.description}</span>
                  )}
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {about?.history_text && (
        <section className="bg-white py-14 md:py-20">
          <Container size="narrow">
            <p className="text-lg text-ink-700 leading-relaxed">{about.history_text}</p>
            <p className="mt-6 text-lg text-ink-700 leading-relaxed">Merci pour votre soutien !</p>
          </Container>
        </section>
      )}

      {members.length > 0 && (
        <section id="equipe">
          <div className="bg-paper-100 py-6">
            <Container size="narrow">
              <h2 className="font-bold text-2xl md:text-3xl text-ink-800 text-center">Team LTL·TV</h2>
            </Container>
          </div>

          <div className="bg-white py-10 md:py-14">
            <Container size="narrow">
              {groups.map((g) => (
                <div key={g.category} className="mb-10 last:mb-0">
                  <h3
                    className="font-bold text-xl mb-4"
                    style={{ color: HEADING_COLORS[CATEGORY_ORDER.indexOf(g.category as TeamMember['category']) % 2] }}
                  >
                    {g.label} LTL TV
                  </h3>
                  <div className="space-y-4">
                    {g.members.map((m) => {
                      const color = TILE_COLORS[tileIndex % 2];
                      tileIndex += 1;
                      return (
                        <div key={m.id} className="flex items-center gap-4 rounded-lg bg-paper-100 p-3">
                          <div
                            className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-lg overflow-hidden"
                            style={{ backgroundColor: color }}
                          >
                            {m.photo && (
                              <img src={m.photo} alt={m.full_name} className="h-full w-full object-cover" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-ink-800">{m.full_name}</p>
                            {m.role && <p className="text-sm text-ink-500 leading-relaxed">{m.role}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </Container>
          </div>
        </section>
      )}
    </>
  );
}

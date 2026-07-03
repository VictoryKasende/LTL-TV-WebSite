export default function HomePage() {
  return (
    <section className="max-w-5xl mx-auto px-6 py-20">
      <h1 className="text-4xl md:text-6xl font-bold text-brand">
        Bienvenue sur <span className="text-brand-accent">LTL TV</span>
      </h1>
      <p className="mt-6 text-lg text-slate-600 max-w-2xl">
        Découvrez nos programmes, témoignages et articles qui informent,
        inspirent et transforment des vies au quotidien.
      </p>
      <div className="mt-10 flex gap-4">
        <a
          href="/programmes"
          className="inline-block px-6 py-3 rounded bg-brand-accent text-white font-medium hover:opacity-90 transition"
        >
          Voir les programmes
        </a>
        <a
          href="/temoignages"
          className="inline-block px-6 py-3 rounded border border-brand text-brand font-medium hover:bg-brand hover:text-white transition"
        >
          Lire les témoignages
        </a>
      </div>
    </section>
  );
}

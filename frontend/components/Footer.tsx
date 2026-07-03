export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 mt-16">
      <div className="max-w-6xl mx-auto px-6 py-8 text-sm text-slate-600 flex flex-col md:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} LTL TV. Tous droits réservés.</p>
        <p>
          Contact :{' '}
          <a href="mailto:contact@ltltv.com" className="text-brand-accent">
            contact@ltltv.com
          </a>
        </p>
      </div>
    </footer>
  );
}

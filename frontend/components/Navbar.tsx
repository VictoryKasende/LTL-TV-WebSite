import Link from 'next/link';

const links = [
  { href: '/', label: 'Accueil' },
  { href: '/programmes', label: 'Programmes' },
  { href: '/temoignages', label: 'Témoignages' },
  { href: '/articles', label: 'Articles' },
  { href: '/contact', label: 'Contact' },
];

export default function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold text-brand">
          LTL<span className="text-brand-accent">TV</span>
        </Link>
        <ul className="hidden md:flex gap-6 text-sm font-medium text-slate-700">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="hover:text-brand-accent transition">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

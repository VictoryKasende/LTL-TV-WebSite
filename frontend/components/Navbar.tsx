'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X, Heart } from 'lucide-react';
import clsx from 'clsx';

const links = [
  { href: '/',            label: 'Accueil' },
  { href: '/emissions',   label: 'Émissions' },
  { href: '/programmes',  label: 'Grille TV' },
  { href: '/temoignages', label: 'Témoignage' },
  { href: '/articles',    label: 'Articles' },
  { href: '/contact',     label: 'Contact' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header
      className={clsx(
        'sticky top-0 z-50 bg-brand-700 text-white transition-shadow duration-300',
        scrolled ? 'shadow-[0_4px_24px_-4px_rgba(15,17,20,0.35)]' : 'shadow-none',
      )}
    >
      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 md:h-[4.5rem] flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center shrink-0" aria-label="LTL TV — Accueil">
            <img src="/logo-ltl-white.svg" alt="LTL TV" className="h-6 md:h-7 w-auto" />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  'relative text-sm font-semibold tracking-wide transition-colors py-1',
                  isActive(l.href) ? 'text-white' : 'text-white/70 hover:text-white',
                )}
              >
                {l.label}
                <span
                  className={clsx(
                    'absolute -bottom-[1px] left-0 right-0 h-0.5 rounded-full bg-amber-400 origin-left transition-transform duration-300',
                    isActive(l.href) ? 'scale-x-100' : 'scale-x-0',
                  )}
                />
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4 shrink-0">
            <Link
              href="/contact#don"
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 text-brand-800 font-semibold px-4 py-2 text-sm hover:bg-amber-500 transition-colors"
            >
              <Heart className="h-3.5 w-3.5" strokeWidth={2.5} />
              Faire un don
            </Link>
          </div>

          <button
            className="md:hidden -mr-2 p-2 text-white"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <div
        className={clsx(
          'md:hidden grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out-editorial bg-brand-800',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <nav className="min-h-0">
          <div className="px-6 py-5 flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  'flex items-center py-3 text-base font-semibold border-b border-white/10 transition-colors',
                  isActive(l.href) ? 'text-amber-400' : 'text-white/90 hover:text-white',
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="px-6 pb-6 pt-2">
            <Link
              href="/contact#don"
              className="flex items-center justify-center gap-2 rounded-full bg-amber-400 text-brand-800 font-semibold px-5 py-3 text-sm hover:bg-amber-500 transition-colors"
            >
              <Heart className="h-4 w-4" strokeWidth={2.5} />
              Faire un don
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

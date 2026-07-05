'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, Facebook, Youtube, Instagram } from 'lucide-react';
import clsx from 'clsx';

const links = [
  { href: '/',            label: 'Accueil' },
  { href: '/programmes',  label: 'Grille TV' },
  { href: '/temoignages', label: 'Témoignage' },
  { href: '/articles',    label: 'Articles' },
  { href: '/contact',     label: 'Contact' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 bg-brand-700 text-white">
      <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 md:h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center" aria-label="LTL TV — Accueil">
          <img src="/logo-ltl-white.svg" alt="LTL TV" className="h-6 md:h-7 w-auto" />
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                'relative text-sm font-medium tracking-wide transition-colors py-1',
                isActive(l.href) ? 'text-white' : 'text-white/70 hover:text-white'
              )}
            >
              {l.label}
              {isActive(l.href) && (
                <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-brand-500 rounded-full" />
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {[
            { href: 'https://facebook.com',  Icon: Facebook,  label: 'Facebook'  },
            { href: 'https://youtube.com',   Icon: Youtube,   label: 'YouTube'   },
            { href: 'https://instagram.com', Icon: Instagram, label: 'Instagram' },
          ].map(({ href, Icon, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="h-8 w-8 inline-flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
            </a>
          ))}
        </div>

        <button
          className="md:hidden p-2 -mr-2 text-white"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <nav className="md:hidden border-t border-white/10 bg-brand-700">
          <div className="px-6 py-5 flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  'flex items-center py-3 text-base font-medium border-b border-white/5',
                  isActive(l.href) ? 'text-brand-200' : 'text-white/90'
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}

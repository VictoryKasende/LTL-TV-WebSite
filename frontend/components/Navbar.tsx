'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, Radio } from 'lucide-react';
import clsx from 'clsx';

const links = [
  { href: '/', label: 'Accueil' },
  { href: '/programmes', label: 'Programmes' },
  { href: '/temoignages', label: 'Témoignages' },
  { href: '/articles', label: 'Articles' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-cream-200">
      <div className="max-w-6xl mx-auto px-6 md:px-10 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="relative">
            <div className="h-2 w-2 rounded-full bg-gold-500 animate-pulse-dot" />
            <div className="absolute inset-0 h-2 w-2 rounded-full bg-gold-500/40 blur-sm" />
          </div>
          <span className="font-serif text-2xl font-semibold tracking-tight text-ink-900">
            LTL<span className="text-gold-600">·</span>TV
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                'relative text-sm font-medium tracking-wide transition-colors',
                isActive(l.href)
                  ? 'text-ink-900'
                  : 'text-ink-500 hover:text-ink-900'
              )}
            >
              {l.label}
              {isActive(l.href) && (
                <span className="absolute -bottom-1.5 left-0 right-0 h-px bg-gold-500" />
              )}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA + live indicator */}
        <div className="hidden md:flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500">
            <Radio className="h-3.5 w-3.5 text-gold-500" strokeWidth={2.5} />
            En direct 24/7
          </span>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded bg-ink-900 text-cream-50 text-sm font-medium px-5 py-2.5 hover:bg-ink-800 transition-colors"
          >
            Nous contacter
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 -mr-2 text-ink-900"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <nav className="md:hidden border-t border-cream-200 bg-white">
          <div className="px-6 py-6 flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  'flex items-center py-3 text-base font-medium border-b border-cream-100',
                  isActive(l.href) ? 'text-gold-600' : 'text-ink-700'
                )}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="mt-4 text-center rounded bg-ink-900 text-cream-50 text-base font-medium px-6 py-3"
            >
              Nous contacter
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

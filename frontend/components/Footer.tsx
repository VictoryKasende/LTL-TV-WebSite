import Link from 'next/link';
import { Facebook, Youtube, Instagram, Mail, MapPin, Radio } from 'lucide-react';

const nav = [
  { label: 'Accueil', href: '/' },
  { label: 'Programmes', href: '/programmes' },
  { label: 'Témoignages', href: '/temoignages' },
  { label: 'Articles', href: '/articles' },
  { label: 'Contact', href: '/contact' },
];

const socials = [
  { label: 'Facebook',  href: 'https://facebook.com',  Icon: Facebook },
  { label: 'YouTube',   href: 'https://youtube.com',   Icon: Youtube },
  { label: 'Instagram', href: 'https://instagram.com', Icon: Instagram },
];

export default function Footer() {
  return (
    <footer className="bg-ink-900 text-cream-100">
      <div className="max-w-6xl mx-auto px-6 md:px-10 pt-20 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-5">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="h-2 w-2 rounded-full bg-gold-500" />
              <span className="font-serif text-3xl font-semibold tracking-tight text-cream-50">
                LTL<span className="text-gold-500">·</span>TV
              </span>
            </Link>
            <p className="mt-6 max-w-md text-cream-100/70 leading-relaxed">
              La chaîne qui inspire, informe et transforme. Des programmes,
              des témoignages et des réflexions qui parlent au cœur.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 text-sm text-gold-400">
              <Radio className="h-4 w-4" strokeWidth={2.5} />
              <span>Diffusion 24 heures sur 24, 7 jours sur 7</span>
            </div>
          </div>

          {/* Nav */}
          <div className="md:col-span-3">
            <p className="text-xs uppercase tracking-[0.2em] text-gold-400 mb-5">Navigation</p>
            <ul className="space-y-3">
              {nav.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-cream-100/80 hover:text-gold-400 transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-4">
            <p className="text-xs uppercase tracking-[0.2em] text-gold-400 mb-5">Contact</p>
            <ul className="space-y-3 text-cream-100/80">
              <li className="flex items-start gap-3">
                <Mail className="h-4 w-4 mt-1 text-gold-400 shrink-0" />
                <a href="mailto:contact@ltltv.com" className="hover:text-gold-400 transition-colors">
                  contact@ltltv.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-1 text-gold-400 shrink-0" />
                <span>Studios LTL TV<br />ltltv.com</span>
              </li>
            </ul>

            <div className="mt-8 flex gap-3">
              {socials.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank" rel="noopener noreferrer"
                  aria-label={label}
                  className="h-10 w-10 inline-flex items-center justify-center rounded border border-cream-100/20 text-cream-100/70 hover:border-gold-400 hover:text-gold-400 transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="rule-gold my-10" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-cream-100/50">
          <p>© {new Date().getFullYear()} LTL TV. Tous droits réservés.</p>
          <p className="font-serif italic">« La lumière qui inspire la vie. »</p>
        </div>
      </div>
    </footer>
  );
}

import Link from 'next/link';
import { Youtube, Instagram, Heart, Handshake } from 'lucide-react';
import { TikTokIcon, WhatsAppIcon } from './icons/SocialIcons';

const col1 = [
  { label: 'Accueil',     href: '/' },
  { label: 'Témoignage',  href: '/temoignages' },
  { label: 'Prière',      href: '/contact#priere' },
  { label: 'LIVE',        href: '/programmes' },
  { label: 'Contact',     href: '/contact' },
];

const col2 = [
  { label: 'À propos',            href: '/a-propos' },
  { label: 'Vision',              href: '/a-propos#mission' },
  { label: 'Mission & Valeurs',   href: '/a-propos#mission' },
  { label: 'Histoire',            href: '/a-propos#histoire' },
  { label: 'Team LTL TV',         href: '/a-propos#equipe' },
];

const col3 = [
  { label: 'Grille TV',            href: '/programmes' },
  { label: 'Émissions',            href: '/emissions' },
  { label: 'Prends Courage',       href: '/emissions/prends-courage' },
  { label: 'Dans les Profondeurs', href: '/emissions/dans-les-profondeurs' },
  { label: 'Rafraîchissement',     href: '/emissions/rafraichissement' },
];

export default function Footer() {
  return (
    <footer className="bg-ink-900 text-white">
      <div className="max-w-6xl mx-auto px-6 md:px-10 pt-16 pb-8">
        {/* Row de marques */}
        <div className="flex flex-nowrap items-center justify-between gap-3 md:flex-wrap md:justify-start md:gap-x-10 md:gap-y-6 pb-12 border-b border-white/10">
          <Link href="/" aria-label="LTL TV" className="shrink-0">
            <img src="/logo-ltl-white.svg" alt="LTL TV" className="h-5 md:h-6 w-auto" />
          </Link>
          <Link href="/emissions/dans-les-profondeurs" aria-label="Dans Les Profondeurs" className="shrink-0">
            <img src="/logo-dlp.svg" alt="Dans Les Profondeurs" className="h-5 md:h-6 w-auto opacity-90" />
          </Link>
          <Link href="/emissions/prends-courage" aria-label="Prends Courage" className="shrink-0">
            <img src="/logo-pc.svg" alt="Prends Courage" className="h-6 md:h-7 w-auto opacity-90" style={{ filter: 'invert(1) brightness(1.4)' }} />
          </Link>
          <Link href="/emissions/rafraichissement" aria-label="Rafraîchissement" className="shrink-0">
            <img src="/logo-raf.svg" alt="Rafraîchissement" className="h-9 md:h-14 w-auto opacity-90" style={{ filter: 'brightness(1.4)' }} />
          </Link>
        </div>

        {/* Colonnes */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-10 py-12">
          <FooterCol items={col1} />
          <FooterCol items={col2} />
          <FooterCol items={col3} />
        </div>

        {/* CTA + socials */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-6 border-t border-white/10">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/contact#partenaire"
              className="inline-flex items-center gap-2 rounded-full bg-brand-500 text-white font-medium px-5 py-2.5 text-sm hover:bg-brand-400 transition-colors"
            >
              <Handshake className="h-4 w-4" strokeWidth={2} />
              Devenir Partenaire
            </Link>
            <Link
              href="/contact#don"
              className="inline-flex items-center gap-2 rounded-full border border-brand-500 text-brand-300 font-medium px-5 py-2.5 text-sm hover:bg-brand-500/10 transition-colors"
            >
              <Heart className="h-4 w-4" strokeWidth={2} />
              Faire un don
            </Link>
          </div>

          <div className="flex gap-2">
            {[
              { href: 'https://youtube.com/shorts/F4RCRIVNURA?si=ab-KeblDKyKrwn-T', Icon: Youtube, label: 'YouTube' },
              { href: 'https://www.instagram.com/reel/DZdI4f4iXxE/?igsh=MXhxbTBldGc4bGs2Zg==', Icon: Instagram, label: 'Instagram' },
              { href: 'https://vt.tiktok.com/ZSQfEk2xa/', Icon: TikTokIcon, label: 'TikTok' },
              { href: 'https://whatsapp.com/channel/0029VaLQDXoKLaHjRAj7m52H', Icon: WhatsAppIcon, label: 'WhatsApp' },
            ].map(({ href, Icon, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-white/15 text-white/70 hover:border-brand-500 hover:text-brand-300 transition-colors"
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
              </a>
            ))}
          </div>
        </div>

        <p className="mt-8 text-center md:text-left text-xs text-white/45">
          © {new Date().getFullYear()} LTL TV, votre chaîne chrétienne. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}

function FooterCol({ items }: { items: { label: string; href: string }[] }) {
  return (
    <ul className="space-y-3">
      {items.map((l) => (
        <li key={l.label}>
          <Link
            href={l.href}
            className="text-sm text-white/70 hover:text-brand-300 transition-colors"
          >
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

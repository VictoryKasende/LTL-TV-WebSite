'use client';

import { useEffect, useState } from 'react';
import type { ComponentType, CSSProperties } from 'react';
import {
  Check, Facebook, Link2, Linkedin, Mail, MessageCircle, Send, Share2,
} from 'lucide-react';
import { SITE_URL } from '../../lib/seo';

type Network = {
  key: string;
  label: string;
  color: string;
  Icon: ComponentType<{ className?: string }>;
  href: (url: string, title: string, excerpt: string) => string;
};

// X's mark isn't in lucide (its "Twitter" icon is the old bird).
function XMark({ className }: { className?: string }) {
  return <span aria-hidden className={`font-black leading-none ${className ?? ''}`}>𝕏</span>;
}

const enc = encodeURIComponent;

const NETWORKS: Network[] = [
  {
    key: 'whatsapp', label: 'WhatsApp', color: '#25D366', Icon: MessageCircle,
    href: (url, title) => `https://wa.me/?text=${enc(`${title}\n${url}`)}`,
  },
  {
    key: 'facebook', label: 'Facebook', color: '#1877F2', Icon: Facebook,
    href: (url) => `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
  },
  {
    key: 'x', label: 'X', color: '#0F1114', Icon: XMark,
    href: (url, title) => `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`,
  },
  {
    key: 'telegram', label: 'Telegram', color: '#229ED9', Icon: Send,
    href: (url, title) => `https://t.me/share/url?url=${enc(url)}&text=${enc(title)}`,
  },
  {
    key: 'linkedin', label: 'LinkedIn', color: '#0A66C2', Icon: Linkedin,
    href: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
  },
  {
    key: 'email', label: 'E-mail', color: '#212870', Icon: Mail,
    href: (url, title, excerpt) =>
      `mailto:?subject=${enc(title)}&body=${enc(`${excerpt ? `${excerpt}\n\n` : ''}${url}`)}`,
  },
];

/** Share links for one article. `full`: labelled buttons (end of article);
 *  `compact`: round icons only (article header). */
export default function ShareArticle({
  slug, title, excerpt = '', variant = 'full',
}: { slug: string; title: string; excerpt?: string; variant?: 'full' | 'compact' }) {
  const url = `${SITE_URL}/articles/${slug}`;
  const [copied, setCopied] = useState(false);
  // The system share sheet (Instagram, SMS, Messenger…) exists mostly on
  // phones; only known after mount.
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => { setCanNativeShare(typeof navigator !== 'undefined' && !!navigator.share); }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked: nothing to do */ }
  }

  async function nativeShare() {
    try { await navigator.share({ title, text: excerpt || title, url }); } catch { /* cancelled */ }
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1.5" aria-label="Partager cet article">
        {NETWORKS.slice(0, 4).map(({ key, label, color, Icon, href }) => (
          <a
            key={key}
            href={href(url, title, excerpt)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Partager sur ${label}`}
            title={`Partager sur ${label}`}
            className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-paper-300 text-ink-500 transition-colors hover:text-white hover:border-transparent hover:bg-[var(--brand)]"
            style={{ '--brand': color } as CSSProperties}
          >
            <Icon className="h-3.5 w-3.5" />
          </a>
        ))}
        <button
          type="button"
          onClick={canNativeShare ? nativeShare : copyLink}
          aria-label={canNativeShare ? 'Plus d\'options de partage' : 'Copier le lien'}
          title={canNativeShare ? 'Plus d\'options de partage' : 'Copier le lien'}
          className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-paper-300 text-ink-500 hover:border-brand-500 hover:text-brand-600 transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-signal-500" /> : canNativeShare ? <Share2 className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="text-xs uppercase tracking-[0.18em] font-bold text-signal-500">Partager cet article</p>
      <div className="flex flex-wrap justify-center gap-2">
        {NETWORKS.map(({ key, label, color, Icon, href }) => (
          <a
            key={key}
            href={href(url, title, excerpt)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: color }}
          >
            <Icon className="h-4 w-4" />
            {label}
          </a>
        ))}
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-2 rounded-full border border-paper-300 px-4 py-2 text-sm font-semibold text-ink-700 hover:border-brand-500 transition-colors"
        >
          {copied ? <Check className="h-4 w-4 text-signal-500" /> : <Link2 className="h-4 w-4" />}
          {copied ? 'Lien copié' : 'Copier le lien'}
        </button>
        {canNativeShare && (
          <button
            type="button"
            onClick={nativeShare}
            className="inline-flex items-center gap-2 rounded-full border border-paper-300 px-4 py-2 text-sm font-semibold text-ink-700 hover:border-brand-500 transition-colors"
          >
            <Share2 className="h-4 w-4" />
            Plus…
          </button>
        )}
      </div>
    </div>
  );
}

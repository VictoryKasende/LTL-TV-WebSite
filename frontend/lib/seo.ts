import type { Metadata } from 'next';

export const SITE_NAME = 'LTL TV';
export const SITE_URL = 'https://ltltv.com';

// Branded 1200×630 card (see app/og.png/route.tsx) used whenever a page has
// no picture of its own — WhatsApp, Facebook, X… all show it in link previews.
export const DEFAULT_OG_IMAGE = {
  url: '/og.png',
  width: 1200,
  height: 630,
  alt: 'LTL TV — La chaîne chrétienne',
};

type OgType = 'website' | 'article' | 'video.other';

/**
 * Full share metadata for one page. Next merges `openGraph` shallowly — a
 * page that sets it without `images`/`url` would drop the layout's — so
 * every page builds the whole block through here instead.
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
  imageAlt,
  type = 'website',
  publishedTime,
  authors,
}: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  imageAlt?: string;
  type?: OgType;
  publishedTime?: string | null;
  authors?: string[];
}): Metadata {
  const images = image ? [{ url: image, alt: imageAlt || title }] : [DEFAULT_OG_IMAGE];
  // Link previews show no site chrome, so say where the link leads.
  const shareTitle = /LTL/.test(title) ? title : `${title} · ${SITE_NAME}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: shareTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: 'fr_FR',
      type,
      images,
      ...(type === 'article' && publishedTime ? { publishedTime } : {}),
      ...(type === 'article' && authors?.length ? { authors } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: shareTitle,
      description,
      images: images.map((img) => img.url),
    },
  };
}

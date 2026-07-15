import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LTL TV — La chaîne chrétienne',
    short_name: 'LTL TV',
    description: 'LTL TV, la chaîne chrétienne focalisée à annoncer l\'Évangile par les médias.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#212870',
    lang: 'fr',
    icons: [
      { src: '/notification-icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/notification-icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}

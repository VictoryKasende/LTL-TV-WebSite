import type { Metadata, Viewport } from 'next';
import { Manrope, Anton } from 'next/font/google';
import '../styles/globals.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import NotificationPrompt from '../components/NotificationPrompt';
import PwaServiceWorker from '../components/PwaServiceWorker';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

const anton = Anton({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-anton',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'LTL TV — La chaîne chrétienne',
    template: '%s · LTL TV',
  },
  description:
    'LTL TV, la chaîne chrétienne focalisée à annoncer l\'Évangile par les médias. Programmes, émissions LIVE Zoom et YouTube, témoignages et articles.',
  metadataBase: new URL('https://ltltv.com'),
  alternates: { canonical: '/' },
  openGraph: {
    title: 'LTL TV — La chaîne chrétienne',
    description: 'La chaîne chrétienne focalisée à annoncer l\'Évangile par les médias.',
    url: 'https://ltltv.com',
    siteName: 'LTL TV',
    locale: 'fr_FR',
    type: 'website',
  },
  appleWebApp: {
    capable: true,
    title: 'LTL TV',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  themeColor: '#212870',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${manrope.variable} ${anton.variable}`}>
      <body className="min-h-screen flex flex-col font-sans bg-white text-ink-800 antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'LTL TV',
              url: 'https://ltltv.com',
              logo: 'https://ltltv.com/notification-icon-512.png',
              sameAs: [
                'https://youtube.com/shorts/F4RCRIVNURA?si=ab-KeblDKyKrwn-T',
                'https://www.instagram.com/reel/DZdI4f4iXxE/?igsh=MXhxbTBldGc4bGs2Zg==',
                'https://vt.tiktok.com/ZSQfEk2xa/',
                'https://whatsapp.com/channel/0029VaLQDXoKLaHjRAj7m52H',
              ],
            }),
          }}
        />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <PwaServiceWorker />
        <NotificationPrompt />
      </body>
    </html>
  );
}

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
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <PwaServiceWorker />
        <NotificationPrompt />
      </body>
    </html>
  );
}

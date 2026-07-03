import type { Metadata } from 'next';
import { Fraunces, Manrope } from 'next/font/google';
import '../styles/globals.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'LTL TV — La chaîne qui inspire',
    template: '%s · LTL TV',
  },
  description:
    'Programmes, témoignages et articles qui inspirent et transforment. LTL TV, la chaîne au service de la lumière et de la vie.',
  metadataBase: new URL('https://ltltv.com'),
  openGraph: {
    title: 'LTL TV — La chaîne qui inspire',
    description: 'Programmes, témoignages et articles qui inspirent et transforment.',
    url: 'https://ltltv.com',
    siteName: 'LTL TV',
    locale: 'fr_FR',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${manrope.variable}`}>
      <body className="min-h-screen flex flex-col font-sans bg-white text-ink-700 antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

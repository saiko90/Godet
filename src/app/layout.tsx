import type { Metadata, Viewport } from 'next';
import { Archivo, IBM_Plex_Mono, Michroma } from 'next/font/google';
import { IconSprite } from '@/components/Icons';
import './globals.css';

const michroma = Michroma({ subsets: ['latin'], weight: '400', variable: '--font-michroma', display: 'swap' });
const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo', display: 'swap' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-plex-mono', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000'),
  ),
  title: { default: 'Godet — le garage de votre parc d’engins', template: '%s · Godet' },
  description:
    'Carnet d’entretien numérique des machines de chantier : services, réparations, pièces, coûts, photos et vidéos, échéances. Pensé en Suisse, pour les entreprises de construction.',
  applicationName: 'Godet',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Godet', statusBarStyle: 'black-translucent' },
  formatDetection: { telephone: false },
  openGraph: {
    title: 'Godet — le garage de votre parc d’engins',
    description: 'Le carnet d’entretien de chaque machine, dans un showroom 3D. Services, réparations, pièces, coûts, photos.',
    locale: 'fr_CH',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#08090b',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr-CH" className={`${michroma.variable} ${archivo.variable} ${plexMono.variable}`}>
      <body>
        <IconSprite />
        {children}
      </body>
    </html>
  );
}

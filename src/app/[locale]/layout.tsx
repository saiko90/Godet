import type { Metadata, Viewport } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { Archivo, IBM_Plex_Mono, Michroma } from 'next/font/google';
import { notFound } from 'next/navigation';
import { IconSprite } from '@/components/Icons';
import { pickMessages, type AppMessages } from '@/i18n/messages';
import { htmlLang, routing } from '@/i18n/routing';
import '../globals.css';

const michroma = Michroma({ subsets: ['latin'], weight: '400', variable: '--font-michroma', display: 'swap' });
const archivo = Archivo({ subsets: ['latin', 'latin-ext'], axes: ['wdth'], variable: '--font-archivo', display: 'swap' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin', 'latin-ext'], weight: ['400', '500'], variable: '--font-plex-mono', display: 'swap' });

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const l = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  const t = await getTranslations({ locale: l, namespace: 'common.meta' });
  return {
    metadataBase: new URL(SITE),
    title: { default: t('title'), template: t('titleTemplate') },
    description: t('description'),
    applicationName: 'Godet',
    manifest: '/manifest.webmanifest',
    appleWebApp: { capable: true, title: 'Godet', statusBarStyle: 'black-translucent' },
    formatDetection: { telephone: false },
    openGraph: {
      title: t('title'),
      description: t('ogDescription'),
      locale: l === 'en' ? 'en_GB' : `${l}_CH`,
      type: 'website',
      siteName: 'Godet',
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#08090b',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = (await getMessages()) as unknown as AppMessages;

  return (
    <html lang={htmlLang(locale)} className={`${michroma.variable} ${archivo.variable} ${plexMono.variable}`}>
      <body>
        <IconSprite />
        {/* Textes communs à toutes les pages ; chaque zone ajoute les siens avec son propre fournisseur. */}
        <NextIntlClientProvider locale={locale} messages={pickMessages(messages, ['common', 'domain'])}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

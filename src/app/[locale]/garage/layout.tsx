import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { garageClientMessages } from '@/components/garage/messages';
import type { AppMessages } from '@/i18n/messages';
import { routing } from '@/i18n/routing';

// Textes du garage pour la page, l'écran de chargement et la page d'erreur (le layout racine ne fournit que
// « common » et « domain »).
export default async function GarageLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = (await getMessages()) as unknown as AppMessages;
  return (
    <NextIntlClientProvider locale={locale} messages={garageClientMessages(messages, ['common', 'domain', 'garage', 'excel'])}>
      {children}
    </NextIntlClientProvider>
  );
}

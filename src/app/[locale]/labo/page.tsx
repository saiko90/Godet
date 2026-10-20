// Laboratoire du moteur 3D (développement uniquement) : parc de test, navigation, fiche simulée, qualité, son,
// effets et captures. En production, cette page n'existe pas.
import type { Metadata } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { FormatProvider } from '@/components/FormatProvider';
import { pickMessages, type AppMessages } from '@/i18n/messages';
import { routing } from '@/i18n/routing';
import { Labo } from './Labo';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: hasLocale(routing.locales, locale) ? locale : routing.defaultLocale, namespace: 'garage.labo' });
  return { title: t('title'), robots: { index: false, follow: false } };
}

export default async function LaboPage({ params }: Props) {
  if (process.env.NODE_ENV === 'production') notFound();
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = (await getMessages()) as unknown as AppMessages;
  return (
    <NextIntlClientProvider locale={locale} messages={pickMessages(messages, ['common', 'domain', 'garage'])}>
      <FormatProvider locale={locale} country="CH" currency="CHF">
        <Labo />
      </FormatProvider>
    </NextIntlClientProvider>
  );
}

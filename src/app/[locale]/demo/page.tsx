import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { FormatProvider } from '@/components/FormatProvider';
import { DemoGarage } from '@/components/garage/DemoGarage';
import { ogImages } from '@/components/site/seo';
import { localizedAlternates } from '@/i18n/metadata';
import { routing } from '@/i18n/routing';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
  const { locale: l } = await params;
  const locale = hasLocale(routing.locales, l) ? l : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'demo.meta' });
  const alternates = localizedAlternates('/demo', locale);
  const title = t('title');
  const shareTitle = t('shareTitle');
  const description = t('description');
  const images = await ogImages(locale);
  return {
    title,
    description,
    alternates,
    keywords: t('keywords')
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean),
    openGraph: {
      title: shareTitle,
      description,
      url: alternates.canonical,
      type: 'website',
      locale: locale === 'en' ? 'en_GB' : `${locale}_CH`,
      siteName: 'Godet',
      images,
    },
    twitter: { card: 'summary_large_image', title: shareTitle, description, images: images.map((i) => i.url) },
  };
}

function machineParam(value: string | string[] | undefined): string | null {
  return typeof value === 'string' && /^[\w-]{1,64}$/.test(value) ? value : null;
}

export default async function DemoPage({ params, searchParams }: Props) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  // Le parc d'exemple est une entreprise suisse : formats et devise suisses dans toutes les langues.
  return (
    <FormatProvider locale={locale} country="CH" currency="CHF">
      <DemoGarage machineId={machineParam(query.m)} />
    </FormatProvider>
  );
}

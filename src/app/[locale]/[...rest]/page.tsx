import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { checkLocale, metaLocale, NO_INDEX, type LocaleParams } from '@/components/site/seo';

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = metaLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'site.notFound' });
  return { title: t('metaTitle'), robots: NO_INDEX };
}

// Toute adresse inconnue affiche la page 404 dans la langue de la personne.
export default async function CatchAll({ params }: { params: LocaleParams }) {
  const locale = checkLocale((await params).locale);
  setRequestLocale(locale);
  notFound();
}

// Lien court des lettres de prospection (godet.app/demo/location/<code>) : ouvre la démo de l’option Location avec le code de suivi.
import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { isRefCode } from '@/components/site/nav';
import { NO_INDEX } from '@/components/site/seo';
import { redirect } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

export const metadata: Metadata = { robots: NO_INDEX };

export default async function DemoLocationRefPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const code = decodeURIComponent(id).trim().toLowerCase();
  if (!hasLocale(routing.locales, locale) || !isRefCode(code)) notFound();
  setRequestLocale(locale);
  return redirect({ href: { pathname: '/demo/location', query: { ref: code } }, locale });
}

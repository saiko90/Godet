// Lien court des lettres de prospection (godet.app/demo/<code>) : ouvre la démo du garage avec le code de suivi.
import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { isRefCode } from '@/components/site/nav';
import { NO_INDEX } from '@/components/site/seo';
import { redirect } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

export const metadata: Metadata = { robots: NO_INDEX };

export default async function DemoRefPage({ params }: { params: Promise<{ locale: string; ref: string }> }) {
  const { locale, ref } = await params;
  const code = decodeURIComponent(ref).trim().toLowerCase();
  if (!hasLocale(routing.locales, locale) || !isRefCode(code)) notFound();
  setRequestLocale(locale);
  return redirect({ href: { pathname: '/demo', query: { ref: code } }, locale });
}

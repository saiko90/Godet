// Adresse courte des codes QR collés sur les machines (/m/<id>) : ouvre la fiche de la machine au garage.
// Sans session, le garage renvoie vers la connexion puis revient sur la fiche. La langue suit le préfixe, sinon
// le cookie ou le navigateur (détection next-intl), car une étiquette est lue par n'importe quel téléphone.
import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { isUuid } from '@/components/site/nav';
import { NO_INDEX } from '@/components/site/seo';
import { redirect } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

export const metadata: Metadata = { robots: NO_INDEX };

export default async function MachineQrPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!hasLocale(routing.locales, locale) || !isUuid(id)) notFound();
  setRequestLocale(locale);
  return redirect({ href: { pathname: '/garage', query: { m: id } }, locale });
}

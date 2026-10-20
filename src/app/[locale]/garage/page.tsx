import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { FormatProvider } from '@/components/FormatProvider';
import { CloudGarage } from '@/components/garage/CloudGarage';
import { getPathname, redirect } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { loadFleet } from '@/lib/repo/supabase';
import { getSession } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: hasLocale(routing.locales, locale) ? locale : routing.defaultLocale, namespace: 'garage.meta' });
  return {
    title: t('title'),
    description: t('description'),
    robots: { index: false, follow: false },
  };
}

/** Identifiant de machine reçu dans l'adresse (/garage?m=<id>) : gardé seulement s'il a une forme valable. */
function machineParam(value: string | string[] | undefined): string | null {
  return typeof value === 'string' && /^[\w-]{1,64}$/.test(value) ? value : null;
}

export default async function GaragePage({ params, searchParams }: Props) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const session = await getSession();
  const machineId = machineParam(query.m);

  if (session.status === 'anon') {
    // Le proxy redirige déjà ; ici, même forme que lui : la suite garde sa langue (/de/garage?m=…).
    const suite = `${getPathname({ href: '/garage', locale })}${machineId ? `?m=${machineId}` : ''}`;
    return redirect({ href: `/connexion?suite=${encodeURIComponent(suite)}`, locale });
  }
  if (session.status === 'no-org') return redirect({ href: '/bienvenue', locale });

  // Échéances par défaut dans la langue de la page (comme le dépôt du navigateur, cf. CloudGarage).
  const td = await getTranslations({ locale, namespace: 'garage.schedules.defaults' });
  const fleet = await loadFleet(await supabaseServer(), session.ctx, { service: td('service'), safety: td('safety') });
  return (
    <FormatProvider locale={locale} country={session.ctx.org.country} currency={session.ctx.org.currency}>
      <CloudGarage session={session.ctx} fleet={fleet} machineId={machineId} />
    </FormatProvider>
  );
}

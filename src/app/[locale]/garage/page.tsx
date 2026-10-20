import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { FormatProvider } from '@/components/FormatProvider';
import { CloudGarage } from '@/components/garage/CloudGarage';
import { getPathname, redirect } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import type { RentalBadge } from '@/components/garage/rental';
import { rentalEnabled } from '@/lib/billing';
import { nowMs } from '@/lib/clock';
import { machineRentalState, type Rental } from '@/lib/rental';
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
  const supabase = await supabaseServer();
  const fleet = await loadFleet(supabase, session.ctx, { service: td('service'), safety: td('safety') });

  // Option Location : statut de chaque machine (louée, réservée aujourd'hui, disponible avec la prochaine réservation).
  let rentals: { byMachine: Record<string, RentalBadge>; base: string } | null = null;
  const now = nowMs();
  if (rentalEnabled(session.ctx.org, now)) {
    const { data } = await supabase
      .from('rentals')
      .select('*')
      .eq('org_id', session.ctx.org.id)
      .in('status', ['reservee', 'en_cours'])
      .limit(2000);
    const list = (data ?? []) as Rental[];
    // Machine en réparation avec une réservation à venir : risque de retard.
    const { data: open } = await supabase
      .from('entries')
      .select('machine_id')
      .eq('org_id', session.ctx.org.id)
      .eq('kind', 'reparation')
      .in('repair_status', ['en_cours', 'attente_piece'])
      .is('deleted_at', null);
    const inRepair = new Set((open ?? []).map((e) => e.machine_id));
    const byMachine: Record<string, RentalBadge> = {};
    for (const m of fleet.machines) {
      const st = machineRentalState(list, m.id, now);
      const r = st.state === 'disponible' ? st.next : st.rental;
      byMachine[m.id] = {
        state: st.state,
        late: st.state === 'louee' ? st.late : undefined,
        rentalId: r?.id,
        client: r ? r.client_company || r.client_name : undefined,
        at: r ? (st.state === 'louee' ? r.end_at : r.start_at) : undefined,
        risk: st.state === 'reservee' || (st.state === 'disponible' && st.next) ? inRepair.has(m.id) : undefined,
      };
    }
    rentals = { byMachine, base: '/location' };
  }
  return (
    <FormatProvider locale={locale} country={session.ctx.org.country} currency={session.ctx.org.currency}>
      <CloudGarage session={session.ctx} fleet={fleet} machineId={machineId} rentals={rentals} />
    </FormatProvider>
  );
}

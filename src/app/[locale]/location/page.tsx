// Agenda des locations : machines louées, réservées ou disponibles, départs et retours du jour, réservations.
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { FormatProvider } from '@/components/FormatProvider';
import { Icon } from '@/components/Icons';
import { Planner, type PlannerMachine } from '@/components/site/location/Planner';
import { checkLocale, metaLocale, NO_INDEX } from '@/components/site/seo';
import { AppHeader, SkipLink } from '@/components/site/SiteChrome';
import { getPathname, Link, redirect } from '@/i18n/navigation';
import { pickMessages, type AppMessages } from '@/i18n/messages';
import { rentalEnabled } from '@/lib/billing';
import { can } from '@/lib/domain';
import { getDomainText } from '@/lib/domain-text.server';
import { nowMs } from '@/lib/clock';
import { makeFormat } from '@/lib/format';
import type { Rental } from '@/lib/rental';
import { getSession } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: metaLocale(locale),
    namespace: 'rental',
  });
  return { title: t('title'), robots: NO_INDEX };
}

export default async function LocationPage({ params }: { params: Params }) {
  const locale = checkLocale((await params).locale);
  setRequestLocale(locale);
  const session = await getSession();
  if (session.status === 'anon') {
    return redirect({
      href: `/connexion?suite=${encodeURIComponent(getPathname({ href: '/location', locale }))}`,
      locale,
    });
  }
  if (session.status === 'no-org') return redirect({ href: '/bienvenue', locale });
  const { ctx } = session;
  const t = await getTranslations({ locale, namespace: 'rental' });
  const now = nowMs();
  const nowIso = new Date(now).toISOString();

  if (!rentalEnabled(ctx.org, now)) {
    return (
      <div className="s-page">
        <SkipLink />
        <AppHeader orgName={ctx.org.name} />
        <main id="contenu" className="s-wrap s-rent">
          <section className="s-rent-upsell">
            <Icon name="calendar" />
            <h1>{t('upsell.title')}</h1>
            <p>{t('upsell.text')}</p>
            <ul>
              {(['agenda', 'checks', 'sign', 'pdf'] as const).map((k) => (
                <li key={k}>
                  <Icon name="check" /> {t(`upsell.points.${k}`)}
                </li>
              ))}
            </ul>
            {can.manageTeam(ctx.role) ? (
              <Link href="/parametres#abonnement" className="btn btn-primary">
                {t('upsell.cta')}
              </Link>
            ) : (
              <p className="muted">{t('upsell.askOwner')}</p>
            )}
          </section>
        </main>
      </div>
    );
  }

  const supabase = await supabaseServer();
  const since = new Date(now - 60 * 86_400_000).toISOString();
  const until = new Date(now + 365 * 86_400_000).toISOString();
  const [machines, rentals, clients] = await Promise.all([
    supabase.from('machines').select('id, code, kind, weight_t, brand, model').eq('org_id', ctx.org.id).is('archived_at', null).order('code'),
    supabase
      .from('rentals')
      .select('*')
      .eq('org_id', ctx.org.id)
      .neq('status', 'annulee')
      .lte('start_at', until)
      .or(`end_at.gte.${since},status.eq.en_cours`)
      .order('start_at')
      .limit(3000),
    supabase
      .from('rentals')
      .select('client_company, client_name, client_phone, client_email')
      .eq('org_id', ctx.org.id)
      .order('created_at', { ascending: false })
      .limit(400),
  ]);
  if (machines.error || rentals.error) throw new Error(`Location : lecture impossible (${(machines.error ?? rentals.error)?.code})`);
  const ids = (rentals.data ?? []).map((r) => r.id);
  const checks = ids.length
    ? await supabase.from('rental_checks').select('id, rental_id, kind').in('rental_id', ids)
    : { data: [] as { id: string; rental_id: string; kind: string }[] };

  const f = makeFormat({
    locale,
    country: ctx.org.country,
    currency: ctx.org.currency,
  });
  const dt = await getDomainText(locale, f);
  const list: PlannerMachine[] = (machines.data ?? [])
    .map((m) => ({
      id: m.id,
      code: m.code,
      kind: m.kind,
      title: dt.machineTitle(m),
      make: [m.brand, m.model].filter(Boolean).join(' '),
    }))
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  const checkMap: Record<string, { depart?: string; retour?: string }> = {};
  for (const c of checks.data ?? []) (checkMap[c.rental_id] ??= {})[c.kind as 'depart' | 'retour'] = c.id;
  // Clients déjà servis (propositions dans le formulaire), sans doublon.
  const seen = new Set<string>();
  const known = (clients.data ?? []).filter((c) => {
    const k = `${c.client_company ?? ''}|${c.client_name}`.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const messages = (await getMessages({ locale })) as unknown as AppMessages;
  return (
    <div className="s-page">
      <SkipLink />
      <AppHeader orgName={ctx.org.name} />
      <main id="contenu" className="s-wrap s-rent">
        <NextIntlClientProvider locale={locale} messages={pickMessages(messages, ['common', 'domain', 'rental'])}>
          <FormatProvider locale={locale} country={ctx.org.country} currency={ctx.org.currency}>
            <Planner
              orgId={ctx.org.id}
              orgName={ctx.org.name}
              machines={list}
              rentals={(rentals.data ?? []) as Rental[]}
              checks={checkMap}
              clients={known}
              nowIso={nowIso}
              canManage={can.manageFleet(ctx.role)}
              userId={ctx.userId}
            />
          </FormatProvider>
        </NextIntlClientProvider>
      </main>
    </div>
  );
}

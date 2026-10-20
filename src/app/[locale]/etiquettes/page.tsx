// Étiquettes QR à imprimer (planches A4) : une par machine du parc actif ; le code ouvre la fiche au garage.
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { Labels, type LabelMachine } from '@/components/site/etiquettes/Labels';
import { isUuid } from '@/components/site/nav';
import { checkLocale, metaLocale, NO_INDEX } from '@/components/site/seo';
import { getPathname, redirect } from '@/i18n/navigation';
import type { AppMessages } from '@/i18n/messages';
import { machineMakeModel } from '@/lib/domain';
import { getDomainText } from '@/lib/domain-text.server';
import { siteUrl } from '@/lib/env';
import { makeFormat } from '@/lib/format';
import { machineQrUrl } from '@/lib/qr';
import { getSession } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';

type Params = Promise<{ locale: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: metaLocale(locale), namespace: 'garage.labels' });
  return { title: t('title'), robots: NO_INDEX };
}

/** Machines demandées dans l'adresse (?ids=a,b) : identifiants valables seulement. */
function idsParam(value: string | string[] | undefined): string[] {
  const raw = Array.isArray(value) ? value.join(',') : (value ?? '');
  return raw.split(',').map((s) => s.trim()).filter(isUuid).slice(0, 500);
}

export default async function EtiquettesPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const [{ locale: raw }, query] = await Promise.all([params, searchParams]);
  const locale = checkLocale(raw);
  setRequestLocale(locale);
  const session = await getSession();
  if (session.status === 'anon') {
    const suite = `${getPathname({ href: '/etiquettes', locale })}${typeof query.ids === 'string' ? `?ids=${encodeURIComponent(query.ids)}` : ''}`;
    return redirect({ href: `/connexion?suite=${encodeURIComponent(suite)}`, locale });
  }
  if (session.status === 'no-org') return redirect({ href: '/bienvenue', locale });

  const { org } = session.ctx;
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('machines')
    .select('id, code, kind, weight_t, brand, model')
    .eq('org_id', org.id)
    .is('archived_at', null)
    .order('code');
  if (error) throw new Error(`Étiquettes : machines illisibles (${error.code})`);

  const f = makeFormat({ locale, country: org.country, currency: org.currency });
  const dt = await getDomainText(locale, f);
  const base = siteUrl();
  const machines: LabelMachine[] = (data ?? []).map((m) => ({
    id: m.id,
    code: m.code,
    title: dt.machineTitle(m),
    make: machineMakeModel({ brand: m.brand, model: m.model, year: null }),
    url: machineQrUrl(base, m.id),
  }));
  machines.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

  const messages = (await getMessages({ locale })) as unknown as AppMessages;
  return (
    <NextIntlClientProvider locale={locale} messages={{ garage: { labels: messages.garage.labels } }}>
      <Labels machines={machines} orgName={org.name} initialIds={idsParam(query.ids)} />
    </NextIntlClientProvider>
  );
}

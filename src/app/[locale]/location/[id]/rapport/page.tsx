// Rapport d'une location : états des lieux de départ et de retour côte à côte (points, relevés, photos, frais,
// signatures), lien vers le PDF et renvoi au client. Imprimable.
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { FormatProvider } from '@/components/FormatProvider';
import { ReportView, type ReportCheck } from '@/components/site/location/ReportView';
import { isUuid } from '@/components/site/nav';
import { checkLocale, metaLocale, NO_INDEX } from '@/components/site/seo';
import { AppHeader, SkipLink } from '@/components/site/SiteChrome';
import { getPathname, redirect } from '@/i18n/navigation';
import { pickMessages, type AppMessages } from '@/i18n/messages';
import { rentalEnabled } from '@/lib/billing';
import { nowMs } from '@/lib/clock';
import { getDomainText } from '@/lib/domain-text.server';
import { makeFormat } from '@/lib/format';
import type { CheckKind, Rental, RentalCheck } from '@/lib/rental';
import { getSession } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';

type Params = Promise<{ locale: string; id: string }>;
type Search = Promise<{ ok?: string; missing?: string; pdf?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: metaLocale(locale),
    namespace: 'rental.report',
  });
  return { title: t('title'), robots: NO_INDEX };
}

export default async function ReportPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { locale: raw, id } = await params;
  const q = await searchParams;
  const locale = checkLocale(raw);
  setRequestLocale(locale);
  if (!isUuid(id)) notFound();
  const session = await getSession();
  if (session.status === 'anon') {
    return redirect({
      href: `/connexion?suite=${encodeURIComponent(getPathname({ href: `/location/${id}/rapport`, locale }))}`,
      locale,
    });
  }
  if (session.status === 'no-org') return redirect({ href: '/bienvenue', locale });
  const { ctx } = session;
  if (!rentalEnabled(ctx.org, nowMs())) return redirect({ href: '/location', locale });

  const supabase = await supabaseServer();
  const { data: rental } = await supabase.from('rentals').select('*').eq('id', id).eq('org_id', ctx.org.id).maybeSingle();
  if (!rental) notFound();
  const [{ data: machine }, { data: checks }] = await Promise.all([
    supabase.from('machines').select('id, code, kind, brand, model, weight_t, serial').eq('id', rental.machine_id).single(),
    supabase.from('rental_checks').select('*').eq('rental_id', id),
  ]);
  if (!machine) notFound();
  const byKind = new Map((checks ?? []).map((c) => [c.kind as CheckKind, c as RentalCheck]));
  const ids = (checks ?? []).map((c) => c.id);
  const { data: media } = ids.length
    ? await supabase.from('media').select('id, path, kind, slot, rental_check_id, taken_at').in('rental_check_id', ids).order('taken_at')
    : {
        data: [] as {
          id: string;
          path: string;
          kind: string;
          slot: string | null;
          rental_check_id: string | null;
          taken_at: string;
        }[],
      };

  // Liens signés : photos, vidéos, signatures et PDF.
  const paths = [
    ...(media ?? []).map((m) => m.path),
    ...(checks ?? []).flatMap((c) => [c.client_signature, c.staff_signature, c.report_path, c.terms_path].filter((p): p is string => Boolean(p))),
  ];
  const { data: signed } = paths.length ? await supabase.storage.from('medias').createSignedUrls(paths, 3600) : { data: [] };
  const url = new Map<string, string>();
  for (const s of signed ?? []) if (s.path && s.signedUrl) url.set(s.path, s.signedUrl);

  const f = makeFormat({ locale, country: ctx.org.country, currency: ctx.org.currency });
  const dt = await getDomainText(locale, f);
  const messages = (await getMessages({ locale })) as unknown as AppMessages;
  const view = (c: RentalCheck | undefined): ReportCheck | undefined =>
    c
      ? {
          ...c,
          pdfUrl: c.report_path ? (url.get(c.report_path) ?? null) : null,
          clientSigUrl: c.client_signature ? (url.get(c.client_signature) ?? null) : null,
          staffSigUrl: c.staff_signature ? (url.get(c.staff_signature) ?? null) : null,
          termsUrl: c.terms_path ? (url.get(c.terms_path) ?? null) : null,
          photos: (media ?? [])
            .filter((m) => m.rental_check_id === c.id && m.kind !== 'document' && url.get(m.path))
            .map((m) => ({ id: m.id, kind: m.kind === 'video' ? ('video' as const) : ('photo' as const), slot: m.slot, url: url.get(m.path)! })),
        }
      : undefined;
  const machineLabel = `${machine.code} · ${dt.machineTitle(machine)}${machine.brand || machine.model ? ` · ${[machine.brand, machine.model].filter(Boolean).join(' ')}` : ''}`;

  const okKind = q.ok === 'depart' || q.ok === 'retour' ? q.ok : null;
  const missing = Number(q.missing) || 0;
  return (
    <div className="s-page">
      <SkipLink />
      <AppHeader orgName={ctx.org.name} />
      <main id="contenu" className="s-wrap s-rent">
        <NextIntlClientProvider locale={locale} messages={pickMessages(messages, ['common', 'rental'])}>
          <FormatProvider locale={locale} country={ctx.org.country} currency={ctx.org.currency}>
            <ReportView
              rental={rental as Rental}
              machineKind={machine.kind}
              machineLabel={machineLabel}
              orgName={ctx.org.name}
              depart={view(byKind.get('depart'))}
              retour={view(byKind.get('retour'))}
              notices={{ ok: okKind, missing, pdfFailed: q.pdf === '0' }}
            />
          </FormatProvider>
        </NextIntlClientProvider>
      </main>
    </div>
  );
}

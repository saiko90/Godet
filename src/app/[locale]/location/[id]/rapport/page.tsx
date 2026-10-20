// Rapport d'une location : états des lieux de départ et de retour côte à côte (points, relevés, photos, frais,
// signatures), lien vers le PDF et renvoi au client. Imprimable.
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { FormatProvider } from '@/components/FormatProvider';
import { ReportActions } from '@/components/site/location/ReportActions';
import { isUuid } from '@/components/site/nav';
import { checkLocale, metaLocale, NO_INDEX } from '@/components/site/seo';
import { AppHeader, SkipLink } from '@/components/site/SiteChrome';
import { getPathname, Link, redirect } from '@/i18n/navigation';
import { pickMessages, type AppMessages } from '@/i18n/messages';
import { rentalEnabled } from '@/lib/billing';
import { nowMs } from '@/lib/clock';
import { getDomainText } from '@/lib/domain-text.server';
import { makeFormat } from '@/lib/format';
import { asFuel, checkGroups, type CheckItems, type CheckKind, type Charge, type MediaSlot, type RentalCheck } from '@/lib/rental';
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

const SLOTS: MediaSlot[] = ['avant', 'arriere', 'gauche', 'droite', 'compteur', 'carburant', 'securite', 'verins', 'libre', 'video'];
const asSlot = (s: string | null): MediaSlot => ((SLOTS as string[]).includes(s ?? '') ? (s as MediaSlot) : 'libre');

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

  const t = await getTranslations({ locale, namespace: 'rental' });
  const f = makeFormat({
    locale,
    country: ctx.org.country,
    currency: ctx.org.currency,
  });
  const dt = await getDomainText(locale, f);
  const groups = checkGroups(machine.kind);
  const depart = byKind.get('depart');
  const retour = byKind.get('retour');
  const messages = (await getMessages({ locale })) as unknown as AppMessages;

  const section = (kind: CheckKind, c: RentalCheck | undefined) => {
    const title = t(`report.kind.${kind}`);
    if (!c) {
      const next = (kind === 'depart' && rental.status === 'reservee') || (kind === 'retour' && rental.status === 'en_cours');
      return (
        <section className="s-report-check" aria-label={title}>
          <h2>{title}</h2>
          <p className="muted">{t('report.notDone')}</p>
          {next ? (
            <Link href={`/location/${id}/${kind}`} className="btn btn-primary">
              {t('report.doIt')}
            </Link>
          ) : null}
        </section>
      );
    }
    const items = (c.items ?? {}) as unknown as CheckItems;
    const before = kind === 'retour' && depart ? ((depart.items ?? {}) as unknown as CheckItems) : null;
    const charges = (Array.isArray(c.charges) ? c.charges : []) as unknown as Charge[];
    const total = charges.reduce((s, x) => s + (Number(x.amount) || 0), 0);
    const fuel = asFuel(c.fuel_level);
    const mine = (media ?? []).filter((m) => m.rental_check_id === c.id && m.kind !== 'document');
    const worked = kind === 'retour' && depart?.hours != null && c.hours != null ? Number(c.hours) - Number(depart.hours) : null;
    const facts: [string, string][] = [
      [t('report.hours'), c.hours != null ? f.hours(Number(c.hours)) : '—'],
      ...(worked != null ? ([[t('report.worked'), f.hours(worked)]] as [string, string][]) : []),
      ...(fuel ? ([[t('report.fuel'), t(`check.fuelLevels.${fuel}`)]] as [string, string][]) : []),
      [t('report.accident'), c.accident ? `${t('check.yes')}${c.accident_note ? ` · ${c.accident_note}` : ''}` : t('check.no')],
      ...(c.safety_valid != null
        ? ([[t('report.safety'), `${c.safety_valid ? t('check.valid') : t('check.invalid')}${c.safety_until ? ` · ${f.date(c.safety_until)}` : ''}`]] as [
            string,
            string,
          ][])
        : []),
      ...(c.accessories ? ([[t('report.accessories'), c.accessories]] as [string, string][]) : []),
      ...(c.keys_count != null ? ([[t('report.keys'), String(c.keys_count)]] as [string, string][]) : []),
      ...(c.reserves != null ? ([[t('report.reserves'), c.reserves ? t('check.withReserves') : t('check.noReserves')]] as [string, string][]) : []),
      ...(c.remarks ? ([[t('report.remarks'), c.remarks]] as [string, string][]) : []),
      ...(c.breakdown ? ([[t('report.breakdown'), `${t('report.breakdownYes')}${c.breakdown_note ? ` · ${c.breakdown_note}` : ''}`]] as [string, string][]) : []),
      ...(c.terms_accepted && !(c.terms_path && url.get(c.terms_path)) ? ([[t('report.terms'), t('report.termsAccepted')]] as [string, string][]) : []),
    ];
    const pdf = c.report_path ? url.get(c.report_path) : null;
    return (
      <section className="s-report-check" aria-label={title}>
        <div>
          <h2>{title}</h2>
          <p className="muted">
            {t('report.at', { date: f.dateTime(c.created_at) })} ·{' '}
            {c.staff_signer
              ? t('report.by', {
                  client: c.client_signer,
                  staff: c.staff_signer,
                })
              : t('report.byClient', { client: c.client_signer })}
          </p>
          <p className="muted">
            {c.emailed_at && rental.client_email
              ? t('report.sent', {
                  email: rental.client_email,
                  date: f.dateTime(c.emailed_at),
                })
              : t('report.notSent')}
          </p>
        </div>
        <ReportActions checkId={c.id} kind={kind} pdfUrl={pdf ?? null} canEmail={Boolean(rental.client_email)} />

        <table className="s-report-table">
          <thead>
            <tr>
              <th scope="col">{t('report.item')}</th>
              <th scope="col">{t('report.result')}</th>
            </tr>
          </thead>
          <tbody>
            {groups.flatMap((g) =>
              g.items.map((k) => {
                const v = items[k];
                const worse = before && before[k] && before[k].state !== 'defaut' && v?.state === 'defaut';
                return (
                  <tr key={k}>
                    <td>{t(`items.${k}`)}</td>
                    <td className={v ? `is-${v.state}` : undefined}>
                      {v ? t(`check.states.${v.state}`) : '—'}
                      {worse ? ` · ${t('report.worse')}` : ''}
                      {v?.comment ? ` · ${v.comment}` : ''}
                    </td>
                  </tr>
                );
              }),
            )}
          </tbody>
        </table>

        <dl className="s-rent-dl">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
          {c.terms_path && url.get(c.terms_path) ? (
            <div>
              <dt>{t('report.terms')}</dt>
              <dd>
                {t('report.termsAccepted')} ·{' '}
                <a href={url.get(c.terms_path)} target="_blank" rel="noopener noreferrer">
                  {t('report.termsLink')}
                </a>
              </dd>
            </div>
          ) : null}
          {c.lat != null && c.lng != null ? (
            <div>
              <dt>{t('report.position')}</dt>
              <dd>
                <a href={`https://www.openstreetmap.org/?mlat=${c.lat}&mlon=${c.lng}#map=17/${c.lat}/${c.lng}`} target="_blank" rel="noopener noreferrer">
                  {t('report.map')}
                </a>
              </dd>
            </div>
          ) : null}
        </dl>

        {charges.length ? (
          <>
            <h3>{t('report.charges')}</h3>
            <table className="s-report-table">
              <tbody>
                {charges.map((x, i) => (
                  <tr key={i}>
                    <td>{x.label}</td>
                    <td className="num">{f.money2(Number(x.amount) || 0)}</td>
                  </tr>
                ))}
                <tr>
                  <th scope="row">{t('report.total')}</th>
                  <td className="num">
                    <b>{f.money2(total)}</b>
                  </td>
                </tr>
              </tbody>
            </table>
          </>
        ) : null}

        {mine.length ? (
          <>
            <h3>{t('report.photos')}</h3>
            <div className="s-report-photos">
              {mine.map((m) => {
                const src = url.get(m.path);
                if (!src) return null;
                const label = t(`check.slots.${asSlot(m.slot)}`);
                return (
                  <figure key={m.id}>
                    {m.kind === 'video' ? (
                      <video src={src} controls preload="metadata" playsInline />
                    ) : (
                      <a href={src} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element -- lien signé du stockage */}
                        <img src={src} alt={label} loading="lazy" />
                      </a>
                    )}
                    <figcaption>{label}</figcaption>
                  </figure>
                );
              })}
            </div>
          </>
        ) : null}

        <h3>{t('report.signatures')}</h3>
        <div className="s-report-signs">
          {c.client_signature && url.get(c.client_signature) ? (
            <figure>
              {/* eslint-disable-next-line @next/next/no-img-element -- lien signé du stockage */}
              <img src={url.get(c.client_signature)} alt={t('check.clientSignature')} />
              <figcaption>{c.client_signer}</figcaption>
            </figure>
          ) : null}
          {c.staff_signature && url.get(c.staff_signature) ? (
            <figure>
              {/* eslint-disable-next-line @next/next/no-img-element -- lien signé du stockage */}
              <img src={url.get(c.staff_signature)} alt={t('check.staffSignature')} />
              <figcaption>
                {c.staff_signer} · {ctx.org.name}
              </figcaption>
            </figure>
          ) : null}
        </div>
      </section>
    );
  };

  const okKind = q.ok === 'depart' || q.ok === 'retour' ? q.ok : null;
  const missing = Number(q.missing) || 0;
  return (
    <div className="s-page">
      <SkipLink />
      <AppHeader orgName={ctx.org.name} />
      <main id="contenu" className="s-wrap s-rent">
        <NextIntlClientProvider locale={locale} messages={pickMessages(messages, ['common', 'rental'])}>
          <FormatProvider locale={locale} country={ctx.org.country} currency={ctx.org.currency}>
            <div className="s-report">
              <div className="s-report-bar">
                <Link href="/location" className="btn btn-ghost s-btn-sm">
                  ← {t('report.back')}
                </Link>
                <ReportActions print />
              </div>
              {okKind ? (
                <p className="s-report-notice" role="status">
                  {t(`report.ok.${okKind}`)}
                </p>
              ) : null}
              {missing ? <p className="s-report-notice is-warn">{t('report.missing', { count: missing })}</p> : null}
              {q.pdf === '0' ? <p className="s-report-notice is-warn">{t('report.pdfFailed')}</p> : null}
              <header>
                <p className="eyebrow">
                  {machine.code} · {dt.machineTitle(machine)}
                  {machine.brand || machine.model ? ` · ${[machine.brand, machine.model].filter(Boolean).join(' ')}` : ''}
                </p>
                <h1 className="s-report-title">{t('report.title')}</h1>
                <p className="muted">
                  {[rental.client_company, rental.client_name].filter(Boolean).join(' · ')} · {f.dateTime(rental.start_at)} → {f.dateTime(rental.end_at)}
                  {rental.site ? ` · ${rental.site}` : ''}
                </p>
              </header>
              {section('depart', depart)}
              {section('retour', retour)}
            </div>
          </FormatProvider>
        </NextIntlClientProvider>
      </main>
    </div>
  );
}

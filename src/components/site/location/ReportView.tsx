'use client';

// Rapport d'une location (compte et démonstration) : états des lieux de départ et de retour (points, relevés, photos,
// frais, signatures), PDF et renvoi au client. Les liens (photos, signatures, PDF) sont fournis prêts à afficher.
import { useTranslations } from 'next-intl';
import { useFormat } from '@/components/FormatProvider';
import { Link } from '@/i18n/navigation';
import { asFuel, checkGroups, type Charge, type CheckItems, type CheckKind, type MediaSlot, type Rental, type RentalCheck } from '@/lib/rental';
import type { MachineKind } from '@/lib/types';
import { useRentalBackend } from './backend';
import { ReportActions } from './ReportActions';

export interface ReportCheck extends RentalCheck {
  pdfUrl: string | null;
  clientSigUrl: string | null;
  staffSigUrl: string | null;
  termsUrl: string | null;
  photos: { id: string; kind: 'photo' | 'video'; slot: string | null; url: string }[];
}

const SLOTS: MediaSlot[] = ['avant', 'arriere', 'gauche', 'droite', 'compteur', 'carburant', 'securite', 'verins', 'libre', 'video'];
const asSlot = (s: string | null): MediaSlot => ((SLOTS as string[]).includes(s ?? '') ? (s as MediaSlot) : 'libre');

export function ReportView({
  rental,
  machineKind,
  machineLabel,
  orgName,
  depart,
  retour,
  notices,
}: {
  rental: Rental;
  machineKind: MachineKind;
  machineLabel: string;
  orgName: string;
  depart?: ReportCheck;
  retour?: ReportCheck;
  notices: { ok: CheckKind | null; missing: number; pdfFailed: boolean };
}) {
  const t = useTranslations('rental');
  const f = useFormat();
  const backend = useRentalBackend();
  const groups = checkGroups(machineKind);

  const section = (kind: CheckKind, c: ReportCheck | undefined) => {
    const title = t(`report.kind.${kind}`);
    if (!c) {
      const next = (kind === 'depart' && rental.status === 'reservee') || (kind === 'retour' && rental.status === 'en_cours');
      return (
        <section className="s-report-check" aria-label={title}>
          <h2>{title}</h2>
          <p className="muted">{t('report.notDone')}</p>
          {next ? (
            <Link href={`${backend.base}/${rental.id}/${kind}`} className="btn btn-primary">
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
    const worked = kind === 'retour' && depart?.hours != null && c.hours != null ? Number(c.hours) - Number(depart.hours) : null;
    const facts: [string, string][] = [[t('report.hours'), c.hours != null ? f.hours(Number(c.hours)) : '—']];
    if (worked != null) facts.push([t('report.worked'), f.hours(worked)]);
    if (fuel) facts.push([t('report.fuel'), t(`check.fuelLevels.${fuel}`)]);
    facts.push([t('report.accident'), c.accident ? `${t('check.yes')}${c.accident_note ? ` · ${c.accident_note}` : ''}` : t('check.no')]);
    if (c.safety_valid != null) facts.push([t('report.safety'), `${c.safety_valid ? t('check.valid') : t('check.invalid')}${c.safety_until ? ` · ${f.date(c.safety_until)}` : ''}`]);
    if (c.accessories) facts.push([t('report.accessories'), c.accessories]);
    if (c.keys_count != null) facts.push([t('report.keys'), String(c.keys_count)]);
    if (c.reserves != null) facts.push([t('report.reserves'), c.reserves ? t('check.withReserves') : t('check.noReserves')]);
    if (c.remarks) facts.push([t('report.remarks'), c.remarks]);
    if (c.breakdown) facts.push([t('report.breakdown'), `${t('report.breakdownYes')}${c.breakdown_note ? ` · ${c.breakdown_note}` : ''}`]);
    if (c.terms_accepted && !c.termsUrl) facts.push([t('report.terms'), t('report.termsAccepted')]);

    return (
      <section className="s-report-check" aria-label={title}>
        <div>
          <h2>{title}</h2>
          <p className="muted">
            {t('report.at', { date: f.dateTime(c.created_at) })} ·{' '}
            {c.staff_signer ? t('report.by', { client: c.client_signer, staff: c.staff_signer }) : t('report.byClient', { client: c.client_signer })}
          </p>
          {backend.demo ? (
            <p className="muted">{t('demo.noEmail')}</p>
          ) : (
            <p className="muted">
              {c.emailed_at && rental.client_email ? t('report.sent', { email: rental.client_email, date: f.dateTime(c.emailed_at) }) : t('report.notSent')}
            </p>
          )}
        </div>
        {backend.demo ? null : <ReportActions checkId={c.id} kind={kind} pdfUrl={c.pdfUrl} canEmail={Boolean(rental.client_email)} />}

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
          {c.termsUrl ? (
            <div>
              <dt>{t('report.terms')}</dt>
              <dd>
                {t('report.termsAccepted')} ·{' '}
                <a href={c.termsUrl} target="_blank" rel="noopener noreferrer">
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

        {c.photos.length ? (
          <>
            <h3>{t('report.photos')}</h3>
            <div className="s-report-photos">
              {c.photos.map((m) => {
                const label = t(`check.slots.${asSlot(m.slot)}`);
                return (
                  <figure key={m.id}>
                    {m.kind === 'video' ? (
                      <video src={m.url} controls preload="metadata" playsInline />
                    ) : (
                      <a href={m.url} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element -- lien signé ou local */}
                        <img src={m.url} alt={label} loading="lazy" />
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
          {c.clientSigUrl ? (
            <figure>
              {/* eslint-disable-next-line @next/next/no-img-element -- lien signé ou local */}
              <img src={c.clientSigUrl} alt={t('check.clientSignature')} />
              <figcaption>{c.client_signer}</figcaption>
            </figure>
          ) : null}
          {c.staffSigUrl ? (
            <figure>
              {/* eslint-disable-next-line @next/next/no-img-element -- lien signé ou local */}
              <img src={c.staffSigUrl} alt={t('check.staffSignature')} />
              <figcaption>
                {c.staff_signer} · {orgName}
              </figcaption>
            </figure>
          ) : null}
        </div>
      </section>
    );
  };

  return (
    <div className="s-report">
      <div className="s-report-bar">
        <Link href={backend.base} className="btn btn-ghost s-btn-sm">
          ← {t('report.back')}
        </Link>
        <ReportActions print />
      </div>
      {notices.ok ? (
        <p className="s-report-notice" role="status">
          {t(`report.ok.${notices.ok}`)}
        </p>
      ) : null}
      {notices.missing ? <p className="s-report-notice is-warn">{t('report.missing', { count: notices.missing })}</p> : null}
      {notices.pdfFailed ? <p className="s-report-notice is-warn">{t('report.pdfFailed')}</p> : null}
      <header>
        <p className="eyebrow">{machineLabel}</p>
        <h1 className="s-report-title">{t('report.title')}</h1>
        <p className="muted">
          {[rental.client_company, rental.client_name].filter(Boolean).join(' · ')} · {f.dateTime(rental.start_at)} → {f.dateTime(rental.end_at)}
          {rental.site ? ` · ${rental.site}` : ''}
        </p>
      </header>
      {section('depart', depart)}
      {section('retour', retour)}
    </div>
  );
}

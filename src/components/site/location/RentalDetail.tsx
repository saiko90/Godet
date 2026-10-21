'use client';

// Détail d'une location : client, dates, chantier ; état des lieux de départ ou de retour ; rapports ;
// modification et annulation d'une réservation.
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { useFormat } from '@/components/FormatProvider';
import { Icon } from '@/components/Icons';
import { Link } from '@/i18n/navigation';
import { transportOf, type Rental, type TransportLegKey } from '@/lib/rental';
import { useRentalBackend } from './backend';
import { Dialog } from './Dialog';
import { Truck } from './MachineCard';
import type { PlannerMachine } from './Planner';

export function RentalDetail({
  rental: r,
  machine,
  repair,
  onTransport,
  checks,
  canEdit,
  now,
  onClose,
  onEdit,
  onChanged,
}: {
  rental: Rental;
  machine: PlannerMachine | undefined;
  /** Réparation ouverte sur la machine (réservation à venir) : avertissement. */
  repair: { title: string; date: string } | null;
  /** Ouvre le formulaire de transport sur le trajet choisi. */
  onTransport: (leg: TransportLegKey) => void;
  checks: { depart?: string; retour?: string };
  canEdit: boolean;
  now: number;
  onClose: () => void;
  onEdit: () => void;
  onChanged: () => void;
}) {
  const t = useTranslations('rental');
  const f = useFormat();
  const uid = useId();
  const backend = useRentalBackend();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const late = r.status === 'en_cours' && Date.parse(r.end_at) < now;

  async function cancel() {
    if (!window.confirm(t('detail.confirmCancel'))) return;
    setBusy(true);
    const code = await backend.cancelRental(r.id);
    setBusy(false);
    if (code) return setError(t(`errors.${code}`));
    onChanged();
  }


  const rows: [string, string | null][] = [
    [t('detail.client'), [r.client_company, r.client_name].filter(Boolean).join(' · ')],
    [t('detail.phone'), r.client_phone],
    [t('detail.email'), r.client_email],
    [t('detail.site'), r.site],
    [t('detail.delivery'), t(`form.deliveries.${r.delivery as 'livraison' | 'enlevement'}`)],
    [t('detail.planned'), `${f.dateTime(r.start_at)} → ${f.dateTime(r.end_at)}`],
    [t('detail.out'), r.out_at ? f.dateTime(r.out_at) : null],
    [t('detail.back'), r.back_at ? f.dateTime(r.back_at) : null],
    [t('detail.notes'), r.notes],
  ];

  return (
    <Dialog labelledBy={`${uid}-h`} onClose={onClose}>
      <div className="s-rent-detail">
        <p className="eyebrow">
          {machine?.code} · {machine?.title}
        </p>
        <h2 id={`${uid}-h`}>{r.client_company || r.client_name}</h2>
        <p className={`s-rent-pill is-${late ? 'late' : r.status === 'reservee' ? 'reservee' : r.status === 'en_cours' ? 'louee' : 'done'}`}>
          {late ? t('status.late') : t(`status.${r.status as 'reservee' | 'en_cours' | 'terminee' | 'annulee'}`)}
        </p>
        {repair ? (
          <p className="s-rent-warn" role="alert">
            <Icon name="alert" /> {t('detail.risk', { repair: repair.title })}
          </p>
        ) : null}
        <dl className="s-rent-dl">
          {rows
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
        </dl>

        {r.delivery === 'livraison' && r.status !== 'annulee' ? (
          <section className="s-transport-sum" aria-label={t('transport.title')}>
            <h3>{t('transport.title')}</h3>
            <ul>
              {(['out', 'back'] as const).map((leg) => {
                const l = transportOf(r)[leg];
                const finished = (leg === 'out' && r.status !== 'reservee') || r.status === 'terminee';
                return (
                  <li key={leg} className={l?.done ? 'is-done' : finished ? 'is-past' : ''}>
                    <Truck label="" done={Boolean(l?.done)} />
                    <span>
                      <b>{t(`transport.${leg}`)}</b>
                      {l?.done
                        ? ` · ${[l.carrier, l.at ? f.dateTime(l.at) : null].filter(Boolean).join(' · ')}`
                        : ` · ${t('transport.statusTodo')}`}
                      {l?.note ? <em> · {l.note}</em> : null}
                    </span>
                    {!finished || l ? (
                      <button type="button" className="btn btn-soft s-btn-sm" onClick={() => onTransport(leg)}>
                        {l ? t('transport.edit') : t('transport.organize')}
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <div className="s-rent-actions">
          {r.status === 'reservee' ? (
            <Link href={`${backend.base}/${r.id}/depart`} className="btn btn-primary">
              <Icon name="check" />
              {t('actions.checkOut')}
            </Link>
          ) : null}
          {r.status === 'en_cours' ? (
            <Link href={`${backend.base}/${r.id}/retour`} className="btn btn-primary">
              <Icon name="check" />
              {t('actions.checkIn')}
            </Link>
          ) : null}
          {checks.depart || checks.retour ? (
            <Link href={`${backend.base}/${r.id}/rapport`} className="btn btn-soft">
              <Icon name="file" />
              {t('actions.report')}
            </Link>
          ) : null}
          {canEdit && (r.status === 'reservee' || r.status === 'en_cours') ? (
            <button type="button" className="btn btn-soft" onClick={onEdit} disabled={busy}>
              <Icon name="edit" />
              {r.status === 'en_cours' ? t('actions.extend') : t('actions.edit')}
            </button>
          ) : null}
          {canEdit && r.status === 'reservee' ? (
            <button type="button" className="btn btn-ghost" onClick={() => void cancel()} disabled={busy}>
              <Icon name="close" />
              {t('actions.cancel')}
            </button>
          ) : null}
        </div>
        {error ? (
          <p className="err" role="alert">
            {error}
          </p>
        ) : null}
        <button type="button" className="btn btn-ghost s-rent-close" onClick={onClose}>
          {t('actions.close')}
        </button>
      </div>
    </Dialog>
  );
}

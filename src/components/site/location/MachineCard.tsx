'use client';

// Fiche rapide d'une machine depuis l'agenda : état, compteur, réparations ouvertes, échéances à surveiller,
// location en cours ou prochaine ; liens vers la fiche complète du garage et vers une nouvelle réservation.
// Aussi : le petit camion rouge des locations livrées sur le chantier (transport à organiser).
import { useTranslations } from 'next-intl';
import { useId } from 'react';
import { useFormat } from '@/components/FormatProvider';
import { Icon } from '@/components/Icons';
import { Link } from '@/i18n/navigation';
import type { MachineRentalState } from '@/lib/rental';
import type { MachineQuickInfo } from '@/lib/rental-machine-info';
import { useRentalBackend } from './backend';
import { Dialog } from './Dialog';
import type { PlannerMachine } from './Planner';

/** Camion rouge : la machine est livrée (ou reprise) sur le chantier, le transport est à organiser. */
export function Truck({ label }: { label: string }) {
  return (
    <span className="s-rent-truck" title={label || undefined} aria-label={label || undefined} role={label ? 'img' : undefined}>
      <Icon name="truck" />
    </span>
  );
}

export function MachineCard({
  machine,
  info,
  state,
  repairing,
  onClose,
  onBook,
}: {
  machine: PlannerMachine | undefined;
  info: MachineQuickInfo | undefined;
  state: MachineRentalState | undefined;
  repairing: boolean;
  onClose: () => void;
  onBook: () => void;
}) {
  const t = useTranslations('rental');
  const f = useFormat();
  const uid = useId();
  const backend = useRentalBackend();
  if (!machine) return null;
  const rental = state?.state === 'disponible' ? state.next : state?.rental;
  const health = info?.health ?? (repairing ? 'warn' : 'ok');

  return (
    <Dialog labelledBy={`${uid}-h`} onClose={onClose}>
      <div className="s-rent-card">
        <p className="eyebrow">{machine.make || machine.title}</p>
        <h2 id={`${uid}-h`}>
          {machine.code} · {machine.title}
        </h2>
        <div className="s-rent-card-pills">
          <span className={`s-rent-pill is-health-${health}`}>
            <Icon name={health === 'ok' ? 'check' : 'alert'} /> {info?.healthLabel ?? t(health === 'ok' ? 'card.ok' : 'state.repair')}
          </span>
          {state ? (
            <span className={`s-rent-pill is-${state.state === 'louee' && state.late ? 'late' : state.state}`}>{t(`state.${state.state}`)}</span>
          ) : null}
          {info ? (
            <span className="s-rent-pill is-done">
              <Icon name="clock" /> {f.hours(info.hours)}
            </span>
          ) : null}
        </div>

        {rental ? (
          <p className="s-rent-card-line">
            {state?.state === 'louee'
              ? t('card.out', { client: rental.client_company || rental.client_name, date: f.dateTime(rental.end_at) })
              : t('card.next', { client: rental.client_company || rental.client_name, date: f.dateTime(rental.start_at) })}
            {rental.delivery === 'livraison' ? (
              <>
                {' '}
                <Truck label={t('form.deliveries.livraison')} />
              </>
            ) : null}
          </p>
        ) : null}

        <section aria-labelledby={`${uid}-r`}>
          <h3 id={`${uid}-r`}>{t('card.repairs')}</h3>
          {info?.repairs.length ? (
            <ul className="s-rent-card-list">
              {info.repairs.map((r, i) => (
                <li key={i} className="is-bad">
                  <b>{r.title}</b>
                  <span>
                    {[r.status, t('card.since', { date: f.date(r.date) })].filter(Boolean).join(' · ')}
                  </span>
                  {r.details ? <span className="muted">{r.details}</span> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">{t('card.noRepair')}</p>
          )}
        </section>

        <section aria-labelledby={`${uid}-d`}>
          <h3 id={`${uid}-d`}>{t('card.dues')}</h3>
          {info?.dues.length ? (
            <ul className="s-rent-card-list">
              {info.dues.map((d, i) => (
                <li key={i} className={`is-${d.state}`}>
                  <b>{d.label}</b>
                  <span>{d.text}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">{t('card.noDue')}</p>
          )}
        </section>

        <div className="s-rent-actions">
          <Link href={`${backend.garage}?m=${machine.id}`} className="btn btn-primary">
            <Icon name="wrench" />
            {t('card.sheet')}
          </Link>
          <button type="button" className="btn btn-soft" onClick={onBook}>
            <Icon name="plus" />
            {t('card.book')}
          </button>
        </div>
        <button type="button" className="btn btn-ghost s-rent-close" onClick={onClose}>
          {t('actions.close')}
        </button>
      </div>
    </Dialog>
  );
}

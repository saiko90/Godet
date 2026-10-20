'use client';

// Détail d'une location : client, dates, chantier ; état des lieux de départ ou de retour ; rapports ;
// modification et annulation d'une réservation.
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { useFormat } from '@/components/FormatProvider';
import { Icon } from '@/components/Icons';
import { Link } from '@/i18n/navigation';
import { rentalErrorCode, type Rental } from '@/lib/rental';
import { supabaseBrowser } from '@/lib/supabase/client';
import { Dialog } from './Dialog';
import type { PlannerMachine } from './Planner';

export function RentalDetail({
  rental: r,
  machine,
  checks,
  canEdit,
  now,
  onClose,
  onEdit,
  onChanged,
}: {
  rental: Rental;
  machine: PlannerMachine | undefined;
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const late = r.status === 'en_cours' && Date.parse(r.end_at) < now;

  async function cancel() {
    if (!window.confirm(t('detail.confirmCancel'))) return;
    setBusy(true);
    const { error: dbError } = await supabaseBrowser().from('rentals').update({ status: 'annulee' }).eq('id', r.id).select('id').single();
    setBusy(false);
    if (dbError) return setError(t(`errors.${rentalErrorCode(dbError)}`));
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

        <div className="s-rent-actions">
          {r.status === 'reservee' ? (
            <Link href={`/location/${r.id}/depart`} className="btn btn-primary">
              <Icon name="check" />
              {t('actions.checkOut')}
            </Link>
          ) : null}
          {r.status === 'en_cours' ? (
            <Link href={`/location/${r.id}/retour`} className="btn btn-primary">
              <Icon name="check" />
              {t('actions.checkIn')}
            </Link>
          ) : null}
          {checks.depart || checks.retour ? (
            <Link href={`/location/${r.id}/rapport`} className="btn btn-soft">
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

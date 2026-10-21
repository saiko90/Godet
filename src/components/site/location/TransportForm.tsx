'use client';

// Transport d'une location livrée sur le chantier : aller (livraison) et retour (reprise). Transporteur ou chauffeur,
// passage prévu, remarque, et « transport confirmé » qui fait passer le camion de l'agenda du rouge au vert.
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { useFormat } from '@/components/FormatProvider';
import { Icon } from '@/components/Icons';
import { transportOf, type Rental, type Transport, type TransportLeg, type TransportLegKey } from '@/lib/rental';
import { useRentalBackend } from './backend';
import { Dialog } from './Dialog';
import { Truck } from './MachineCard';

const pad = (n: number) => String(n).padStart(2, '0');
/** Valeur d'un champ « date et heure » locale. */
function localInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface LegDraft {
  carrier: string;
  at: string;
  note: string;
  done: boolean;
}

const draftOf = (leg: TransportLeg | undefined, fallback: string): LegDraft => ({
  carrier: leg?.carrier ?? '',
  at: localInput(leg?.at ?? fallback),
  note: leg?.note ?? '',
  done: Boolean(leg?.done),
});

export function TransportForm({
  rental,
  machineCode,
  focus,
  carriers,
  onClose,
  onSaved,
}: {
  rental: Rental;
  machineCode: string;
  /** Trajet mis en avant (celui sur lequel on a cliqué). */
  focus: TransportLegKey;
  /** Transporteurs déjà utilisés (propositions). */
  carriers: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations('rental.transport');
  const te = useTranslations('rental.errors');
  const f = useFormat();
  const uid = useId();
  const backend = useRentalBackend();
  const current = transportOf(rental);
  const [legs, setLegs] = useState<Record<TransportLegKey, LegDraft>>(() => ({
    out: draftOf(current.out, rental.start_at),
    back: draftOf(current.back, rental.end_at),
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const order: TransportLegKey[] = focus === 'back' ? ['back', 'out'] : ['out', 'back'];
  const set = (leg: TransportLegKey, patch: Partial<LegDraft>) => setLegs((cur) => ({ ...cur, [leg]: { ...cur[leg], ...patch } }));

  async function save() {
    for (const leg of order) {
      if (legs[leg].done && !legs[leg].carrier.trim()) return setError(t('errors.carrier'));
    }
    setBusy(true);
    const next: Transport = {};
    for (const leg of ['out', 'back'] as const) {
      const d = legs[leg];
      if (!d.carrier.trim() && !d.note.trim() && !d.done) continue;
      next[leg] = {
        carrier: d.carrier.trim().slice(0, 120),
        at: d.at ? new Date(d.at).toISOString() : null,
        note: d.note.trim().slice(0, 500),
        done: d.done,
      };
    }
    const code = await backend.saveTransport(rental.id, next);
    setBusy(false);
    if (code) return setError(te(code));
    onSaved();
  }

  return (
    <Dialog labelledBy={`${uid}-h`} onClose={onClose} wide>
      <form
        className="s-rent-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy) void save();
        }}
      >
        <p className="eyebrow">
          {machineCode} · {rental.client_company || rental.client_name}
          {rental.site ? ` · ${rental.site}` : ''}
        </p>
        <h2 id={`${uid}-h`}>{t('title')}</h2>
        <datalist id={`${uid}-carriers`}>
          {carriers.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        {order.map((leg) => {
          const d = legs[leg];
          return (
            <fieldset key={leg} className={`s-rent-fieldset s-transport-leg${d.done ? ' is-done' : ''}`}>
              <legend>
                <Truck label="" done={d.done} /> {t(leg)} · {f.dateTime(leg === 'out' ? rental.start_at : rental.end_at)}
              </legend>
              <div className="s-row">
                <div className="field">
                  <label htmlFor={`${uid}-${leg}-c`}>{t('carrier')}</label>
                  <input
                    id={`${uid}-${leg}-c`}
                    list={`${uid}-carriers`}
                    maxLength={120}
                    placeholder={t('carrierPlaceholder')}
                    value={d.carrier}
                    onChange={(e) => set(leg, { carrier: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor={`${uid}-${leg}-a`}>{t('at')}</label>
                  <input id={`${uid}-${leg}-a`} type="datetime-local" value={d.at} onChange={(e) => set(leg, { at: e.target.value })} />
                </div>
              </div>
              <div className="field">
                <label htmlFor={`${uid}-${leg}-n`}>{t('note')}</label>
                <input id={`${uid}-${leg}-n`} maxLength={500} placeholder={t('notePlaceholder')} value={d.note} onChange={(e) => set(leg, { note: e.target.value })} />
              </div>
              <label className="s-transport-done">
                <input type="checkbox" checked={d.done} onChange={(e) => set(leg, { done: e.target.checked })} />
                <span>{t('done')}</span>
              </label>
            </fieldset>
          );
        })}
        {error ? (
          <p className="err" role="alert">
            {error}
          </p>
        ) : null}
        <div className="dialog-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            {t('cancel')}
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            <Icon name="check" />
            {busy ? t('saving') : t('save')}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

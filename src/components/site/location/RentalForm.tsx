'use client';

// Réservation : machine, client (avec les clients déjà servis), chantier, livraison ou enlèvement, dates.
// Création ou modification ; la base refuse une machine déjà réservée ou louée sur la période.
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { Icon } from '@/components/Icons';
import { rentalErrorCode, rentalRow, type Rental, type RentalInput } from '@/lib/rental';
import { supabaseBrowser } from '@/lib/supabase/client';
import { Dialog } from './Dialog';
import type { PlannerMachine } from './Planner';

export interface ClientSuggestion {
  client_company: string | null;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
}

const pad = (n: number) => String(n).padStart(2, '0');
/** Valeur d'un champ « date et heure » locale : 2026-10-21T07:00. */
function localInput(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function atHour(day: number, h: number): number {
  const d = new Date(day);
  d.setHours(h, 0, 0, 0);
  return d.getTime();
}

export function RentalForm({
  orgId,
  machines,
  rentals,
  clients,
  repairs,
  rental,
  machineId,
  day,
  onClose,
  onSaved,
}: {
  orgId: string;
  machines: PlannerMachine[];
  rentals: Rental[];
  clients: ClientSuggestion[];
  repairs: Record<string, { title: string; date: string }>;
  rental?: Rental;
  machineId?: string;
  day?: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations('rental.form');
  const te = useTranslations('rental.errors');
  const uid = useId();
  const [v, setV] = useState<RentalInput>(() => {
    const startDay = day ?? Date.now();
    return {
      machineId: rental?.machine_id ?? machineId ?? machines[0]?.id ?? '',
      clientCompany: rental?.client_company ?? '',
      clientName: rental?.client_name ?? '',
      clientPhone: rental?.client_phone ?? '',
      clientEmail: rental?.client_email ?? '',
      site: rental?.site ?? '',
      delivery: (rental?.delivery as RentalInput['delivery']) ?? 'enlevement',
      startAt: rental ? localInput(Date.parse(rental.start_at)) : localInput(atHour(startDay, 7)),
      endAt: rental ? localInput(Date.parse(rental.end_at)) : localInput(atHour(startDay + 86_400_000, 17)),
      notes: rental?.notes ?? '',
    };
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof RentalInput>(k: K, value: RentalInput[K]) => {
    setV((cur) => ({ ...cur, [k]: value }));
    setError(null);
  };

  // Chevauchement vu d'avance (la base le refuse de toute façon).
  const s = Date.parse(v.startAt);
  const e = Date.parse(v.endAt);
  const clash = rentals.find(
    (r) =>
      r.id !== rental?.id &&
      r.machine_id === v.machineId &&
      (r.status === 'reservee' || r.status === 'en_cours') &&
      Date.parse(r.start_at) < e &&
      Date.parse(r.end_at) > s,
  );

  /** Client choisi dans la liste : on complète les autres champs. */
  function pickClient(name: string) {
    const c = clients.find((x) => (x.client_company ? `${x.client_company} · ${x.client_name}` : x.client_name) === name);
    if (!c) return false;
    setV((cur) => ({
      ...cur,
      clientCompany: c.client_company ?? '',
      clientName: c.client_name,
      clientPhone: c.client_phone ?? cur.clientPhone,
      clientEmail: c.client_email ?? cur.clientEmail,
    }));
    return true;
  }

  async function save() {
    if (!v.clientName.trim()) return setError(te('clientName'));
    if (!(e > s)) return setError(te('dates'));
    if (v.clientEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.clientEmail.trim())) return setError(te('email'));
    setBusy(true);
    const db = supabaseBrowser();
    const row = rentalRow(v);
    const { error: dbError } = rental
      ? await db.from('rentals').update(row).eq('id', rental.id).select('id').single()
      : await db
          .from('rentals')
          .insert({ ...row, org_id: orgId })
          .select('id')
          .single();
    setBusy(false);
    if (dbError) {
      console.error('[location] réservation :', dbError.code, dbError.message);
      return setError(te(rentalErrorCode(dbError)));
    }
    onSaved();
  }

  return (
    <Dialog labelledBy={`${uid}-h`} onClose={onClose} wide>
      <form
        className="s-rent-form"
        noValidate
        onSubmit={(ev) => {
          ev.preventDefault();
          if (!busy) void save();
        }}
      >
        <h2 id={`${uid}-h`}>{rental ? t('titleEdit') : t('titleNew')}</h2>

        <div className="field">
          <label htmlFor={`${uid}-m`}>{t('machine')}</label>
          <select
            id={`${uid}-m`}
            value={v.machineId}
            onChange={(ev) => set('machineId', ev.target.value)}
            disabled={Boolean(rental && rental.status !== 'reservee')}
          >
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.code} · {m.title}
                {m.make ? ` · ${m.make}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="s-row">
          <div className="field">
            <label htmlFor={`${uid}-s`}>{t('start')}</label>
            <input
              id={`${uid}-s`}
              type="datetime-local"
              value={v.startAt}
              onChange={(ev) => set('startAt', ev.target.value)}
              disabled={Boolean(rental?.out_at)}
            />
          </div>
          <div className="field">
            <label htmlFor={`${uid}-e`}>{t('end')}</label>
            <input id={`${uid}-e`} type="datetime-local" value={v.endAt} onChange={(ev) => set('endAt', ev.target.value)} />
          </div>
        </div>
        {repairs[v.machineId] ? (
          <p className="s-rent-warn" role="status">
            <Icon name="alert" /> {t('risk', { repair: repairs[v.machineId].title })}
          </p>
        ) : null}
        {clash ? (
          <p className="s-rent-warn" role="status">
            <Icon name="alert" /> {t('clash', { client: clash.client_company || clash.client_name })}
          </p>
        ) : null}

        <fieldset className="s-rent-fieldset">
          <legend>{t('client')}</legend>
          {clients.length ? (
            <div className="field">
              <label htmlFor={`${uid}-k`}>{t('known')}</label>
              <input
                id={`${uid}-k`}
                list={`${uid}-kl`}
                placeholder={t('knownPlaceholder')}
                onChange={(ev) => {
                  if (pickClient(ev.target.value)) ev.target.value = '';
                }}
              />
              <datalist id={`${uid}-kl`}>
                {clients.map((c, i) => (
                  <option key={i} value={c.client_company ? `${c.client_company} · ${c.client_name}` : c.client_name} />
                ))}
              </datalist>
            </div>
          ) : null}
          <div className="s-row">
            <div className="field">
              <label htmlFor={`${uid}-co`}>{t('company')}</label>
              <input
                id={`${uid}-co`}
                autoComplete="organization"
                maxLength={120}
                value={v.clientCompany}
                onChange={(ev) => set('clientCompany', ev.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor={`${uid}-n`}>{t('name')}</label>
              <input id={`${uid}-n`} autoComplete="name" maxLength={120} required value={v.clientName} onChange={(ev) => set('clientName', ev.target.value)} />
            </div>
          </div>
          <div className="s-row">
            <div className="field">
              <label htmlFor={`${uid}-p`}>{t('phone')}</label>
              <input
                id={`${uid}-p`}
                type="tel"
                autoComplete="tel"
                maxLength={40}
                value={v.clientPhone}
                onChange={(ev) => set('clientPhone', ev.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor={`${uid}-em`}>{t('email')}</label>
              <input
                id={`${uid}-em`}
                type="email"
                autoComplete="email"
                maxLength={200}
                value={v.clientEmail}
                onChange={(ev) => set('clientEmail', ev.target.value)}
              />
              <p className="s-field-hint">{t('emailHint')}</p>
            </div>
          </div>
        </fieldset>

        <div className="field">
          <label htmlFor={`${uid}-si`}>{t('site')}</label>
          <input id={`${uid}-si`} maxLength={300} value={v.site} onChange={(ev) => set('site', ev.target.value)} placeholder={t('sitePlaceholder')} />
        </div>
        <div className="s-rent-radios" role="radiogroup" aria-label={t('delivery')}>
          {(['enlevement', 'livraison'] as const).map((d) => (
            <label key={d}>
              <input type="radio" name={`${uid}-d`} checked={v.delivery === d} onChange={() => set('delivery', d)} />
              {t(`deliveries.${d}`)}
            </label>
          ))}
        </div>
        <div className="field">
          <label htmlFor={`${uid}-no`}>{t('notes')}</label>
          <textarea id={`${uid}-no`} rows={2} maxLength={2000} value={v.notes} onChange={(ev) => set('notes', ev.target.value)} />
        </div>

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
            {busy ? t('saving') : rental ? t('saveEdit') : t('save')}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

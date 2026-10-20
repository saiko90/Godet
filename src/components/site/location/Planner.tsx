'use client';

// Agenda des locations : une ligne par machine, une colonne par jour ; barres des réservations (pointillés), des
// locations en cours (pleines, rouges en retard) et terminées. Clic sur une case vide : nouvelle réservation ;
// clic sur une barre : détail, état des lieux de départ ou de retour, modification, annulation.
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { useFormat } from '@/components/FormatProvider';
import { Icon } from '@/components/Icons';
import { Link, useRouter } from '@/i18n/navigation';
import { machineRentalState, type Rental } from '@/lib/rental';
import type { MachineKind } from '@/lib/types';
import { RentalDetail } from './RentalDetail';
import { RentalForm, type ClientSuggestion } from './RentalForm';

export interface PlannerMachine {
  id: string;
  code: string;
  kind: MachineKind;
  title: string;
  make: string;
}

const DAY = 86_400_000;
const startOfDay = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
const addDays = (t: number, n: number) => {
  const d = new Date(t);
  d.setDate(d.getDate() + n);
  return d.getTime();
};

export function Planner({
  orgId,
  orgName,
  machines,
  rentals,
  checks,
  clients,
  nowIso,
  canManage,
  userId,
}: {
  orgId: string;
  orgName: string;
  machines: PlannerMachine[];
  rentals: Rental[];
  checks: Record<string, { depart?: string; retour?: string }>;
  clients: ClientSuggestion[];
  nowIso: string;
  canManage: boolean;
  userId: string;
}) {
  const t = useTranslations('rental');
  const f = useFormat();
  const router = useRouter();
  const now = Date.parse(nowIso);
  const today = startOfDay(now);
  const [from, setFrom] = useState(() => addDays(today, -2));
  const [span, setSpan] = useState(21);
  const [open, setOpen] = useState<string | null>(null);
  const [form, setForm] = useState<{
    rental?: Rental;
    machineId?: string;
    day?: number;
  } | null>(null);
  const days = useMemo(() => Array.from({ length: span }, (_, i) => addDays(from, i)), [from, span]);
  const to = addDays(from, span);

  const byMachine = useMemo(() => {
    const map = new Map<string, Rental[]>();
    for (const r of rentals) {
      if (r.status === 'annulee') continue;
      const list = map.get(r.machine_id) ?? [];
      list.push(r);
      map.set(r.machine_id, list);
    }
    return map;
  }, [rentals]);

  const states = useMemo(() => new Map(machines.map((m) => [m.id, machineRentalState(rentals, m.id, now)])), [machines, rentals, now]);
  const counts = { louee: 0, reservee: 0, disponible: 0 };
  for (const s of states.values()) counts[s.state] += 1;
  const departures = rentals.filter((r) => r.status === 'reservee' && startOfDay(Date.parse(r.start_at)) <= today);
  const returns = rentals.filter((r) => r.status === 'en_cours' && startOfDay(Date.parse(r.end_at)) <= today);
  const late = returns.filter((r) => Date.parse(r.end_at) < now);

  const machineOf = (id: string) => machines.find((m) => m.id === id);
  const selected = open ? rentals.find((r) => r.id === open) : undefined;

  /** Position d'une barre dans la fenêtre (en fraction de jours), ou null si hors de la fenêtre. */
  const place = (r: Rental) => {
    const s = Date.parse(r.out_at ?? r.start_at);
    const e = r.status === 'en_cours' ? Math.max(Date.parse(r.end_at), now) : Date.parse(r.back_at ?? r.end_at);
    if (e <= from || s >= to) return null;
    const left = (Math.max(s, from) - from) / DAY;
    const right = (Math.min(e, to) - from) / DAY;
    return { left, width: Math.max(right - left, 0.18) };
  };

  return (
    <div className="s-rent-planner">
      <div className="s-rent-head">
        <div>
          <p className="eyebrow">{orgName}</p>
          <h1>{t('title')}</h1>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setForm({})}>
          <Icon name="plus" />
          {t('newBooking')}
        </button>
      </div>

      <ul className="s-rent-kpis">
        <li className="is-out">
          <b>{f.num(counts.louee)}</b>
          {t('kpi.out', { count: counts.louee })}
        </li>
        <li className="is-booked">
          <b>{f.num(counts.reservee)}</b>
          {t('kpi.booked', { count: counts.reservee })}
        </li>
        <li className="is-free">
          <b>{f.num(counts.disponible)}</b>
          {t('kpi.free', { count: counts.disponible })}
        </li>
        {late.length ? (
          <li className="is-late">
            <b>{f.num(late.length)}</b>
            {t('kpi.late', { count: late.length })}
          </li>
        ) : null}
      </ul>

      {departures.length || returns.length ? (
        <section className="s-rent-today" aria-labelledby="rent-today">
          <h2 id="rent-today">{t('today.title')}</h2>
          <ul>
            {departures.map((r) => (
              <li key={r.id}>
                <span className="s-rent-dot is-booked" aria-hidden="true" />
                <span>
                  <b>{machineOf(r.machine_id)?.code}</b> ·{' '}
                  {t('today.departure', {
                    client: r.client_company || r.client_name,
                    time: f.dateTime(r.start_at),
                  })}
                </span>
                <Link href={`/location/${r.id}/depart`} className="btn btn-primary s-btn-sm">
                  {t('actions.checkOut')}
                </Link>
              </li>
            ))}
            {returns.map((r) => (
              <li key={r.id}>
                <span className={`s-rent-dot ${Date.parse(r.end_at) < now ? 'is-late' : 'is-out'}`} aria-hidden="true" />
                <span>
                  <b>{machineOf(r.machine_id)?.code}</b> ·{' '}
                  {Date.parse(r.end_at) < now
                    ? t('today.late', {
                        client: r.client_company || r.client_name,
                        time: f.dateTime(r.end_at),
                      })
                    : t('today.return', {
                        client: r.client_company || r.client_name,
                        time: f.dateTime(r.end_at),
                      })}
                </span>
                <Link href={`/location/${r.id}/retour`} className="btn btn-soft s-btn-sm">
                  {t('actions.checkIn')}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="s-rent-nav">
        <button type="button" className="btn btn-soft s-btn-sm" onClick={() => setFrom((v) => addDays(v, -7))} aria-label={t('nav.prev')}>
          <Icon name="chevron-left" />
        </button>
        <button type="button" className="btn btn-soft s-btn-sm" onClick={() => setFrom(addDays(today, -2))}>
          {t('nav.today')}
        </button>
        <button type="button" className="btn btn-soft s-btn-sm" onClick={() => setFrom((v) => addDays(v, 7))} aria-label={t('nav.next')}>
          <Icon name="chevron-right" />
        </button>
        <span className="s-rent-range">
          {f.date(new Date(from).toISOString())} – {f.date(new Date(addDays(to, -1)).toISOString())}
        </span>
        <div className="s-rent-span" role="radiogroup" aria-label={t('nav.span')}>
          {[14, 21, 42].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={span === n} className={span === n ? 'is-on' : ''} onClick={() => setSpan(n)}>
              {t('nav.days', { count: n })}
            </button>
          ))}
        </div>
      </div>

      <div className="s-rent-legend" aria-hidden="true">
        <span>
          <i className="is-booked" /> {t('legend.booked')}
        </span>
        <span>
          <i className="is-out" /> {t('legend.out')}
        </span>
        <span>
          <i className="is-late" /> {t('legend.late')}
        </span>
        <span>
          <i className="is-done" /> {t('legend.done')}
        </span>
      </div>

      {machines.length === 0 ? (
        <p className="muted">{t('noMachines')}</p>
      ) : (
        <div className="s-rent-scroll" role="region" aria-label={t('gridLabel')} tabIndex={0}>
          <div className="s-rent-grid" style={{ ['--days' as string]: span }}>
            <div className="s-rent-corner" />
            {days.map((d) => {
              const date = new Date(d);
              const weekend = date.getDay() === 0 || date.getDay() === 6;
              return (
                <div key={d} className={`s-rent-day${d === today ? ' is-today' : ''}${weekend ? ' is-weekend' : ''}`}>
                  <span>{date.toLocaleDateString(f.tag, { weekday: 'short' })}</span>
                  <b>{date.getDate()}</b>
                </div>
              );
            })}
            {machines.map((m) => {
              const st = states.get(m.id)!;
              const list = byMachine.get(m.id) ?? [];
              return (
                <div key={m.id} className="s-rent-row" role="group" aria-label={`${m.code} · ${t(`state.${st.state}`)}`}>
                  <div className="s-rent-machine">
                    <b>{m.code}</b>
                    <span>{m.title}</span>
                    <span className={`s-rent-pill is-${st.state === 'louee' && st.late ? 'late' : st.state}`}>{t(`state.${st.state}`)}</span>
                  </div>
                  <div className="s-rent-track">
                    {days.map((d, i) => {
                      const date = new Date(d);
                      const weekend = date.getDay() === 0 || date.getDay() === 6;
                      return (
                        <button
                          key={d}
                          type="button"
                          className={`s-rent-cell${weekend ? ' is-weekend' : ''}${d === today ? ' is-today' : ''}`}
                          style={{ gridColumn: i + 1 }}
                          aria-label={t('cellLabel', {
                            code: m.code,
                            date: f.date(date.toISOString()),
                          })}
                          onClick={() => setForm({ machineId: m.id, day: d })}
                        />
                      );
                    })}
                    {list.map((r) => {
                      const p = place(r);
                      if (!p) return null;
                      const lateBar = r.status === 'en_cours' && Date.parse(r.end_at) < now;
                      const kind = r.status === 'reservee' ? 'booked' : r.status === 'en_cours' ? (lateBar ? 'late' : 'out') : 'done';
                      return (
                        <button
                          key={r.id}
                          type="button"
                          className={`s-rent-bar is-${kind}`}
                          style={{
                            left: `calc(${p.left} * var(--col))`,
                            width: `calc(${p.width} * var(--col))`,
                          }}
                          onClick={() => setOpen(r.id)}
                          title={`${r.client_company || r.client_name} · ${f.dateTime(r.start_at)} → ${f.dateTime(r.end_at)}`}
                        >
                          <span>{r.client_company || r.client_name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selected ? (
        <RentalDetail
          rental={selected}
          machine={machineOf(selected.machine_id)}
          checks={checks[selected.id] ?? {}}
          canEdit={canManage || selected.created_by === userId}
          now={now}
          onClose={() => setOpen(null)}
          onEdit={() => {
            setOpen(null);
            setForm({ rental: selected });
          }}
          onChanged={() => {
            setOpen(null);
            router.refresh();
          }}
        />
      ) : null}

      {form ? (
        <RentalForm
          orgId={orgId}
          machines={machines}
          rentals={rentals}
          clients={clients}
          rental={form.rental}
          machineId={form.machineId}
          day={form.day}
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

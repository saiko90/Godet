'use client';

// Contenu des onglets de la fiche machine : Aperçu, Carnet, Réparations, Pièces, Coûts, Échéances.
// (Médias : MediaTab.tsx.) Les données viennent du dossier de la machine ; les actions passent par le contexte.
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { useFormat } from '@/components/FormatProvider';
import { Icon } from '@/components/Icons';
import {
  can,
  DEFAULT_WEEKLY_RATE,
  duesOf,
  ENTRY_KINDS,
  entryCost,
  isOpenRepair,
  REPAIR_STATUS,
  weeklyRate,
  type DueInfo,
  type MachineHealth,
} from '@/lib/domain';
import { daysBetween } from '@/lib/format';
import type { Entry, EntryKind, Machine, MachineFile, RepairStatus } from '@/lib/types';
import { useDomainText } from '@/lib/use-domain-text';
import { CostChart } from './CostChart';
import { useGarage } from './context';
import { useErrorText } from './errors';
import { canEditEntry, costWindowStart, kindForSchedule, machineStats } from './helpers';
import { MediaPreview } from './MediaPreview';
import { useGarageText } from './text';

function Kpi({ label, value, small }: { label: string; value: string; small?: string }) {
  return (
    <div className="kpi">
      <span>{label}</span>
      <b>{value}</b>
      {small ? <small>{small}</small> : null}
    </div>
  );
}

function Empty({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="empty">
      <b>{title}</b>
      <span>{children}</span>
      {action}
    </div>
  );
}

const live = (entries: Entry[]) => entries.filter((e) => !e.deleted_at);
const bold = (chunks: React.ReactNode) => <b>{chunks}</b>;

// ------------------------------------------------------------------ échéance (jauge)

export function DueGauge({ due, children }: { due: DueInfo; children?: React.ReactNode }) {
  const t = useTranslations('garage');
  const f = useFormat();
  const dt = useDomainText();
  const gt = useGarageText();
  const s = due.schedule;
  const { flash } = useGarage();
  const pct = due.progress != null ? Math.round(due.progress * 100) : null;
  const text = dt.dueText(due);
  const last = s.last_date
    ? s.basis === 'heures' && s.last_hours != null
      ? t('due.lastHours', { date: f.date(s.last_date), hours: f.hours(Number(s.last_hours)) })
      : t('due.last', { date: f.date(s.last_date) })
    : null;
  return (
    <section className={`gauge g-due${flash === s.id ? ' g-flash' : ''}`} aria-label={t('due.aria', { label: s.label, text })}>
      <div className="gauge-top">
        <b>{s.label}</b>
        <span className={`pill ${due.state}`}>{text}</span>
      </div>
      {pct != null ? (
        <div
          className={`bar${due.state === 'ok' ? ' ok' : ''}${due.state === 'bad' ? ' g-bar-bad' : ''}`}
          role="img"
          aria-label={t('due.elapsed', { pct: String(pct) })}
        >
          <i style={{ width: `${Math.max(2, pct)}%` }} />
        </div>
      ) : null}
      <p className="muted">{dt.dueHint(due)}</p>
      <p className="g-due-meta">{[t('due.meta', { target: gt.target(s), interval: gt.interval(s) }), last].filter(Boolean).join(' · ')}</p>
      {children}
    </section>
  );
}

// ------------------------------------------------------------------ saisie du carnet

function EntryItem({ entry, file, compact = false }: { entry: Entry; file: MachineFile; compact?: boolean }) {
  const t = useTranslations('garage');
  const tc = useTranslations('common');
  const f = useFormat();
  const dt = useDomainText();
  const gt = useGarageText();
  const { role, userId, openModal, openLightbox, flash } = useGarage();
  const removed = Boolean(entry.deleted_at);
  const cost = entryCost(entry);
  const media = file.media.filter((m) => m.entry_id === entry.id && m.kind !== 'document');
  const docs = file.media.filter((m) => m.entry_id === entry.id && m.kind === 'document');
  const editable = !removed && !compact && canEditEntry(role, userId, entry);
  const meta = [
    dt.entry(entry.kind),
    f.date(entry.date),
    entry.hours != null ? f.hours(Number(entry.hours)) : null,
    entry.performed_by,
    entry.kind === 'reparation' && entry.repair_status && entry.repair_status !== 'fait' ? gt.repairInline(entry.repair_status) : null,
    entry.kind === 'piece' && entry.part_ref ? t('entry.ref', { ref: entry.part_ref }) : null,
  ].filter(Boolean);

  return (
    <li className={`tl g-tl${removed ? ' is-removed' : ''}${flash === entry.id ? ' new' : ''}`}>
      <span className={`tl-icon k-${entry.kind}`} aria-hidden="true">
        <Icon name={ENTRY_KINDS[entry.kind].icon} />
      </span>
      <div className="tl-main">
        <div className="tl-head">
          <b>
            {removed ? <span className="g-sr">{t('entry.removedSr')}</span> : null}
            {entry.title}
          </b>
          {cost > 0 ? <span className="cost">{f.money(cost)}</span> : null}
        </div>
        <div className="tl-meta">{meta.join(' · ')}</div>
        {entry.details && !compact ? <p>{entry.details}</p> : null}
        {media.length && !compact ? (
          <div className="tl-photos">
            {media.map((m) => (
              <button
                key={m.id}
                type="button"
                className="g-thumb"
                onClick={() => openLightbox(entry.machine_id, m.id)}
                aria-label={m.kind === 'video' ? t('entry.openVideo', { title: entry.title }) : t('entry.openPhoto', { title: entry.title })}
              >
                <MediaPreview item={m} />
              </button>
            ))}
          </div>
        ) : null}
        {docs.length && !compact ? (
          <p className="g-tl-docs">
            <Icon name="file" /> {t('entry.docs', { count: docs.length, n: f.num(docs.length) })}
          </p>
        ) : null}
        {removed ? (
          <p className="g-removed">
            {entry.delete_reason
              ? t('entry.removedOnReason', { date: f.date(entry.deleted_at), reason: entry.delete_reason })
              : t('entry.removedOn', { date: f.date(entry.deleted_at) })}
          </p>
        ) : null}
        {editable ? (
          <div className="g-tl-actions">
            <button
              type="button"
              className="g-link-btn"
              onClick={() => openModal({ type: 'entry', machineId: entry.machine_id, entryId: entry.id })}
            >
              <Icon name="edit" />
              {tc('actions.edit')}
            </button>
            <button
              type="button"
              className="g-link-btn"
              onClick={() => openModal({ type: 'remove-entry', machineId: entry.machine_id, entryId: entry.id })}
            >
              <Icon name="trash" />
              {t('entry.remove')}
            </button>
          </div>
        ) : null}
      </div>
    </li>
  );
}

// ------------------------------------------------------------------ Aperçu

export function OverviewTab({ machine, file, health }: { machine: Machine; file: MachineFile; health: MachineHealth | undefined }) {
  const t = useTranslations('garage');
  const f = useFormat();
  const dt = useDomainText();
  const { today, openModal, setTab } = useGarage();
  const stats = useMemo(() => machineStats(machine, file.entries, file.readings, today), [machine, file, today]);
  const rate = weeklyRate(file.readings, machine.id);
  const dues = duesOf(machine, file.schedules, rate, today);
  const next = dues[0] ?? null;
  const open = live(file.entries).filter(isOpenRepair);
  const recent = live(file.entries).slice(0, 3);

  return (
    <div className="stack fade-in">
      <section className="kpis" aria-label={t('overview.kpis')}>
        <Kpi label={t('overview.meter')} value={f.hours(Number(machine.hours))} small={t('overview.readOn', { date: f.date(machine.hours_at) })} />
        <Kpi
          label={t('overview.costPerHour')}
          value={stats.costPerHour != null ? f.money2(stats.costPerHour) : '—'}
          small={
            stats.costPerHour != null
              ? t('overview.costPerHourSmall', { hours: f.hours(Math.round(stats.worked ?? 0)) })
              : t('overview.notEnoughReadings')
          }
        />
        <Kpi label={t('overview.cost12')} value={f.money(stats.totals.total)} small={t('overview.cost12Small')} />
        <Kpi
          label={t('overview.availability')}
          value={stats.availability != null ? t('overview.percent', { pct: String(Math.round(stats.availability * 100)) }) : '—'}
          small={stats.downtime ? t('overview.downtime', { hours: f.hours(stats.downtime) }) : t('overview.noDowntime')}
        />
      </section>

      {next ? (
        <div>
          <h3>{t('overview.nextDue')}</h3>
          <DueGauge due={next}>
            <div className="g-due-actions">
              <button
                type="button"
                className="btn btn-soft g-btn-sm"
                onClick={() =>
                  openModal({
                    type: 'entry',
                    machineId: machine.id,
                    scheduleId: next.schedule.id,
                    kind: kindForSchedule(next.schedule.label),
                  })
                }
              >
                <Icon name="check" />
                {t('due.markDone')}
              </button>
              <button type="button" className="g-link-btn" onClick={() => setTab('echeances')}>
                {t('overview.allDues', { count: String(dues.length) })}
              </button>
            </div>
          </DueGauge>
          {rate ? <p className="g-note">{t('overview.rate', { rate: f.num(rate, rate < 10 ? 1 : 0) })}</p> : null}
        </div>
      ) : null}

      {open.length ? (
        <section>
          <h3>{t('overview.openRepairs', { count: open.length })}</h3>
          <div className="cards">
            {open.map((r) => {
              const days = Math.max(0, daysBetween(r.date, today));
              const status = r.repair_status ?? 'en_cours';
              return (
                <button key={r.id} type="button" className="card g-card-btn" onClick={() => setTab('reparations')}>
                  <span className="card-top">
                    <b>{r.title}</b>
                    <span className={`pill ${REPAIR_STATUS[status].state}`}>{dt.repair(status)}</span>
                  </span>
                  <span className="tl-meta">{t('overview.since', { date: f.date(r.date), count: days, n: f.num(days) })}</span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <section>
        <h3>{t('overview.recent')}</h3>
        {recent.length ? (
          <ol className="timeline">
            {recent.map((e) => (
              <EntryItem key={e.id} entry={e} file={file} compact />
            ))}
          </ol>
        ) : (
          <Empty
            title={t('overview.emptyTitle')}
            action={
              <button
                type="button"
                className="btn btn-primary g-btn-sm"
                onClick={() => openModal({ type: 'entry', machineId: machine.id })}
              >
                <Icon name="plus" />
                {t('overview.emptyAction')}
              </button>
            }
          >
            {t('overview.emptyText')}
          </Empty>
        )}
        {recent.length ? (
          <button type="button" className="g-link-btn g-more" onClick={() => setTab('carnet')}>
            {t('overview.allLog', { count: String(live(file.entries).length) })}
          </button>
        ) : null}
      </section>

      {machine.notes ? (
        <section>
          <h3>{t('overview.notes')}</h3>
          <p className="g-notes">{machine.notes}</p>
        </section>
      ) : null}

      {health && health.alerts === 0 && !open.length ? (
        <p className="g-ok-line">
          <Icon name="check" /> {t('overview.allClear')}
        </p>
      ) : null}

      <p className="law">{t.rich('overview.law', { b: bold })}</p>
    </div>
  );
}

// ------------------------------------------------------------------ Carnet

type LogFilter = 'tout' | EntryKind;

export function LogbookTab({ machine, file }: { machine: Machine; file: MachineFile }) {
  const t = useTranslations('garage');
  const f = useFormat();
  const dt = useDomainText();
  const { openModal } = useGarage();
  const [filter, setFilter] = useState<LogFilter>('tout');
  const counts = useMemo(() => {
    const c = new Map<EntryKind, number>();
    for (const e of live(file.entries)) c.set(e.kind, (c.get(e.kind) ?? 0) + 1);
    return c;
  }, [file.entries]);
  const kinds = (Object.keys(ENTRY_KINDS) as EntryKind[]).filter((k) => counts.get(k));
  const items = file.entries.filter((e) => filter === 'tout' || e.kind === filter);
  const total = live(file.entries).length;
  const removed = file.entries.length - total;

  if (!file.entries.length) {
    return (
      <div className="stack fade-in">
        <Empty
          title={t('logbook.emptyTitle')}
          action={
            <button type="button" className="btn btn-primary g-btn-sm" onClick={() => openModal({ type: 'entry', machineId: machine.id })}>
              <Icon name="plus" />
              {t('logbook.emptyAction')}
            </button>
          }
        >
          {t('logbook.emptyText')}
        </Empty>
      </div>
    );
  }

  const shown = items.filter((e) => !e.deleted_at).length;
  const heading = t('logbook.heading', { title: filter === 'tout' ? t('logbook.title') : dt.entry(filter), count: shown, n: f.num(shown) });

  return (
    <div className="stack fade-in">
      <div className="seg g-filter" role="group" aria-label={t('logbook.filter')}>
        <button type="button" aria-pressed={filter === 'tout'} onClick={() => setFilter('tout')}>
          {t('logbook.all')} <span className="g-count">{total}</span>
        </button>
        {kinds.map((k) => (
          <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}>
            {dt.entry(k)} <span className="g-count">{counts.get(k)}</span>
          </button>
        ))}
      </div>
      <section aria-live="polite">
        <h3>
          {removed && filter === 'tout' ? `${heading} · ${t('logbook.removed', { count: removed, n: f.num(removed) })}` : heading}
        </h3>
        {items.length ? (
          <ol className="timeline">
            {items.map((e) => (
              <EntryItem key={e.id} entry={e} file={file} />
            ))}
          </ol>
        ) : (
          <p className="muted">{t('logbook.noneOfKind')}</p>
        )}
      </section>
    </div>
  );
}

// ------------------------------------------------------------------ Réparations

const STATUS_ORDER: RepairStatus[] = ['en_cours', 'attente_piece', 'fait'];

function RepairCard({ repair, file }: { repair: Entry; file: MachineFile }) {
  const t = useTranslations('garage');
  const f = useFormat();
  const dt = useDomainText();
  const gt = useGarageText();
  const errorText = useErrorText();
  const { role, userId, repo, refresh, toast, effect, animate, flash } = useGarage();
  const [busy, setBusy] = useState(false);
  const status = repair.repair_status ?? 'fait';
  const editable = canEditEntry(role, userId, repair);
  const photos = file.media.filter((m) => m.entry_id === repair.id && m.kind !== 'document').length;

  async function setStatus(next: RepairStatus) {
    if (next === status || busy) return;
    setBusy(true);
    try {
      await repo().updateEntry(repair.id, { repairStatus: next });
      await refresh(repair.machine_id);
      toast(next === 'fait' ? t('repairs.done', { title: repair.title }) : t('repairs.status', { status: gt.repairInline(next) }));
      effect('save');
      if (next === 'fait') animate(repair.machine_id, 'repair');
    } catch (e) {
      toast(errorText(e, 'status'), 'error');
      effect('alert');
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className={`card${flash === repair.id ? ' new' : ''}`} aria-busy={busy || undefined}>
      <div className="card-top">
        <b>{repair.title}</b>
        <span className={`pill ${REPAIR_STATUS[status].state}`}>{dt.repair(status)}</span>
      </div>
      <div className="tl-meta">
        {[
          f.date(repair.date),
          repair.hours != null ? f.hours(Number(repair.hours)) : null,
          repair.performed_by,
          photos ? t('repairs.photos', { count: photos, n: f.num(photos) }) : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      </div>
      {repair.details ? <p>{repair.details}</p> : null}
      <dl>
        <div>
          <dt>{t('repairs.downtime')}</dt>
          <dd>{repair.downtime_hours ? f.hours(Number(repair.downtime_hours)) : '—'}</dd>
        </div>
        <div>
          <dt>{t('repairs.parts')}</dt>
          <dd>{f.money(Number(repair.cost_parts))}</dd>
        </div>
        <div>
          <dt>{t('repairs.labour')}</dt>
          <dd>{f.money(Number(repair.cost_labour))}</dd>
        </div>
        <div>
          <dt>{status === 'fait' ? t('repairs.total') : t('repairs.toDate')}</dt>
          <dd>{f.money(entryCost(repair))}</dd>
        </div>
      </dl>
      {editable ? (
        <div className="g-status" role="group" aria-label={t('repairs.statusGroup', { title: repair.title })}>
          {STATUS_ORDER.map((s) => (
            <button key={s} type="button" aria-pressed={status === s} disabled={busy} onClick={() => setStatus(s)}>
              {dt.repair(s)}
            </button>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function RepairsTab({ machine, file }: { machine: Machine; file: MachineFile }) {
  const t = useTranslations('garage');
  const f = useFormat();
  const { openModal, today } = useGarage();
  const repairs = live(file.entries)
    .filter((e) => e.kind === 'reparation')
    .sort((a, b) => Number(!isOpenRepair(a)) - Number(!isOpenRepair(b)) || b.date.localeCompare(a.date));
  const start = costWindowStart(today);
  const year = repairs.filter((r) => r.date >= start);
  const cost = year.reduce((s, r) => s + entryCost(r), 0);
  const down = year.reduce((s, r) => s + Number(r.downtime_hours || 0), 0);
  const open = repairs.filter(isOpenRepair).length;
  const summary = t('repairs.summary', { count: year.length, n: f.num(year.length), cost: f.money(cost), down: f.hours(down) });

  return (
    <div className="stack fade-in">
      <div className="g-tab-head">
        <p className="muted">
          {repairs.length
            ? open
              ? `${summary} · ${t('repairs.summaryOpen', { count: open, n: String(open) })}`
              : summary
            : t('repairs.none')}
        </p>
        <button
          type="button"
          className="btn btn-soft g-btn-sm"
          onClick={() => openModal({ type: 'entry', machineId: machine.id, kind: 'reparation' })}
        >
          <Icon name="plus" />
          {t('repairs.add')}
        </button>
      </div>
      {repairs.length ? (
        <section className="cards" aria-label={t('repairs.list')}>
          {repairs.map((r) => (
            <RepairCard key={r.id} repair={r} file={file} />
          ))}
        </section>
      ) : (
        <Empty title={t('repairs.emptyTitle')}>{t('repairs.emptyText')}</Empty>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ Pièces

export function PartsTab({ machine, file }: { machine: Machine; file: MachineFile }) {
  const t = useTranslations('garage');
  const f = useFormat();
  const { openModal, today, flash } = useGarage();
  const parts = live(file.entries).filter((e) => e.kind === 'piece');
  const total = parts.reduce((s, p) => s + entryCost(p), 0);
  const start = costWindowStart(today);
  const year = parts.filter((p) => p.date >= start).reduce((s, p) => s + entryCost(p), 0);

  return (
    <div className="stack fade-in">
      <div className="g-tab-head">
        <p className="muted">
          {parts.length ? t('parts.summary', { count: parts.length, n: f.num(parts.length), cost: f.money(year) }) : t('parts.none')}
        </p>
        <button
          type="button"
          className="btn btn-soft g-btn-sm"
          onClick={() => openModal({ type: 'entry', machineId: machine.id, kind: 'piece' })}
        >
          <Icon name="plus" />
          {t('parts.add')}
        </button>
      </div>
      {parts.length ? (
        <div className="table-wrap" tabIndex={0} role="region" aria-label={t('parts.region')}>
          <table className="g-parts">
            <caption className="g-sr">{t('parts.caption', { code: machine.code })}</caption>
            <thead>
              <tr>
                <th scope="col">{t('parts.date')}</th>
                <th scope="col">{t('parts.part')}</th>
                <th scope="col">{t('parts.ref')}</th>
                <th scope="col" className="r">
                  {t('parts.qty')}
                </th>
                <th scope="col">{t('parts.supplier')}</th>
                <th scope="col" className="r">
                  {t('parts.price')}
                </th>
                <th scope="col">{t('parts.warranty')}</th>
              </tr>
            </thead>
            <tbody>
              {parts.map((p) => {
                const valid = p.warranty_until ? p.warranty_until >= today : null;
                return (
                  <tr key={p.id} className={flash === p.id ? 'new' : undefined}>
                    <td className="nowrap">{f.date(p.date)}</td>
                    <td>{p.title}</td>
                    <td className="mono nowrap">{p.part_ref || '—'}</td>
                    <td className="r">
                      {p.part_qty != null ? f.num(Number(p.part_qty), Number.isInteger(Number(p.part_qty)) ? 0 : 2) : '—'}
                    </td>
                    <td>{p.supplier || '—'}</td>
                    <td className="r">{f.money(entryCost(p))}</td>
                    <td className="nowrap">
                      {p.warranty_until ? (
                        <>
                          {f.date(p.warranty_until)}{' '}
                          <span className={`pill ${valid ? '' : 'muted'} g-pill-xs`}>{valid ? t('parts.valid') : t('parts.expired')}</span>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5}>{t('parts.total')}</td>
                <td className="r">{f.money(total)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <Empty title={t('parts.emptyTitle')}>{t('parts.emptyText')}</Empty>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ Coûts

export function CostsTab({ machine, file }: { machine: Machine; file: MachineFile }) {
  const t = useTranslations('garage');
  const f = useFormat();
  const dt = useDomainText();
  const { today } = useGarage();
  const stats = useMemo(() => machineStats(machine, file.entries, file.readings, today), [machine, file, today]);
  const totals = stats.totals;
  const pct = (v: number) => (totals.total ? t('costs.share', { pct: String(Math.round((v / totals.total) * 100)) }) : '');
  const open = live(file.entries).filter(isOpenRepair);
  const first = stats.months[0];
  const last = stats.months[stats.months.length - 1];

  if (!totals.total) {
    return (
      <div className="stack fade-in">
        <Empty title={t('costs.emptyTitle')}>{t('costs.emptyText')}</Empty>
      </div>
    );
  }

  return (
    <div className="stack fade-in">
      <section className="kpis">
        <Kpi
          label={t('costs.total12')}
          value={f.money(totals.total)}
          small={t('costs.range', { from: f.month(first.ym), to: f.month(last.ym), year: last.ym.slice(0, 4) })}
        />
        <Kpi
          label={t('costs.costPerHour')}
          value={stats.costPerHour != null ? f.money2(stats.costPerHour) : '—'}
          small={stats.worked ? t('costs.worked', { hours: f.hours(Math.round(stats.worked)) }) : t('costs.notEnough')}
        />
      </section>
      <section className="split" aria-label={t('costs.split')}>
        <Kpi label={dt.cost('entretien')} value={f.money(totals.entretien)} small={pct(totals.entretien)} />
        <Kpi label={dt.cost('reparations')} value={f.money(totals.reparations)} small={pct(totals.reparations)} />
        <Kpi label={dt.cost('pieces')} value={f.money(totals.pieces)} small={pct(totals.pieces)} />
      </section>
      <CostChart months={stats.months} title={t('costs.chartTitle', { currency: f.currency })} />
      <p className="muted">
        {t('costs.note')}
        {open.length ? ` ${t('costs.noteOpen')}` : ''}
      </p>
    </div>
  );
}

// ------------------------------------------------------------------ Échéances

export function SchedulesTab({ machine, file }: { machine: Machine; file: MachineFile }) {
  const t = useTranslations('garage');
  const tc = useTranslations('common');
  const f = useFormat();
  const { role, today, openModal } = useGarage();
  const rate = weeklyRate(file.readings, machine.id);
  const dues = duesOf(machine, file.schedules, rate, today);
  const manage = can.manageFleet(role);
  const rateText = rate
    ? t('schedules.rateActual', { rate: f.num(rate, rate < 10 ? 1 : 0) })
    : t('schedules.rateDefault', { rate: f.num(DEFAULT_WEEKLY_RATE) });

  return (
    <div className="stack fade-in">
      <div className="g-tab-head">
        <p className="muted">
          {dues.length ? t('schedules.summary', { count: dues.length, n: f.num(dues.length), rate: rateText }) : t('schedules.none')}
        </p>
        {manage ? (
          <button type="button" className="btn btn-soft g-btn-sm" onClick={() => openModal({ type: 'schedule', machineId: machine.id })}>
            <Icon name="plus" />
            {t('schedules.add')}
          </button>
        ) : null}
      </div>
      {dues.length ? (
        <ul className="dues g-dues">
          {dues.map((d) => (
            <li key={d.schedule.id}>
              <DueGauge due={d}>
                <div className="g-due-actions">
                  <button
                    type="button"
                    className="btn btn-soft g-btn-sm"
                    onClick={() =>
                      openModal({
                        type: 'entry',
                        machineId: machine.id,
                        scheduleId: d.schedule.id,
                        kind: kindForSchedule(d.schedule.label),
                      })
                    }
                  >
                    <Icon name="check" />
                    {t('due.markDone')}
                  </button>
                  {manage ? (
                    <>
                      <button
                        type="button"
                        className="g-link-btn"
                        onClick={() => openModal({ type: 'schedule', machineId: machine.id, scheduleId: d.schedule.id })}
                      >
                        <Icon name="edit" />
                        {tc('actions.edit')}
                      </button>
                      <button
                        type="button"
                        className="g-link-btn"
                        onClick={() => openModal({ type: 'delete-schedule', machineId: machine.id, scheduleId: d.schedule.id })}
                      >
                        <Icon name="trash" />
                        {tc('actions.delete')}
                      </button>
                    </>
                  ) : null}
                </div>
              </DueGauge>
            </li>
          ))}
        </ul>
      ) : (
        <Empty
          title={t('schedules.emptyTitle')}
          action={
            manage ? (
              <button
                type="button"
                className="btn btn-primary g-btn-sm"
                onClick={() => openModal({ type: 'schedule', machineId: machine.id })}
              >
                <Icon name="plus" />
                {t('schedules.emptyAction')}
              </button>
            ) : undefined
          }
        >
          {t('schedules.emptyText')}
        </Empty>
      )}
      <p className="law">{t.rich('schedules.how', { b: bold })}</p>
    </div>
  );
}

/** Nombre d'éléments par onglet (pastilles des onglets). */
export function tabCounts(file: MachineFile | undefined): Partial<Record<string, number>> {
  if (!file) return {};
  const l = live(file.entries);
  return {
    carnet: l.length,
    reparations: l.filter((e) => e.kind === 'reparation').length,
    pieces: l.filter((e) => e.kind === 'piece').length,
    medias: file.media.length,
    echeances: file.schedules.length,
  };
}

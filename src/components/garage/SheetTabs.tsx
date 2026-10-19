'use client';

// Contenu des onglets de la fiche machine : Aperçu, Carnet, Réparations, Pièces, Coûts, Échéances.
// (Médias : MediaTab.tsx.) Les données viennent du dossier de la machine ; les actions passent par le contexte.
import { useMemo, useState } from 'react';
import { Icon } from '@/components/Icons';
import {
  can,
  duesOf,
  ENTRY_KINDS,
  entryCost,
  isOpenRepair,
  REPAIR_STATUS,
  weeklyRate,
  type DueInfo,
  type MachineHealth,
} from '@/lib/domain';
import { chf, chf2, dateCH, daysBetween, grp, hrs } from '@/lib/format';
import type { Entry, EntryKind, Machine, MachineFile, RepairStatus } from '@/lib/types';
import { CostChart } from './CostChart';
import { useGarage } from './context';
import { MediaPreview } from './MediaPreview';
import { canEditEntry, costWindowStart, errorText, intervalText, kindForSchedule, machineStats, plural, scheduleTarget } from './helpers';

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

// ------------------------------------------------------------------ échéance (jauge)

export function DueGauge({ due, children }: { due: DueInfo; children?: React.ReactNode }) {
  const s = due.schedule;
  const { flash } = useGarage();
  const pct = due.progress != null ? Math.round(due.progress * 100) : null;
  return (
    <section className={`gauge g-due${flash === s.id ? ' g-flash' : ''}`} aria-label={`${s.label} : ${due.text}`}>
      <div className="gauge-top">
        <b>{s.label}</b>
        <span className={`pill ${due.state}`}>{due.text}</span>
      </div>
      {pct != null ? (
        <div
          className={`bar${due.state === 'ok' ? ' ok' : ''}${due.state === 'bad' ? ' g-bar-bad' : ''}`}
          role="img"
          aria-label={`${pct} % de l’intervalle écoulé`}
        >
          <i style={{ width: `${Math.max(2, pct)}%` }} />
        </div>
      ) : null}
      <p className="muted">{due.hint}</p>
      <p className="g-due-meta">
        Échéance {scheduleTarget(s)} · {intervalText(s)}
        {s.last_date ? ` · dernière fois le ${dateCH(s.last_date)}` : ''}
        {s.last_date && s.basis === 'heures' && s.last_hours != null ? ` à ${hrs(Number(s.last_hours))}` : ''}
      </p>
      {children}
    </section>
  );
}

// ------------------------------------------------------------------ saisie du carnet

function EntryItem({ entry, file, compact = false }: { entry: Entry; file: MachineFile; compact?: boolean }) {
  const { role, userId, openModal, openLightbox, flash } = useGarage();
  const k = ENTRY_KINDS[entry.kind];
  const removed = Boolean(entry.deleted_at);
  const cost = entryCost(entry);
  const media = file.media.filter((m) => m.entry_id === entry.id && m.kind !== 'document');
  const docs = file.media.filter((m) => m.entry_id === entry.id && m.kind === 'document');
  const editable = !removed && !compact && canEditEntry(role, userId, entry);
  const meta = [
    k.label,
    dateCH(entry.date),
    entry.hours != null ? hrs(Number(entry.hours)) : null,
    entry.performed_by,
    entry.kind === 'reparation' && entry.repair_status && entry.repair_status !== 'fait'
      ? REPAIR_STATUS[entry.repair_status].label.toLowerCase()
      : null,
    entry.kind === 'piece' && entry.part_ref ? `réf. ${entry.part_ref}` : null,
  ].filter(Boolean);

  return (
    <li className={`tl g-tl${removed ? ' is-removed' : ''}${flash === entry.id ? ' new' : ''}`}>
      <span className={`tl-icon k-${entry.kind}`} aria-hidden="true">
        <Icon name={k.icon} />
      </span>
      <div className="tl-main">
        <div className="tl-head">
          <b>
            {removed ? <span className="g-sr">Saisie retirée : </span> : null}
            {entry.title}
          </b>
          {cost > 0 ? <span className="cost">{chf(cost)}</span> : null}
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
                aria-label={`Agrandir ${m.kind === 'video' ? 'la vidéo' : 'la photo'} jointe à « ${entry.title} »`}
              >
                <MediaPreview item={m} />
              </button>
            ))}
          </div>
        ) : null}
        {docs.length && !compact ? (
          <p className="g-tl-docs">
            <Icon name="file" /> {plural(docs.length, 'document joint', 'documents joints')}
          </p>
        ) : null}
        {removed ? (
          <p className="g-removed">
            Retirée le {dateCH(entry.deleted_at)}
            {entry.delete_reason ? ` : ${entry.delete_reason}` : ''}
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
              Modifier
            </button>
            <button
              type="button"
              className="g-link-btn"
              onClick={() => openModal({ type: 'remove-entry', machineId: entry.machine_id, entryId: entry.id })}
            >
              <Icon name="trash" />
              Retirer
            </button>
          </div>
        ) : null}
      </div>
    </li>
  );
}

// ------------------------------------------------------------------ Aperçu

export function OverviewTab({ machine, file, health }: { machine: Machine; file: MachineFile; health: MachineHealth | undefined }) {
  const { today, openModal, setTab } = useGarage();
  const stats = useMemo(() => machineStats(machine, file.entries, file.readings, today), [machine, file, today]);
  const rate = weeklyRate(file.readings, machine.id);
  const dues = duesOf(machine, file.schedules, rate, today);
  const next = dues[0] ?? null;
  const open = live(file.entries).filter(isOpenRepair);
  const recent = live(file.entries).slice(0, 3);

  return (
    <div className="stack fade-in">
      <section className="kpis" aria-label="Indicateurs de la machine">
        <Kpi label="Compteur" value={hrs(Number(machine.hours))} small={`relevé le ${dateCH(machine.hours_at)}`} />
        <Kpi
          label="Coût par heure"
          value={stats.costPerHour != null ? chf2(stats.costPerHour) : '—'}
          small={stats.costPerHour != null ? `12 mois · ${hrs(Math.round(stats.worked ?? 0))} travaillées` : 'pas encore assez de relevés'}
        />
        <Kpi label="Coûts 12 mois" value={chf(stats.totals.total)} small="entretien, réparations, pièces" />
        <Kpi
          label="Disponibilité"
          value={stats.availability != null ? `${Math.round(stats.availability * 100)} %` : '—'}
          small={stats.downtime ? `${hrs(stats.downtime)} d’immobilisation en 12 mois` : 'aucune immobilisation saisie'}
        />
      </section>

      {next ? (
        <div>
          <h3>Prochaine échéance</h3>
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
                Marquer comme fait
              </button>
              <button type="button" className="g-link-btn" onClick={() => setTab('echeances')}>
                Toutes les échéances ({dues.length})
              </button>
            </div>
          </DueGauge>
          {rate ? <p className="g-note">Rythme actuel : environ {grp(rate, rate < 10 ? 1 : 0)} h par semaine.</p> : null}
        </div>
      ) : null}

      {open.length ? (
        <section>
          <h3>{open.length > 1 ? 'Réparations ouvertes' : 'Réparation ouverte'}</h3>
          <div className="cards">
            {open.map((r) => (
              <button key={r.id} type="button" className="card g-card-btn" onClick={() => setTab('reparations')}>
                <span className="card-top">
                  <b>{r.title}</b>
                  <span className={`pill ${REPAIR_STATUS[r.repair_status ?? 'en_cours'].state}`}>
                    {REPAIR_STATUS[r.repair_status ?? 'en_cours'].label}
                  </span>
                </span>
                <span className="tl-meta">
                  Depuis le {dateCH(r.date)} · {plural(Math.max(0, daysBetween(r.date, today)), 'jour')}
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h3>Dernières saisies</h3>
        {recent.length ? (
          <ol className="timeline">
            {recent.map((e) => (
              <EntryItem key={e.id} entry={e} file={file} compact />
            ))}
          </ol>
        ) : (
          <Empty
            title="Aucune saisie pour l’instant"
            action={
              <button
                type="button"
                className="btn btn-primary g-btn-sm"
                onClick={() => openModal({ type: 'entry', machineId: machine.id })}
              >
                <Icon name="plus" />
                Première intervention
              </button>
            }
          >
            Services, réparations, pièces, contrôles : tout ce qui est fait sur la machine se note ici.
          </Empty>
        )}
        {recent.length ? (
          <button type="button" className="g-link-btn g-more" onClick={() => setTab('carnet')}>
            Tout le carnet ({live(file.entries).length})
          </button>
        ) : null}
      </section>

      {machine.notes ? (
        <section>
          <h3>Remarques</h3>
          <p className="g-notes">{machine.notes}</p>
        </section>
      ) : null}

      {health && health.alerts === 0 && !open.length ? (
        <p className="g-ok-line">
          <Icon name="check" /> Rien à signaler : échéances à jour, aucune réparation ouverte.
        </p>
      ) : null}

      <p className="law">
        <b>OPA, art. 32b :</b> « Les résultats des opérations d’entretien doivent être consignés. » Chaque saisie est datée et reste dans ce
        carnet : une saisie retirée est barrée, jamais effacée.
      </p>
    </div>
  );
}

// ------------------------------------------------------------------ Carnet

type LogFilter = 'tout' | EntryKind;

export function LogbookTab({ machine, file }: { machine: Machine; file: MachineFile }) {
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
          title="Le carnet est vide"
          action={
            <button type="button" className="btn btn-primary g-btn-sm" onClick={() => openModal({ type: 'entry', machineId: machine.id })}>
              <Icon name="plus" />
              Ajouter une intervention
            </button>
          }
        >
          Chaque service, réparation, pièce changée ou contrôle s’ajoute ici, daté et signé.
        </Empty>
      </div>
    );
  }

  return (
    <div className="stack fade-in">
      <div className="seg g-filter" role="group" aria-label="Filtrer le carnet par type">
        <button type="button" aria-pressed={filter === 'tout'} onClick={() => setFilter('tout')}>
          Tout <span className="g-count">{total}</span>
        </button>
        {kinds.map((k) => (
          <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}>
            {ENTRY_KINDS[k].label} <span className="g-count">{counts.get(k)}</span>
          </button>
        ))}
      </div>
      <section aria-live="polite">
        <h3>
          {filter === 'tout' ? 'Carnet d’entretien' : ENTRY_KINDS[filter].label} ·{' '}
          {plural(items.filter((e) => !e.deleted_at).length, 'saisie')}
          {removed && filter === 'tout' ? ` · ${plural(removed, 'retirée')}` : ''}
        </h3>
        {items.length ? (
          <ol className="timeline">
            {items.map((e) => (
              <EntryItem key={e.id} entry={e} file={file} />
            ))}
          </ol>
        ) : (
          <p className="muted">Aucune saisie de ce type.</p>
        )}
      </section>
    </div>
  );
}

// ------------------------------------------------------------------ Réparations

const STATUS_ORDER: RepairStatus[] = ['en_cours', 'attente_piece', 'fait'];

function RepairCard({ repair, file }: { repair: Entry; file: MachineFile }) {
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
      toast(next === 'fait' ? `« ${repair.title} » : réparation terminée` : `Statut : ${REPAIR_STATUS[next].label.toLowerCase()}`);
      effect('save');
      if (next === 'fait') animate(repair.machine_id, 'repair');
    } catch (e) {
      toast(errorText(e, 'Le statut n’a pas pu être changé.'), 'error');
      effect('alert');
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className={`card${flash === repair.id ? ' new' : ''}`} aria-busy={busy || undefined}>
      <div className="card-top">
        <b>{repair.title}</b>
        <span className={`pill ${REPAIR_STATUS[status].state}`}>{REPAIR_STATUS[status].label}</span>
      </div>
      <div className="tl-meta">
        {[
          dateCH(repair.date),
          repair.hours != null ? hrs(Number(repair.hours)) : null,
          repair.performed_by,
          photos ? plural(photos, 'photo') : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      </div>
      {repair.details ? <p>{repair.details}</p> : null}
      <dl>
        <div>
          <dt>Arrêt</dt>
          <dd>{repair.downtime_hours ? hrs(Number(repair.downtime_hours)) : '—'}</dd>
        </div>
        <div>
          <dt>Pièces</dt>
          <dd>{chf(Number(repair.cost_parts))}</dd>
        </div>
        <div>
          <dt>Main-d’œuvre</dt>
          <dd>{chf(Number(repair.cost_labour))}</dd>
        </div>
        <div>
          <dt>{status === 'fait' ? 'Total' : 'À ce jour'}</dt>
          <dd>{chf(entryCost(repair))}</dd>
        </div>
      </dl>
      {editable ? (
        <div className="g-status" role="group" aria-label={`Statut de « ${repair.title} »`}>
          {STATUS_ORDER.map((s) => (
            <button key={s} type="button" aria-pressed={status === s} disabled={busy} onClick={() => setStatus(s)}>
              {REPAIR_STATUS[s].label}
            </button>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function RepairsTab({ machine, file }: { machine: Machine; file: MachineFile }) {
  const { openModal, today } = useGarage();
  const repairs = live(file.entries)
    .filter((e) => e.kind === 'reparation')
    .sort((a, b) => Number(!isOpenRepair(a)) - Number(!isOpenRepair(b)) || b.date.localeCompare(a.date));
  const start = costWindowStart(today);
  const year = repairs.filter((r) => r.date >= start);
  const cost = year.reduce((s, r) => s + entryCost(r), 0);
  const down = year.reduce((s, r) => s + Number(r.downtime_hours || 0), 0);
  const open = repairs.filter(isOpenRepair).length;

  return (
    <div className="stack fade-in">
      <div className="g-tab-head">
        <p className="muted">
          {repairs.length
            ? `${plural(year.length, 'réparation')} sur 12 mois · ${chf(cost)} · ${hrs(down)} d’arrêt${open ? ` · ${open} ouverte${open > 1 ? 's' : ''}` : ''}`
            : 'Aucune réparation enregistrée.'}
        </p>
        <button
          type="button"
          className="btn btn-soft g-btn-sm"
          onClick={() => openModal({ type: 'entry', machineId: machine.id, kind: 'reparation' })}
        >
          <Icon name="plus" />
          Réparation
        </button>
      </div>
      {repairs.length ? (
        <section className="cards" aria-label="Réparations, les ouvertes d’abord">
          {repairs.map((r) => (
            <RepairCard key={r.id} repair={r} file={file} />
          ))}
        </section>
      ) : (
        <Empty title="Aucune réparation">Les réparations saisies apparaîtront ici, avec leur coût et la durée d’immobilisation.</Empty>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ Pièces

export function PartsTab({ machine, file }: { machine: Machine; file: MachineFile }) {
  const { openModal, today, flash } = useGarage();
  const parts = live(file.entries).filter((e) => e.kind === 'piece');
  const total = parts.reduce((s, p) => s + entryCost(p), 0);
  const start = costWindowStart(today);
  const year = parts.filter((p) => p.date >= start).reduce((s, p) => s + entryCost(p), 0);

  return (
    <div className="stack fade-in">
      <div className="g-tab-head">
        <p className="muted">
          {parts.length ? `${plural(parts.length, 'pièce')} · ${chf(year)} sur 12 mois` : 'Aucune pièce enregistrée.'}
        </p>
        <button
          type="button"
          className="btn btn-soft g-btn-sm"
          onClick={() => openModal({ type: 'entry', machineId: machine.id, kind: 'piece' })}
        >
          <Icon name="plus" />
          Pièce
        </button>
      </div>
      {parts.length ? (
        <div className="table-wrap" tabIndex={0} role="region" aria-label="Pièces et consommables (défilement horizontal)">
          <table className="g-parts">
            <caption className="g-sr">Pièces et consommables de {machine.code}</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Pièce</th>
                <th scope="col">Réf.</th>
                <th scope="col" className="r">
                  Qté
                </th>
                <th scope="col">Fournisseur</th>
                <th scope="col" className="r">
                  Prix
                </th>
                <th scope="col">Garantie</th>
              </tr>
            </thead>
            <tbody>
              {parts.map((p) => {
                const valid = p.warranty_until ? p.warranty_until >= today : null;
                return (
                  <tr key={p.id} className={flash === p.id ? 'new' : undefined}>
                    <td className="nowrap">{dateCH(p.date)}</td>
                    <td>{p.title}</td>
                    <td className="mono nowrap">{p.part_ref || '—'}</td>
                    <td className="r">
                      {p.part_qty != null ? grp(Number(p.part_qty), Number.isInteger(Number(p.part_qty)) ? 0 : 2) : '—'}
                    </td>
                    <td>{p.supplier || '—'}</td>
                    <td className="r">{chf(entryCost(p))}</td>
                    <td className="nowrap">
                      {p.warranty_until ? (
                        <>
                          {dateCH(p.warranty_until)}{' '}
                          <span className={`pill ${valid ? '' : 'muted'} g-pill-xs`}>{valid ? 'valable' : 'échue'}</span>
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
                <td colSpan={5}>Total</td>
                <td className="r">{chf(total)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <Empty title="Aucune pièce">
          Les pièces et consommables achetés pour cette machine apparaîtront ici, avec leur référence et leur garantie.
        </Empty>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ Coûts

export function CostsTab({ machine, file }: { machine: Machine; file: MachineFile }) {
  const { today } = useGarage();
  const stats = useMemo(() => machineStats(machine, file.entries, file.readings, today), [machine, file, today]);
  const t = stats.totals;
  const pct = (v: number) => (t.total ? `${Math.round((v / t.total) * 100)} % du total` : '');
  const open = live(file.entries).filter(isOpenRepair);
  const first = stats.months[0];
  const last = stats.months[stats.months.length - 1];

  if (!t.total) {
    return (
      <div className="stack fade-in">
        <Empty title="Pas encore de coûts">Les coûts apparaissent dès la première intervention chiffrée (pièces et main-d’œuvre).</Empty>
      </div>
    );
  }

  return (
    <div className="stack fade-in">
      <section className="kpis">
        <Kpi label="Total 12 mois" value={chf(t.total)} small={`${first.label} à ${last.label} ${last.ym.slice(0, 4)}`} />
        <Kpi
          label="Coût par heure"
          value={stats.costPerHour != null ? chf2(stats.costPerHour) : '—'}
          small={stats.worked ? `${hrs(Math.round(stats.worked))} travaillées` : 'relevés insuffisants'}
        />
      </section>
      <section className="split" aria-label="Répartition des coûts">
        <Kpi label="Entretien" value={chf(t.entretien)} small={pct(t.entretien)} />
        <Kpi label="Réparations" value={chf(t.reparations)} small={pct(t.reparations)} />
        <Kpi label="Pièces" value={chf(t.pieces)} small={pct(t.pieces)} />
      </section>
      <CostChart months={stats.months} title="Coûts par mois, en CHF" />
      <p className="muted">
        Le coût par heure compte l’entretien, les réparations et les pièces saisis dans le carnet. Il ne compte ni le carburant, ni
        l’amortissement, ni le salaire du machiniste.
        {open.length ? ' Les montants des réparations ouvertes sont comptés tels que saisis à ce jour.' : ''}
      </p>
    </div>
  );
}

// ------------------------------------------------------------------ Échéances

export function SchedulesTab({ machine, file }: { machine: Machine; file: MachineFile }) {
  const { role, today, openModal } = useGarage();
  const rate = weeklyRate(file.readings, machine.id);
  const dues = duesOf(machine, file.schedules, rate, today);
  const manage = can.manageFleet(role);

  return (
    <div className="stack fade-in">
      <div className="g-tab-head">
        <p className="muted">
          {dues.length
            ? `${plural(dues.length, 'échéance')} · ${rate ? `rythme actuel ≈ ${grp(rate, rate < 10 ? 1 : 0)} h par semaine` : 'rythme estimé à 30 h par semaine'}`
            : 'Aucune échéance suivie.'}
        </p>
        {manage ? (
          <button type="button" className="btn btn-soft g-btn-sm" onClick={() => openModal({ type: 'schedule', machineId: machine.id })}>
            <Icon name="plus" />
            Échéance
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
                    Marquer comme fait
                  </button>
                  {manage ? (
                    <>
                      <button
                        type="button"
                        className="g-link-btn"
                        onClick={() => openModal({ type: 'schedule', machineId: machine.id, scheduleId: d.schedule.id })}
                      >
                        <Icon name="edit" />
                        Modifier
                      </button>
                      <button
                        type="button"
                        className="g-link-btn"
                        onClick={() => openModal({ type: 'delete-schedule', machineId: machine.id, scheduleId: d.schedule.id })}
                      >
                        <Icon name="trash" />
                        Supprimer
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
          title="Aucune échéance"
          action={
            manage ? (
              <button
                type="button"
                className="btn btn-primary g-btn-sm"
                onClick={() => openModal({ type: 'schedule', machineId: machine.id })}
              >
                <Icon name="plus" />
                Ajouter une échéance
              </button>
            ) : undefined
          }
        >
          Services toutes les 500 h, contrôle annuel de sécurité, expertise : Godet vous prévient avant qu’il soit trop tard.
        </Empty>
      )}
      <p className="law">
        <b>Comment ça marche :</b> « Marquer comme fait » ouvre l’intervention liée à l’échéance. Une fois enregistrée, l’échéance repart
        pour un nouvel intervalle à partir du compteur ou de la date saisis.
      </p>
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

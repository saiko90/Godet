// Carnet d'entretien imprimable d'une machine (A4). Composant de présentation pur : toutes les données arrivent
// en props, déjà autorisées par la RLS côté serveur.
import Link from 'next/link';
import { Fragment } from 'react';
import { Icon } from '@/components/Icons';
import {
  COST_CATEGORIES,
  costCategory,
  costTotals,
  duesOf,
  ENTRY_KINDS,
  entryCost,
  MACHINE_KINDS,
  machineMakeModel,
  machineTitle,
  REPAIR_STATUS,
  weeklyRate,
  type CostCategory,
  type DueInfo,
  type DueState,
} from '@/lib/domain';
import { chf, chf2, dateCH, grp, hrs } from '@/lib/format';
import type { Entry, HourReading, Machine, Schedule } from '@/lib/types';
import { cantonLabel } from '../cantons';
import { PrintButton } from './PrintButton';
import '../site.css';

export interface CarnetData {
  orgName: string;
  orgCanton: string | null;
  machine: Machine;
  /** Toutes les saisies, retirées comprises, de la plus ancienne à la plus récente. */
  entries: Entry[];
  /** Échéances actives de la machine. */
  schedules: Schedule[];
  /** Relevés récents (rythme d'utilisation). */
  readings: HourReading[];
  /** Nom affiché des membres cités (saisie, retrait), par identifiant. */
  people: Record<string, string>;
  media: { photo: number; video: number; document: number };
  /** Date du jour (AAAA-MM-JJ, Zurich). */
  today: string;
}

const NB = '\u00a0';
const STATE_LABEL: Record<DueState, string> = { ok: 'À jour', warn: 'Bientôt', bad: 'En retard' };

/** Montant : au franc s'il est rond, au centime sinon. */
function money(n: number): string {
  return Math.abs(n - Math.round(n)) < 0.005 ? chf(n) : chf2(n);
}

function plural(n: number, one: string, many: string): string {
  return `${grp(n)}${NB}${n > 1 ? many : one}`;
}

function quantity(n: number | null): string {
  if (n == null) return '—';
  return grp(n, Number.isInteger(n) ? 0 : 2);
}

function rhythm(s: Schedule): string {
  if (s.basis === 'heures') return s.interval_hours ? `Toutes les ${hrs(Number(s.interval_hours))}` : 'Une fois';
  if (!s.interval_days) return 'Une fois';
  const days = Number(s.interval_days);
  if (days % 365 === 0) return days === 365 ? 'Chaque année' : `Tous les ${days / 365}${NB}ans`;
  if (days % 30 === 0) return days === 30 ? 'Chaque mois' : `Tous les ${days / 30}${NB}mois`;
  return `Tous les ${days}${NB}jours`;
}

/** Texte d'une chaîne CSS sûre (codes et noms saisis par l'entreprise), pour les marges de page imprimées. */
function cssString(text: string): string {
  let out = '"';
  for (const ch of text) {
    out += /[A-Za-z0-9 ,.-]/.test(ch) ? ch : `\\${(ch.codePointAt(0) ?? 32).toString(16)} `;
  }
  return `${out}"`;
}

function State({ state, children }: { state: DueState; children?: React.ReactNode }) {
  return (
    <span className={`s-state${state === 'ok' ? '' : ` s-${state}`}`}>
      <i aria-hidden="true" />
      {children ?? STATE_LABEL[state]}
    </span>
  );
}

function DueRow({ d }: { d: DueInfo }) {
  const s = d.schedule;
  const last = [s.last_date ? dateCH(s.last_date) : null, s.last_hours != null ? hrs(Number(s.last_hours)) : null]
    .filter(Boolean)
    .join(' · ');
  return (
    <tr>
      <td>
        <div className="s-t-title">{s.label}</div>
      </td>
      <td>{rhythm(s)}</td>
      <td className="nw">{last || '—'}</td>
      <td className="nw">
        {s.basis === 'heures' ? (
          <>
            {hrs(Number(s.due_hours))}
            <div className="s-t-sub">{d.left >= 0 ? `vers le ${dateCH(d.dueDate)}` : 'à faire dès que possible'}</div>
          </>
        ) : (
          dateCH(s.due_date)
        )}
      </td>
      <td>
        <State state={d.state} />
        <div className="s-t-sub">{d.text}</div>
      </td>
    </tr>
  );
}

function EntryRow({ e, people }: { e: Entry; people: Record<string, string> }) {
  const kind = ENTRY_KINDS[e.kind];
  const removed = Boolean(e.deleted_at);
  const parts = Number(e.cost_parts || 0);
  const labour = Number(e.cost_labour || 0);
  const total = parts + labour;
  const who = e.performed_by?.trim() || (e.created_by ? people[e.created_by] : '') || '—';
  const extra: string[] = [];
  if (e.kind === 'piece') {
    if (e.part_ref) extra.push(`Réf. ${e.part_ref}`);
    if (e.part_qty != null) extra.push(`Qté ${quantity(Number(e.part_qty))}`);
    if (e.supplier) extra.push(e.supplier);
    if (e.warranty_until) extra.push(`garantie jusqu’au ${dateCH(e.warranty_until)}`);
  } else if (e.supplier) {
    extra.push(e.supplier);
  }
  if (e.downtime_hours) extra.push(`immobilisation ${hrs(Number(e.downtime_hours))}`);

  return (
    <tr className={removed ? 's-gone' : undefined}>
      <td className="nw">{dateCH(e.date)}</td>
      <td className="nw">{e.hours != null ? hrs(Number(e.hours)) : '—'}</td>
      <td>
        {kind?.label ?? e.kind}
        {e.kind === 'reparation' && e.repair_status ? <div className="s-t-sub">{REPAIR_STATUS[e.repair_status].label}</div> : null}
      </td>
      <td>
        <div className="s-t-title">{e.title}</div>
        {e.details ? <div className="s-t-det">{e.details}</div> : null}
        {extra.length ? <div className="s-t-sub">{extra.join(' · ')}</div> : null}
        {removed ? (
          <div className="s-gone-note">
            <span className="s-tag">Retirée</span> le {dateCH(e.deleted_at)}
            {e.deleted_by && people[e.deleted_by] ? ` par ${people[e.deleted_by]}` : ''}. Motif{NB}:{' '}
            {e.delete_reason?.trim() || 'non précisé'}.
          </div>
        ) : null}
      </td>
      <td>{who}</td>
      <td className="r">
        {total > 0 ? money(total) : '—'}
        {parts > 0 && labour > 0 ? (
          <div className="s-t-sub">
            pièces {grp(parts, parts % 1 ? 2 : 0)} · m.-o. {grp(labour, labour % 1 ? 2 : 0)}
          </div>
        ) : null}
      </td>
    </tr>
  );
}

export function CarnetSheet({ data }: { data: CarnetData }) {
  const { machine, entries, people, today } = data;
  const live = entries.filter((e) => !e.deleted_at);
  const removedCount = entries.length - live.length;
  const dues = duesOf(machine, data.schedules, weeklyRate(data.readings, machine.id), today);
  const repairs = live.filter((e) => e.kind === 'reparation');
  const parts = live.filter((e) => e.kind === 'piece');

  const allTime: Record<CostCategory, number> = { entretien: 0, reparations: 0, pieces: 0 };
  for (const e of live) allTime[costCategory(e.kind)] += entryCost(e);
  const totalAll = allTime.entretien + allTime.reparations + allTime.pieces;
  const last12 = costTotals(live, today, 12);
  const downtime = live.reduce((s, e) => s + Number(e.downtime_hours || 0), 0);
  const first = live[0]?.date ?? null;
  const lastEntry = live[live.length - 1]?.date ?? null;
  const mediaTotal = data.media.photo + data.media.video + data.media.document;
  const mediaText = mediaTotal
    ? [
        data.media.photo ? plural(data.media.photo, 'photo', 'photos') : null,
        data.media.video ? plural(data.media.video, 'vidéo', 'vidéos') : null,
        data.media.document ? plural(data.media.document, 'document', 'documents') : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : 'Aucun';

  const kindLabel = MACHINE_KINDS[machine.kind]?.label ?? 'Engin';
  const makeModel = machineMakeModel({ brand: machine.brand, model: machine.model, year: null });
  const canton = cantonLabel(data.orgCanton);
  const printedOn = dateCH(today);
  const marginLeft = `${machine.code} · ${data.orgName} · Carnet d’entretien Godet`;

  return (
    <div className="s-page s-carnet">
      <style>{`@page { size: A4; margin: 13mm 12mm 15mm; @bottom-left { content: ${cssString(marginLeft)}; font: 7.5pt sans-serif; color: #6f737a; } @bottom-right { content: "Page " counter(page) " / " counter(pages); font: 7.5pt sans-serif; color: #6f737a; } }`}</style>
      <a className="s-skip" href="#contenu">
        Aller au carnet
      </a>
      <header className="s-carnet-bar s-noprint">
        <div className="s-wrap s-carnet-bar-row">
          <Link
            href={machine.archived_at ? '/parametres#archives' : `/garage?m=${encodeURIComponent(machine.id)}`}
            className="btn btn-ghost s-btn-sm"
          >
            <Icon name="chevron-left" />
            {machine.archived_at ? 'Paramètres' : 'Garage'}
          </Link>
          <div className="s-carnet-bar-title">
            <b>Carnet d’entretien · {machine.code}</b>
            <span>
              {machineTitle(machine)}
              {makeModel ? ` · ${makeModel}` : ''}
            </span>
          </div>
          <PrintButton />
        </div>
      </header>
      <p className="s-carnet-tip s-noprint">
        Pour un fichier PDF, choisissez «&nbsp;Enregistrer au format PDF&nbsp;» comme imprimante.
      </p>

      <main id="contenu">
        <article className="s-sheet" aria-label={`Carnet d’entretien de ${machine.code}`}>
          <header className="s-sheet-head">
            <div className="s-sheet-brand">
              <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false">
                <path d="M7 9h15c6.6 0 11 4.4 11 11v2.5L27.5 30H17C11.5 30 7 25.5 7 20z" fill="var(--paint)" />
                <path d="M13 15h8.5c3.6 0 5.5 2.1 5.5 5.5v.5l-3 4h-6.5c-2.5 0-4.5-2-4.5-4.5z" fill="var(--night)" />
                <path d="M17 30l1.6 4 1.6-4zM21.6 30l1.6 4 1.6-4zM26.2 30l1.6 4 1.6-4z" fill="var(--paint)" />
              </svg>
              <div>
                <b>GODET</b>
                <span>Carnet d’entretien</span>
              </div>
            </div>
            <div className="s-sheet-org">
              <b>{data.orgName}</b>
              {canton ? <span>{canton}</span> : null}
              <span>Édité le {printedOn}</span>
            </div>
          </header>

          <section className="s-sheet-id" aria-label="Identité de la machine">
            <div className="s-sheet-id-top">
              <div className="s-sheet-code">
                <i aria-hidden="true" style={{ background: machine.color }} />
                <div>
                  <h1>{machine.code}</h1>
                  <p>
                    {kindLabel}
                    {machine.weight_t ? ` · ${grp(Number(machine.weight_t), Number.isInteger(Number(machine.weight_t)) ? 0 : 1)}${NB}t` : ''}
                    {makeModel ? <span> · {makeModel}</span> : null}
                  </p>
                </div>
              </div>
              <div className="s-sheet-meter">
                <b>{hrs(Number(machine.hours))}</b>
                <span>Compteur relevé le {dateCH(machine.hours_at)}</span>
              </div>
            </div>
            <dl className="s-sheet-facts">
              <div>
                <dt>Marque</dt>
                <dd>{machine.brand || '—'}</dd>
              </div>
              <div>
                <dt>Modèle</dt>
                <dd>{machine.model || '—'}</dd>
              </div>
              <div>
                <dt>Année</dt>
                <dd>{machine.year ?? '—'}</dd>
              </div>
              <div>
                <dt>Statut</dt>
                <dd>{machine.archived_at ? `Archivée le ${dateCH(machine.archived_at)}` : 'En service'}</dd>
              </div>
              <div>
                <dt>N° de série</dt>
                <dd className="s-mono">{machine.serial || '—'}</dd>
              </div>
              <div>
                <dt>Plaque</dt>
                <dd className="s-mono">{machine.plate || '—'}</dd>
              </div>
              <div>
                <dt>Dans Godet depuis</dt>
                <dd>{dateCH(machine.created_at)}</dd>
              </div>
              <div>
                <dt>Médias archivés</dt>
                <dd>{mediaText}</dd>
              </div>
            </dl>
            <div className="s-sheet-kpis">
              <div>
                <span>Interventions</span>
                <b>{grp(live.length)}</b>
                <small>{removedCount ? `+ ${plural(removedCount, 'retirée', 'retirées')}` : 'consignées'}</small>
              </div>
              <div>
                <span>Carnet tenu depuis</span>
                <b>{first ? dateCH(first) : '—'}</b>
                <small>{lastEntry ? `dernière saisie le ${dateCH(lastEntry)}` : 'aucune saisie'}</small>
              </div>
              <div>
                <span>Coût total</span>
                <b>{money(totalAll)}</b>
                <small>depuis le début</small>
              </div>
              <div>
                <span>12 derniers mois</span>
                <b>{money(last12.total)}</b>
                <small>entretien, réparations, pièces</small>
              </div>
              <div>
                <span>Immobilisation</span>
                <b>{hrs(downtime)}</b>
                <small>pour réparations</small>
              </div>
            </div>
          </section>

          <section aria-labelledby="carnet-echeances">
            <h2 id="carnet-echeances">
              Prochaines échéances <small>au {printedOn}</small>
            </h2>
            <div className="s-tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Échéance</th>
                    <th>Rythme</th>
                    <th>Dernière fois</th>
                    <th>Prévue</th>
                    <th>État</th>
                  </tr>
                </thead>
                <tbody>
                  {dues.length ? (
                    dues.map((d) => <DueRow key={d.schedule.id} d={d} />)
                  ) : (
                    <tr>
                      <td colSpan={5} className="s-empty-row">
                        Aucune échéance active pour cette machine.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="carnet-chronologie">
            <h2 id="carnet-chronologie">
              Chronologie complète <small>de la plus ancienne à la plus récente</small>
            </h2>
            <div className="s-tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Compteur</th>
                    <th>Type</th>
                    <th>Intervention</th>
                    <th>Fait par</th>
                    <th className="r">Coût</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.length ? (
                    entries.map((e, i) => {
                      // Repère chronologique : une ligne d'année quand l'année change.
                      const year = e.date.slice(0, 4);
                      const showYear = i === 0 || entries[i - 1].date.slice(0, 4) !== year;
                      return (
                        <Fragment key={e.id}>
                          {showYear ? (
                            <tr className="s-year">
                              <th colSpan={6} scope="rowgroup">
                                {year}
                              </th>
                            </tr>
                          ) : null}
                          <EntryRow e={e} people={people} />
                        </Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="s-empty-row">
                        Aucune intervention consignée pour le moment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="carnet-reparations">
            <h2 id="carnet-reparations">
              Réparations <small>{plural(repairs.length, 'réparation', 'réparations')}</small>
            </h2>
            <div className="s-tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Compteur</th>
                    <th>Réparation</th>
                    <th>État</th>
                    <th className="r">Immobilisation</th>
                    <th className="r">Coût</th>
                  </tr>
                </thead>
                <tbody>
                  {repairs.length ? (
                    repairs.map((e) => {
                      const status = e.repair_status ? REPAIR_STATUS[e.repair_status] : null;
                      return (
                        <tr key={e.id}>
                          <td className="nw">{dateCH(e.date)}</td>
                          <td className="nw">{e.hours != null ? hrs(Number(e.hours)) : '—'}</td>
                          <td>
                            <div className="s-t-title">{e.title}</div>
                            {e.details ? <div className="s-t-det">{e.details}</div> : null}
                          </td>
                          <td>{status ? <State state={status.state}>{status.label}</State> : '—'}</td>
                          <td className="r">{e.downtime_hours ? hrs(Number(e.downtime_hours)) : '—'}</td>
                          <td className="r">{entryCost(e) > 0 ? money(entryCost(e)) : '—'}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="s-empty-row">
                        Aucune réparation consignée.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="carnet-pieces">
            <h2 id="carnet-pieces">
              Pièces <small>{plural(parts.length, 'pièce ou lot', 'pièces ou lots')}</small>
            </h2>
            <div className="s-tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Pièce</th>
                    <th>Référence</th>
                    <th className="r">Qté</th>
                    <th>Fournisseur</th>
                    <th>Garantie</th>
                    <th className="r">Coût</th>
                  </tr>
                </thead>
                <tbody>
                  {parts.length ? (
                    parts.map((e) => (
                      <tr key={e.id}>
                        <td className="nw">{dateCH(e.date)}</td>
                        <td>
                          <div className="s-t-title">{e.title}</div>
                        </td>
                        <td className="s-mono">{e.part_ref || '—'}</td>
                        <td className="r">{quantity(e.part_qty != null ? Number(e.part_qty) : null)}</td>
                        <td>{e.supplier || '—'}</td>
                        <td className="nw">{e.warranty_until ? `jusqu’au ${dateCH(e.warranty_until)}` : '—'}</td>
                        <td className="r">{entryCost(e) > 0 ? money(entryCost(e)) : '—'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="s-empty-row">
                        Aucune pièce consignée.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="carnet-totaux">
            <h2 id="carnet-totaux">
              Totaux <small>saisies retirées non comptées</small>
            </h2>
            <div className="s-tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Catégorie</th>
                    <th className="r">12 derniers mois</th>
                    <th className="r">Depuis le début du carnet</th>
                  </tr>
                </thead>
                <tbody>
                  {(Object.keys(COST_CATEGORIES) as CostCategory[]).map((c) => (
                    <tr key={c}>
                      <td>
                        {COST_CATEGORIES[c].label}
                        {c === 'entretien' ? <div className="s-t-sub">services, contrôles, inspections, notes</div> : null}
                      </td>
                      <td className="r">{money(last12[c])}</td>
                      <td className="r">{money(allTime[c])}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td>Total</td>
                    <td className="r">{money(last12.total)}</td>
                    <td className="r">{money(totalAll)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {machine.notes?.trim() ? (
            <section aria-labelledby="carnet-notes">
              <h2 id="carnet-notes">Notes sur la machine</h2>
              <p className="s-sheet-notes">{machine.notes}</p>
            </section>
          ) : null}

          <p className="s-sheet-law">
            <b>Art. 32b OPA</b>{NB}: «{NB}Les résultats des opérations d’entretien doivent être consignés.{NB}» Ce carnet
            n’efface aucune saisie&nbsp;: une saisie retirée reste visible, avec sa date, son auteur et son motif.
          </p>

          <footer className="s-sheet-foot">
            <span>
              <b>Carnet tenu avec Godet</b> — imprimé le {printedOn}
            </span>
            <span>
              {machine.code} · {data.orgName}
            </span>
          </footer>
        </article>
      </main>
    </div>
  );
}

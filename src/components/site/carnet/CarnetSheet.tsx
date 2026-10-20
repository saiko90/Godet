// Carnet d'entretien imprimable d'une machine (A4). Composant serveur de présentation : toutes les données arrivent
// en props, déjà autorisées par la RLS côté serveur. Textes dans la langue de la page ; dates, heures et montants
// selon le pays et la devise de l'entreprise.
import { getTranslations } from 'next-intl/server';
import { Fragment } from 'react';
import { Icon } from '@/components/Icons';
import { Link } from '@/i18n/navigation';
import { htmlLang, type AppLocale } from '@/i18n/routing';
import {
  costCategory,
  costTotals,
  duesOf,
  entryCost,
  machineMakeModel,
  REPAIR_STATUS,
  weeklyRate,
  type CostCategory,
  type DueInfo,
  type DueState,
} from '@/lib/domain';
import type { DomainText } from '@/lib/domain-text';
import { getDomainText } from '@/lib/domain-text.server';
import { makeFormat, type Format } from '@/lib/format';
import type { Entry, HourReading, Machine, Schedule } from '@/lib/types';
import { cantonLabel, type CantonCode } from '../cantons';
import { PrintButton } from './PrintButton';
import '../site.css';

export interface CarnetData {
  orgName: string;
  orgCanton: string | null;
  /** Pays (ISO) et devise de l'entreprise : formats des nombres, des dates et des montants. */
  orgCountry: string;
  orgCurrency: string;
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

function carnetTexts(locale: AppLocale) {
  return getTranslations({ locale, namespace: 'carnet' });
}
type T = Awaited<ReturnType<typeof carnetTexts>>;

const COSTS: CostCategory[] = ['entretien', 'reparations', 'pieces'];

/** Montant : à l'unité s'il est rond, au centime sinon. */
function money(f: Format, n: number): string {
  return Math.abs(n - Math.round(n)) < 0.005 ? f.money(n) : f.money2(n);
}

function quantity(f: Format, n: number | null): string {
  if (n == null) return '—';
  return f.num(n, Number.isInteger(n) ? 0 : 2);
}

function rhythm(t: T, f: Format, s: Schedule): string {
  if (s.basis === 'heures') return s.interval_hours ? t('dues.every.hours', { hours: f.hours(Number(s.interval_hours)) }) : t('dues.every.once');
  if (!s.interval_days) return t('dues.every.once');
  const days = Number(s.interval_days);
  if (days % 365 === 0) return t('dues.every.years', { count: days / 365 });
  if (days % 30 === 0) return t('dues.every.months', { count: days / 30 });
  return t('dues.every.days', { count: days });
}

/** Texte d'une chaîne CSS sûre (codes et noms saisis par l'entreprise), pour les marges de page imprimées. */
function cssString(text: string): string {
  let out = '"';
  for (const ch of text) {
    out += /[A-Za-z0-9 ,.-]/.test(ch) ? ch : `\\${(ch.codePointAt(0) ?? 32).toString(16)} `;
  }
  return `${out}"`;
}

function State({ state, children }: { state: DueState; children: React.ReactNode }) {
  return (
    <span className={`s-state${state === 'ok' ? '' : ` s-${state}`}`}>
      <i aria-hidden="true" />
      {children}
    </span>
  );
}

function DueRow({ d, t, f, dt }: { d: DueInfo; t: T; f: Format; dt: DomainText }) {
  const s = d.schedule;
  const last = [s.last_date ? f.date(s.last_date) : null, s.last_hours != null ? f.hours(Number(s.last_hours)) : null]
    .filter(Boolean)
    .join(' · ');
  return (
    <tr>
      <td>
        <div className="s-t-title">{s.label}</div>
      </td>
      <td>{rhythm(t, f, s)}</td>
      <td className="nw">{last || '—'}</td>
      <td className="nw">
        {s.basis === 'heures' ? (
          <>
            {f.hours(Number(s.due_hours))}
            <div className="s-t-sub">{d.left >= 0 ? t('dues.around', { date: f.date(d.dueDate) }) : t('dues.asap')}</div>
          </>
        ) : (
          f.date(s.due_date)
        )}
      </td>
      <td>
        <State state={d.state}>{t(`dues.states.${d.state}`)}</State>
        <div className="s-t-sub">{dt.dueText(d)}</div>
      </td>
    </tr>
  );
}

function EntryRow({ e, people, t, f, dt }: { e: Entry; people: Record<string, string>; t: T; f: Format; dt: DomainText }) {
  const removed = Boolean(e.deleted_at);
  const parts = Number(e.cost_parts || 0);
  const labour = Number(e.cost_labour || 0);
  const total = parts + labour;
  const who = e.performed_by?.trim() || (e.created_by ? people[e.created_by] : '') || '—';
  const extra: string[] = [];
  if (e.kind === 'piece') {
    if (e.part_ref) extra.push(t('timeline.ref', { ref: e.part_ref }));
    if (e.part_qty != null) extra.push(t('timeline.qty', { qty: quantity(f, Number(e.part_qty)) }));
    if (e.supplier) extra.push(e.supplier);
    if (e.warranty_until) extra.push(t('timeline.warrantyUntil', { date: f.date(e.warranty_until) }));
  } else if (e.supplier) {
    extra.push(e.supplier);
  }
  if (e.downtime_hours) extra.push(t('timeline.downtime', { hours: f.hours(Number(e.downtime_hours)) }));
  const remover = e.deleted_by ? people[e.deleted_by] : '';

  return (
    <tr className={removed ? 's-gone' : undefined}>
      <td className="nw">{f.date(e.date)}</td>
      <td className="nw">{e.hours != null ? f.hours(Number(e.hours)) : '—'}</td>
      <td>
        {dt.entry(e.kind)}
        {e.kind === 'reparation' && e.repair_status ? <div className="s-t-sub">{dt.repair(e.repair_status)}</div> : null}
      </td>
      <td>
        <div className="s-t-title">{e.title}</div>
        {e.details ? <div className="s-t-det">{e.details}</div> : null}
        {extra.length ? <div className="s-t-sub">{extra.join(' · ')}</div> : null}
        {removed ? (
          <div className="s-gone-note">
            <span className="s-tag">{t('timeline.removedTag')}</span> {t('timeline.removedOn', { date: f.date(e.deleted_at) })}
            {remover ? ` ${t('timeline.removedBy', { name: remover })}` : ''}.{' '}
            {t('timeline.reason', { reason: e.delete_reason?.trim() || t('timeline.noReason') })}
          </div>
        ) : null}
      </td>
      <td>{who}</td>
      <td className="r">
        {total > 0 ? money(f, total) : '—'}
        {parts > 0 && labour > 0 ? (
          <div className="s-t-sub">
            {t('timeline.split', { parts: f.num(parts, parts % 1 ? 2 : 0), labour: f.num(labour, labour % 1 ? 2 : 0) })}
          </div>
        ) : null}
      </td>
    </tr>
  );
}

export async function CarnetSheet({ data, locale }: { data: CarnetData; locale: AppLocale }) {
  const { machine, entries, people, today } = data;
  const f = makeFormat({ locale, country: data.orgCountry, currency: data.orgCurrency });
  const [t, ts, dt] = await Promise.all([
    carnetTexts(locale),
    getTranslations({ locale, namespace: 'site' }),
    getDomainText(locale, f),
  ]);

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
  const counted = (key: 'photos' | 'videos' | 'documents', n: number) => (n ? t(`identity.${key}`, { count: n, n: f.num(n) }) : null);
  const mediaText =
    [counted('photos', data.media.photo), counted('videos', data.media.video), counted('documents', data.media.document)]
      .filter(Boolean)
      .join(' · ') || t('identity.noMedia');

  const makeModel = machineMakeModel({ brand: machine.brand, model: machine.model, year: null });
  const canton = cantonLabel(data.orgCanton, (code: CantonCode) => ts(`cantons.${code}`));
  const printedOn = f.date(today);
  const swiss = data.orgCountry === 'CH';
  const weight = machine.weight_t ? Number(machine.weight_t) : null;
  const marginLeft = t('print.margin', { code: machine.code, org: data.orgName });
  const bold = (chunks: React.ReactNode) => <b>{chunks}</b>;

  return (
    <div className="s-page s-carnet" lang={htmlLang(locale)}>
      <style>{`@page { size: A4; margin: 13mm 12mm 15mm; @bottom-left { content: ${cssString(marginLeft)}; font: 7.5pt sans-serif; color: #6f737a; } @bottom-right { content: ${cssString(`${t('print.page')} `)} counter(page) " / " counter(pages); font: 7.5pt sans-serif; color: #6f737a; } }`}</style>
      <a className="s-skip" href="#contenu">
        {t('bar.skip')}
      </a>
      <header className="s-carnet-bar s-noprint">
        <div className="s-wrap s-carnet-bar-row">
          <Link
            href={machine.archived_at ? '/parametres#archives' : { pathname: '/garage', query: { m: machine.id } }}
            className="btn btn-ghost s-btn-sm"
          >
            <Icon name="chevron-left" />
            {machine.archived_at ? t('bar.settings') : t('bar.garage')}
          </Link>
          <div className="s-carnet-bar-title">
            <b>{t('bar.title', { code: machine.code })}</b>
            <span>
              {dt.machineTitle(machine)}
              {makeModel ? ` · ${makeModel}` : ''}
            </span>
          </div>
          <PrintButton label={t('bar.print')} />
        </div>
      </header>
      <p className="s-carnet-tip s-noprint">{t('bar.tip')}</p>

      <main id="contenu">
        <article className="s-sheet" aria-label={t('head.label', { code: machine.code })}>
          <header className="s-sheet-head">
            <div className="s-sheet-brand">
              <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false">
                <path d="M7 9h15c6.6 0 11 4.4 11 11v2.5L27.5 30H17C11.5 30 7 25.5 7 20z" fill="var(--paint)" />
                <path d="M13 15h8.5c3.6 0 5.5 2.1 5.5 5.5v.5l-3 4h-6.5c-2.5 0-4.5-2-4.5-4.5z" fill="var(--night)" />
                <path d="M17 30l1.6 4 1.6-4zM21.6 30l1.6 4 1.6-4zM26.2 30l1.6 4 1.6-4z" fill="var(--paint)" />
              </svg>
              <div>
                <b>GODET</b>
                <span>{t('head.brand')}</span>
              </div>
            </div>
            <div className="s-sheet-org">
              <b>{data.orgName}</b>
              {canton ? <span>{canton}</span> : null}
              <span>{t('head.printedOn', { date: printedOn })}</span>
            </div>
          </header>

          <section className="s-sheet-id" aria-label={t('identity.label')}>
            <div className="s-sheet-id-top">
              <div className="s-sheet-code">
                <i aria-hidden="true" style={{ background: machine.color }} />
                <div>
                  <h1>{machine.code}</h1>
                  <p>
                    {dt.kind(machine.kind)}
                    {weight ? ` · ${f.num(weight, Number.isInteger(weight) ? 0 : 1)} t` : ''}
                    {makeModel ? <span> · {makeModel}</span> : null}
                  </p>
                </div>
              </div>
              <div className="s-sheet-meter">
                <b>{f.hours(Number(machine.hours))}</b>
                <span>{t('identity.meterOn', { date: f.date(machine.hours_at) })}</span>
              </div>
            </div>
            <dl className="s-sheet-facts">
              <div>
                <dt>{t('identity.brand')}</dt>
                <dd>{machine.brand || '—'}</dd>
              </div>
              <div>
                <dt>{t('identity.model')}</dt>
                <dd>{machine.model || '—'}</dd>
              </div>
              <div>
                <dt>{t('identity.year')}</dt>
                <dd>{machine.year ?? '—'}</dd>
              </div>
              <div>
                <dt>{t('identity.status')}</dt>
                <dd>{machine.archived_at ? t('identity.archivedOn', { date: f.date(machine.archived_at) }) : t('identity.inService')}</dd>
              </div>
              <div>
                <dt>{t('identity.serial')}</dt>
                <dd className="s-mono">{machine.serial || '—'}</dd>
              </div>
              <div>
                <dt>{t('identity.plate')}</dt>
                <dd className="s-mono">{machine.plate || '—'}</dd>
              </div>
              <div>
                <dt>{t('identity.since')}</dt>
                <dd>{f.date(machine.created_at)}</dd>
              </div>
              <div>
                <dt>{t('identity.media')}</dt>
                <dd>{mediaText}</dd>
              </div>
            </dl>
            <div className="s-sheet-kpis">
              <div>
                <span>{t('kpis.entries')}</span>
                <b>{f.num(live.length)}</b>
                <small>{removedCount ? t('kpis.removed', { count: removedCount, n: f.num(removedCount) }) : t('kpis.recorded')}</small>
              </div>
              <div>
                <span>{t('kpis.keptSince')}</span>
                <b>{first ? f.date(first) : '—'}</b>
                <small>{lastEntry ? t('kpis.lastEntry', { date: f.date(lastEntry) }) : t('kpis.noEntry')}</small>
              </div>
              <div>
                <span>{t('kpis.totalCost')}</span>
                <b>{money(f, totalAll)}</b>
                <small>{t('kpis.sinceStart')}</small>
              </div>
              <div>
                <span>{t('kpis.last12')}</span>
                <b>{money(f, last12.total)}</b>
                <small>{t('kpis.last12Hint')}</small>
              </div>
              <div>
                <span>{t('kpis.downtime')}</span>
                <b>{f.hours(downtime)}</b>
                <small>{t('kpis.downtimeHint')}</small>
              </div>
            </div>
          </section>

          <section aria-labelledby="carnet-echeances">
            <h2 id="carnet-echeances">
              {t('dues.title')} <small>{t('dues.asOf', { date: printedOn })}</small>
            </h2>
            <div className="s-tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>{t('dues.due')}</th>
                    <th>{t('dues.rhythm')}</th>
                    <th>{t('dues.last')}</th>
                    <th>{t('dues.planned')}</th>
                    <th>{t('dues.state')}</th>
                  </tr>
                </thead>
                <tbody>
                  {dues.length ? (
                    dues.map((d) => <DueRow key={d.schedule.id} d={d} t={t} f={f} dt={dt} />)
                  ) : (
                    <tr>
                      <td colSpan={5} className="s-empty-row">
                        {t('dues.empty')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="carnet-chronologie">
            <h2 id="carnet-chronologie">
              {t('timeline.title')} <small>{t('timeline.order')}</small>
            </h2>
            <div className="s-tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>{t('timeline.date')}</th>
                    <th>{t('timeline.meter')}</th>
                    <th>{t('timeline.type')}</th>
                    <th>{t('timeline.work')}</th>
                    <th>{t('timeline.by')}</th>
                    <th className="r">{t('timeline.cost')}</th>
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
                          <EntryRow e={e} people={people} t={t} f={f} dt={dt} />
                        </Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="s-empty-row">
                        {t('timeline.empty')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="carnet-reparations">
            <h2 id="carnet-reparations">
              {t('repairs.title')} <small>{t('repairs.count', { count: repairs.length, n: f.num(repairs.length) })}</small>
            </h2>
            <div className="s-tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>{t('repairs.date')}</th>
                    <th>{t('repairs.meter')}</th>
                    <th>{t('repairs.repair')}</th>
                    <th>{t('repairs.state')}</th>
                    <th className="r">{t('repairs.downtime')}</th>
                    <th className="r">{t('repairs.cost')}</th>
                  </tr>
                </thead>
                <tbody>
                  {repairs.length ? (
                    repairs.map((e) => (
                      <tr key={e.id}>
                        <td className="nw">{f.date(e.date)}</td>
                        <td className="nw">{e.hours != null ? f.hours(Number(e.hours)) : '—'}</td>
                        <td>
                          <div className="s-t-title">{e.title}</div>
                          {e.details ? <div className="s-t-det">{e.details}</div> : null}
                        </td>
                        <td>
                          {e.repair_status ? (
                            <State state={REPAIR_STATUS[e.repair_status].state}>{dt.repair(e.repair_status)}</State>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="r">{e.downtime_hours ? f.hours(Number(e.downtime_hours)) : '—'}</td>
                        <td className="r">{entryCost(e) > 0 ? money(f, entryCost(e)) : '—'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="s-empty-row">
                        {t('repairs.empty')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="carnet-pieces">
            <h2 id="carnet-pieces">
              {t('parts.title')} <small>{t('parts.count', { count: parts.length, n: f.num(parts.length) })}</small>
            </h2>
            <div className="s-tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>{t('parts.date')}</th>
                    <th>{t('parts.part')}</th>
                    <th>{t('parts.ref')}</th>
                    <th className="r">{t('parts.qty')}</th>
                    <th>{t('parts.supplier')}</th>
                    <th>{t('parts.warranty')}</th>
                    <th className="r">{t('parts.cost')}</th>
                  </tr>
                </thead>
                <tbody>
                  {parts.length ? (
                    parts.map((e) => (
                      <tr key={e.id}>
                        <td className="nw">{f.date(e.date)}</td>
                        <td>
                          <div className="s-t-title">{e.title}</div>
                        </td>
                        <td className="s-mono">{e.part_ref || '—'}</td>
                        <td className="r">{quantity(f, e.part_qty != null ? Number(e.part_qty) : null)}</td>
                        <td>{e.supplier || '—'}</td>
                        <td className="nw">{e.warranty_until ? t('parts.until', { date: f.date(e.warranty_until) }) : '—'}</td>
                        <td className="r">{entryCost(e) > 0 ? money(f, entryCost(e)) : '—'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="s-empty-row">
                        {t('parts.empty')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="carnet-totaux">
            <h2 id="carnet-totaux">
              {t('totals.title')} <small>{t('totals.note')}</small>
            </h2>
            <div className="s-tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>{t('totals.category')}</th>
                    <th className="r">{t('totals.last12')}</th>
                    <th className="r">{t('totals.sinceStart')}</th>
                  </tr>
                </thead>
                <tbody>
                  {COSTS.map((c) => (
                    <tr key={c}>
                      <td>
                        {dt.cost(c)}
                        {c === 'entretien' ? <div className="s-t-sub">{t('totals.maintenanceHint')}</div> : null}
                      </td>
                      <td className="r">{money(f, last12[c])}</td>
                      <td className="r">{money(f, allTime[c])}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td>{t('totals.total')}</td>
                    <td className="r">{money(f, last12.total)}</td>
                    <td className="r">{money(f, totalAll)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {machine.notes?.trim() ? (
            <section aria-labelledby="carnet-notes">
              <h2 id="carnet-notes">{t('notes')}</h2>
              <p className="s-sheet-notes">{machine.notes}</p>
            </section>
          ) : null}

          {/* La citation de l'OPA (droit suisse) n'est reprise que pour les entreprises établies en Suisse. */}
          <p className="s-sheet-law">{swiss ? t.rich('law.swiss', { b: bold }) : t('law.general')}</p>

          <footer className="s-sheet-foot">
            <span>{t.rich('foot', { date: printedOn, b: bold })}</span>
            <span>
              {machine.code} · {data.orgName}
            </span>
          </footer>
        </article>
      </main>
    </div>
  );
}

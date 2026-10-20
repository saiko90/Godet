'use client';

// Mode atelier : tout le parc en cartes, sans 3D (gros boutons, utilisable avec des gants), recherche et filtre
// par état. Ouvre la même fiche que le garage. C'est aussi le repli quand la 3D ne peut pas s'afficher.
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { useFormat } from '@/components/FormatProvider';
import { Icon } from '@/components/Icons';
import { can, type DueState } from '@/lib/domain';
import { useDomainText } from '@/lib/use-domain-text';
import { useGarage } from './context';
import { machineCost12 } from './helpers';
import { KindIcon } from './KindIcon';
import { useGarageText } from './text';
import type { EngineFailure } from './useShowroom';

type Filter = 'tous' | DueState;

/** Message affiché quand la 3D ne peut pas s'afficher (garage.atelier.failure.*). */
const FAILURE_KEY = { 'no-webgl': 'noWebgl', load: 'load', start: 'start', 'context-lost': 'contextLost' } as const satisfies Record<
  EngineFailure,
  string
>;

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function Atelier({
  failure,
  canReturn,
  withSheet,
  onReturn,
  onRetry,
  onOpen,
  onAdd,
}: {
  failure: EngineFailure | null;
  canReturn: boolean;
  withSheet: boolean;
  onReturn: () => void;
  onRetry: () => void;
  onOpen: (id: string) => void;
  onAdd: () => void;
}) {
  const t = useTranslations('garage');
  const f = useFormat();
  const dt = useDomainText();
  const gt = useGarageText();
  const { fleet, health, today, role, openModal } = useGarage();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('tous');

  const lastEntry = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of fleet.recentEntries)
      if (!map.has(e.machine_id) || e.date > (map.get(e.machine_id) ?? '')) map.set(e.machine_id, e.date);
    return map;
  }, [fleet.recentEntries]);

  const counts = useMemo(() => {
    const c: Record<DueState, number> = { ok: 0, warn: 0, bad: 0 };
    for (const m of fleet.machines) c[health.get(m.id)?.state ?? 'ok']++;
    return c;
  }, [fleet.machines, health]);

  const q = norm(query.trim());
  const list = fleet.machines.filter((m) => {
    if (filter !== 'tous' && (health.get(m.id)?.state ?? 'ok') !== filter) return false;
    if (!q) return true;
    const hay = norm(
      [m.code, dt.kind(m.kind), m.brand, m.model, m.serial, m.plate, m.year ? String(m.year) : ''].filter(Boolean).join(' '),
    );
    return hay.includes(q);
  });

  const filters: { id: Filter; label: string; n: number }[] = [
    { id: 'tous', label: t('atelier.all'), n: fleet.machines.length },
    { id: 'bad', label: gt.state('bad'), n: counts.bad },
    { id: 'warn', label: gt.state('warn'), n: counts.warn },
    { id: 'ok', label: gt.state('ok'), n: counts.ok },
  ];

  return (
    <section className={`atelier g-atelier${withSheet ? ' with-sheet' : ''}`} aria-labelledby="atelier-title">
      <div className="atelier-inner">
        {failure ? (
          <div className="g-notice" role="status">
            <Icon name="alert" />
            <p>{t(`atelier.failure.${FAILURE_KEY[failure]}`)}</p>
            {failure !== 'no-webgl' ? (
              <button type="button" className="btn btn-ghost g-btn-sm" onClick={onRetry}>
                {t('atelier.retry3d')}
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="g-atelier-head">
          <p className="eyebrow">{t('atelier.eyebrow')}</p>
          <h2 id="atelier-title">{t('atelier.title')}</h2>
          <p className="muted">
            {t('atelier.text')}
            {canReturn ? ` ${t('atelier.paused')}` : ''}
          </p>
        </div>

        {fleet.machines.length ? (
          <div className="g-atelier-tools">
            <div className="field g-search">
              <label htmlFor="atelier-q" className="g-sr">
                {t('atelier.search')}
              </label>
              <span className="g-search-icon" aria-hidden="true">
                <Icon name="search" />
              </span>
              <input
                id="atelier-q"
                type="search"
                value={query}
                placeholder={t('atelier.searchPlaceholder')}
                autoComplete="off"
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="seg g-filter" role="group" aria-label={t('atelier.filter')}>
              {filters.map((f) => (
                <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
                  {f.id !== 'tous' ? <i className={`dot ${f.id}`} aria-hidden="true" /> : null}
                  {f.label} <span className="g-count">{f.n}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <p className="g-sr" aria-live="polite">
          {fleet.machines.length ? t('atelier.shown', { count: list.length, n: f.num(list.length) }) : ''}
        </p>

        {list.length ? (
          <ul className="a-list g-alist">
            {list.map((m) => {
              const h = health.get(m.id);
              const state = h?.state ?? 'ok';
              const next = h?.dues[0];
              const cost = machineCost12(m.id, fleet.recentEntries, today);
              const last = lastEntry.get(m.id);
              const open = h?.openRepairs.length ?? 0;
              return (
                <li key={m.id} className={`a-card g-acard is-${state}`}>
                  <div className="a-head">
                    <div className="g-acard-id">
                      <span className="g-acard-kind" aria-hidden="true" style={{ color: m.color }}>
                        <KindIcon kind={m.kind} />
                      </span>
                      <div>
                        <p className="eyebrow">{gt.eyebrow(m)}</p>
                        <h3>{m.code}</h3>
                        {m.brand || m.model ? <p className="g-acard-sub">{[m.brand, m.model].filter(Boolean).join(' ')}</p> : null}
                      </div>
                    </div>
                    <span className={`pill ${state === 'ok' ? '' : state}`}>
                      <i className={`dot ${state}`} aria-hidden="true" />
                      {gt.state(state)}
                    </span>
                  </div>
                  <dl className="a-meta g-ameta">
                    <div>
                      <dt>{t('atelier.meter')}</dt>
                      <dd>{f.hours(Number(m.hours))}</dd>
                    </div>
                    {next ? (
                      <div>
                        <dt>{next.schedule.label}</dt>
                        <dd className={next.state === 'ok' ? undefined : `is-${next.state}`}>{dt.dueText(next)}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt>{t('atelier.cost12')}</dt>
                      <dd>{f.money(cost)}</dd>
                    </div>
                    {open ? (
                      <div>
                        <dt>{t('atelier.repairs')}</dt>
                        <dd className="is-warn">{t('atelier.openCount', { count: open, n: f.num(open) })}</dd>
                      </div>
                    ) : last ? (
                      <div>
                        <dt>{t('atelier.lastEntry')}</dt>
                        <dd>{f.date(last)}</dd>
                      </div>
                    ) : null}
                  </dl>
                  <div className="a-btns g-abtns">
                    <button type="button" className="btn btn-primary" onClick={() => openModal({ type: 'entry', machineId: m.id })}>
                      <Icon name="plus" />
                      {t('atelier.work')}
                      <span className="g-sr">{t('atelier.workSr', { code: m.code })}</span>
                    </button>
                    <button type="button" className="btn btn-soft" onClick={() => openModal({ type: 'hours', machineId: m.id })}>
                      <Icon name="clock" />
                      {t('atelier.meterButton')}
                      <span className="g-sr">{t('atelier.meterSr', { code: m.code })}</span>
                    </button>
                    <button type="button" className="btn btn-soft" data-fiche={m.id} onClick={() => onOpen(m.id)}>
                      {t('atelier.file')}
                      <span className="g-sr">{t('atelier.fileSr', { code: m.code })}</span>
                      <Icon name="chevron-right" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : fleet.machines.length ? (
          <div className="empty">
            <b>{t('atelier.noMatchTitle')}</b>
            <span>{t('atelier.noMatchText')}</span>
            <button
              type="button"
              className="btn btn-soft g-btn-sm"
              onClick={() => {
                setQuery('');
                setFilter('tous');
              }}
            >
              {t('atelier.showAll')}
            </button>
          </div>
        ) : (
          <div className="empty">
            <b>{t('atelier.emptyTitle')}</b>
            <span>{can.manageFleet(role) ? t('welcome.copyEmpty') : t('app.emptyRead')}</span>
          </div>
        )}

        <div className="g-atelier-foot">
          {can.manageFleet(role) ? (
            <button type="button" className="btn btn-primary" onClick={onAdd}>
              <Icon name="plus" />
              {t('app.addMachine')}
            </button>
          ) : null}
          {canReturn ? (
            <button type="button" className="btn btn-ghost" onClick={onReturn}>
              <Icon name="garage" />
              {t('atelier.back')}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

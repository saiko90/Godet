'use client';

// Mode atelier : tout le parc en cartes, sans 3D (gros boutons, utilisable avec des gants), recherche et filtre
// par état. Ouvre la même fiche que le garage. C'est aussi le repli quand la 3D ne peut pas s'afficher.
import { useMemo, useState } from 'react';
import { Icon } from '@/components/Icons';
import { can, MACHINE_KINDS, type DueState } from '@/lib/domain';
import { chf, dateCH, grp, hrs } from '@/lib/format';
import { useGarage } from './context';
import { machineCost12, machineEyebrow, plural, STATE_LABEL } from './helpers';
import { KindIcon } from './KindIcon';
import type { EngineFailure } from './useShowroom';

type Filter = 'tous' | DueState;

const FAILURE_TEXT: Record<EngineFailure, string> = {
  'no-webgl': 'Cet appareil ou ce navigateur n’affiche pas la 3D (WebGL 2). Toutes les fiches restent accessibles ici.',
  load: 'La 3D n’a pas pu être téléchargée. Vérifiez la connexion ; toutes les fiches restent accessibles ici.',
  start: 'La 3D n’a pas pu démarrer sur cet appareil. Toutes les fiches restent accessibles ici.',
  'context-lost': 'La 3D s’est arrêtée (mémoire graphique saturée). Toutes les fiches restent accessibles ici.',
};

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
      [m.code, MACHINE_KINDS[m.kind]?.label, m.brand, m.model, m.serial, m.plate, m.year ? String(m.year) : ''].filter(Boolean).join(' '),
    );
    return hay.includes(q);
  });

  const filters: { id: Filter; label: string; n: number }[] = [
    { id: 'tous', label: 'Tous', n: fleet.machines.length },
    { id: 'bad', label: 'En retard', n: counts.bad },
    { id: 'warn', label: 'À surveiller', n: counts.warn },
    { id: 'ok', label: 'À jour', n: counts.ok },
  ];

  return (
    <section className={`atelier g-atelier${withSheet ? ' with-sheet' : ''}`} aria-labelledby="atelier-title">
      <div className="atelier-inner">
        {failure ? (
          <div className="g-notice" role="status">
            <Icon name="alert" />
            <p>{FAILURE_TEXT[failure]}</p>
            {failure !== 'no-webgl' ? (
              <button type="button" className="btn btn-ghost g-btn-sm" onClick={onRetry}>
                Réessayer la 3D
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="g-atelier-head">
          <p className="eyebrow">Mode atelier</p>
          <h2 id="atelier-title">Le parc en un coup d’œil</h2>
          <p className="muted">
            Les mêmes fiches, sans 3D : de gros boutons pour saisir une intervention ou relever un compteur en quelques secondes, même avec
            des gants.{canReturn ? ' La 3D est en pause pour économiser la batterie.' : ''}
          </p>
        </div>

        {fleet.machines.length ? (
          <div className="g-atelier-tools">
            <div className="field g-search">
              <label htmlFor="atelier-q" className="g-sr">
                Rechercher une machine
              </label>
              <span className="g-search-icon" aria-hidden="true">
                <Icon name="search" />
              </span>
              <input
                id="atelier-q"
                type="search"
                value={query}
                placeholder="Code, type, marque, n° de série…"
                autoComplete="off"
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="seg g-filter" role="group" aria-label="Filtrer par état">
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
          {fleet.machines.length ? `${plural(list.length, 'machine affichée', 'machines affichées')}` : ''}
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
                        <p className="eyebrow">{machineEyebrow(m)}</p>
                        <h3>{m.code}</h3>
                        {m.brand || m.model ? <p className="g-acard-sub">{[m.brand, m.model].filter(Boolean).join(' ')}</p> : null}
                      </div>
                    </div>
                    <span className={`pill ${state === 'ok' ? '' : state}`}>
                      <i className={`dot ${state}`} aria-hidden="true" />
                      {STATE_LABEL[state]}
                    </span>
                  </div>
                  <dl className="a-meta g-ameta">
                    <div>
                      <dt>Compteur</dt>
                      <dd>{hrs(Number(m.hours))}</dd>
                    </div>
                    {next ? (
                      <div>
                        <dt>{next.schedule.label}</dt>
                        <dd className={next.state === 'ok' ? undefined : `is-${next.state}`}>{next.text}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt>Coûts 12 mois</dt>
                      <dd>{chf(cost)}</dd>
                    </div>
                    {open ? (
                      <div>
                        <dt>Réparations</dt>
                        <dd className="is-warn">{open > 1 ? `${grp(open)} ouvertes` : '1 ouverte'}</dd>
                      </div>
                    ) : last ? (
                      <div>
                        <dt>Dernière saisie</dt>
                        <dd>{dateCH(last)}</dd>
                      </div>
                    ) : null}
                  </dl>
                  <div className="a-btns g-abtns">
                    <button type="button" className="btn btn-primary" onClick={() => openModal({ type: 'entry', machineId: m.id })}>
                      <Icon name="plus" />
                      Intervention
                      <span className="g-sr"> sur {m.code}</span>
                    </button>
                    <button type="button" className="btn btn-soft" onClick={() => openModal({ type: 'hours', machineId: m.id })}>
                      <Icon name="clock" />
                      Compteur
                      <span className="g-sr"> de {m.code}</span>
                    </button>
                    <button type="button" className="btn btn-soft" data-fiche={m.id} onClick={() => onOpen(m.id)}>
                      Fiche
                      <span className="g-sr"> de {m.code}</span>
                      <Icon name="chevron-right" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : fleet.machines.length ? (
          <div className="empty">
            <b>Aucune machine ne correspond</b>
            <span>Essayez un autre mot ou retirez le filtre.</span>
            <button
              type="button"
              className="btn btn-soft g-btn-sm"
              onClick={() => {
                setQuery('');
                setFilter('tous');
              }}
            >
              Tout afficher
            </button>
          </div>
        ) : (
          <div className="empty">
            <b>Le parc est vide</b>
            <span>
              {can.manageFleet(role)
                ? 'Ajoutez votre première machine : son carnet, ses échéances et ses coûts se rempliront au fil des interventions.'
                : 'Aucune machine pour l’instant. Un responsable du parc peut les ajouter.'}
            </span>
          </div>
        )}

        <div className="g-atelier-foot">
          {can.manageFleet(role) ? (
            <button type="button" className="btn btn-primary" onClick={onAdd}>
              <Icon name="plus" />
              Ajouter une machine
            </button>
          ) : null}
          {canReturn ? (
            <button type="button" className="btn btn-ghost" onClick={onReturn}>
              <Icon name="garage" />
              Retour au garage 3D
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

'use client';

// Dock des machines : une puce par machine (code, type, pastille d'état), précédente / suivante, « + Machine ».
import { useEffect, useRef } from 'react';
import { Icon } from '@/components/Icons';
import { machineTitle, type MachineHealth } from '@/lib/domain';
import type { Machine } from '@/lib/types';
import { STATE_LABEL } from './helpers';

export function Dock({
  machines,
  health,
  current,
  canAdd,
  reducedMotion,
  onOpen,
  onPrev,
  onNext,
  onAdd,
}: {
  machines: Machine[];
  health: Map<string, MachineHealth>;
  current: string | null;
  canAdd: boolean;
  reducedMotion: boolean;
  onOpen: (id: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onAdd: () => void;
}) {
  const row = useRef<HTMLDivElement>(null);

  // La puce de la machine ouverte reste visible dans le dock défilant.
  useEffect(() => {
    if (!current || !row.current) return;
    const chip = row.current.querySelector<HTMLElement>(`[data-machine="${CSS.escape(current)}"]`);
    chip?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [current, reducedMotion]);

  const several = machines.length > 1;

  return (
    <nav className="dock g-dock" aria-label="Machines du parc">
      <div className="g-dock-inner">
        {several ? (
          <button type="button" className="icon-btn g-dock-nav" aria-label="Machine précédente (flèche gauche)" onClick={onPrev}>
            <Icon name="chevron-left" />
          </button>
        ) : null}
        <div className="dock-row" ref={row}>
          {machines.map((m) => {
            const h = health.get(m.id);
            const state = h?.state ?? 'ok';
            const alerts = h?.alerts ?? 0;
            return (
              <button
                key={m.id}
                type="button"
                className="chip"
                data-machine={m.id}
                aria-current={current === m.id ? 'true' : undefined}
                onClick={() => onOpen(m.id)}
              >
                <i className={`dot ${state}`} aria-hidden="true" />
                <b>{m.code}</b>
                <span>{machineTitle(m)}</span>
                <span className="g-sr">
                  , {STATE_LABEL[state]}
                  {alerts ? `, ${alerts} point${alerts > 1 ? 's' : ''} d’attention` : ''}
                </span>
              </button>
            );
          })}
          {canAdd ? (
            <button type="button" className="chip add" onClick={onAdd}>
              <Icon name="plus" />
              Machine
              <span className="g-sr"> : ajouter une machine au parc</span>
            </button>
          ) : null}
        </div>
        {several ? (
          <button type="button" className="icon-btn g-dock-nav" aria-label="Machine suivante (flèche droite)" onClick={onNext}>
            <Icon name="chevron-right" />
          </button>
        ) : null}
      </div>
    </nav>
  );
}

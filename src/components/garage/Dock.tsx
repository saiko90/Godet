'use client';

// Dock des machines : une puce par machine (code, type, pastille d'état), précédente / suivante, « + Machine ».
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { useFormat } from '@/components/FormatProvider';
import { Icon } from '@/components/Icons';
import type { MachineHealth } from '@/lib/domain';
import type { Machine } from '@/lib/types';
import { useDomainText } from '@/lib/use-domain-text';

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
  const t = useTranslations('garage');
  const f = useFormat();
  const dt = useDomainText();
  const row = useRef<HTMLDivElement>(null);

  // La puce de la machine ouverte reste visible dans le dock défilant.
  useEffect(() => {
    if (!current || !row.current) return;
    const chip = row.current.querySelector<HTMLElement>(`[data-machine="${CSS.escape(current)}"]`);
    chip?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [current, reducedMotion]);

  const several = machines.length > 1;

  return (
    <nav className="dock g-dock" aria-label={t('dock.label')}>
      <div className="g-dock-inner">
        {several ? (
          <button type="button" className="icon-btn g-dock-nav" aria-label={t('dock.prev')} onClick={onPrev}>
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
                <span>{dt.machineTitle(m)}</span>
                <span className="g-sr">
                  , {t(`state.${state}`)}
                  {alerts ? `, ${t('dock.points', { count: alerts, n: f.num(alerts) })}` : ''}
                </span>
              </button>
            );
          })}
          {canAdd ? (
            <button type="button" className="chip add" onClick={onAdd}>
              <Icon name="plus" />
              {t('dock.add')}
              <span className="g-sr">{t('dock.addSr')}</span>
            </button>
          ) : null}
        </div>
        {several ? (
          <button type="button" className="icon-btn g-dock-nav" aria-label={t('dock.next')} onClick={onNext}>
            <Icon name="chevron-right" />
          </button>
        ) : null}
      </div>
    </nav>
  );
}

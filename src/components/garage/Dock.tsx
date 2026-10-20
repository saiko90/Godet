'use client';

// Dock des machines : une puce par plateau du showroom (une machine, ou un groupe du même type : « PE ×10 »),
// avec pastille d'état, précédente / suivante, « + Machine ».
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { useFormat } from '@/components/FormatProvider';
import { Icon } from '@/components/Icons';
import type { FleetView } from './groups';

export function Dock({
  views,
  labelOf,
  current,
  canAdd,
  reducedMotion,
  onOpen,
  onPrev,
  onNext,
  onAdd,
  onOverview,
}: {
  views: FleetView[];
  /** Code et titre affichés sur la puce (et sur l'étiquette du showroom). */
  labelOf: (view: FleetView) => { code: string; title: string };
  current: string | null;
  canAdd: boolean;
  reducedMotion: boolean;
  onOpen: (id: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onAdd: () => void;
  /** Téléphone : retour au hall entier (absent hors du mode « de machine en machine »). */
  onOverview?: () => void;
}) {
  const t = useTranslations('garage');
  const f = useFormat();
  const row = useRef<HTMLDivElement>(null);

  // La puce de la machine ouverte reste visible dans le dock défilant.
  useEffect(() => {
    if (!current || !row.current) return;
    const chip = row.current.querySelector<HTMLElement>(`[data-machine="${CSS.escape(current)}"]`);
    chip?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [current, reducedMotion]);

  const several = views.length > 1;

  return (
    <nav className="dock g-dock" aria-label={t('dock.label')}>
      <div className="g-dock-inner">
        {onOverview ? (
          <button type="button" className="icon-btn g-dock-nav" aria-label={t('dock.overview')} title={t('dock.overview')} onClick={onOverview}>
            <Icon name="garage" />
          </button>
        ) : null}
        {several ? (
          <button type="button" className="icon-btn g-dock-nav" aria-label={t('dock.prev')} onClick={onPrev}>
            <Icon name="chevron-left" />
          </button>
        ) : null}
        <div className="dock-row" ref={row}>
          {views.map((v) => {
            const { code, title } = labelOf(v);
            return (
              <button
                key={v.id}
                type="button"
                className={`chip${v.group ? ' is-group' : ''}`}
                data-machine={v.id}
                aria-current={current === v.id ? 'true' : undefined}
                onClick={() => onOpen(v.id)}
              >
                <i className={`dot ${v.state}`} aria-hidden="true" />
                <b>{code}</b>
                <span>{title}</span>
                <span className="g-sr">
                  {v.group ? `, ${t('groups.chipSr', { count: v.machines.length, n: f.num(v.machines.length) })}` : ''}, {t(`state.${v.state}`)}
                  {v.alerts ? `, ${t('dock.points', { count: v.alerts, n: f.num(v.alerts) })}` : ''}
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

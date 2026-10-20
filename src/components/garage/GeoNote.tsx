'use client';

// Ligne « position » des fenêtres de saisie : état du GPS et case pour ne pas joindre la position cette fois.
import { useTranslations } from 'next-intl';
import { useFormat } from '@/components/FormatProvider';
import { Icon } from '@/components/Icons';
import type { GeoState } from '@/lib/geo';

export function GeoNote({ state, accuracy, on, onToggle }: { state: GeoState; accuracy: number | null; on: boolean; onToggle: (on: boolean) => void }) {
  const t = useTranslations('garage.geo');
  const f = useFormat();
  if (state === 'off') return null;
  if (state === 'ok') {
    return (
      <label className="g-geo is-ok">
        <input type="checkbox" checked={on} onChange={(e) => onToggle(e.target.checked)} />
        <Icon name="pin" />
        <span>{accuracy != null ? t('attach', { meters: f.num(Math.round(accuracy)) }) : t('attachNoAccuracy')}</span>
      </label>
    );
  }
  return (
    <p className={`g-geo${state === 'locating' ? '' : ' is-off'}`} role="status">
      <Icon name="pin" />
      <span>{t(state)}</span>
    </p>
  );
}

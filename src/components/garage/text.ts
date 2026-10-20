'use client';

// Textes composés du garage (machine, échéances) dans la langue de l'interface, avec les formats de l'entreprise.
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useFormat } from '@/components/FormatProvider';
import { machineMakeModel, type DueState } from '@/lib/domain';
import type { Format } from '@/lib/format';
import type { Machine, Schedule } from '@/lib/types';
import { useDomainText } from '@/lib/use-domain-text';

export interface GarageText {
  /** « Pelle sur chenilles · 21 t ». */
  eyebrow(m: Pick<Machine, 'kind' | 'weight_t'>): string;
  /** « Liebherr · L 550 · 2021 · N° L550-2105-1187 · VS 287 514 ». */
  details(m: Machine): string;
  /** « à 7’000 h » ou « le 15.02.2027 ». */
  target(s: Pick<Schedule, 'basis' | 'due_hours' | 'due_date'>): string;
  /** « toutes les 500 h », « tous les ans », « tous les 6 mois », « une seule fois ». */
  interval(s: Pick<Schedule, 'basis' | 'interval_hours' | 'interval_days'>): string;
  /** « À jour », « À surveiller », « En retard ». */
  state(s: DueState): string;
  /** Statut de réparation en minuscules dans une phrase : « en attente de pièce ». */
  repairInline(status: string): string;
}

/** Poids d'une machine : « 21 », « 2.7 ». */
export function weightText(f: Format, weight: number | string): string {
  const w = Number(weight);
  return f.num(w, Number.isInteger(w) ? 0 : 1);
}

export function useGarageText(): GarageText {
  const t = useTranslations('garage');
  const f = useFormat();
  const dt = useDomainText();

  return useMemo<GarageText>(
    () => ({
      eyebrow(m) {
        const kind = dt.kind(m.kind);
        return m.weight_t ? t('machine.eyebrow', { kind, weight: weightText(f, m.weight_t) }) : kind;
      },
      details(m) {
        return [machineMakeModel(m), m.serial ? t('machine.serial', { serial: m.serial }) : null, m.plate].filter(Boolean).join(' · ');
      },
      target(s) {
        return s.basis === 'heures' ? t('due.atHours', { hours: f.hours(Number(s.due_hours)) }) : t('due.onDate', { date: f.date(s.due_date) });
      },
      interval(s) {
        if (s.basis === 'heures') return s.interval_hours ? t('due.everyHours', { hours: f.hours(Number(s.interval_hours)) }) : t('due.once');
        const d = s.interval_days;
        if (!d) return t('due.once');
        if (d % 365 === 0) return t('due.everyYears', { count: d / 365, n: f.num(d / 365) });
        const months = Math.round(d / 30.44);
        if (months >= 1 && Math.abs(months * 30.44 - d) <= 2) return t('due.everyMonths', { count: months, n: f.num(months) });
        return t('due.everyDays', { count: d, n: f.num(d) });
      },
      state(s) {
        return t(`state.${s}`);
      },
      repairInline(status) {
        return t('repairInline', { status });
      },
    }),
    [t, f, dt],
  );
}

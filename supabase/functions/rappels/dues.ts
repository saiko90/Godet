// Échéances : mêmes règles que l'application (src/lib/domain.ts, `weeklyRate` et `dueOf`), pour qu'un rappel
// annonce exactement ce que montre le garage. Toute évolution de domain.ts doit être reportée ici.

import { addDays, daysBetween } from './format.ts';

/** Rythme supposé quand les relevés ne suffisent pas (h par semaine), comme dans domain.ts. */
export const DEFAULT_WEEKLY_RATE = 30;
const DAY_MS = 86_400_000;

export interface ReadingRow {
  machine_id: string;
  hours: number | string;
  read_at: string;
}

export interface ScheduleRow {
  id: string;
  machine_id: string;
  label: string;
  basis: 'heures' | 'date';
  interval_hours: number | string | null;
  last_hours: number | string | null;
  due_hours: number | string | null;
  due_date: string | null;
}

export interface Due {
  scheduleId: string;
  machineId: string;
  label: string;
  /** « h » : échéance au compteur ; « j » : échéance en date. */
  unit: 'h' | 'j';
  /** Heures restantes (base heures) ou jours restants (base date). Négatif : dépassé. */
  left: number;
  /** Jours avant l'échéance (estimés pour la base heures) : sert au tri et au seuil en jours. */
  daysLeft: number;
  /** Date prévue (réelle pour la base date, estimée pour la base heures). */
  dueDate: string;
  /** Rythme utilisé pour l'estimation (h par semaine) et s'il vient des relevés. */
  rate: number;
  rateKnown: boolean;
}

/**
 * Rythme d'utilisation en heures par semaine, d'après les relevés des 90 derniers jours (null si inconnu).
 * `readings` : relevés d'UNE machine, dans n'importe quel ordre.
 */
export function weeklyRate(readings: ReadingRow[]): number | null {
  const rs = [...readings].sort((a, b) => Date.parse(a.read_at) - Date.parse(b.read_at));
  if (rs.length < 2) return null;
  const last = rs[rs.length - 1];
  const lastT = Date.parse(last.read_at);
  const first = rs.find((r) => Date.parse(r.read_at) >= lastT - 90 * DAY_MS && r !== last) ?? rs[0];
  const days = (lastT - Date.parse(first.read_at)) / DAY_MS;
  if (days < 7) return null;
  const rate = ((Number(last.hours) - Number(first.hours)) / days) * 7;
  return rate > 0.5 ? Math.round(rate * 10) / 10 : null;
}

/** Rythme de chaque machine (relevés de toutes les machines mélangés). */
export function weeklyRates(readings: ReadingRow[]): Map<string, number | null> {
  const byMachine = new Map<string, ReadingRow[]>();
  for (const r of readings) {
    const list = byMachine.get(r.machine_id);
    if (list) list.push(r);
    else byMachine.set(r.machine_id, [r]);
  }
  const out = new Map<string, number | null>();
  for (const [id, list] of byMachine) out.set(id, weeklyRate(list));
  return out;
}

/** État d'une échéance pour une machine dont le compteur indique `machineHours`. */
export function dueOf(s: ScheduleRow, machineHours: number, rate: number | null, today: string): Due {
  const r = rate ?? DEFAULT_WEEKLY_RATE;
  if (s.basis === 'heures') {
    const due = Number(s.due_hours ?? 0);
    const left = Math.round((due - machineHours) * 10) / 10;
    const daysLeft = Math.round((left / r) * 7);
    return {
      scheduleId: s.id,
      machineId: s.machine_id,
      label: s.label,
      unit: 'h',
      left,
      daysLeft,
      dueDate: left >= 0 ? addDays(today, daysLeft) : today,
      rate: r,
      rateKnown: rate != null,
    };
  }
  const dueDate = s.due_date ?? today;
  const days = daysBetween(today, dueDate);
  return {
    scheduleId: s.id,
    machineId: s.machine_id,
    label: s.label,
    unit: 'j',
    left: days,
    daysLeft: days,
    dueDate,
    rate: r,
    rateKnown: rate != null,
  };
}

export function isOverdue(d: Due): boolean {
  return d.left < 0;
}

/**
 * L'échéance entre-t-elle dans les seuils de la personne ?
 * - en date : `leadDays` jours avant (ou dépassée) ;
 * - au compteur : `leadHours` heures avant, ou plus tôt si, au rythme d'utilisation, elle tombe dans `leadDays` jours.
 */
export function isWithinLead(d: Due, leadDays: number, leadHours: number): boolean {
  if (d.unit === 'h') return d.left <= leadHours || d.daysLeft <= leadDays;
  return d.daysLeft <= leadDays;
}

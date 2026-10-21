// Fiche rapide d'une machine dans l'agenda de location : état, échéances à surveiller, réparations ouvertes.
// Construite côté serveur (compte) ou dans le navigateur (démonstration) avec les textes de la langue.
import { duesOf, type DueState } from '@/lib/domain';
import type { DomainText } from '@/lib/domain-text';
import type { Entry, Machine, Schedule } from '@/lib/types';

export interface MachineQuickInfo {
  hours: number;
  health: DueState;
  healthLabel: string;
  dues: { label: string; state: DueState; text: string }[];
  repairs: { title: string; status: string; date: string; details: string | null }[];
}

export function buildMachineInfo(
  machines: Pick<Machine, 'id' | 'hours'>[],
  schedules: Schedule[],
  openRepairs: Pick<Entry, 'machine_id' | 'title' | 'repair_status' | 'date' | 'details'>[],
  today: string,
  dt: DomainText,
): Record<string, MachineQuickInfo> {
  const out: Record<string, MachineQuickInfo> = {};
  for (const m of machines) {
    const dues = duesOf(m as Machine, schedules, null, today).filter((d) => d.state !== 'ok');
    const repairs = openRepairs.filter((e) => e.machine_id === m.id);
    const health: DueState = dues.some((d) => d.state === 'bad') ? 'bad' : dues.length || repairs.length ? 'warn' : 'ok';
    out[m.id] = {
      hours: Number(m.hours),
      health,
      healthLabel: dt.health(health),
      dues: dues.map((d) => ({ label: d.schedule.label, state: d.state, text: dt.dueText(d) })),
      repairs: repairs.map((e) => ({
        title: e.title,
        status: e.repair_status ? dt.repair(e.repair_status) : '',
        date: e.date,
        details: e.details,
      })),
    };
  }
  return out;
}

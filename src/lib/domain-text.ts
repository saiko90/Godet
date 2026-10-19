// Textes du domaine (types de machines, saisies, rôles, échéances…) dans la langue de l'interface.
// Les règles restent dans domain.ts ; ici on ne fait que les traduire (zone de messages « domain »).
import type { CostCategory, DueInfo, DueState } from '@/lib/domain';
import type { Format } from '@/lib/format';
import type { EntryKind, Machine, MachineKind, MemberRole, RepairStatus } from '@/lib/types';

/** Fonction de traduction de la zone « domain » (next-intl), vue de façon simplifiée. */
export type TFn = (key: string, values?: Record<string, string | number | Date>) => string;

export interface DomainText {
  /** « Pelle sur chenilles », « Raupenbagger »… */
  kind(kind: MachineKind): string;
  /** « Pelle », « Bagger »… */
  kindShort(kind: MachineKind): string;
  entry(kind: EntryKind): string;
  entryHint(kind: EntryKind): string;
  repair(status: RepairStatus): string;
  role(role: MemberRole): string;
  roleHint(role: MemberRole): string;
  cost(category: CostCategory): string;
  health(state: DueState): string;
  /** « Pelle 21 t », « Bagger 21 t ». */
  machineTitle(m: Pick<Machine, 'kind' | 'weight_t'>): string;
  /** « dans 158 h », « dépassé de 40 h », « le 15.02.2027 », « en retard de 3 jours ». */
  dueText(d: DueInfo): string;
  /** « Vers le 12.11.2026 au rythme actuel (≈ 36 h par semaine) », « Dans 12 jours »… */
  dueHint(d: DueInfo): string;
}

export function buildDomainText(t: TFn, f: Format): DomainText {
  return {
    kind: (k) => t(`machineKinds.${k}.label`),
    kindShort: (k) => t(`machineKinds.${k}.short`),
    entry: (k) => t(`entryKinds.${k}.label`),
    entryHint: (k) => t(`entryKinds.${k}.hint`),
    repair: (s) => t(`repairStatus.${s}`),
    role: (r) => t(`roles.${r}.label`),
    roleHint: (r) => t(`roles.${r}.hint`),
    cost: (c) => t(`costCategories.${c}`),
    health: (s) => t(`health.${s}`),
    machineTitle(m) {
      const short = t(`machineKinds.${m.kind}.short`);
      if (!m.weight_t) return short;
      const w = Number(m.weight_t);
      return t('machineTitle', { kind: short, weight: f.num(w, Number.isInteger(w) ? 0 : 1) });
    },
    dueText(d) {
      if (d.unit === 'h') {
        return d.left < 0 ? t('due.overdueHours', { hours: f.hours(-d.left) }) : t('due.inHours', { hours: f.hours(d.left) });
      }
      return d.left < 0 ? t('due.lateDays', { days: -d.left }) : t('due.onDate', { date: f.date(d.dueDate) });
    },
    dueHint(d) {
      if (d.unit === 'h') {
        if (d.left < 0) return t('due.hintAsap');
        return t('due.hintEstimate', {
          date: f.date(d.dueDate),
          rateKind: d.rateKnown ? 'actual' : 'average',
          rate: f.num(d.rate, Number.isInteger(d.rate) ? 0 : 1),
        });
      }
      if (d.left < 0) return t('due.hintLate');
      if (d.left === 0) return t('due.hintToday');
      return t('due.hintInDays', { days: d.left });
    },
  };
}

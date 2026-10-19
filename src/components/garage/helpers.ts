// Outils d'affichage du garage : libellés, statistiques d'une machine, droits sur une saisie ou un média.
import {
  availability,
  can,
  costTotals,
  entryCost,
  hoursSince,
  MACHINE_KINDS,
  machineMakeModel,
  monthlyCosts,
  type DueInfo,
  type DueState,
} from '@/lib/domain';
import { dateCH, grp, hrs } from '@/lib/format';
import type { Entry, EntryKind, Machine, MachineFile, MachineKind, MediaItem, MemberRole, Schedule } from '@/lib/types';

export type SheetTab = 'apercu' | 'carnet' | 'reparations' | 'pieces' | 'couts' | 'medias' | 'echeances';

export const TABS: { id: SheetTab; label: string }[] = [
  { id: 'apercu', label: 'Aperçu' },
  { id: 'carnet', label: 'Carnet' },
  { id: 'reparations', label: 'Réparations' },
  { id: 'pieces', label: 'Pièces' },
  { id: 'couts', label: 'Coûts' },
  { id: 'medias', label: 'Médias' },
  { id: 'echeances', label: 'Échéances' },
];

export const STATE_LABEL: Record<DueState, string> = { ok: 'À jour', warn: 'À surveiller', bad: 'En retard' };

/** Préfixe proposé pour le code d'une nouvelle machine (« PE-07 »). */
export const KIND_PREFIX: Record<MachineKind, string> = {
  pelle: 'PE',
  mini_pelle: 'MP',
  chargeuse: 'CH',
  dumper: 'DU',
  camion: 'CA',
  grue: 'GR',
  rouleau: 'RO',
  autre: 'EN',
};

export const PAINT_NAMES: Record<string, string> = {
  '#f3b71b': 'Jaune engin',
  '#e8792b': 'Orange',
  '#d8362f': 'Rouge',
  '#2f6fd8': 'Bleu',
  '#3c9a5f': 'Vert',
  '#e9e4d8': 'Blanc',
  '#5b6068': 'Gris anthracite',
  '#1d1f24': 'Noir',
};

/** Prochain code libre pour un type de machine : PE-01, PE-02… (numéro suivant le plus grand du parc). */
export function nextCode(kind: MachineKind, machines: Pick<Machine, 'code'>[]): string {
  const prefix = KIND_PREFIX[kind];
  const used = new Set(machines.map((m) => m.code.toUpperCase()));
  const highest = machines.reduce((max, m) => {
    const n = Number(/-(\d+)$/.exec(m.code)?.[1] ?? 0);
    return Math.max(max, n);
  }, 0);
  for (let n = highest + 1; n < highest + 200; n++) {
    const code = `${prefix}-${String(n).padStart(2, '0')}`;
    if (!used.has(code)) return code;
  }
  return `${prefix}-${String(highest + 1).padStart(2, '0')}`;
}

/** « Pelle sur chenilles · 21 t ». */
export function machineEyebrow(m: Pick<Machine, 'kind' | 'weight_t'>): string {
  const kind = MACHINE_KINDS[m.kind]?.label ?? 'Engin';
  return m.weight_t ? `${kind} · ${grp(Number(m.weight_t), Number.isInteger(Number(m.weight_t)) ? 0 : 1)} t` : kind;
}

/** « Liebherr · L 550 · 2021 · N° L550-2105-1187 · VS 287 514 ». */
export function machineDetails(m: Machine): string {
  return [machineMakeModel(m), m.serial ? `N°\u00a0${m.serial}` : null, m.plate].filter(Boolean).join(' · ');
}

/** « à 7’000 h » ou « le 15.02.2027 ». */
export function scheduleTarget(s: Schedule): string {
  return s.basis === 'heures' ? `à ${hrs(Number(s.due_hours))}` : `le ${dateCH(s.due_date)}`;
}

/** « toutes les 500 h », « tous les ans », « tous les 6 mois », « une seule fois ». */
export function intervalText(s: Pick<Schedule, 'basis' | 'interval_hours' | 'interval_days'>): string {
  if (s.basis === 'heures') return s.interval_hours ? `toutes les ${hrs(Number(s.interval_hours))}` : 'une seule fois';
  const d = s.interval_days;
  if (!d) return 'une seule fois';
  if (d % 365 === 0) return d === 365 ? 'tous les ans' : `tous les ${d / 365} ans`;
  const months = Math.round(d / 30.44);
  if (months >= 1 && Math.abs(months * 30.44 - d) <= 2) return months === 1 ? 'tous les mois' : `tous les ${months} mois`;
  return `tous les ${d} jours`;
}

/** Type de saisie le plus probable pour accomplir une échéance (« Contrôle annuel » → contrôle). */
export function kindForSchedule(label: string): EntryKind {
  if (/contr[ôo]le|expertise|tachygraphe|extincteur|s[ée]curit[ée]/i.test(label)) return 'controle';
  if (/inspection|usure|hivernage|nettoyage/i.test(label)) return 'inspection';
  return 'service';
}

/** Premier jour de la fenêtre des coûts (12 mois, mois courant compris). */
export function costWindowStart(today: string): string {
  const [y, m] = today.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 12, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`;
}

export interface MachineStats {
  months: ReturnType<typeof monthlyCosts>;
  totals: ReturnType<typeof costTotals>;
  /** Heures travaillées sur 12 mois d'après les relevés (null : inconnu). */
  worked: number | null;
  costPerHour: number | null;
  availability: number | null;
  downtime: number;
}

/** Coûts, heures travaillées et disponibilité d'une machine sur 12 mois (fenêtre des coûts). */
export function machineStats(machine: Machine, entries: Entry[], readings: MachineFile['readings'], today: string): MachineStats {
  const start = costWindowStart(today);
  const live = entries.filter((e) => !e.deleted_at && e.machine_id === machine.id);
  const inWindow = live.filter((e) => e.date >= start);
  const months = monthlyCosts(live, today);
  const totals = costTotals(live, today);
  const worked = hoursSince(readings, machine, start);
  const downtime = inWindow.reduce((s, e) => s + Number(e.downtime_hours || 0), 0);
  return {
    months,
    totals,
    worked,
    costPerHour: worked && totals.total ? totals.total / worked : null,
    availability: availability(inWindow, worked),
    downtime,
  };
}

/** Coûts des 12 derniers mois d'une machine, d'après les saisies récentes du parc. */
export function machineCost12(machineId: string, recent: Entry[], today: string): number {
  const start = costWindowStart(today);
  return recent.filter((e) => e.machine_id === machineId && !e.deleted_at && e.date >= start).reduce((s, e) => s + entryCost(e), 0);
}

export function canEditEntry(role: MemberRole, userId: string, e: Pick<Entry, 'created_by'>): boolean {
  return can.editAnyEntry(role) || e.created_by === userId;
}

export function canDeleteMedia(role: MemberRole, userId: string, m: Pick<MediaItem, 'created_by'>): boolean {
  return can.deleteAnyMedia(role) || m.created_by === userId;
}

/** Message d'une erreur attrapée, prêt à afficher. */
export function errorText(e: unknown, fallback: string): string {
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

/** La plus urgente des échéances non à jour, sinon la plus proche. */
export function nextDue(dues: DueInfo[]): DueInfo | null {
  return dues[0] ?? null;
}

/** Pluriel simple : « 1 photo », « 3 photos ». */
export function plural(n: number, one: string, many = `${one}s`): string {
  return `${grp(n)} ${n > 1 ? many : one}`;
}

/** Saisie avec un compteur au moment de l'intervention ? */
export const KINDS_WITH_HOURS: readonly EntryKind[] = ['service', 'reparation', 'controle', 'inspection'];

// Règles métier de Godet : libellés, droits, état des échéances, santé des machines, coûts.
// Fonctions pures, utilisables côté serveur comme dans le navigateur (et en mode démo).
import type { IconName } from '@/components/Icons';
import { addDays, dateCH, daysBetween, grp, hrs, monthLabel } from '@/lib/format';
import type {
  Entry,
  EntryKind,
  HourReading,
  Machine,
  MachineKind,
  MemberRole,
  RepairStatus,
  Schedule,
} from '@/lib/types';

export type DueState = 'ok' | 'warn' | 'bad';

export const MACHINE_KINDS: Record<MachineKind, { label: string; short: string }> = {
  pelle: { label: 'Pelle sur chenilles', short: 'Pelle' },
  mini_pelle: { label: 'Mini-pelle', short: 'Mini-pelle' },
  chargeuse: { label: 'Chargeuse sur pneus', short: 'Chargeuse' },
  dumper: { label: 'Dumper', short: 'Dumper' },
  camion: { label: 'Camion', short: 'Camion' },
  grue: { label: 'Grue', short: 'Grue' },
  rouleau: { label: 'Rouleau compresseur', short: 'Rouleau' },
  autre: { label: 'Autre engin', short: 'Engin' },
};

export const ENTRY_KINDS: Record<EntryKind, { label: string; icon: IconName; hint: string }> = {
  service: { label: 'Service', icon: 'drop', hint: 'Vidanges, filtres, graissage selon le plan du constructeur' },
  controle: { label: 'Contrôle', icon: 'shield', hint: 'Contrôle de sécurité, expertise, contrôle annuel' },
  inspection: { label: 'Inspection', icon: 'search', hint: 'Tour de la machine, niveaux, usure, nettoyage' },
  reparation: { label: 'Réparation', icon: 'wrench', hint: 'Panne, fuite, casse : ce qui a été réparé et ce que ça a coûté' },
  piece: { label: 'Pièce', icon: 'cog', hint: 'Pièce changée ou achetée, avec sa référence et sa garantie' },
  note: { label: 'Note', icon: 'note', hint: 'Remarque, observation du machiniste' },
};

export const REPAIR_STATUS: Record<RepairStatus, { label: string; state: DueState }> = {
  fait: { label: 'Réparée', state: 'ok' },
  en_cours: { label: 'En cours', state: 'warn' },
  attente_piece: { label: 'En attente de pièce', state: 'warn' },
};

export const ROLES: Record<MemberRole, { label: string; hint: string }> = {
  owner: { label: 'Propriétaire', hint: 'Tous les droits, y compris l’entreprise et l’abonnement.' },
  admin: { label: 'Administrateur', hint: 'Gère le parc, les échéances et l’équipe.' },
  mechanic: { label: 'Mécanicien', hint: 'Ajoute et modifie les machines, les échéances et toutes les saisies.' },
  operator: { label: 'Machiniste', hint: 'Consulte le parc, saisit les heures, les interventions et les photos.' },
};

/** Droits par rôle (la base de données applique les mêmes règles). */
export const can = {
  /** Ajouter, modifier, archiver des machines ; gérer les échéances. */
  manageFleet: (r: MemberRole) => r === 'owner' || r === 'admin' || r === 'mechanic',
  /** Inviter, changer les rôles, retirer des membres ; modifier l'entreprise. */
  manageTeam: (r: MemberRole) => r === 'owner' || r === 'admin',
  /** Modifier ou retirer une saisie faite par quelqu'un d'autre. */
  editAnyEntry: (r: MemberRole) => r === 'owner' || r === 'admin' || r === 'mechanic',
  /** Supprimer un média déposé par quelqu'un d'autre. */
  deleteAnyMedia: (r: MemberRole) => r === 'owner' || r === 'admin',
};

/** Couleurs de peinture proposées pour une machine (la première est le jaune engin de la marque). */
export const PAINTS = ['#f3b71b', '#e8792b', '#d8362f', '#2f6fd8', '#3c9a5f', '#e9e4d8', '#5b6068', '#1d1f24'] as const;

export const DEFAULT_WEEKLY_RATE = 30;

export const entryCost = (e: Pick<Entry, 'cost_parts' | 'cost_labour'>) => Number(e.cost_parts || 0) + Number(e.cost_labour || 0);
export const isOpenRepair = (e: Entry) => e.kind === 'reparation' && !e.deleted_at && (e.repair_status === 'en_cours' || e.repair_status === 'attente_piece');

/** Rythme d'utilisation en heures par semaine, d'après les relevés des 90 derniers jours (null si inconnu). */
export function weeklyRate(readings: HourReading[], machineId: string): number | null {
  const rs = readings.filter((r) => r.machine_id === machineId).sort((a, b) => a.read_at.localeCompare(b.read_at));
  if (rs.length < 2) return null;
  const last = rs[rs.length - 1];
  const lastT = Date.parse(last.read_at);
  const first = rs.find((r) => Date.parse(r.read_at) >= lastT - 90 * 86400000 && r !== last) ?? rs[0];
  const days = (lastT - Date.parse(first.read_at)) / 86400000;
  if (days < 7) return null;
  const rate = ((Number(last.hours) - Number(first.hours)) / days) * 7;
  return rate > 0.5 ? Math.round(rate * 10) / 10 : null;
}

export interface DueInfo {
  schedule: Schedule;
  state: DueState;
  /** Heures restantes (base heures) ou jours restants (base date). Négatif : dépassé. */
  left: number;
  unit: 'h' | 'j';
  /** « dans 158 h », « dépassé de 40 h », « le 15.02.2027 », « en retard de 3 j ». */
  text: string;
  /** « Vers le 12.11.2026 au rythme actuel (≈ 36 h par semaine) ». */
  hint: string;
  /** Avancement depuis la dernière fois (0 à 1), si connu. */
  progress: number | null;
  /** Date prévue (réelle pour la base date, estimée pour la base heures). */
  dueDate: string | null;
  /** Jours avant l'échéance (estimés pour la base heures) : sert au tri. */
  daysLeft: number;
  /** Rythme utilisé pour l'estimation (h par semaine) et s'il vient des relevés (sinon : moyenne par défaut). */
  rate: number;
  rateKnown: boolean;
}

/** État d'une échéance pour une machine donnée. */
export function dueOf(s: Schedule, machineHours: number, rate: number | null, today: string): DueInfo {
  const r = rate ?? DEFAULT_WEEKLY_RATE;
  if (s.basis === 'heures') {
    const due = Number(s.due_hours ?? 0);
    const left = Math.round((due - machineHours) * 10) / 10;
    const daysLeft = Math.round((left / r) * 7);
    const interval = s.interval_hours != null ? Number(s.interval_hours) : null;
    const warnAt = Math.min(200, 0.4 * (interval ?? 500));
    const state: DueState = left < 0 ? 'bad' : left <= warnAt || daysLeft <= 14 ? 'warn' : 'ok';
    const from = s.last_hours != null ? Number(s.last_hours) : interval != null ? due - interval : null;
    const progress = from != null && due > from ? Math.min(1, Math.max(0, (machineHours - from) / (due - from))) : null;
    const dueDate = left >= 0 ? addDays(today, daysLeft) : today;
    return {
      schedule: s,
      state,
      left,
      unit: 'h',
      text: left < 0 ? `dépassé de ${hrs(-left)}` : `dans ${hrs(left)}`,
      hint:
        left < 0
          ? 'À faire dès que possible'
          : `Vers le ${dateCH(dueDate)} au rythme ${rate ? 'actuel' : 'moyen'} (≈ ${grp(r)} h par semaine)`,
      progress,
      dueDate,
      daysLeft,
      rate: r,
      rateKnown: rate != null,
    };
  }
  const dueDate = s.due_date ?? today;
  const days = daysBetween(today, dueDate);
  const state: DueState = days < 0 ? 'bad' : days <= 30 ? 'warn' : 'ok';
  let progress: number | null = null;
  if (s.last_date) {
    const span = daysBetween(s.last_date, dueDate);
    if (span > 0) progress = Math.min(1, Math.max(0, daysBetween(s.last_date, today) / span));
  }
  return {
    schedule: s,
    state,
    left: days,
    unit: 'j',
    text: days < 0 ? `en retard de ${-days} j` : `le ${dateCH(dueDate)}`,
    hint: days < 0 ? 'En retard' : days === 0 ? 'Aujourd’hui' : `Dans ${days} jours`,
    progress,
    dueDate,
    daysLeft: days,
    rate: r,
    rateKnown: rate != null,
  };
}

/** Échéances actives d'une machine, de la plus urgente à la plus lointaine. */
export function duesOf(machine: Machine, schedules: Schedule[], rate: number | null, today: string): DueInfo[] {
  return schedules
    .filter((s) => s.machine_id === machine.id && s.active)
    .map((s) => dueOf(s, Number(machine.hours), rate, today))
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

export interface MachineHealth {
  state: DueState;
  /** Nombre de points d'attention : échéances proches ou dépassées + réparations ouvertes. */
  alerts: number;
  dues: DueInfo[];
  openRepairs: Entry[];
  rate: number | null;
}

/** Santé d'une machine : la pire échéance et les réparations ouvertes. */
export function machineHealth(
  machine: Machine,
  schedules: Schedule[],
  openRepairs: Entry[],
  readings: HourReading[],
  today: string,
): MachineHealth {
  const rate = weeklyRate(readings, machine.id);
  const dues = duesOf(machine, schedules, rate, today);
  const open = openRepairs.filter((e) => e.machine_id === machine.id && isOpenRepair(e));
  const state: DueState = dues.some((d) => d.state === 'bad')
    ? 'bad'
    : dues.some((d) => d.state === 'warn') || open.length
      ? 'warn'
      : 'ok';
  return { state, alerts: dues.filter((d) => d.state !== 'ok').length + open.length, dues, openRepairs: open, rate };
}

export type CostCategory = 'entretien' | 'reparations' | 'pieces';

export function costCategory(kind: EntryKind): CostCategory {
  return kind === 'reparation' ? 'reparations' : kind === 'piece' ? 'pieces' : 'entretien';
}

export const COST_CATEGORIES: Record<CostCategory, { label: string; color: string }> = {
  entretien: { label: 'Entretien', color: '#f3b71b' },
  reparations: { label: 'Réparations', color: '#e2683c' },
  pieces: { label: 'Pièces', color: '#8fa6c4' },
};

export interface MonthCost {
  ym: string;
  label: string;
  entretien: number;
  reparations: number;
  pieces: number;
  total: number;
}

/** Coûts par mois sur les `months` derniers mois (mois courant compris), du plus ancien au plus récent. */
export function monthlyCosts(entries: Entry[], today: string, months = 12): MonthCost[] {
  const [y, m] = today.split('-').map(Number);
  const out: MonthCost[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    out.push({ ym, label: monthLabel(ym), entretien: 0, reparations: 0, pieces: 0, total: 0 });
  }
  const index = new Map(out.map((o, i) => [o.ym, i]));
  for (const e of entries) {
    if (e.deleted_at) continue;
    const i = index.get(e.date.slice(0, 7));
    if (i == null) continue;
    const c = entryCost(e);
    out[i][costCategory(e.kind)] += c;
    out[i].total += c;
  }
  return out;
}

/** Totaux des coûts sur la période de `monthlyCosts`. */
export function costTotals(entries: Entry[], today: string, months = 12) {
  const ms = monthlyCosts(entries, today, months);
  return ms.reduce(
    (t, m) => ({
      entretien: t.entretien + m.entretien,
      reparations: t.reparations + m.reparations,
      pieces: t.pieces + m.pieces,
      total: t.total + m.total,
    }),
    { entretien: 0, reparations: 0, pieces: 0, total: 0 },
  );
}

/** Heures travaillées depuis `sinceISO` d'après les relevés (null si inconnu). */
export function hoursSince(readings: HourReading[], machine: Machine, sinceISO: string): number | null {
  const rs = readings.filter((r) => r.machine_id === machine.id).sort((a, b) => a.read_at.localeCompare(b.read_at));
  if (!rs.length) return null;
  const before = [...rs].reverse().find((r) => r.read_at.slice(0, 10) <= sinceISO) ?? rs[0];
  const worked = Number(machine.hours) - Number(before.hours);
  return worked > 0 ? worked : null;
}

/** Disponibilité sur 12 mois : 1 − immobilisation / (heures travaillées + immobilisation). */
export function availability(entries: Entry[], worked: number | null): number | null {
  if (!worked) return null;
  const down = entries.filter((e) => !e.deleted_at && e.downtime_hours).reduce((s, e) => s + Number(e.downtime_hours), 0);
  return Math.max(0, Math.min(1, 1 - down / (worked + down)));
}

/** Libellé court d'une machine : « Pelle 21 t », « Chargeuse », « Mini-pelle 2.7 t ». */
export function machineTitle(m: Pick<Machine, 'kind' | 'weight_t'>): string {
  const k = MACHINE_KINDS[m.kind]?.short ?? 'Engin';
  return m.weight_t ? `${k} ${grp(Number(m.weight_t), Number.isInteger(Number(m.weight_t)) ? 0 : 1)} t` : k;
}

/** Marque et modèle : « Démo · Pelle sur chenilles 21 t ». */
export function machineMakeModel(m: Pick<Machine, 'brand' | 'model' | 'year'>): string {
  return [m.brand, m.model, m.year ? String(m.year) : null].filter(Boolean).join(' · ');
}

// Qui reçoit un rappel, quand, et avec quoi. Fonctions pures (testées dans rappels.test.ts).

import { daysBetween, isoWeekday, zurichDay } from './format.ts';
import { dueOf, isOverdue, isWithinLead, weeklyRates, type Due, type ReadingRow, type ScheduleRow } from './dues.ts';

export type Role = 'owner' | 'admin' | 'mechanic' | 'operator';
export type Frequency = 'quotidien' | 'hebdo';

/** Réglages par défaut d'une personne sans ligne `notification_prefs` (identiques aux valeurs par défaut de la table). */
export const DEFAULT_SETTINGS = { frequency: 'hebdo' as Frequency, leadDays: 14, leadHours: 50 };
/** Jour du résumé hebdomadaire (ISO : 1 = lundi). */
export const WEEKLY_DAY = 1;
/** Rôles prévenus par défaut ; les machinistes seulement s'ils ont activé et enregistré leurs rappels. */
const MANAGER_ROLES: ReadonlySet<string> = new Set(['owner', 'admin', 'mechanic']);
const ROLES: ReadonlySet<string> = new Set(['owner', 'admin', 'mechanic', 'operator']);

export interface PrefsRow {
  user_id: string;
  email_enabled: boolean;
  frequency: string;
  lead_days: number;
  lead_hours: number;
  last_digest_at: string | null;
}

export interface MembershipRow {
  org_id: string;
  user_id: string;
  role: string;
}

export interface Settings {
  frequency: Frequency;
  leadDays: number;
  leadHours: number;
  /** La personne a enregistré ses réglages (ligne `notification_prefs`). */
  hasRow: boolean;
}

export interface Recipient {
  userId: string;
  settings: Settings;
  orgs: { orgId: string; role: Role }[];
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

/** Réglages effectifs d'une personne, ou null si elle ne veut aucun rappel par e-mail. */
export function settingsOf(row: PrefsRow | undefined): Settings | null {
  if (!row) return { ...DEFAULT_SETTINGS, hasRow: false };
  if (!row.email_enabled || row.frequency === 'jamais') return null;
  return {
    frequency: row.frequency === 'quotidien' ? 'quotidien' : 'hebdo',
    leadDays: clampInt(row.lead_days, 1, 90, DEFAULT_SETTINGS.leadDays),
    leadHours: clampInt(row.lead_hours, 5, 500, DEFAULT_SETTINGS.leadHours),
    hasRow: true,
  };
}

/**
 * Personnes à prévenir et leurs entreprises :
 * - propriétaire, administrateur, mécanicien : par défaut (sauf rappels désactivés ou fréquence « jamais ») ;
 * - machiniste : seulement s'il a enregistré des réglages avec les rappels activés.
 */
export function selectRecipients(memberships: MembershipRow[], prefs: Map<string, PrefsRow>): Recipient[] {
  const out = new Map<string, Recipient>();
  for (const m of memberships) {
    if (!ROLES.has(m.role)) continue;
    const row = prefs.get(m.user_id);
    const settings = settingsOf(row);
    if (!settings) continue;
    if (!MANAGER_ROLES.has(m.role) && !settings.hasRow) continue;
    let r = out.get(m.user_id);
    if (!r) {
      r = { userId: m.user_id, settings, orgs: [] };
      out.set(m.user_id, r);
    }
    if (!r.orgs.some((o) => o.orgId === m.org_id)) r.orgs.push({ orgId: m.org_id, role: m.role as Role });
  }
  return [...out.values()].sort((a, b) => a.userId.localeCompare(b.userId));
}

/** Jour (Zurich) du dernier rappel réellement envoyé, d'après la préférence et le journal des envois. */
export function lastDigestDay(...instants: (string | null | undefined)[]): string | null {
  let best: number | null = null;
  for (const iso of instants) {
    if (!iso) continue;
    const t = Date.parse(iso);
    if (Number.isFinite(t) && (best == null || t > best)) best = t;
  }
  return best == null ? null : zurichDay(new Date(best));
}

/**
 * Le rappel est-il dû aujourd'hui (`today` : jour de Zurich) ?
 * - chaque jour : pas encore envoyé aujourd'hui ;
 * - chaque semaine : le lundi, au plus un résumé tous les 7 jours.
 */
export function isDueToday(frequency: Frequency, lastDay: string | null, today: string): boolean {
  if (frequency === 'quotidien') return !lastDay || lastDay < today;
  return isoWeekday(today) === WEEKLY_DAY && (!lastDay || daysBetween(lastDay, today) >= 7);
}

// ------------------------------------------------------------------ parc d'une entreprise

export interface OrgRow {
  id: string;
  name: string;
  country: string | null;
  currency: string | null;
  plan: string | null;
}

export interface MachineRow {
  id: string;
  org_id: string;
  code: string;
  kind: string;
  weight_t: number | string | null;
  hours: number | string;
}

export interface RepairRow {
  id: string;
  org_id: string;
  machine_id: string;
  title: string;
  date: string;
  repair_status: string;
  cost_parts: number | string | null;
  cost_labour: number | string | null;
}

export interface OrgFleet {
  org: OrgRow;
  machines: Map<string, MachineRow>;
  /** Échéances actives des machines, de la plus urgente à la plus lointaine. */
  dues: Due[];
  /** Réparations ouvertes, de la plus ancienne à la plus récente. */
  repairs: RepairRow[];
}

/** Échéances et réparations ouvertes d'une entreprise (indépendantes de la personne qui lit). */
export function buildOrgFleet(
  org: OrgRow,
  machines: MachineRow[],
  schedules: (ScheduleRow & { org_id?: string })[],
  repairs: RepairRow[],
  readings: ReadingRow[],
  today: string,
): OrgFleet {
  const byId = new Map(machines.map((m) => [m.id, m]));
  const rates = weeklyRates(readings.filter((r) => byId.has(r.machine_id)));
  const dues = schedules
    .filter((s) => byId.has(s.machine_id))
    .map((s) => dueOf(s, Number(byId.get(s.machine_id)!.hours), rates.get(s.machine_id) ?? null, today))
    .sort((a, b) => a.daysLeft - b.daysLeft || a.label.localeCompare(b.label));
  const open = repairs
    .filter((r) => byId.has(r.machine_id) && (r.repair_status === 'en_cours' || r.repair_status === 'attente_piece'))
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  return { org, machines: byId, dues, repairs: open };
}

export interface DigestSection {
  org: OrgRow;
  role: Role;
  machines: Map<string, MachineRow>;
  dues: Due[];
  repairs: RepairRow[];
}

/** Ce que la personne doit voir, entreprise par entreprise (sections vides retirées). */
export function buildSections(recipient: Recipient, fleets: Map<string, OrgFleet>): DigestSection[] {
  const { leadDays, leadHours } = recipient.settings;
  const out: DigestSection[] = [];
  for (const { orgId, role } of recipient.orgs) {
    const fleet = fleets.get(orgId);
    if (!fleet) continue;
    const dues = fleet.dues.filter((d) => isWithinLead(d, leadDays, leadHours));
    if (!dues.length && !fleet.repairs.length) continue;
    out.push({ org: fleet.org, role, machines: fleet.machines, dues, repairs: fleet.repairs });
  }
  return out.sort((a, b) => a.org.name.localeCompare(b.org.name) || a.org.id.localeCompare(b.org.id));
}

export interface DigestTotals {
  dues: number;
  overdue: number;
  repairs: number;
  orgs: number;
}

export function totalsOf(sections: DigestSection[]): DigestTotals {
  return sections.reduce(
    (t, s) => ({
      dues: t.dues + s.dues.length,
      overdue: t.overdue + s.dues.filter(isOverdue).length,
      repairs: t.repairs + s.repairs.length,
      orgs: t.orgs + 1,
    }),
    { dues: 0, overdue: 0, repairs: 0, orgs: 0 },
  );
}

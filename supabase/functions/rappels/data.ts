// Accès à la base avec la clé de service (la RLS ne s'applique pas : chaque requête filtre elle-même).
// Mêmes filtres que le garage (src/lib/repo/supabase.ts, `loadFleet`) : machines non archivées, échéances actives,
// réparations ouvertes non retirées, relevés des 120 derniers jours.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { MachineRow, MembershipRow, OrgRow, PrefsRow, RepairRow } from './digest.ts';
import type { ReadingRow, ScheduleRow } from './dues.ts';

/** Une requête PostgREST renvoie au plus 1’000 lignes. */
const PAGE = 1000;
/** Identifiants par filtre « in » (longueur des adresses). */
const CHUNK = 100;
/** Entreprises chargées ensemble. */
const ORG_CHUNK = 25;

export const REMINDER_KINDS = ['rappel_quotidien', 'rappel_hebdo'] as const;

/** Erreur de la base, sans donnée personnelle (code Postgres/PostgREST et message technique). */
export class DbError extends Error {
  constructor(
    readonly step: string,
    readonly code: string,
    message: string,
  ) {
    super(`${step} : ${code} ${message}`.slice(0, 300));
    this.name = 'DbError';
  }
}

interface PgError {
  code?: string;
  message?: string;
}

function fail(step: string, error: PgError): DbError {
  return new DbError(step, error.code || 'inconnu', error.message || '');
}

type Page<T> = PromiseLike<{ data: T[] | null; error: PgError | null }>;

async function fetchAll<T>(step: string, page: (from: number, to: number) => Page<T>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) throw fail(step, error);
    const rows = data ?? [];
    out.push(...rows);
    if (rows.length < PAGE) return out;
  }
}

function chunks<T>(list: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

// ------------------------------------------------------------------ garde-fou

export type Claim = { claimed: true } | { claimed: false; lastRunAt: string | null };

/**
 * Réserve l'exécution du jour : au plus une exécution réelle toutes les `minHours` heures (table job_runs).
 * Atomique : la mise à jour conditionnelle et l'insertion (clé primaire) ne réussissent qu'une fois.
 */
export async function claimRun(db: SupabaseClient, job: string, now: Date, minHours: number): Promise<Claim> {
  const nowIso = now.toISOString();
  const cutoff = new Date(now.getTime() - minHours * 3_600_000).toISOString();
  const updated = await db.from('job_runs').update({ last_run_at: nowIso }).eq('job', job).lt('last_run_at', cutoff).select('job');
  if (updated.error) throw fail('job_runs', updated.error);
  if (updated.data?.length) return { claimed: true };

  const inserted = await db.from('job_runs').insert({ job, last_run_at: nowIso });
  if (!inserted.error) return { claimed: true };
  if (inserted.error.code !== '23505') throw fail('job_runs', inserted.error);

  const current = await db.from('job_runs').select('last_run_at').eq('job', job).maybeSingle();
  if (current.error) throw fail('job_runs', current.error);
  return { claimed: false, lastRunAt: (current.data as { last_run_at?: string } | null)?.last_run_at ?? null };
}

// ------------------------------------------------------------------ personnes

export function loadPrefs(db: SupabaseClient): Promise<PrefsRow[]> {
  return fetchAll<PrefsRow>('notification_prefs', (a, b) =>
    db
      .from('notification_prefs')
      .select('user_id, email_enabled, frequency, lead_days, lead_hours, last_digest_at')
      .order('user_id')
      .range(a, b),
  );
}

export function loadMemberships(db: SupabaseClient): Promise<MembershipRow[]> {
  return fetchAll<MembershipRow>('memberships', (a, b) =>
    db.from('memberships').select('org_id, user_id, role').order('org_id').order('user_id').range(a, b),
  );
}

export interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  locale: string | null;
}

export async function loadProfiles(db: SupabaseClient, ids: string[]): Promise<Map<string, ProfileRow>> {
  const out = new Map<string, ProfileRow>();
  for (const part of chunks(ids, CHUNK)) {
    const { data, error } = await db.from('profiles').select('id, full_name, email, locale').in('id', part);
    if (error) throw fail('profiles', error);
    for (const p of (data ?? []) as ProfileRow[]) out.set(p.id, p);
  }
  return out;
}

/** Dernier rappel réellement envoyé à chaque personne depuis `sinceIso` (journal des envois). */
export async function loadLastSends(db: SupabaseClient, ids: string[], sinceIso: string): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (const part of chunks(ids, CHUNK)) {
    const rows = await fetchAll<{ user_id: string; created_at: string }>('notification_log', (a, b) =>
      db
        .from('notification_log')
        .select('user_id, created_at')
        .in('user_id', part)
        .eq('status', 'envoye')
        .in('kind', [...REMINDER_KINDS])
        .gte('created_at', sinceIso)
        .order('created_at', { ascending: false })
        .range(a, b),
    );
    for (const r of rows) if (!out.has(r.user_id)) out.set(r.user_id, r.created_at);
  }
  return out;
}

// ------------------------------------------------------------------ entreprises et parcs

export async function loadOrgs(db: SupabaseClient, ids: string[]): Promise<Map<string, OrgRow>> {
  const out = new Map<string, OrgRow>();
  for (const part of chunks(ids, CHUNK)) {
    const { data, error } = await db.from('organizations').select('id, name, country, currency, plan').in('id', part);
    if (error) throw fail('organizations', error);
    for (const o of (data ?? []) as OrgRow[]) out.set(o.id, o);
  }
  return out;
}

export interface FleetRows {
  machines: MachineRow[];
  schedules: (ScheduleRow & { org_id: string })[];
  repairs: RepairRow[];
  readings: (ReadingRow & { org_id: string })[];
}

/** Machines, échéances actives, réparations ouvertes et relevés récents des entreprises demandées. */
export async function loadFleets(db: SupabaseClient, orgIds: string[], readingsSince: string): Promise<FleetRows> {
  const out: FleetRows = { machines: [], schedules: [], repairs: [], readings: [] };
  for (const part of chunks(orgIds, ORG_CHUNK)) {
    const [machines, schedules, repairs, readings] = await Promise.all([
      fetchAll<MachineRow>('machines', (a, b) =>
        db
          .from('machines')
          .select('id, org_id, code, kind, weight_t, hours')
          .in('org_id', part)
          .is('archived_at', null)
          .order('id')
          .range(a, b),
      ),
      fetchAll<ScheduleRow & { org_id: string }>('schedules', (a, b) =>
        db
          .from('schedules')
          .select('id, org_id, machine_id, label, basis, interval_hours, last_hours, due_hours, due_date')
          .in('org_id', part)
          .eq('active', true)
          .order('id')
          .range(a, b),
      ),
      fetchAll<RepairRow>('entries', (a, b) =>
        db
          .from('entries')
          .select('id, org_id, machine_id, title, date, repair_status, cost_parts, cost_labour')
          .in('org_id', part)
          .is('deleted_at', null)
          .eq('kind', 'reparation')
          .in('repair_status', ['en_cours', 'attente_piece'])
          .order('id')
          .range(a, b),
      ),
      fetchAll<ReadingRow & { org_id: string }>('hour_readings', (a, b) =>
        db
          .from('hour_readings')
          .select('org_id, machine_id, hours, read_at')
          .in('org_id', part)
          .gte('read_at', readingsSince)
          .order('id')
          .range(a, b),
      ),
    ]);
    out.machines.push(...machines);
    out.schedules.push(...schedules);
    out.repairs.push(...repairs);
    out.readings.push(...readings);
  }
  return out;
}

// ------------------------------------------------------------------ écritures

export interface LogRow {
  user_id: string;
  org_id: string | null;
  kind: string;
  status: 'envoye' | 'ignore' | 'erreur' | 'simulation';
  /** Compteurs et codes uniquement (jamais d'adresse, de nom ni de contenu). */
  detail: string;
}

export async function writeLog(db: SupabaseClient, row: LogRow): Promise<boolean> {
  const { error } = await db.from('notification_log').insert({ ...row, channel: 'email', detail: row.detail.slice(0, 2000) });
  if (error) {
    console.error('[rappels] journal non écrit :', error.code || 'inconnu');
    return false;
  }
  return true;
}

/** Rappel parti : la date du dernier résumé avance (seulement si la personne a une ligne de réglages). */
export async function markDigestSent(db: SupabaseClient, userId: string, atIso: string): Promise<void> {
  const { error } = await db.from('notification_prefs').update({ last_digest_at: atIso }).eq('user_id', userId);
  if (error) console.error('[rappels] last_digest_at non mis à jour :', error.code || 'inconnu');
}

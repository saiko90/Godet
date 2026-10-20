// Dépôt « cloud » : les vraies données de l'entreprise dans Supabase (Postgres + RLS + stockage privé).
// Utilisable côté serveur (composant serveur : `loadFleet`) comme dans le navigateur (`createSupabaseRepo`).
// Règles respectées : saisies retirées = `deleted_at` (jamais effacées), machines archivées exclues, médias dans le
// bucket privé « medias » au chemin <org_id>/<machine_id>/<uuid>.<ext>, lecture par liens signés d'une heure.
// Les erreurs sont des codes (GarageError) : l'interface les traduit dans la langue de la personne.
import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import type { Database, TablesInsert, TablesUpdate } from '@/lib/database.types';
import { MEDIA_BUCKET, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/env';
import { addDays, todayISO } from '@/lib/format';
import { extForMime, type UploadProgressOptions } from '@/lib/media';
import type { GarageRepo, GeoFix, NewEntry, NewMachine, NewSchedule } from '@/lib/repo/types';
import type { Entry, FleetSnapshot, HourReading, Machine, MachineFile, MediaItem, MediaRow, MemberRole, Org, Schedule } from '@/lib/types';

export type GarageClient = SupabaseClient<Database>;

/** Ce que le dépôt doit savoir de la personne connectée (compatible avec `SessionContext`). */
export interface RepoContext {
  org: Org;
  role: MemberRole;
  userId: string;
}

/** Taille d'une page PostgREST (limite par défaut de Supabase : 1’000 lignes). */
const PAGE = 1000;
/** Durée de validité des liens de lecture des médias. */
const SIGNED_URL_TTL = 3600;

// ------------------------------------------------------------------ fenêtres de temps (partagées avec la démo)

/** Début des « 13 derniers mois » du parc : premier jour du mois, douze mois avant le mois courant. */
export function fleetSince(today: string): string {
  const [y, m] = today.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 13, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`;
}

/** Début des relevés utiles au rythme d'utilisation (120 derniers jours). */
export function readingsSince(today: string): string {
  return `${addDays(today, -120)}T00:00:00Z`;
}

/** Relevés gardés dans le dossier d'une machine : un peu plus d'un an (coût par heure, disponibilité). */
function fileReadingsSince(today: string): string {
  return `${addDays(today, -400)}T00:00:00Z`;
}

// ------------------------------------------------------------------ erreurs (codes traduits par l'interface)

/** Ce qui a échoué : sert de message quand l'erreur n'a pas de cause plus précise. */
export type RepoAction =
  | 'loadFleet'
  | 'loadFile'
  | 'loadMachine'
  | 'addMachine'
  | 'updateMachine'
  | 'archiveMachine'
  | 'addEntry'
  | 'updateEntry'
  | 'removeEntry'
  | 'addReading'
  | 'addSchedule'
  | 'updateSchedule'
  | 'deleteSchedule'
  | 'upload'
  | 'deleteMedia';

/** Contraintes de la base (nommées par Postgres « <table>_<colonne>_check ») expliquées à la personne. */
export const CHECK_CONSTRAINTS = [
  'machines_code_check',
  'machines_brand_check',
  'machines_model_check',
  'machines_year_check',
  'machines_serial_check',
  'machines_plate_check',
  'machines_weight_t_check',
  'machines_color_check',
  'machines_hours_check',
  'machines_notes_check',
  'entries_title_check',
  'entries_details_check',
  'entries_performed_by_check',
  'entries_hours_check',
  'entries_cost_parts_check',
  'entries_cost_labour_check',
  'entries_downtime_hours_check',
  'entries_part_ref_check',
  'entries_part_qty_check',
  'entries_supplier_check',
  'entries_delete_reason_check',
  'schedules_label_check',
  'schedules_interval_hours_check',
  'schedules_interval_days_check',
  'schedules_check',
  'hour_readings_hours_check',
  'media_caption_check',
  'media_mime_check',
] as const;
export type CheckConstraint = (typeof CHECK_CONSTRAINTS)[number];

export type GarageErrorCode =
  /** Réseau indisponible. */
  | 'network'
  /** Le rôle ne permet pas l'action. */
  | 'forbidden'
  /** Session expirée ou fermée. */
  | 'session'
  /** Fichier de plus de 50 Mo. */
  | 'tooBig'
  /** Type de fichier refusé par le stockage. */
  | 'badType'
  /** Code de machine déjà pris ; `params.code` si connu. */
  | 'codeTaken'
  | 'fileExists'
  | 'duplicate'
  /** Contrainte de la base ; `params.constraint` (voir CHECK_CONSTRAINTS). */
  | 'check'
  | 'invalidValue'
  | 'notFound'
  | 'required'
  | 'textTooLong'
  | 'numberTooBig'
  | 'badFormat'
  | 'notFoundOrRights'
  /** Exception levée par une fonction de la base ; `params.message` (code ou texte). */
  | 'server'
  | 'aborted'
  | 'machineGone'
  | 'otherOrg'
  | 'entryNotEditable'
  | 'entryNotRemovable'
  | 'reasonRequired'
  | 'reasonInvalid'
  | 'hoursInvalid'
  /** Le compteur reculerait ; `params.hours` (dernier relevé) et `params.at` (sa date). */
  | 'hoursBackwards'
  | 'mediaNotOwn'
  | 'scheduleGone'
  | 'dueHoursRequired'
  | 'dueDateRequired'
  | 'entryGone'
  | 'entryRemoved'
  | 'entryAlreadyRemoved'
  | 'linkedEntryGone'
  | 'fileGone'
  /** Échec sans cause précise ; `params.action` dit ce qui a échoué. */
  | 'failed';

export type GarageErrorParams = Partial<{
  action: RepoAction;
  constraint: string;
  code: string;
  message: string;
  hours: number;
  at: string;
}>;

/**
 * Erreur du dépôt (cloud ou démo) : un code et ses paramètres, jamais une phrase.
 * L'interface la traduit (src/components/garage/errors.ts, messages garage.errors.*).
 */
export class GarageError extends Error {
  readonly code: GarageErrorCode;
  readonly params: GarageErrorParams;

  constructor(code: GarageErrorCode, params: GarageErrorParams = {}) {
    super(params.action ? `${code}:${params.action}` : code);
    this.name = 'GarageError';
    this.code = code;
    this.params = params;
  }
}

export function isGarageError(e: unknown): e is GarageError {
  return e instanceof GarageError;
}

interface ErrorLike {
  message?: string;
  code?: string;
  details?: string;
  status?: number;
  statusCode?: string;
}

const isNetwork = (msg: string) => /failed to fetch|networkerror|network request failed|load failed|fetch failed/i.test(msg);

/**
 * Convertit une erreur Postgres, PostgREST, Storage ou réseau en erreur du dépôt (code + paramètres).
 * `action` dit ce qui a échoué (« addEntry »…), pour le message par défaut.
 */
export function repoError(err: unknown, action: RepoAction): GarageError {
  if (isGarageError(err)) return err;
  const e: ErrorLike = typeof err === 'object' && err !== null ? (err as ErrorLike) : { message: String(err ?? '') };
  const msg = String(e.message ?? '');
  const code = String(e.code ?? '');
  const status = typeof e.status === 'number' ? e.status : Number(e.statusCode) || 0;

  if (isNetwork(msg)) return new GarageError('network');
  if (code === '23505') {
    if (/machines_code_unique/.test(msg)) return new GarageError('codeTaken');
    return new GarageError(/path/.test(msg + (e.details ?? '')) ? 'fileExists' : 'duplicate');
  }
  if (code === '42501' || /row-level security|permission denied/i.test(msg)) return new GarageError('forbidden');
  if (code === '23514') {
    const constraint = /constraint "([^"]+)"/.exec(msg)?.[1] ?? '';
    return (CHECK_CONSTRAINTS as readonly string[]).includes(constraint)
      ? new GarageError('check', { constraint })
      : new GarageError('invalidValue');
  }
  if (code === '23503') return new GarageError('notFound');
  if (code === '23502') return new GarageError('required');
  if (code === '22001') return new GarageError('textTooLong');
  if (code === '22003') return new GarageError('numberTooBig');
  if (code === '22P02' || code === '22007' || code === '22008') return new GarageError('badFormat');
  if (code === 'PGRST116') return new GarageError('notFoundOrRights');
  if (code === 'PGRST301' || code === 'PGRST303' || /jwt expired/i.test(msg) || status === 401) return new GarageError('session');
  // Exceptions levées par nos fonctions (codes comme « forbidden », ou anciens messages) : l'interface les traduit.
  if (code === 'P0001' && msg) return new GarageError('server', { message: msg });
  if (status === 413 || /maximum allowed size|too large/i.test(msg)) return new GarageError('tooBig');
  if (status === 415 || /mime type|invalid_mime_type/i.test(msg)) return new GarageError('badType');
  if (status === 403) return new GarageError('forbidden');
  if (status === 409 || /already exists|duplicate/i.test(msg)) return new GarageError('fileExists');
  return new GarageError('failed', { action });
}

// ------------------------------------------------------------------ outils de requête

type PageResult<T> = PromiseLike<{ data: T[] | null; error: PostgrestError | null }>;

/** Lit toutes les lignes, page par page (une requête PostgREST est limitée à 1’000 lignes). */
async function fetchAll<T>(page: (from: number, to: number) => PageResult<T>, action: RepoAction): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) throw repoError(error, action);
    const rows = data ?? [];
    out.push(...rows);
    if (rows.length < PAGE) return out;
  }
}

const clean = (s: string | null | undefined) => {
  const t = (s ?? '').trim();
  return t ? t : null;
};

/** Ajoute les liens signés (une heure) aux médias, par lots. */
async function withUrls(client: GarageClient, rows: MediaRow[]): Promise<MediaItem[]> {
  if (!rows.length) return [];
  const urls = new Map<string, string>();
  const chunks: string[][] = [];
  for (let i = 0; i < rows.length; i += 100) chunks.push(rows.slice(i, i + 100).map((r) => r.path));
  await Promise.all(
    chunks.map(async (paths) => {
      try {
        const { data, error } = await client.storage.from(MEDIA_BUCKET).createSignedUrls(paths, SIGNED_URL_TTL);
        if (error || !data) return;
        for (const d of data) if (d.path && d.signedUrl && !d.error) urls.set(d.path, d.signedUrl);
      } catch {
        // Lien indisponible : le média s'affiche sans aperçu.
      }
    }),
  );
  return rows.map((r) => ({ ...r, url: urls.get(r.path) ?? null }));
}

// ------------------------------------------------------------------ lecture du parc

/** Vue d'ensemble du parc de l'entreprise active (composant serveur ou navigateur). */
export async function loadFleet(client: GarageClient, ctx: RepoContext, labels?: DefaultScheduleLabels): Promise<FleetSnapshot> {
  const orgId = ctx.org.id;
  const today = todayISO();
  const since = fleetSince(today);
  const readSince = readingsSince(today);
  const why: RepoAction = 'loadFleet';

  const [machines, schedules, recent, open, readings] = await Promise.all([
    fetchAll(
      (a, b) =>
        client
          .from('machines')
          .select('*')
          .eq('org_id', orgId)
          .is('archived_at', null)
          .order('position', { ascending: true })
          .order('code', { ascending: true })
          .order('id', { ascending: true })
          .range(a, b),
      why,
    ),
    fetchAll(
      (a, b) => client.from('schedules').select('*').eq('org_id', orgId).eq('active', true).order('created_at').order('id').range(a, b),
      why,
    ),
    fetchAll(
      (a, b) =>
        client
          .from('entries')
          .select('*')
          .eq('org_id', orgId)
          .is('deleted_at', null)
          .gte('date', since)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false })
          .order('id')
          .range(a, b),
      why,
    ),
    fetchAll(
      (a, b) =>
        client
          .from('entries')
          .select('*')
          .eq('org_id', orgId)
          .is('deleted_at', null)
          .eq('kind', 'reparation')
          .in('repair_status', ['en_cours', 'attente_piece'])
          .order('date', { ascending: false })
          .order('id')
          .range(a, b),
      why,
    ),
    fetchAll(
      (a, b) =>
        client.from('hour_readings').select('*').eq('org_id', orgId).gte('read_at', readSince).order('read_at').order('id').range(a, b),
      why,
    ),
  ]);

  const ids = new Set(machines.map((m) => m.id));
  return {
    org: ctx.org,
    role: ctx.role,
    userId: ctx.userId,
    machines,
    schedules: schedules.filter((s) => ids.has(s.machine_id)).map((s) => localizeSchedule(s, labels)),
    recentEntries: recent.filter((e) => ids.has(e.machine_id)),
    openRepairs: open.filter((e) => ids.has(e.machine_id)),
    readings: readings.filter((r) => ids.has(r.machine_id)),
  };
}

// ------------------------------------------------------------------ envoi des fichiers

/** Envoi direct à l'API de stockage avec suivi de l'avancement (même requête que supabase-js, via XHR). */
async function uploadWithProgress(
  client: GarageClient,
  path: string,
  blob: Blob,
  fileName: string,
  onProgress: (fraction: number) => void,
): Promise<void> {
  const { data } = await client.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new GarageError('session');
  const body = new FormData();
  body.append('cacheControl', '3600');
  body.append('', blob, fileName);
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/${MEDIA_BUCKET}/${path}`;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('apikey', SUPABASE_PUBLISHABLE_KEY);
    xhr.setRequestHeader('authorization', `Bearer ${token}`);
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && ev.total > 0) onProgress(Math.min(0.99, ev.loaded / ev.total));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(1);
        resolve();
        return;
      }
      let message = '';
      let statusCode = '';
      try {
        const j = JSON.parse(xhr.responseText) as { message?: string; error?: string; statusCode?: string | number };
        message = j.message ?? j.error ?? '';
        statusCode = String(j.statusCode ?? '');
      } catch {
        message = xhr.statusText;
      }
      reject(repoError({ message, status: Number(statusCode) || xhr.status }, 'upload'));
    };
    xhr.onerror = () => reject(new GarageError('network'));
    xhr.onabort = () => reject(new GarageError('aborted'));
    xhr.send(body);
  });
}

// ------------------------------------------------------------------ dépôt

/**
 * Libellés possibles des deux échéances créées avec chaque machine par le déclencheur de la base : il les écrit dans
 * la langue du profil de la personne (profiles.locale), en français par défaut.
 */
const DB_DEFAULT_SCHEDULES = {
  service: ['Service', 'Wartung', 'Manutenzione'],
  safety: ['Contrôle annuel de sécurité', 'Jährliche Sicherheitskontrolle', 'Controllo annuale di sicurezza', 'Annual safety inspection'],
} as const;

/** Libellés des échéances par défaut dans la langue de la page. */
export type DefaultScheduleLabels = { service: string; safety: string };

/**
 * Libellé affiché d'une échéance : une échéance par défaut (libellé d'origine, dans n'importe quelle langue) prend
 * le libellé de la page ; un libellé choisi par l'entreprise reste tel quel. Une équipe bilingue voit ainsi
 * « Wartung » en allemand et « Service » en français pour la même échéance.
 */
export function localizeDefaultLabel(label: string, wanted?: DefaultScheduleLabels): string {
  if (!wanted) return label;
  const l = label.trim();
  for (const k of Object.keys(DB_DEFAULT_SCHEDULES) as (keyof typeof DB_DEFAULT_SCHEDULES)[]) {
    if ((DB_DEFAULT_SCHEDULES[k] as readonly string[]).includes(l)) return wanted[k] || label;
  }
  return label;
}

function localizeSchedule<T extends { label: string }>(s: T, wanted?: DefaultScheduleLabels): T {
  const label = localizeDefaultLabel(s.label, wanted);
  return label === s.label ? s : { ...s, label };
}

export interface SupabaseRepoOptions {
  /**
   * Libellés des échéances par défaut dans la langue de la page : le déclencheur de la base les crée dans la langue
   * du profil ; si la page est dans une autre langue, le dépôt les renomme aussitôt après l'ajout d'une machine.
   */
  defaultSchedules?: { service: string; safety: string };
}

/** Dépôt des données réelles de l'entreprise `ctx.org` pour la personne `ctx.userId`. */
export function createSupabaseRepo(client: GarageClient, ctx: RepoContext, options: SupabaseRepoOptions = {}): GarageRepo {
  const orgId = ctx.org.id;

  /**
   * La session est-elle toujours ouverte dans ce navigateur ? Après une déconnexion dans un autre onglet, les requêtes
   * partiraient en anonyme : la RLS renverrait un parc vide (le garage se viderait à l'actualisation) et chaque
   * enregistrement serait refusé comme une question de rôle. On le dit clairement à la place.
   */
  async function ensureSession(): Promise<void> {
    const { data } = await client.auth.getSession();
    if (!data.session) throw new GarageError('session');
  }

  async function currentMachine(id: string): Promise<Machine> {
    const { data, error } = await client.from('machines').select('*').eq('id', id).maybeSingle();
    if (error) throw repoError(error, 'loadMachine');
    if (!data || data.archived_at) throw new GarageError('machineGone');
    if (data.org_id !== orgId) throw new GarageError('otherOrg');
    return data;
  }

  /** Échéances par défaut d'une nouvelle machine dans la langue de la personne (facultatif : ignoré en cas d'échec). */
  async function relabelDefaults(machineId: string): Promise<void> {
    const wanted = options.defaultSchedules;
    if (!wanted) return;
    const pairs = (Object.keys(DB_DEFAULT_SCHEDULES) as (keyof typeof DB_DEFAULT_SCHEDULES)[])
      .map((k) => [DB_DEFAULT_SCHEDULES[k].filter((label) => label !== wanted[k].trim()), wanted[k].trim().slice(0, 80)] as const)
      .filter(([from, to]) => to && from.length > 0);
    await Promise.all(
      pairs.map(async ([from, to]) => {
        try {
          await client.from('schedules').update({ label: to }).eq('machine_id', machineId).in('label', [...from]);
        } catch {
          // Le libellé reste celui de la base : sans conséquence.
        }
      }),
    );
  }

  /** Colonnes de position (arrondies : ~1 m suffit). */
  function geo(l: GeoFix | null | undefined) {
    if (!l || !Number.isFinite(l.lat) || !Number.isFinite(l.lng)) return {};
    return {
      lat: Math.round(l.lat * 1e6) / 1e6,
      lng: Math.round(l.lng * 1e6) / 1e6,
      loc_accuracy: l.accuracy != null && Number.isFinite(l.accuracy) ? Math.round(l.accuracy) : null,
    };
  }

  function entryInsert(input: NewEntry): TablesInsert<'entries'> {
    return {
      ...(input.id ? { id: input.id } : {}),
      org_id: orgId,
      machine_id: input.machineId,
      kind: input.kind,
      date: input.date ?? todayISO(),
      hours: input.hours ?? null,
      title: input.title.trim(),
      details: clean(input.details),
      performed_by: clean(input.performedBy),
      cost_parts: input.costParts ?? 0,
      cost_labour: input.costLabour ?? 0,
      downtime_hours: input.downtimeHours ?? null,
      repair_status: input.kind === 'reparation' ? (input.repairStatus ?? 'fait') : null,
      part_ref: clean(input.partRef),
      part_qty: input.partQty ?? null,
      supplier: clean(input.supplier),
      warranty_until: input.warrantyUntil || null,
      schedule_id: input.scheduleId ?? null,
      ...geo(input.location),
    };
  }

  function entryUpdate(p: Partial<Omit<NewEntry, 'machineId'>>): TablesUpdate<'entries'> {
    const u: TablesUpdate<'entries'> = {};
    if (p.kind !== undefined) u.kind = p.kind;
    if (p.date !== undefined) u.date = p.date;
    if (p.hours !== undefined) u.hours = p.hours;
    if (p.title !== undefined) u.title = p.title.trim();
    if (p.details !== undefined) u.details = clean(p.details);
    if (p.performedBy !== undefined) u.performed_by = clean(p.performedBy);
    if (p.costParts !== undefined) u.cost_parts = p.costParts;
    if (p.costLabour !== undefined) u.cost_labour = p.costLabour;
    if (p.downtimeHours !== undefined) u.downtime_hours = p.downtimeHours;
    if (p.repairStatus !== undefined) u.repair_status = p.repairStatus;
    if (p.partRef !== undefined) u.part_ref = clean(p.partRef);
    if (p.partQty !== undefined) u.part_qty = p.partQty;
    if (p.supplier !== undefined) u.supplier = clean(p.supplier);
    if (p.warrantyUntil !== undefined) u.warranty_until = p.warrantyUntil || null;
    if (p.scheduleId !== undefined) u.schedule_id = p.scheduleId;
    if (p.kind !== undefined && p.kind !== 'reparation') u.repair_status = null;
    return u;
  }

  function machineFields(p: Partial<NewMachine> & { position?: number }): TablesUpdate<'machines'> {
    const u: TablesUpdate<'machines'> = {};
    if (p.code !== undefined) u.code = p.code.trim().toUpperCase();
    if (p.kind !== undefined) u.kind = p.kind;
    if (p.brand !== undefined) u.brand = clean(p.brand);
    if (p.model !== undefined) u.model = clean(p.model);
    if (p.year !== undefined) u.year = p.year;
    if (p.serial !== undefined) u.serial = clean(p.serial);
    if (p.plate !== undefined) u.plate = clean(p.plate);
    if (p.weightT !== undefined) u.weight_t = p.weightT;
    if (p.color !== undefined) u.color = p.color;
    if (p.notes !== undefined) u.notes = clean(p.notes);
    if (p.position !== undefined) u.position = p.position;
    return u;
  }

  const repo: GarageRepo = {
    mode: 'cloud',

    async loadFleet(): Promise<FleetSnapshot> {
      await ensureSession();
      return loadFleet(client, ctx, options.defaultSchedules);
    },

    async loadMachineFile(machineId: string): Promise<MachineFile> {
      await ensureSession();
      const today = todayISO();
      const since = fileReadingsSince(today);
      const why: RepoAction = 'loadFile';
      const [machine, entries, schedules, recentReadings, older, mediaRows] = await Promise.all([
        currentMachine(machineId),
        fetchAll(
          (a, b) =>
            client
              .from('entries')
              .select('*')
              .eq('machine_id', machineId)
              .order('date', { ascending: false })
              .order('created_at', { ascending: false })
              .order('id')
              .range(a, b),
          why,
        ),
        fetchAll(
          (a, b) =>
            client.from('schedules').select('*').eq('machine_id', machineId).eq('active', true).order('created_at').order('id').range(a, b),
          why,
        ),
        fetchAll(
          (a, b) =>
            client
              .from('hour_readings')
              .select('*')
              .eq('machine_id', machineId)
              .gte('read_at', since)
              .order('read_at')
              .order('id')
              .range(a, b),
          why,
        ),
        client
          .from('hour_readings')
          .select('*')
          .eq('machine_id', machineId)
          .lt('read_at', since)
          .order('read_at', { ascending: false })
          .limit(1),
        fetchAll(
          (a, b) =>
            client.from('media').select('*').eq('machine_id', machineId).order('taken_at', { ascending: false }).order('id').range(a, b),
          why,
        ),
      ]);
      if (older.error) throw repoError(older.error, why);
      const readings: HourReading[] = [...(older.data ?? []), ...recentReadings];
      return {
        machine,
        entries,
        schedules: schedules.map((s) => localizeSchedule(s, options.defaultSchedules)),
        readings,
        media: await withUrls(client, mediaRows),
      };
    },

    async addMachine(input: NewMachine): Promise<Machine> {
      await ensureSession();
      const why: RepoAction = 'addMachine';
      const last = await client
        .from('machines')
        .select('position')
        .eq('org_id', orgId)
        .is('archived_at', null)
        .order('position', { ascending: false })
        .limit(1);
      if (last.error) throw repoError(last.error, why);
      const row: TablesInsert<'machines'> = {
        org_id: orgId,
        code: input.code.trim().toUpperCase(),
        kind: input.kind,
        brand: clean(input.brand),
        model: clean(input.model),
        year: input.year ?? null,
        serial: clean(input.serial),
        plate: clean(input.plate),
        weight_t: input.weightT ?? null,
        color: input.color ?? '#f3b71b',
        hours: input.hours ?? 0,
        notes: clean(input.notes),
        position: (last.data?.[0]?.position ?? -1) + 1,
      };
      const { data, error } = await client.from('machines').insert(row).select('*').single();
      if (error) throw repoError(error, why);
      await relabelDefaults(data.id);
      return data;
    },

    async updateMachine(id, patch): Promise<Machine> {
      await ensureSession();
      const why: RepoAction = 'updateMachine';
      const current = await currentMachine(id);
      const fields = machineFields(patch);
      if (patch.hours != null && patch.hours !== Number(current.hours)) {
        if (patch.hours > Number(current.hours)) {
          // Le compteur avance par un relevé (le déclencheur met la machine à jour).
          const { error } = await client
            .from('hour_readings')
            .insert({ org_id: orgId, machine_id: id, hours: patch.hours, source: 'saisie' });
          if (error) throw repoError(error, why);
        } else {
          // Correction d'une erreur de saisie : seul cas où le compteur redescend.
          fields.hours = patch.hours;
          fields.hours_at = new Date().toISOString();
        }
      }
      if (Object.keys(fields).length) {
        const { data, error } = await client.from('machines').update(fields).eq('id', id).select('*').single();
        if (error) throw repoError(error, why);
        return data;
      }
      return currentMachine(id);
    },

    async archiveMachine(id: string): Promise<void> {
      await ensureSession();
      const { error } = await client
        .from('machines')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)
        .is('archived_at', null)
        .select('id')
        .single();
      if (error) throw repoError(error, 'archiveMachine');
    },

    async addEntry(input: NewEntry): Promise<Entry> {
      await ensureSession();
      const { data, error } = await client.from('entries').insert(entryInsert(input)).select('*').single();
      if (error) throw repoError(error, 'addEntry');
      return data;
    },

    async updateEntry(id, patch): Promise<Entry> {
      await ensureSession();
      const { data, error } = await client
        .from('entries')
        .update(entryUpdate(patch))
        .eq('id', id)
        .is('deleted_at', null)
        .select('*')
        .single();
      if (error) {
        throw error.code === 'PGRST116' ? new GarageError('entryNotEditable') : repoError(error, 'updateEntry');
      }
      return data;
    },

    async removeEntry(id: string, reason: string): Promise<void> {
      await ensureSession();
      const why = reason.trim();
      if (!why) throw new GarageError('reasonRequired');
      const { error } = await client
        .from('entries')
        .update({ deleted_at: new Date().toISOString(), deleted_by: ctx.userId, delete_reason: why })
        .eq('id', id)
        .is('deleted_at', null)
        .select('id')
        .single();
      if (error) {
        throw error.code === 'PGRST116' ? new GarageError('entryNotRemovable') : repoError(error, 'removeEntry');
      }
    },

    async addReading(machineId: string, hours: number, location?: GeoFix | null): Promise<void> {
      await ensureSession();
      if (!Number.isFinite(hours) || hours < 0) throw new GarageError('hoursInvalid');
      const m = await currentMachine(machineId);
      if (hours < Number(m.hours)) throw new GarageError('hoursBackwards', { hours: Number(m.hours), at: m.hours_at });
      const { error } = await client.from('hour_readings').insert({ org_id: orgId, machine_id: machineId, hours, source: 'saisie', ...geo(location) });
      if (error) throw repoError(error, 'addReading');
    },

    async addSchedule(input: NewSchedule): Promise<Schedule> {
      await ensureSession();
      const row: TablesInsert<'schedules'> = {
        org_id: orgId,
        machine_id: input.machineId,
        label: input.label.trim(),
        basis: input.basis,
        interval_hours: input.basis === 'heures' ? (input.intervalHours ?? null) : null,
        interval_days: input.basis === 'date' ? (input.intervalDays ?? null) : null,
        last_hours: input.lastHours ?? null,
        last_date: input.lastDate ?? null,
        due_hours: input.basis === 'heures' ? (input.dueHours ?? null) : null,
        due_date: input.basis === 'date' ? (input.dueDate ?? null) : null,
      };
      const { data, error } = await client.from('schedules').insert(row).select('*').single();
      if (error) throw repoError(error, 'addSchedule');
      return data;
    },

    async updateSchedule(id, patch): Promise<Schedule> {
      await ensureSession();
      const u: TablesUpdate<'schedules'> = {};
      if (patch.label !== undefined) u.label = patch.label.trim();
      if (patch.basis !== undefined) u.basis = patch.basis;
      if (patch.intervalHours !== undefined) u.interval_hours = patch.intervalHours;
      if (patch.intervalDays !== undefined) u.interval_days = patch.intervalDays;
      if (patch.lastHours !== undefined) u.last_hours = patch.lastHours;
      if (patch.lastDate !== undefined) u.last_date = patch.lastDate;
      if (patch.dueHours !== undefined) u.due_hours = patch.dueHours;
      if (patch.dueDate !== undefined) u.due_date = patch.dueDate;
      if (patch.active !== undefined) u.active = patch.active;
      if (patch.basis === 'heures') {
        u.interval_days = null;
        u.due_date = null;
      } else if (patch.basis === 'date') {
        u.interval_hours = null;
        u.due_hours = null;
      }
      const { data, error } = await client.from('schedules').update(u).eq('id', id).select('*').single();
      if (error) throw repoError(error, 'updateSchedule');
      return data;
    },

    async deleteSchedule(id: string): Promise<void> {
      await ensureSession();
      const { error } = await client.from('schedules').delete().eq('id', id).select('id').single();
      if (error) throw repoError(error, 'deleteSchedule');
    },

    async uploadMedia(machineId: string, file: Blob, opts: UploadProgressOptions): Promise<MediaItem> {
      await ensureSession();
      const why: RepoAction = 'upload';
      const mime = file.type || 'application/octet-stream';
      const id =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
      const path = `${orgId}/${machineId}/${id}.${extForMime(mime, opts.fileName)}`;

      if (opts.onProgress && typeof XMLHttpRequest !== 'undefined') {
        await uploadWithProgress(client, path, file, opts.fileName ?? `${id}.${extForMime(mime)}`, opts.onProgress);
      } else {
        const { error } = await client.storage
          .from(MEDIA_BUCKET)
          .upload(path, file, { contentType: mime, upsert: false, cacheControl: '3600' });
        if (error) throw repoError(error, why);
      }

      const row: TablesInsert<'media'> = {
        org_id: orgId,
        machine_id: machineId,
        entry_id: opts.entryId ?? null,
        rental_check_id: opts.rentalCheckId ?? null,
        slot: opts.slot ?? null,
        kind: opts.kind,
        path,
        mime,
        size_bytes: file.size,
        caption: clean(opts.caption),
        taken_at: opts.takenAt ?? new Date().toISOString(),
      };
      const { data, error } = await client.from('media').insert(row).select('*').single();
      if (error) {
        // La ligne n'existe pas : on retire le fichier pour ne pas laisser d'orphelin dans le stockage.
        try {
          await client.storage.from(MEDIA_BUCKET).remove([path]);
        } catch {
          // Rien de plus à faire.
        }
        throw repoError(error, why);
      }
      const [item] = await withUrls(client, [data]);
      return item;
    },

    async deleteMedia(id: string): Promise<void> {
      await ensureSession();
      const { data, error } = await client.from('media').delete().eq('id', id).select('path').single();
      if (error) {
        throw error.code === 'PGRST116' ? new GarageError('mediaNotOwn') : repoError(error, 'deleteMedia');
      }
      try {
        await client.storage.from(MEDIA_BUCKET).remove([data.path]);
      } catch {
        // Le fichier reste dans le stockage, mais n'est plus référencé ni visible.
      }
    },

    async mediaUrl(path: string): Promise<string | null> {
      const { data, error } = await client.storage.from(MEDIA_BUCKET).createSignedUrl(path, SIGNED_URL_TTL);
      if (error || !data) return null;
      return data.signedUrl;
    },
  };

  return repo;
}

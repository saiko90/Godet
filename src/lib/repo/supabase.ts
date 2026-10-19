// Dépôt « cloud » : les vraies données de l'entreprise dans Supabase (Postgres + RLS + stockage privé).
// Utilisable côté serveur (composant serveur : `loadFleet`) comme dans le navigateur (`createSupabaseRepo`).
// Règles respectées : saisies retirées = `deleted_at` (jamais effacées), machines archivées exclues, médias dans le
// bucket privé « medias » au chemin <org_id>/<machine_id>/<uuid>.<ext>, lecture par liens signés d'une heure.
import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import type { Database, TablesInsert, TablesUpdate } from '@/lib/database.types';
import { MEDIA_BUCKET, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/env';
import { addDays, dateCH, hrs, todayISO } from '@/lib/format';
import { extForMime, type UploadProgressOptions } from '@/lib/media';
import type { GarageRepo, NewEntry, NewMachine, NewSchedule } from '@/lib/repo/types';
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

// ------------------------------------------------------------------ messages d'erreur en français

const NETWORK = 'Pas de connexion au serveur. Vérifiez le réseau, puis réessayez.';
const RIGHTS = 'Votre rôle ne permet pas cette action. Demandez à un responsable du parc.';
const SESSION = 'Votre session a expiré. Rechargez la page pour vous reconnecter.';
const TOO_BIG = 'Le fichier est trop gros : 100 Mo au maximum.';
const BAD_TYPE = 'Ce type de fichier n’est pas accepté : photos JPEG, PNG, WebP ou HEIC, vidéos MP4, MOV ou WebM, documents PDF.';

/** Contraintes de la base (nommées par Postgres « <table>_<colonne>_check ») → explication. */
const CHECKS: Record<string, string> = {
  machines_code_check: 'Le code de la machine doit contenir entre 1 et 16 caractères.',
  machines_brand_check: 'La marque fait 40 caractères au plus.',
  machines_model_check: 'Le modèle fait 40 caractères au plus.',
  machines_year_check: 'L’année doit être comprise entre 1950 et 2100.',
  machines_serial_check: 'Le numéro de série fait 40 caractères au plus.',
  machines_plate_check: 'La plaque fait 20 caractères au plus.',
  machines_weight_t_check: 'Le poids doit être compris entre 0,1 et 999 t.',
  machines_color_check: 'Couleur de peinture invalide.',
  machines_hours_check: 'Le compteur ne peut pas être négatif.',
  machines_notes_check: 'Les remarques font 2’000 caractères au plus.',
  entries_title_check: 'Le titre doit contenir entre 1 et 120 caractères.',
  entries_details_check: 'Les détails font 4’000 caractères au plus.',
  entries_performed_by_check: '« Fait par » fait 80 caractères au plus.',
  entries_hours_check: 'Le compteur ne peut pas être négatif.',
  entries_cost_parts_check: 'Les coûts ne peuvent pas être négatifs.',
  entries_cost_labour_check: 'Les coûts ne peuvent pas être négatifs.',
  entries_downtime_hours_check: 'L’immobilisation ne peut pas être négative.',
  entries_part_ref_check: 'La référence fait 40 caractères au plus.',
  entries_part_qty_check: 'La quantité doit être supérieure à zéro.',
  entries_supplier_check: 'Le fournisseur fait 80 caractères au plus.',
  entries_delete_reason_check: 'Le motif fait 300 caractères au plus.',
  schedules_label_check: 'Le libellé doit contenir entre 1 et 80 caractères.',
  schedules_interval_hours_check: 'L’intervalle doit être supérieur à zéro.',
  schedules_interval_days_check: 'L’intervalle doit être supérieur à zéro.',
  schedules_check: 'Indiquez la prochaine échéance : un nombre d’heures ou une date.',
  hour_readings_hours_check: 'Le compteur ne peut pas être négatif.',
  media_caption_check: 'La légende fait 200 caractères au plus.',
  media_mime_check: BAD_TYPE,
};

interface ErrorLike {
  message?: string;
  code?: string;
  details?: string;
  status?: number;
  statusCode?: string;
}

const isNetwork = (msg: string) => /failed to fetch|networkerror|network request failed|load failed|fetch failed/i.test(msg);

/**
 * Traduit une erreur Postgres, PostgREST, Storage ou réseau en message clair pour la personne.
 * `fallback` décrit ce qui a échoué (« La saisie n’a pas pu être enregistrée. »).
 */
export function frenchError(err: unknown, fallback: string): Error {
  if (err instanceof Error && err.name === 'GarageError') return err;
  const e: ErrorLike = typeof err === 'object' && err !== null ? (err as ErrorLike) : { message: String(err ?? '') };
  const msg = String(e.message ?? '');
  const code = String(e.code ?? '');
  const status = typeof e.status === 'number' ? e.status : Number(e.statusCode) || 0;
  let text = fallback;

  if (isNetwork(msg)) text = NETWORK;
  else if (code === '23505') {
    text = /machines_code_unique/.test(msg)
      ? 'Ce code est déjà utilisé par une autre machine du parc. Choisissez-en un autre.'
      : /path/.test(msg + (e.details ?? ''))
        ? 'Un fichier du même nom existe déjà.'
        : 'Cette valeur existe déjà.';
  } else if (code === '42501' || /row-level security|permission denied/i.test(msg)) text = RIGHTS;
  else if (code === '23514') {
    const name = /constraint "([^"]+)"/.exec(msg)?.[1] ?? '';
    text = CHECKS[name] ?? 'Une valeur saisie n’est pas acceptée. Vérifiez les champs du formulaire.';
  } else if (code === '23503') text = 'Élément introuvable : il a peut-être été supprimé entre-temps. Rechargez la page.';
  else if (code === '23502') text = 'Un champ obligatoire est vide.';
  else if (code === '22001') text = 'Un texte saisi est trop long.';
  else if (code === '22003') text = 'Un nombre saisi est trop grand.';
  else if (code === '22P02' || code === '22007' || code === '22008') text = 'Une valeur saisie n’a pas le bon format (nombre ou date).';
  else if (code === 'PGRST116') text = 'Élément introuvable, ou vos droits ne permettent pas cette action.';
  else if (code === 'PGRST301' || code === 'PGRST303' || /jwt expired/i.test(msg) || status === 401) text = SESSION;
  else if (code === 'P0001' && msg)
    text = msg; // exceptions levées par nos fonctions : déjà en français
  else if (status === 413 || /maximum allowed size|too large/i.test(msg)) text = TOO_BIG;
  else if (status === 415 || /mime type|invalid_mime_type/i.test(msg)) text = BAD_TYPE;
  else if (status === 403) text = RIGHTS;
  else if (status === 409 || /already exists|duplicate/i.test(msg)) text = 'Un fichier du même nom existe déjà.';

  const out = new Error(text);
  out.name = 'GarageError';
  return out;
}

function fail(message: string): Error {
  const out = new Error(message);
  out.name = 'GarageError';
  return out;
}

// ------------------------------------------------------------------ outils de requête

type PageResult<T> = PromiseLike<{ data: T[] | null; error: PostgrestError | null }>;

/** Lit toutes les lignes, page par page (une requête PostgREST est limitée à 1’000 lignes). */
async function fetchAll<T>(page: (from: number, to: number) => PageResult<T>, fallback: string): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) throw frenchError(error, fallback);
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
export async function loadFleet(client: GarageClient, ctx: RepoContext): Promise<FleetSnapshot> {
  const orgId = ctx.org.id;
  const today = todayISO();
  const since = fleetSince(today);
  const readSince = readingsSince(today);
  const why = 'Le parc n’a pas pu être chargé.';

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
    schedules: schedules.filter((s) => ids.has(s.machine_id)),
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
  if (!token) throw fail(SESSION);
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
      reject(frenchError({ message, status: Number(statusCode) || xhr.status }, 'Le fichier n’a pas pu être envoyé.'));
    };
    xhr.onerror = () => reject(fail(NETWORK));
    xhr.onabort = () => reject(fail('Envoi interrompu.'));
    xhr.send(body);
  });
}

// ------------------------------------------------------------------ dépôt

/** Dépôt des données réelles de l'entreprise `ctx.org` pour la personne `ctx.userId`. */
export function createSupabaseRepo(client: GarageClient, ctx: RepoContext): GarageRepo {
  const orgId = ctx.org.id;

  async function currentMachine(id: string): Promise<Machine> {
    const { data, error } = await client.from('machines').select('*').eq('id', id).maybeSingle();
    if (error) throw frenchError(error, 'La machine n’a pas pu être chargée.');
    if (!data || data.archived_at) throw fail('Cette machine n’existe plus ou a été archivée.');
    if (data.org_id !== orgId) throw fail('Cette machine appartient à une autre entreprise.');
    return data;
  }

  function entryInsert(input: NewEntry): TablesInsert<'entries'> {
    return {
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

    loadFleet: () => loadFleet(client, ctx),

    async loadMachineFile(machineId: string): Promise<MachineFile> {
      const today = todayISO();
      const since = fileReadingsSince(today);
      const why = 'La fiche de la machine n’a pas pu être chargée.';
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
      if (older.error) throw frenchError(older.error, why);
      const readings: HourReading[] = [...(older.data ?? []), ...recentReadings];
      return { machine, entries, schedules, readings, media: await withUrls(client, mediaRows) };
    },

    async addMachine(input: NewMachine): Promise<Machine> {
      const why = 'La machine n’a pas pu être ajoutée.';
      const last = await client
        .from('machines')
        .select('position')
        .eq('org_id', orgId)
        .is('archived_at', null)
        .order('position', { ascending: false })
        .limit(1);
      if (last.error) throw frenchError(last.error, why);
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
      if (error) throw frenchError(error, why);
      return data;
    },

    async updateMachine(id, patch): Promise<Machine> {
      const why = 'La machine n’a pas pu être modifiée.';
      const current = await currentMachine(id);
      const fields = machineFields(patch);
      if (patch.hours != null && patch.hours !== Number(current.hours)) {
        if (patch.hours > Number(current.hours)) {
          // Le compteur avance par un relevé (le déclencheur met la machine à jour).
          const { error } = await client
            .from('hour_readings')
            .insert({ org_id: orgId, machine_id: id, hours: patch.hours, source: 'saisie' });
          if (error) throw frenchError(error, why);
        } else {
          // Correction d'une erreur de saisie : seul cas où le compteur redescend.
          fields.hours = patch.hours;
          fields.hours_at = new Date().toISOString();
        }
      }
      if (Object.keys(fields).length) {
        const { data, error } = await client.from('machines').update(fields).eq('id', id).select('*').single();
        if (error) throw frenchError(error, why);
        return data;
      }
      return currentMachine(id);
    },

    async archiveMachine(id: string): Promise<void> {
      const { error } = await client
        .from('machines')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)
        .is('archived_at', null)
        .select('id')
        .single();
      if (error) throw frenchError(error, 'La machine n’a pas pu être archivée.');
    },

    async addEntry(input: NewEntry): Promise<Entry> {
      const { data, error } = await client.from('entries').insert(entryInsert(input)).select('*').single();
      if (error) throw frenchError(error, 'La saisie n’a pas pu être enregistrée.');
      return data;
    },

    async updateEntry(id, patch): Promise<Entry> {
      const { data, error } = await client
        .from('entries')
        .update(entryUpdate(patch))
        .eq('id', id)
        .is('deleted_at', null)
        .select('*')
        .single();
      if (error) {
        throw error.code === 'PGRST116'
          ? fail('Cette saisie a été retirée, ou vous ne pouvez modifier que vos propres saisies.')
          : frenchError(error, 'La saisie n’a pas pu être modifiée.');
      }
      return data;
    },

    async removeEntry(id: string, reason: string): Promise<void> {
      const why = reason.trim();
      if (!why) throw fail('Indiquez le motif du retrait.');
      const { error } = await client
        .from('entries')
        .update({ deleted_at: new Date().toISOString(), deleted_by: ctx.userId, delete_reason: why })
        .eq('id', id)
        .is('deleted_at', null)
        .select('id')
        .single();
      if (error) {
        throw error.code === 'PGRST116'
          ? fail('Cette saisie est déjà retirée, ou vous ne pouvez retirer que vos propres saisies.')
          : frenchError(error, 'La saisie n’a pas pu être retirée.');
      }
    },

    async addReading(machineId: string, hours: number): Promise<void> {
      if (!Number.isFinite(hours) || hours < 0) throw fail('Le compteur doit être un nombre d’heures positif.');
      const m = await currentMachine(machineId);
      if (hours < Number(m.hours)) {
        throw fail(`Le compteur ne peut pas reculer : le dernier relevé est de ${hrs(Number(m.hours))} (${dateCH(m.hours_at)}).`);
      }
      const { error } = await client.from('hour_readings').insert({ org_id: orgId, machine_id: machineId, hours, source: 'saisie' });
      if (error) throw frenchError(error, 'Le relevé n’a pas pu être enregistré.');
    },

    async addSchedule(input: NewSchedule): Promise<Schedule> {
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
      if (error) throw frenchError(error, 'L’échéance n’a pas pu être ajoutée.');
      return data;
    },

    async updateSchedule(id, patch): Promise<Schedule> {
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
      if (error) throw frenchError(error, 'L’échéance n’a pas pu être modifiée.');
      return data;
    },

    async deleteSchedule(id: string): Promise<void> {
      const { error } = await client.from('schedules').delete().eq('id', id).select('id').single();
      if (error) throw frenchError(error, 'L’échéance n’a pas pu être supprimée.');
    },

    async uploadMedia(machineId: string, file: Blob, opts: UploadProgressOptions): Promise<MediaItem> {
      const why = 'Le fichier n’a pas pu être envoyé.';
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
        if (error) throw frenchError(error, why);
      }

      const row: TablesInsert<'media'> = {
        org_id: orgId,
        machine_id: machineId,
        entry_id: opts.entryId ?? null,
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
        throw frenchError(error, why);
      }
      const [item] = await withUrls(client, [data]);
      return item;
    },

    async deleteMedia(id: string): Promise<void> {
      const { data, error } = await client.from('media').delete().eq('id', id).select('path').single();
      if (error) {
        throw error.code === 'PGRST116'
          ? fail('Vous ne pouvez supprimer que les fichiers que vous avez déposés.')
          : frenchError(error, 'Le fichier n’a pas pu être supprimé.');
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

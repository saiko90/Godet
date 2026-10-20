// Dépôt de démonstration : le parc d'exemple vit en mémoire le temps de la visite (rien n'est envoyé).
// Il reproduit les règles de la base : relevé créé par une saisie avec compteur, compteur qui n'avance que vers
// le haut, échéance renouvelée par une saisie liée, échéances par défaut d'une nouvelle machine, retrait sans effacement.
// Textes dans la langue de la visite (messages/<langue>/demo.json) ; erreurs en codes, comme le dépôt Supabase.
import type { DemoTexts } from '@/lib/demo-content/fleet';
import { addDays, todayISO } from '@/lib/format';
import { extForMime, type UploadProgressOptions } from '@/lib/media';
import type { GarageRepo, GeoFix, NewEntry, NewMachine, NewSchedule } from '@/lib/repo/types';
import type { Entry, FleetSnapshot, HourReading, Machine, MachineFile, MediaItem, Schedule } from '@/lib/types';
import { buildDemoSeed, zurichISO, type DemoSeed } from './demo-data';
import { fleetSince, GarageError, readingsSince, type GarageErrorCode, type GarageErrorParams } from './supabase';

/** Petit délai pour que les états d'envoi restent visibles, comme avec un vrai serveur. */
const LATENCY = 160;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const clone = <T>(value: T): T => structuredClone(value);
const nowISO = () => new Date().toISOString();
const clean = (s: string | null | undefined) => {
  const t = (s ?? '').trim();
  return t ? t : null;
};
function check(ok: boolean, code: GarageErrorCode, params?: GarageErrorParams): asserts ok {
  if (!ok) throw new GarageError(code, params);
}
/** Même message que la contrainte de la base du même nom. */
function checkConstraint(ok: boolean, constraint: string): asserts ok {
  if (!ok) throw new GarageError('check', { constraint });
}
const newId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const byEntryOrder = (a: Entry, b: Entry) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at);

export interface DemoRepoOptions {
  /** Textes du parc d'exemple dans la langue de la visite (messages/<langue>/demo.json). */
  texts: DemoTexts;
  /** Libellés des deux échéances ajoutées à une nouvelle machine, dans la même langue. */
  defaultSchedules: { service: string; safety: string };
  /** Parc de départ (par défaut : le parc d'exemple du jour). */
  seed?: DemoSeed;
}

/** Crée le dépôt de démonstration dans une langue (textes du parc et échéances par défaut). */
export function createDemoRepo({ texts, defaultSchedules, seed }: DemoRepoOptions): GarageRepo {
  const today = seed?.today ?? todayISO();
  const db: DemoSeed = clone(seed ?? buildDemoSeed(today, texts));
  let nextReadingId = db.readings.reduce((m, r) => Math.max(m, r.id), 0) + 1;

  const machineById = (id: string): Machine => {
    const m = db.machines.find((x) => x.id === id && !x.archived_at);
    check(Boolean(m), 'machineGone');
    return m as Machine;
  };

  /** Déclencheur « readings_bump » : le compteur n'avance que vers le haut. */
  const bump = (m: Machine, hours: number, at: string) => {
    if (hours > Number(m.hours) || (hours === Number(m.hours) && at > m.hours_at)) {
      m.hours = hours;
      m.hours_at = at > m.hours_at ? at : m.hours_at;
    }
  };

  const addReadingRow = (m: Machine, hours: number, at: string, source: string, l?: GeoFix | null) => {
    const r: HourReading = {
      id: nextReadingId++,
      org_id: db.org.id,
      machine_id: m.id,
      hours,
      read_at: at,
      source,
      created_by: db.userId,
      lat: l?.lat ?? null,
      lng: l?.lng ?? null,
      loc_accuracy: l?.accuracy ?? null,
    };
    db.readings.push(r);
    bump(m, hours, at);
    // Déclencheur « *_last_position » : dernière position de la machine.
    if (l) locate(m, l);
  };

  const locate = (m: Machine, l: GeoFix) => {
    m.last_lat = l.lat;
    m.last_lng = l.lng;
    m.last_loc_accuracy = l.accuracy;
    m.last_located_at = nowISO();
  };

  const validateMachine = (input: Partial<NewMachine>, exceptId?: string) => {
    if (input.code !== undefined) {
      const code = input.code.trim().toUpperCase();
      checkConstraint(code.length >= 1 && code.length <= 16, 'machines_code_check');
      const taken = db.machines.some((m) => !m.archived_at && m.id !== exceptId && m.code.toLowerCase() === code.toLowerCase());
      check(!taken, 'codeTaken', { code });
    }
    checkConstraint((input.brand ?? '').length <= 40, 'machines_brand_check');
    checkConstraint((input.model ?? '').length <= 40, 'machines_model_check');
    checkConstraint(input.year == null || (input.year >= 1950 && input.year <= 2100), 'machines_year_check');
    checkConstraint((input.serial ?? '').length <= 40, 'machines_serial_check');
    checkConstraint((input.plate ?? '').length <= 20, 'machines_plate_check');
    checkConstraint(input.weightT == null || (input.weightT > 0 && input.weightT < 1000), 'machines_weight_t_check');
    checkConstraint(input.color === undefined || /^#[0-9a-f]{6}$/i.test(input.color), 'machines_color_check');
    check(input.hours == null || (input.hours >= 0 && input.hours < 10_000_000), 'hoursInvalid');
    checkConstraint((input.notes ?? '').length <= 2000, 'machines_notes_check');
  };

  const validateEntry = (input: Partial<Omit<NewEntry, 'machineId'>>) => {
    if (input.title !== undefined) {
      const t = input.title.trim();
      checkConstraint(t.length >= 1 && t.length <= 120, 'entries_title_check');
    }
    checkConstraint((input.details ?? '').length <= 4000, 'entries_details_check');
    checkConstraint((input.performedBy ?? '').length <= 80, 'entries_performed_by_check');
    checkConstraint(input.hours == null || input.hours >= 0, 'entries_hours_check');
    checkConstraint((input.costParts ?? 0) >= 0 && (input.costLabour ?? 0) >= 0, 'entries_cost_parts_check');
    checkConstraint(input.downtimeHours == null || input.downtimeHours >= 0, 'entries_downtime_hours_check');
    checkConstraint((input.partRef ?? '').length <= 40, 'entries_part_ref_check');
    checkConstraint(input.partQty == null || input.partQty > 0, 'entries_part_qty_check');
    checkConstraint((input.supplier ?? '').length <= 80, 'entries_supplier_check');
  };

  const validateSchedule = (s: Schedule) => {
    const label = s.label.trim();
    checkConstraint(label.length >= 1 && label.length <= 80, 'schedules_label_check');
    check(s.basis !== 'heures' || s.due_hours != null, 'dueHoursRequired');
    check(s.basis !== 'date' || s.due_date != null, 'dueDateRequired');
    checkConstraint(s.interval_hours == null || s.interval_hours > 0, 'schedules_interval_hours_check');
    checkConstraint(s.interval_days == null || s.interval_days > 0, 'schedules_interval_days_check');
  };

  const repo: GarageRepo = {
    mode: 'demo',

    async loadFleet(): Promise<FleetSnapshot> {
      const since = fleetSince(today);
      const readSince = readingsSince(today);
      const machines = db.machines.filter((m) => !m.archived_at).sort((a, b) => a.position - b.position || a.code.localeCompare(b.code));
      const ids = new Set(machines.map((m) => m.id));
      const live = db.entries.filter((e) => ids.has(e.machine_id) && !e.deleted_at);
      return clone({
        org: db.org,
        role: 'owner' as const,
        userId: db.userId,
        machines,
        schedules: db.schedules.filter((s) => ids.has(s.machine_id) && s.active),
        recentEntries: live.filter((e) => e.date >= since).sort(byEntryOrder),
        openRepairs: live.filter((e) => e.kind === 'reparation' && (e.repair_status === 'en_cours' || e.repair_status === 'attente_piece')),
        readings: db.readings.filter((r) => ids.has(r.machine_id) && r.read_at >= readSince),
      });
    },

    async loadMachineFile(machineId: string): Promise<MachineFile> {
      const machine = machineById(machineId);
      return clone({
        machine,
        entries: db.entries.filter((e) => e.machine_id === machineId).sort(byEntryOrder),
        schedules: db.schedules
          .filter((s) => s.machine_id === machineId && s.active)
          .sort((a, b) => a.created_at.localeCompare(b.created_at)),
        readings: db.readings.filter((r) => r.machine_id === machineId).sort((a, b) => a.read_at.localeCompare(b.read_at)),
        media: db.media.filter((m) => m.machine_id === machineId).sort((a, b) => b.taken_at.localeCompare(a.taken_at)),
      });
    },

    async addMachine(input: NewMachine): Promise<Machine> {
      await wait(LATENCY);
      validateMachine(input);
      const at = nowISO();
      const base = input.hours ?? 0;
      const m: Machine = {
        id: newId(),
        org_id: db.org.id,
        code: input.code.trim().toUpperCase(),
        kind: input.kind,
        brand: clean(input.brand),
        model: clean(input.model),
        year: input.year ?? null,
        serial: clean(input.serial),
        plate: clean(input.plate),
        weight_t: input.weightT ?? null,
        color: input.color ?? '#f3b71b',
        hours: base,
        hours_at: at,
        position: db.machines.reduce((max, x) => (x.archived_at ? max : Math.max(max, x.position)), -1) + 1,
        notes: clean(input.notes),
        archived_at: null,
        created_by: db.userId,
        created_at: at,
        updated_at: at,
        last_lat: null,
        last_lng: null,
        last_loc_accuracy: null,
        last_located_at: null,
      };
      db.machines.push(m);
      // Déclencheur « machines_after_insert » : relevé initial et échéances par défaut.
      addReadingRow(m, base, at, 'creation');
      db.schedules.push(
        {
          id: newId(),
          org_id: db.org.id,
          machine_id: m.id,
          label: defaultSchedules.service,
          basis: 'heures',
          interval_hours: 500,
          interval_days: null,
          last_hours: Math.floor(base / 500) * 500,
          last_date: null,
          due_hours: (Math.floor(base / 500) + 1) * 500,
          due_date: null,
          active: true,
          created_at: at,
        },
        {
          id: newId(),
          org_id: db.org.id,
          machine_id: m.id,
          label: defaultSchedules.safety,
          basis: 'date',
          interval_hours: null,
          interval_days: 365,
          last_hours: null,
          last_date: null,
          due_hours: null,
          due_date: addDays(today, 365),
          active: true,
          created_at: at,
        },
      );
      return clone(m);
    },

    async updateMachine(id, patch): Promise<Machine> {
      await wait(LATENCY);
      const m = machineById(id);
      validateMachine(patch, id);
      if (patch.code !== undefined) m.code = patch.code.trim().toUpperCase();
      if (patch.kind !== undefined) m.kind = patch.kind;
      if (patch.brand !== undefined) m.brand = clean(patch.brand);
      if (patch.model !== undefined) m.model = clean(patch.model);
      if (patch.year !== undefined) m.year = patch.year;
      if (patch.serial !== undefined) m.serial = clean(patch.serial);
      if (patch.plate !== undefined) m.plate = clean(patch.plate);
      if (patch.weightT !== undefined) m.weight_t = patch.weightT;
      if (patch.color !== undefined) m.color = patch.color;
      if (patch.notes !== undefined) m.notes = clean(patch.notes);
      if (patch.position !== undefined) m.position = patch.position;
      if (patch.hours != null && patch.hours !== Number(m.hours)) {
        const at = nowISO();
        if (patch.hours > Number(m.hours)) addReadingRow(m, patch.hours, at, 'saisie');
        else {
          // Correction d'une erreur de saisie : seul cas où le compteur peut redescendre.
          m.hours = patch.hours;
          m.hours_at = at;
        }
      }
      m.updated_at = nowISO();
      return clone(m);
    },

    async archiveMachine(id: string): Promise<void> {
      await wait(LATENCY);
      const m = machineById(id);
      m.archived_at = nowISO();
      m.updated_at = m.archived_at;
    },

    async addEntry(input: NewEntry): Promise<Entry> {
      await wait(LATENCY);
      const m = machineById(input.machineId);
      validateEntry(input);
      const date = input.date ?? today;
      const at = nowISO();
      const schedule = input.scheduleId ? db.schedules.find((s) => s.id === input.scheduleId && s.machine_id === m.id) : null;
      check(!input.scheduleId || Boolean(schedule), 'scheduleGone');
      const e: Entry = {
        id: newId(),
        org_id: db.org.id,
        machine_id: m.id,
        kind: input.kind,
        date,
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
        schedule_id: schedule ? schedule.id : null,
        created_by: db.userId,
        created_at: at,
        updated_at: at,
        deleted_at: null,
        deleted_by: null,
        delete_reason: null,
        lat: input.location?.lat ?? null,
        lng: input.location?.lng ?? null,
        loc_accuracy: input.location?.accuracy ?? null,
      };
      db.entries.push(e);
      if (input.location) locate(m, input.location);
      // Déclencheur « entry_after_insert » : relevé du compteur, puis renouvellement de l'échéance réglée.
      if (e.hours != null) addReadingRow(m, Number(e.hours), zurichISO(date, 12), 'intervention');
      if (schedule) {
        const base = e.hours != null ? Number(e.hours) : Number(m.hours);
        schedule.last_hours = base;
        schedule.last_date = date;
        if (schedule.basis === 'heures' && schedule.interval_hours != null) schedule.due_hours = base + Number(schedule.interval_hours);
        if (schedule.basis === 'date' && schedule.interval_days != null) schedule.due_date = addDays(date, schedule.interval_days);
        if (
          (schedule.basis === 'heures' && schedule.interval_hours == null) ||
          (schedule.basis === 'date' && schedule.interval_days == null)
        ) {
          schedule.active = false;
        }
      }
      return clone(e);
    },

    async updateEntry(id, patch): Promise<Entry> {
      await wait(LATENCY);
      const e = db.entries.find((x) => x.id === id);
      check(Boolean(e), 'entryGone');
      const entry = e as Entry;
      check(!entry.deleted_at, 'entryRemoved');
      validateEntry(patch);
      if (patch.kind !== undefined) entry.kind = patch.kind;
      if (patch.date !== undefined) entry.date = patch.date;
      if (patch.hours !== undefined) entry.hours = patch.hours;
      if (patch.title !== undefined) entry.title = patch.title.trim();
      if (patch.details !== undefined) entry.details = clean(patch.details);
      if (patch.performedBy !== undefined) entry.performed_by = clean(patch.performedBy);
      if (patch.costParts !== undefined) entry.cost_parts = patch.costParts;
      if (patch.costLabour !== undefined) entry.cost_labour = patch.costLabour;
      if (patch.downtimeHours !== undefined) entry.downtime_hours = patch.downtimeHours;
      if (patch.repairStatus !== undefined) entry.repair_status = patch.repairStatus;
      if (patch.partRef !== undefined) entry.part_ref = clean(patch.partRef);
      if (patch.partQty !== undefined) entry.part_qty = patch.partQty;
      if (patch.supplier !== undefined) entry.supplier = clean(patch.supplier);
      if (patch.warrantyUntil !== undefined) entry.warranty_until = patch.warrantyUntil || null;
      if (patch.scheduleId !== undefined) entry.schedule_id = patch.scheduleId;
      if (entry.kind !== 'reparation') entry.repair_status = null;
      else if (!entry.repair_status) entry.repair_status = 'fait';
      entry.updated_at = nowISO();
      return clone(entry);
    },

    async removeEntry(id: string, reason: string): Promise<void> {
      await wait(LATENCY);
      const e = db.entries.find((x) => x.id === id);
      check(Boolean(e), 'entryGone');
      const entry = e as Entry;
      check(!entry.deleted_at, 'entryAlreadyRemoved');
      const why = reason.trim();
      check(why.length >= 1 && why.length <= 300, 'reasonInvalid');
      entry.deleted_at = nowISO();
      entry.deleted_by = db.userId;
      entry.delete_reason = why;
      entry.updated_at = entry.deleted_at;
    },

    async addReading(machineId: string, hours: number, location?: GeoFix | null): Promise<void> {
      await wait(LATENCY);
      const m = machineById(machineId);
      check(Number.isFinite(hours) && hours >= 0, 'hoursInvalid');
      check(hours >= Number(m.hours), 'hoursBackwards', { hours: Number(m.hours), at: m.hours_at });
      addReadingRow(m, hours, nowISO(), 'saisie', location);
    },

    async addSchedule(input: NewSchedule): Promise<Schedule> {
      await wait(LATENCY);
      const m = machineById(input.machineId);
      const s: Schedule = {
        id: newId(),
        org_id: db.org.id,
        machine_id: m.id,
        label: input.label.trim(),
        basis: input.basis,
        interval_hours: input.basis === 'heures' ? (input.intervalHours ?? null) : null,
        interval_days: input.basis === 'date' ? (input.intervalDays ?? null) : null,
        last_hours: input.lastHours ?? null,
        last_date: input.lastDate ?? null,
        due_hours: input.basis === 'heures' ? (input.dueHours ?? null) : null,
        due_date: input.basis === 'date' ? (input.dueDate ?? null) : null,
        active: true,
        created_at: nowISO(),
      };
      validateSchedule(s);
      db.schedules.push(s);
      return clone(s);
    },

    async updateSchedule(id, patch): Promise<Schedule> {
      await wait(LATENCY);
      const s = db.schedules.find((x) => x.id === id);
      check(Boolean(s), 'scheduleGone');
      const next: Schedule = { ...(s as Schedule) };
      if (patch.label !== undefined) next.label = patch.label.trim();
      if (patch.basis !== undefined) next.basis = patch.basis;
      if (patch.intervalHours !== undefined) next.interval_hours = patch.intervalHours;
      if (patch.intervalDays !== undefined) next.interval_days = patch.intervalDays;
      if (patch.lastHours !== undefined) next.last_hours = patch.lastHours;
      if (patch.lastDate !== undefined) next.last_date = patch.lastDate;
      if (patch.dueHours !== undefined) next.due_hours = patch.dueHours;
      if (patch.dueDate !== undefined) next.due_date = patch.dueDate;
      if (patch.active !== undefined) next.active = patch.active;
      if (next.basis === 'heures') {
        next.interval_days = null;
        next.due_date = null;
      } else {
        next.interval_hours = null;
        next.due_hours = null;
      }
      validateSchedule(next);
      Object.assign(s as Schedule, next);
      return clone(next);
    },

    async deleteSchedule(id: string): Promise<void> {
      await wait(LATENCY);
      const i = db.schedules.findIndex((x) => x.id === id);
      check(i >= 0, 'scheduleGone');
      db.schedules.splice(i, 1);
      // « on delete set null » sur les saisies liées.
      db.entries.forEach((e) => {
        if (e.schedule_id === id) e.schedule_id = null;
      });
    },

    async uploadMedia(machineId: string, file: Blob, opts: UploadProgressOptions): Promise<MediaItem> {
      const m = machineById(machineId);
      check(!opts.entryId || db.entries.some((e) => e.id === opts.entryId), 'linkedEntryGone');
      // Rien ne part : on simule un envoi rapide pour garder le même retour visuel.
      for (const f of [0.2, 0.55, 0.85, 1]) {
        await wait(70);
        opts.onProgress?.(f);
      }
      const id = newId();
      const mime = file.type || 'application/octet-stream';
      const at = nowISO();
      const item: MediaItem = {
        id,
        org_id: db.org.id,
        machine_id: m.id,
        entry_id: opts.entryId ?? null,
        kind: opts.kind,
        path: `${db.org.id}/${m.id}/${id}.${extForMime(mime, opts.fileName)}`,
        mime,
        size_bytes: file.size,
        caption: clean(opts.caption),
        taken_at: opts.takenAt ?? at,
        created_by: db.userId,
        created_at: at,
        url: URL.createObjectURL(file),
      };
      db.media.push(item);
      return clone(item);
    },

    async deleteMedia(id: string): Promise<void> {
      await wait(LATENCY);
      const i = db.media.findIndex((x) => x.id === id);
      check(i >= 0, 'fileGone');
      const [item] = db.media.splice(i, 1);
      if (item.url) URL.revokeObjectURL(item.url);
    },

    async mediaUrl(path: string): Promise<string | null> {
      return db.media.find((m) => m.path === path)?.url ?? null;
    },
  };

  return repo;
}

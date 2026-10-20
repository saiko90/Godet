// Garage sans réseau : enveloppe du dépôt cloud.
// - Lectures : réponse du serveur, mémorisée sur l'appareil ; sans réseau, la dernière copie mémorisée.
// - Saisies du carnet et relevés d'heures : sans réseau, mis en file d'attente sur l'appareil, affichés tout de suite,
//   puis envoyés dans l'ordre au retour du réseau (une saisie garde son identifiant : jamais de doublon).
// - Les autres actions (machines, échéances, photos) demandent le réseau : erreur « network » habituelle.
import { GarageError, isGarageError } from '@/lib/repo/supabase';
import type { GarageRepo, GeoFix, NewEntry } from '@/lib/repo/types';
import { todayISO } from '@/lib/format';
import type { Entry, FleetSnapshot, HourReading, MachineFile } from '@/lib/types';
import { idbClear, idbGet, idbSet } from './idb';

export type QueuedOp =
  | { type: 'entry'; id: string; at: string; input: NewEntry }
  | { type: 'reading'; id: string; at: string; machineId: string; hours: number; location?: GeoFix | null };

export interface SyncResult {
  sent: number;
  /** Refusées par le serveur (machine archivée entre-temps, compteur dépassé…) : retirées de la file. */
  refused: number;
}

export interface OfflineState {
  online: boolean;
  pending: number;
  syncing: boolean;
}

export interface OfflineRepo extends GarageRepo {
  state(): OfflineState;
  subscribe(listener: () => void): () => void;
  /** Envoie la file d'attente (sans effet hors ligne ou si un envoi est déjà en cours). */
  sync(): Promise<SyncResult>;
  /** Mémorise un parc chargé ailleurs (rendu serveur). */
  remember(fleet: FleetSnapshot): Promise<void>;
}

const clean = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);

function isOfflineError(e: unknown): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  return isGarageError(e) && e.code === 'network';
}

/** Ce que la base aurait enregistré (même normalisation que le dépôt cloud). */
function entryRow(op: Extract<QueuedOp, { type: 'entry' }>, orgId: string, userId: string): Entry {
  const i = op.input;
  return {
    id: op.id,
    org_id: orgId,
    machine_id: i.machineId,
    kind: i.kind,
    date: i.date ?? todayISO(),
    hours: i.hours ?? null,
    title: i.title.trim(),
    details: clean(i.details),
    performed_by: clean(i.performedBy),
    cost_parts: i.costParts ?? 0,
    cost_labour: i.costLabour ?? 0,
    downtime_hours: i.downtimeHours ?? null,
    repair_status: i.kind === 'reparation' ? (i.repairStatus ?? 'fait') : null,
    lat: i.location?.lat ?? null,
    lng: i.location?.lng ?? null,
    loc_accuracy: i.location?.accuracy ?? null,
    part_ref: clean(i.partRef),
    part_qty: i.partQty ?? null,
    supplier: clean(i.supplier),
    warranty_until: i.warrantyUntil || null,
    schedule_id: i.scheduleId ?? null,
    created_at: op.at,
    created_by: userId,
    updated_at: op.at,
    deleted_at: null,
    deleted_by: null,
    delete_reason: null,
  };
}

export function createOfflineRepo(inner: GarageRepo, ctx: { orgId: string; userId: string }): OfflineRepo {
  const prefix = `${ctx.orgId}:${ctx.userId}`;
  const K = { fleet: `fleet:${prefix}`, queue: `queue:${prefix}`, file: (id: string) => `file:${prefix}:${id}` };
  let queue: QueuedOp[] = [];
  let loaded: Promise<void> | null = null;
  let syncing = false;
  let online = typeof navigator === 'undefined' ? true : navigator.onLine;
  const listeners = new Set<() => void>();
  // Même objet tant que rien ne change (useSyncExternalStore compare les références).
  let snapshot: OfflineState = { online, pending: 0, syncing: false };
  const emit = () => {
    const next = { online, pending: queue.length, syncing };
    if (next.online !== snapshot.online || next.pending !== snapshot.pending || next.syncing !== snapshot.syncing) snapshot = next;
    listeners.forEach((l) => l());
  };

  const ready = () =>
    (loaded ??= idbGet<QueuedOp[]>(K.queue).then((q) => {
      queue = Array.isArray(q) ? q : [];
      emit();
    }));
  const saveQueue = () => idbSet(K.queue, queue);
  let readingSeq = -1;

  function markOnline(value: boolean) {
    if (online !== value) {
      online = value;
      emit();
    }
  }

  /** Saisies et relevés en attente appliqués à une copie (serveur ou mémorisée). */
  function applyFleet(base: FleetSnapshot): FleetSnapshot {
    if (!queue.length) return base;
    const fleet: FleetSnapshot = {
      ...base,
      machines: base.machines.map((m) => ({ ...m })),
      recentEntries: [...base.recentEntries],
      openRepairs: [...base.openRepairs],
      readings: [...base.readings],
    };
    const known = new Set(fleet.recentEntries.map((e) => e.id));
    for (const op of queue) {
      const m = fleet.machines.find((x) => x.id === (op.type === 'entry' ? op.input.machineId : op.machineId));
      if (!m) continue;
      const hours = op.type === 'entry' ? op.input.hours : op.hours;
      if (op.type === 'entry' && !known.has(op.id)) {
        const row = entryRow(op, ctx.orgId, ctx.userId);
        fleet.recentEntries.push(row);
        if (row.kind === 'reparation' && row.repair_status !== 'fait') fleet.openRepairs.push(row);
      }
      if (hours != null) {
        fleet.readings.push(readingRow(op, m.id, hours));
        if (hours > Number(m.hours)) {
          m.hours = hours;
          m.hours_at = op.at;
        }
      }
    }
    return fleet;
  }

  function readingRow(op: QueuedOp, machineId: string, hours: number): HourReading {
    const l = op.type === 'entry' ? op.input.location : op.location;
    return {
      id: readingSeq--,
      org_id: ctx.orgId,
      machine_id: machineId,
      hours,
      read_at: op.at,
      source: op.type === 'entry' ? 'intervention' : 'saisie',
      created_by: ctx.userId,
      lat: l?.lat ?? null,
      lng: l?.lng ?? null,
      loc_accuracy: l?.accuracy ?? null,
    };
  }

  function applyFile(base: MachineFile): MachineFile {
    const mine = queue.filter((op) => (op.type === 'entry' ? op.input.machineId : op.machineId) === base.machine.id);
    if (!mine.length) return base;
    const file: MachineFile = { ...base, machine: { ...base.machine }, entries: [...base.entries], readings: [...base.readings] };
    const known = new Set(file.entries.map((e) => e.id));
    for (const op of mine) {
      if (op.type === 'entry' && !known.has(op.id)) file.entries.push(entryRow(op, ctx.orgId, ctx.userId));
      const hours = op.type === 'entry' ? op.input.hours : op.hours;
      if (hours != null) {
        file.readings.push(readingRow(op, base.machine.id, hours));
        if (hours > Number(file.machine.hours)) {
          file.machine.hours = hours;
          file.machine.hours_at = op.at;
        }
      }
    }
    return file;
  }

  async function enqueue(op: QueuedOp) {
    await ready();
    queue.push(op);
    await saveQueue();
    emit();
  }

  /** Dossier reconstitué depuis le parc mémorisé (machine jamais ouverte avant la coupure). */
  async function fileFromFleet(machineId: string): Promise<MachineFile | null> {
    const fleet = await idbGet<FleetSnapshot>(K.fleet);
    const machine = fleet?.machines.find((m) => m.id === machineId);
    if (!fleet || !machine) return null;
    return {
      machine,
      entries: fleet.recentEntries.filter((e) => e.machine_id === machineId),
      schedules: fleet.schedules.filter((s) => s.machine_id === machineId),
      readings: fleet.readings.filter((r) => r.machine_id === machineId),
      media: [],
    };
  }

  async function currentMeter(machineId: string): Promise<{ hours: number; at: string } | null> {
    const fleet = await idbGet<FleetSnapshot>(K.fleet);
    const m = fleet ? applyFleet(fleet).machines.find((x) => x.id === machineId) : null;
    return m ? { hours: Number(m.hours), at: m.hours_at } : null;
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => markOnline(true));
    window.addEventListener('offline', () => markOnline(false));
  }

  const repo: OfflineRepo = {
    ...inner,
    mode: inner.mode,

    state: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      void ready();
      return () => listeners.delete(listener);
    },

    async remember(fleet) {
      await idbSet(K.fleet, fleet);
    },

    async loadFleet() {
      await ready();
      try {
        const fleet = await inner.loadFleet();
        markOnline(true);
        void idbSet(K.fleet, fleet);
        return applyFleet(fleet);
      } catch (e) {
        if (!isOfflineError(e)) throw e;
        markOnline(false);
        const kept = await idbGet<FleetSnapshot>(K.fleet);
        if (!kept) throw new GarageError('network');
        return applyFleet(kept);
      }
    },

    async loadMachineFile(machineId) {
      await ready();
      try {
        const file = await inner.loadMachineFile(machineId);
        markOnline(true);
        // Les liens des photos expirent : inutile de les garder.
        void idbSet(K.file(machineId), { ...file, media: [] });
        return applyFile(file);
      } catch (e) {
        if (!isOfflineError(e)) throw e;
        markOnline(false);
        const kept = (await idbGet<MachineFile>(K.file(machineId))) ?? (await fileFromFleet(machineId));
        if (!kept) throw new GarageError('network');
        return applyFile(kept);
      }
    },

    async addEntry(input) {
      await ready();
      const op: Extract<QueuedOp, { type: 'entry' }> = {
        type: 'entry',
        id: input.id ?? crypto.randomUUID(),
        at: new Date().toISOString(),
        input: { ...input, date: input.date ?? todayISO() },
      };
      // File non vide : on garde l'ordre (une saisie ne passe pas devant les précédentes).
      if (online && !queue.length) {
        try {
          return await inner.addEntry({ ...op.input, id: op.id });
        } catch (e) {
          if (!isOfflineError(e)) throw e;
          markOnline(false);
        }
      }
      await enqueue(op);
      return entryRow(op, ctx.orgId, ctx.userId);
    },

    async addReading(machineId, hours, location) {
      await ready();
      if (online && !queue.length) {
        try {
          return await inner.addReading(machineId, hours, location);
        } catch (e) {
          if (!isOfflineError(e)) throw e;
          markOnline(false);
        }
      }
      if (!Number.isFinite(hours) || hours < 0) throw new GarageError('hoursInvalid');
      const current = await currentMeter(machineId);
      if (current && hours < current.hours) throw new GarageError('hoursBackwards', current);
      await enqueue({ type: 'reading', id: crypto.randomUUID(), at: new Date().toISOString(), machineId, hours, location: location ?? null });
    },

    async sync() {
      await ready();
      const result: SyncResult = { sent: 0, refused: 0 };
      if (syncing || !queue.length || (typeof navigator !== 'undefined' && !navigator.onLine)) return result;
      syncing = true;
      emit();
      try {
        while (queue.length) {
          const op = queue[0];
          try {
            if (op.type === 'entry') await inner.addEntry({ ...op.input, id: op.id });
            else await inner.addReading(op.machineId, op.hours, op.location);
            result.sent++;
          } catch (e) {
            // Lecture seule (essai terminé) : on garde la file, elle partira une fois l'abonnement actif.
            const inactive = isGarageError(e) && e.code === 'server' && e.params.message === 'subscription_inactive';
            if (inactive) break;
            if (isOfflineError(e) || (isGarageError(e) && e.code === 'session')) {
              markOnline(!isOfflineError(e));
              break;
            }
            // Déjà enregistrée (réponse perdue lors d'un envoi précédent) : c'est un succès.
            if (isGarageError(e) && e.code === 'duplicate') result.sent++;
            else {
              console.warn('[hors ligne] saisie refusée :', e);
              result.refused++;
            }
          }
          queue.shift();
          await saveQueue();
          emit();
        }
        if (!queue.length) markOnline(true);
      } finally {
        syncing = false;
        emit();
      }
      return result;
    },
  };
  return repo;
}

/** Déconnexion : copies et file d'attente effacées de l'appareil, pages mémorisées par le service worker aussi. */
export async function forgetDevice(): Promise<void> {
  await idbClear();
  try {
    if ('caches' in window) for (const key of await caches.keys()) if (key.startsWith('godet-')) await caches.delete(key);
  } catch {
    // Rien à effacer.
  }
}

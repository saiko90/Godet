// Parc d'exemple de /demo : huit machines et douze mois de carnet, dans la langue de la visite.
// La structure (chiffres, dates relatives) est dans src/lib/demo-content/fleet.ts ; les textes dans
// messages/<langue>/demo.json. Toutes les dates sont relatives au jour de la visite.
import { addDays, daysBetween } from '@/lib/format';
import { DEMO_FLEET, entryText, scheduleText, type DemoTexts } from '@/lib/demo-content/fleet';
import type { Entry, HourReading, Machine, MediaItem, Org, Schedule } from '@/lib/types';

export interface DemoSeed {
  org: Org;
  userId: string;
  today: string;
  machines: Machine[];
  schedules: Schedule[];
  entries: Entry[];
  readings: HourReading[];
  media: MediaItem[];
}

export const DEMO_USER_ID = 'demo-utilisateur';
export const DEMO_ORG_ID = 'demo-entreprise';

/** Horodatage UTC d'une heure locale à Zurich (heure d'été comprise). */
export function zurichISO(date: string, hh: number, mm = 0): string {
  const [y, m, d] = date.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Zurich',
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date(guess));
  const get = (t: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const local = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'));
  return new Date(guess - (local - guess)).toISOString();
}

/** Parc d'exemple pour le jour `today` (AAAA-MM-JJ). Identifiants stables : /demo?m=demo-pe-01 ouvre PE-01. */
export function buildDemoSeed(today: string, texts: DemoTexts): DemoSeed {
  const dayOf = (offset: number) => addDays(today, offset);
  const created = zurichISO(addDays(today, -400), 9);

  const org: Org = {
    id: DEMO_ORG_ID,
    name: texts.org,
    canton: 'VS',
    country: 'CH',
    currency: 'CHF',
    plan: 'essai',
    trial_ends_at: zurichISO(addDays(today, 30), 0),
    created_by: DEMO_USER_ID,
    created_at: created,
  };

  const machines: Machine[] = [];
  const schedules: Schedule[] = [];
  const entries: Entry[] = [];
  const readings: HourReading[] = [];
  let readingId = 1;
  const read = (machineId: string, hours: number, at: string, source: string) => {
    readings.push({ id: readingId++, org_id: org.id, machine_id: machineId, hours, read_at: at, source, created_by: DEMO_USER_ID });
  };

  DEMO_FLEET.forEach((def, position) => {
    const id = `demo-${def.code.toLowerCase()}`;
    const text = texts.machines[def.slug];
    // Machine de démonstration (celle de l'inscription) : créée ce matin, avec son historique déjà saisi.
    const isDemoMachine = def.perDay === 0;
    const hoursAt = (offset: number) => Math.round(def.hours + def.perDay * (offset - def.lastRead));
    const lastReadAt = zurichISO(addDays(today, def.lastRead), 7, 15);
    const machineCreated = isDemoMachine ? zurichISO(today, 7, 30) : created;

    machines.push({
      id,
      org_id: org.id,
      code: def.code,
      kind: def.kind,
      brand: def.brand ?? text.brand ?? null,
      model: def.model ?? text.model ?? null,
      year: def.year,
      serial: def.serial,
      plate: def.plate,
      weight_t: def.weight,
      color: def.color,
      hours: def.hours,
      hours_at: isDemoMachine ? machineCreated : lastReadAt,
      position,
      notes: text.notes ?? null,
      archived_at: null,
      created_by: DEMO_USER_ID,
      created_at: machineCreated,
      updated_at: machineCreated,
    });

    // Relevés : création, relevés réguliers, dernier relevé (comme les déclencheurs de la base).
    if (isDemoMachine) {
      read(id, def.hours, machineCreated, 'creation');
      for (const r of def.readings ?? []) read(id, r.hours, zurichISO(addDays(today, r.day), 7, 30), 'saisie');
    } else {
      read(id, hoursAt(-400), created, 'creation');
      if (def.routineReadings) {
        for (let o = -112; o < def.lastRead; o += 14) read(id, hoursAt(o), zurichISO(addDays(today, o), 7, 15), 'saisie');
      }
      read(id, def.hours, lastReadAt, 'saisie');
    }

    def.entries.forEach((e, i) => {
      const [kind, day, h, by, parts, labour, downtime, status, ref, qty, warranty, supplier, removed] = e;
      const { title, details } = entryText(texts, def.slug, i);
      const date = dayOf(day);
      const offset = daysBetween(today, date);
      const hours = h === 'auto' ? hoursAt(offset) : h;
      const at = zurichISO(date, 17, 30);
      const removedAt = removed ? zurichISO(addDays(date, removed.after), 8) : null;
      entries.push({
        id: `${id}-e${String(i + 1).padStart(2, '0')}`,
        org_id: org.id,
        machine_id: id,
        kind,
        date,
        hours,
        title,
        details: details ?? null,
        performed_by: by ? texts.people[by] : null,
        cost_parts: parts,
        cost_labour: labour,
        downtime_hours: downtime,
        repair_status: kind === 'reparation' ? status : null,
        part_ref: ref,
        part_qty: qty,
        supplier: supplier ? texts.suppliers[supplier] : null,
        warranty_until: warranty == null ? null : addDays(date, warranty),
        schedule_id: null,
        created_by: DEMO_USER_ID,
        created_at: at,
        updated_at: removedAt ?? at,
        deleted_at: removedAt,
        deleted_by: removed ? DEMO_USER_ID : null,
        delete_reason: removed ? texts.reasons[removed.reason] : null,
      });
      // Déclencheur : une saisie avec compteur crée un relevé à midi (heure suisse).
      if (hours != null) read(id, hours, zurichISO(date, 12), 'intervention');
    });

    def.schedules.forEach((s, i) => {
      const base = {
        id: `${id}-s${i + 1}`,
        org_id: org.id,
        machine_id: id,
        label: scheduleText(texts, def.slug, i),
        active: true,
        created_at: created,
      };
      if (s.basis === 'heures') {
        schedules.push({
          ...base,
          basis: 'heures',
          interval_hours: s.every,
          interval_days: null,
          last_hours: s.last,
          last_date: s.lastDay == null ? null : dayOf(s.lastDay),
          due_hours: s.due,
          due_date: null,
        });
      } else {
        schedules.push({
          ...base,
          basis: 'date',
          interval_hours: null,
          interval_days: s.everyDays,
          last_hours: null,
          last_date: s.lastDay == null ? null : dayOf(s.lastDay),
          due_hours: null,
          due_date: dayOf(s.dueDay),
        });
      }
    });
  });

  readings.sort((a, b) => a.read_at.localeCompare(b.read_at));
  return { org, userId: DEMO_USER_ID, today, machines, schedules, entries, readings, media: [] };
}

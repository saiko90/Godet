// Contenu de la machine de démonstration créée à l'inscription (« Ajouter une pelle de démonstration »).
// Envoyé tel quel à la fonction create_demo_machine_v2 (Supabase) : jours relatifs à aujourd'hui (négatif = passé).
// C'est PE-01 du parc d'exemple : même structure (src/lib/demo-content/fleet.ts), textes de messages/<langue>/demo.json.
// Le français fait foi ; les autres langues reprennent exactement les mêmes chiffres.
// Module serveur : il embarque les textes des quatre langues.
import type { AppLocale } from '@/i18n/routing';
import de from '../../../messages/de/demo.json';
import en from '../../../messages/en/demo.json';
import fr from '../../../messages/fr/demo.json';
import it from '../../../messages/it/demo.json';
import { DEMO_FLEET, entryText, scheduleText, type DemoMachineDef, type DemoTexts } from './fleet';

export interface DemoEntry {
  kind: 'service' | 'reparation' | 'piece' | 'controle' | 'inspection' | 'note';
  day: number;
  hours?: number;
  title: string;
  details?: string;
  performed_by?: string;
  cost_parts?: number;
  cost_labour?: number;
  downtime_hours?: number;
  repair_status?: 'fait' | 'en_cours' | 'attente_piece';
  part_ref?: string;
  part_qty?: number;
  supplier?: string;
  warranty_day?: number;
}

export interface DemoSchedule {
  label: string;
  basis: 'heures' | 'date';
  interval_hours?: number;
  interval_days?: number;
  last_hours?: number;
  last_day?: number;
  due_hours?: number;
  due_day?: number;
}

export interface DemoMachinePayload {
  machine: {
    code: string;
    kind: 'pelle' | 'mini_pelle' | 'chargeuse' | 'dumper' | 'camion' | 'grue' | 'rouleau' | 'autre';
    brand: string;
    model: string;
    year: number;
    serial: string;
    weight_t: number;
    color: string;
    hours: number;
    notes: string;
  };
  entries: DemoEntry[];
  schedules: DemoSchedule[];
  readings: { hours: number; day: number }[];
}

const TEXTS: Record<AppLocale, DemoTexts> = { fr, de, it, en };

/** Machine de démonstration : PE-01 du parc d'exemple. */
const DEF: DemoMachineDef = DEMO_FLEET.find((m) => m.slug === 'pe01') ?? DEMO_FLEET[0];

/** Valeur gardée seulement si elle est renseignée (la fonction de la base lit des champs facultatifs). */
function set<K extends string, V>(key: K, value: V | null | undefined): Partial<Record<K, V>> {
  return value == null ? {} : ({ [key]: value } as Record<K, V>);
}

function build(texts: DemoTexts): DemoMachinePayload {
  const text = texts.machines[DEF.slug];
  return {
    machine: {
      code: DEF.code,
      kind: DEF.kind,
      brand: DEF.brand ?? text.brand ?? '',
      model: DEF.model ?? text.model ?? '',
      year: DEF.year,
      serial: DEF.serial,
      weight_t: DEF.weight,
      color: DEF.color,
      hours: DEF.hours,
      notes: text.notes ?? '',
    },
    entries: DEF.entries.map((e, i) => {
      const [kind, day, hours, by, parts, labour, downtime, status, ref, qty, warranty, supplier] = e;
      const { title, details } = entryText(texts, DEF.slug, i);
      return {
        kind,
        day,
        ...set('hours', typeof hours === 'number' ? hours : null),
        title,
        ...set('details', details),
        ...set('performed_by', by ? texts.people[by] : null),
        ...set('cost_parts', parts || null),
        ...set('cost_labour', labour || null),
        ...set('downtime_hours', downtime),
        ...set('repair_status', kind === 'reparation' ? status : null),
        ...set('part_ref', ref),
        ...set('part_qty', qty),
        ...set('supplier', supplier ? texts.suppliers[supplier] : null),
        ...set('warranty_day', warranty == null ? null : day + warranty),
      };
    }),
    schedules: DEF.schedules.map((s, i) => {
      const label = scheduleText(texts, DEF.slug, i);
      return s.basis === 'heures'
        ? {
            label,
            basis: 'heures' as const,
            ...set('interval_hours', s.every),
            ...set('last_hours', s.last),
            ...set('last_day', s.lastDay),
            due_hours: s.due,
          }
        : {
            label,
            basis: 'date' as const,
            ...set('interval_days', s.everyDays),
            ...set('last_day', s.lastDay),
            due_day: s.dueDay,
          };
    }),
    readings: (DEF.readings ?? []).map((r) => ({ hours: r.hours, day: r.day })),
  };
}

const CACHE = new Map<AppLocale, DemoMachinePayload>();

/** Machine de démonstration dans la langue demandée (français si la langue est inconnue). */
export function buildDemoMachinePayload(locale: AppLocale): DemoMachinePayload {
  const l: AppLocale = locale in TEXTS ? locale : 'fr';
  let payload = CACHE.get(l);
  if (!payload) {
    payload = build(TEXTS[l]);
    CACHE.set(l, payload);
  }
  return structuredClone(payload);
}

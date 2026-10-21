// Option Location dans la démonstration (/demo/location) : locations d'exemple et états des lieux gardés dans le
// navigateur (mémoire + sessionStorage pour les textes ; les photos ajoutées ne vivent que le temps de l'onglet).
// Rien n'est envoyé. Dates relatives au moment de la visite.
import { useSyncExternalStore } from 'react';
import { allItems, type CheckItems, type Rental, type RentalCheck, type RentalErrorCode, type RentalInput, type Transport } from '@/lib/rental';
import { rentalRow } from '@/lib/rental';
import type { MachineKind } from '@/lib/types';

export const DEMO_RENTAL_ORG = 'demo-entreprise';
export const DEMO_RENTAL_USER = 'demo-utilisateur';

export interface DemoPhoto {
  id: string;
  slot: string;
  kind: 'photo' | 'video';
  url: string;
}

export interface DemoCheck extends RentalCheck {
  photos: DemoPhoto[];
  clientSigUrl: string | null;
  staffSigUrl: string | null;
}

export interface DemoCheckInput {
  check: RentalCheck;
  photos: DemoPhoto[];
  clientSigUrl: string;
  staffSigUrl: string | null;
}

export interface DemoMachine {
  id: string;
  code: string;
  kind: MachineKind;
  hours: number;
}

export interface DemoState {
  day: string;
  rentals: Rental[];
  checks: DemoCheck[];
  /** Machines déclarées en panne au retour pendant la visite (réparation ouverte). */
  broken: { machineId: string; note: string }[];
}

const KEY = 'godet-demo-location-v1';
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** Signature d'exemple (trait manuscrit en SVG). */
const SIGNATURE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="170" viewBox="0 0 600 170"><rect width="600" height="170" fill="#fff"/><path d="M40 120 C 70 40, 110 40, 120 100 S 170 150, 200 80 S 260 30, 280 110 C 300 150, 330 60, 360 90 S 420 130, 450 70 C 470 40, 500 60, 540 95" fill="none" stroke="#111" stroke-width="4" stroke-linecap="round"/></svg>',
  );

let state: DemoState | null = null;
const listeners = new Set<() => void>();

function emit() {
  try {
    // Les photos ajoutées en démonstration (liens locaux) ne sont pas gardées d'une visite à l'autre.
    const keep = { ...state, checks: state?.checks.map((c) => ({ ...c, photos: c.photos.filter((p) => !p.url.startsWith('blob:')) })) };
    sessionStorage.setItem(KEY, JSON.stringify(keep));
  } catch {
    // Stockage indisponible : la démonstration reste en mémoire.
  }
  for (const l of listeners) l();
}

const at = (base: number, days: number, hour: number) => {
  const d = new Date(base + days * DAY);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

function rental(id: string, machine: string, client: [string, string], start: string, end: string, status: Rental['status'], extra: Partial<Rental> = {}): Rental {
  return {
    id,
    org_id: DEMO_RENTAL_ORG,
    machine_id: machine,
    status,
    client_company: client[0],
    client_name: client[1],
    client_phone: '079 000 00 00',
    client_email: 'chantier@exemple.ch',
    site: null,
    delivery: 'livraison',
    start_at: start,
    end_at: end,
    out_at: null,
    back_at: null,
    notes: null,
    transport: {},
    created_by: DEMO_RENTAL_USER,
    created_at: start,
    updated_at: start,
    ...extra,
  };
}

function check(r: Rental, m: DemoMachine, kind: 'depart' | 'retour', when: string, hours: number, defects: Record<string, string> = {}): DemoCheck {
  const items: CheckItems = {};
  for (const k of allItems(m.kind)) items[k] = defects[k] ? { state: 'defaut', comment: defects[k] } : { state: 'ok' };
  return {
    id: `${r.id}-${kind}`,
    org_id: DEMO_RENTAL_ORG,
    rental_id: r.id,
    machine_id: m.id,
    kind,
    items: items as unknown as RentalCheck['items'],
    fuel_level: kind === 'depart' ? 'plein' : '3/4',
    hours,
    accessories: null,
    accident: false,
    accident_note: null,
    safety_valid: null,
    safety_until: null,
    keys_count: 1,
    remarks: null,
    charges: [] as unknown as RentalCheck['charges'],
    reserves: kind === 'retour' ? false : null,
    client_signer: r.client_name,
    client_signature: 'demo',
    staff_signer: 'Atelier',
    staff_signature: 'demo',
    lat: null,
    lng: null,
    report_path: null,
    emailed_at: null,
    created_by: DEMO_RENTAL_USER,
    created_at: when,
    terms_accepted: false,
    terms_path: null,
    breakdown: false,
    breakdown_note: null,
    photos: [],
    clientSigUrl: SIGNATURE,
    staffSigUrl: SIGNATURE,
  };
}

/** Locations d'exemple : une en cours, une en retard, des départs à venir, une rendue, une à risque (machine en réparation). */
function seed(machines: DemoMachine[], inRepair: Set<string>, now: number, day: string): DemoState {
  const by = (code: string) => machines.find((m) => m.code === code) ?? machines[0];
  const rentals: Rental[] = [];
  const checks: DemoCheck[] = [];
  const mp = by('MP-03');
  const na = by('NA-07');
  const ro = by('RO-05');
  const ch = by('CH-02');
  const pe = by('PE-01');
  const ca = by('CA-06');

  const r1 = rental('demo-loc-1', mp.id, ['Paysages Fournier Sàrl', 'Julie Fournier'], at(now, -3, 7), at(now, 2, 17), 'en_cours', { site: 'Nendaz' });
  r1.out_at = r1.start_at;
  checks.push(check(r1, mp, 'depart', r1.start_at, mp.hours - 18));
  const r2 = rental('demo-loc-2', na.id, ['Façades Rey SA', 'Marc Rey'], at(now, -6, 7), at(now, -1, 17), 'en_cours', { site: 'Sion, avenue de la Gare', delivery: 'enlevement' });
  r2.out_at = r2.start_at;
  checks.push(check(r2, na, 'depart', r2.start_at, na.hours - 22));
  rentals.push(r1, r2);
  rentals.push(
    rental('demo-loc-3', ro.id, ['Revêtements Morand SA', 'Luc Morand'], at(now, 0, 7), at(now, 3, 17), 'reservee', {
      site: 'Martigny',
      transport: { out: { carrier: 'Camion interne · Yves', at: at(now, 0, 6), note: '', done: true } },
    }),
  );
  rentals.push(rental('demo-loc-4', ch.id, ['Terrassements Bonvin', 'Anne Bonvin'], at(now, 4, 7), at(now, 9, 17), 'reservee', { delivery: 'enlevement' }));
  rentals.push(rental('demo-loc-5', ca.id, ['Transports Rossier', 'Paul Rossier'], at(now, 12, 7), at(now, 14, 17), 'reservee', { delivery: 'enlevement' }));
  const r6 = rental('demo-loc-6', pe.id, ['Génie civil Crettenand SA', 'David Crettenand'], at(now, -12, 7), at(now, -8, 17), 'terminee', { site: 'Conthey' });
  r6.out_at = r6.start_at;
  r6.back_at = r6.end_at;
  checks.push(check(r6, pe, 'depart', r6.start_at, pe.hours - 60));
  checks.push(check(r6, pe, 'retour', r6.end_at, pe.hours - 26, { carrosserie: 'Rayure sur la porte de cabine' }));
  rentals.push(r6);
  // Réservation à venir d'une machine en réparation : signalée dans l'agenda.
  const risky = machines.find((m) => inRepair.has(m.id) && !rentals.some((r) => r.machine_id === m.id && r.status !== 'terminee'));
  if (risky) rentals.push(rental('demo-loc-7', risky.id, ['Constructions Délèze', 'Sophie Délèze'], at(now, 6, 7), at(now, 8, 17), 'reservee'));
  return { day, rentals, checks, broken: [] };
}

function load(day: string): DemoState | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as DemoState) : null;
    return parsed && parsed.day === day ? { ...parsed, broken: parsed.broken ?? [] } : null;
  } catch {
    return null;
  }
}

/** Initialise la démonstration une fois par visite (même jour : on reprend ce qui a été fait). */
export function initDemoRentals(machines: DemoMachine[], inRepair: Set<string>, day: string) {
  if (state && state.day === day) return;
  state = load(day) ?? seed(machines, inRepair, Date.now(), day);
  emit();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useDemoRentals(): DemoState | null {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => null,
  );
}

function overlap(machineId: string, start: string, end: string, except?: string) {
  return (state?.rentals ?? []).some(
    (r) =>
      r.id !== except &&
      r.machine_id === machineId &&
      (r.status === 'reservee' || r.status === 'en_cours') &&
      Date.parse(r.start_at) < Date.parse(end) &&
      Date.parse(r.end_at) > Date.parse(start),
  );
}

export const demoRentalActions = {
  save(input: RentalInput, id?: string): RentalErrorCode | null {
    if (!state) return 'generic';
    const row = rentalRow(input);
    if (!(Date.parse(row.end_at) > Date.parse(row.start_at))) return 'dates';
    if (overlap(row.machine_id, row.start_at, row.end_at, id)) return 'overlap';
    const stamp = new Date().toISOString();
    if (id) state = { ...state, rentals: state.rentals.map((r) => (r.id === id ? { ...r, ...row, updated_at: stamp } : r)) };
    else
      state = {
        ...state,
        rentals: [...state.rentals, { ...rental(`demo-loc-${Date.now()}`, row.machine_id, [row.client_company ?? '', row.client_name], row.start_at, row.end_at, 'reservee'), ...row }],
      };
    emit();
    return null;
  },
  saveTransport(id: string, transport: Transport): RentalErrorCode | null {
    if (!state) return 'generic';
    state = { ...state, rentals: state.rentals.map((r) => (r.id === id ? { ...r, transport: transport as Rental['transport'] } : r)) };
    emit();
    return null;
  },
  cancel(id: string): RentalErrorCode | null {
    if (!state) return 'generic';
    state = { ...state, rentals: state.rentals.map((r) => (r.id === id ? { ...r, status: 'annulee' } : r)) };
    emit();
    return null;
  },
  saveCheck(input: DemoCheckInput): RentalErrorCode | null {
    if (!state) return 'generic';
    const r = state.rentals.find((x) => x.id === input.check.rental_id);
    if (!r) return 'generic';
    const kind = input.check.kind;
    if ((kind === 'depart' && r.status !== 'reservee') || (kind === 'retour' && r.status !== 'en_cours')) return 'wrongStep';
    const c: DemoCheck = { ...input.check, photos: input.photos, clientSigUrl: input.clientSigUrl, staffSigUrl: input.staffSigUrl };
    const when = input.check.created_at;
    state = {
      ...state,
      checks: [...state.checks.filter((x) => !(x.rental_id === r.id && x.kind === kind)), c],
      broken: input.check.breakdown ? [...state.broken, { machineId: r.machine_id, note: input.check.breakdown_note ?? '' }] : state.broken,
      rentals: state.rentals.map((x) =>
        x.id === r.id ? (kind === 'depart' ? { ...x, status: 'en_cours', out_at: when } : { ...x, status: 'terminee', back_at: when }) : x,
      ),
    };
    emit();
    return null;
  },
};

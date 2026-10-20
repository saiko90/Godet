// Structure du parc d'exemple de /demo (six machines, douze mois de carnet) et de la pelle de démonstration créée à
// l'inscription (PE-01) : types, chiffres et dates. Aucun texte ici : les titres, détails, échéances, notes, modèles,
// personnes et fournisseurs sont dans messages/<langue>/demo.json, sous les mêmes clés (machine, e01, s1…).
// Les quatre langues reprennent donc exactement les mêmes chiffres.
// Jours : décalage depuis aujourd'hui (négatif = passé). PE-01 reprend l'historique de la machine de démonstration
// (supabase/migrations/20261019150100_demo_machine.sql, date de référence 19.10.2026).
import type { EntryKind, MachineKind, RepairStatus } from '@/lib/types';

export type DemoSlug = 'pe01' | 'ch02' | 'mp03' | 'du04' | 'ro05' | 'ca06';
export type DemoPerson = 'workshop' | 'foreman' | 'operator' | 'partner' | 'roadOffice';
export type DemoSupplier = 'tpValais' | 'rhoneHydraulics' | 'rhoneTyres' | 'electroDiesel' | 'trucksMartigny';
export type DemoReason = 'duplicate';

/**
 * Saisie : [type, jour, compteur (nombre, « auto » = selon le rythme de la machine, ou null), fait par,
 * pièces, main-d'œuvre, immobilisation h, statut, réf., qté, garantie (jours après la saisie), fournisseur, retrait].
 * Son texte : machines.<machine>.entries.eNN (NN = rang dans la liste, à partir de 01).
 */
export type DemoEntryDef = [
  kind: EntryKind,
  day: number,
  hours: number | 'auto' | null,
  by: DemoPerson | null,
  parts: number,
  labour: number,
  downtime: number | null,
  status: RepairStatus | null,
  ref: string | null,
  qty: number | null,
  warranty: number | null,
  supplier?: DemoSupplier | null,
  removed?: { reason: DemoReason; after: number },
];

/** Échéance ; son libellé : machines.<machine>.schedules.sN (N = rang, à partir de 1). */
export type DemoScheduleDef =
  | { basis: 'heures'; every: number | null; last: number | null; lastDay: number | null; due: number }
  | { basis: 'date'; everyDays: number | null; lastDay: number | null; dueDay: number };

export interface DemoMachineDef {
  slug: DemoSlug;
  code: string;
  kind: MachineKind;
  /** Marque et modèle (noms de produits) ; absents : textes traduits (machine de démonstration « Démo »). */
  brand?: string;
  model?: string;
  year: number;
  serial: string;
  plate: string | null;
  weight: number;
  color: string;
  hours: number;
  /** Heures par jour calendaire (pour situer les compteurs dans le temps) ; 0 : machine de démonstration. */
  perDay: number;
  /** Décalage du dernier relevé (0 : ce matin). */
  lastRead: number;
  /** Relevés réguliers du machiniste (tous les 14 jours sur les 4 derniers mois). */
  routineReadings: boolean;
  /** Relevés supplémentaires (machine de démonstration). */
  readings?: { hours: number; day: number }[];
  entries: DemoEntryDef[];
  schedules: DemoScheduleDef[];
}

/** Rang d'une saisie → clé de son texte (0 → « e01 »). */
export const entryKey = (index: number) => `e${String(index + 1).padStart(2, '0')}`;
/** Rang d'une échéance → clé de son libellé (0 → « s1 »). */
export const scheduleKey = (index: number) => `s${index + 1}`;

export const DEMO_FLEET: DemoMachineDef[] = [
  {
    slug: 'pe01',
    code: 'PE-01',
    kind: 'pelle',
    year: 2019,
    serial: 'EX21-004587',
    plate: null,
    weight: 21,
    color: '#f3b71b',
    hours: 6842,
    perDay: 0,
    lastRead: 0,
    routineReadings: false,
    readings: [{ hours: 6806, day: -7 }],
    entries: [
      ['service', -356, 5512, 'workshop', 380, 240, null, null, null, null, null],
      ['inspection', -346, 5580, 'foreman', 0, 540, null, null, null, null, null],
      ['reparation', -339, 5590, 'workshop', 980, 260, 4, 'fait', null, null, null],
      ['piece', -332, null, null, 320, 0, null, null, 'CL-03', 1, null],
      ['inspection', -319, 5640, 'operator', 0, 380, null, null, null, null, null],
      ['piece', -318, null, null, 90, 0, null, null, 'EL-KIT', 1, null],
      ['service', -283, 5760, 'workshop', 240, 370, null, null, null, null, null],
      ['piece', -279, null, null, 760, 0, null, null, 'FX-ST', 4, null],
      ['reparation', -265, 5790, 'workshop', 1260, 1120, 18, 'fait', null, null, null],
      ['piece', -251, null, null, 140, 0, null, null, 'LED-24', 1, 365],
      ['inspection', -246, 5860, 'operator', 0, 450, null, null, null, null, null],
      ['reparation', -215, 5998, 'workshop', 450, 190, 2, 'fait', null, null, null],
      ['piece', -215, null, null, 520, 0, null, null, 'LU-110', 1, null],
      ['service', -211, 6004, 'workshop', 760, 480, null, null, null, null, null],
      ['piece', -193, null, null, 210, 0, null, null, 'BAT-140', 1, 731],
      ['inspection', -185, 6060, 'foreman', 0, 530, null, null, null, null, null],
      ['reparation', -160, 6110, 'workshop', 410, 570, 6, 'fait', null, null, null],
      ['piece', -152, null, null, 430, 0, null, null, 'JT-08', 1, 365],
      ['inspection', -143, 6150, 'partner', 0, 690, null, null, null, null, null],
      ['controle', -135, 6220, 'foreman', 0, 420, null, null, null, null, null],
      ['piece', -130, null, null, 160, 0, null, null, 'FC-12', 1, null],
      ['service', -103, 6350, 'partner', 240, 340, null, null, null, null, null],
      ['piece', -103, null, null, 610, 0, null, null, 'CL-110', 2, null],
      ['reparation', -90, 6380, 'workshop', 690, 350, 9, 'fait', null, null, null],
      ['service', -66, 6498, 'workshop', 760, 480, null, null, null, null, null],
      ['piece', -50, null, null, 380, 0, null, null, 'GR-EP2', 24, null],
      ['reparation', -46, 6602, 'workshop', 380, 320, 5, 'fait', null, null, null],
      ['inspection', -37, 6640, 'operator', 0, 120, null, null, null, null, null],
      ['piece', -30, null, null, 440, 0, null, null, 'KF-7000', 1, null],
      ['inspection', -13, 6770, 'operator', 0, 260, null, null, null, null, null],
      ['reparation', -4, 6830, 'foreman', 520, 170, null, 'attente_piece', null, null, null],
    ],
    schedules: [
      { basis: 'heures', every: 500, last: 6498, lastDay: -66, due: 7000 },
      { basis: 'heures', every: 1000, last: 6060, lastDay: -185, due: 7060 },
      { basis: 'heures', every: 2000, last: 6004, lastDay: -211, due: 8000 },
      { basis: 'date', everyDays: 365, lastDay: -246, dueDay: 119 },
      { basis: 'date', everyDays: 365, lastDay: -135, dueDay: 230 },
    ],
  },
  {
    slug: 'ch02',
    code: 'CH-02',
    kind: 'chargeuse',
    brand: 'Liebherr',
    model: 'L 550',
    year: 2021,
    serial: 'L550-2105-1187',
    plate: null,
    weight: 18,
    color: '#f3b71b',
    hours: 4215,
    perDay: 4,
    lastRead: 0,
    routineReadings: true,
    entries: [
      ['inspection', -334, 'auto', 'operator', 0, 120, null, null, null, null, null],
      ['service', -304, 'auto', 'workshop', 640, 420, null, null, null, null, null],
      ['reparation', -268, 'auto', 'workshop', 380, 460, 5, 'fait', null, null, null],
      ['piece', -241, null, null, 720, 0, null, null, 'DG-550', 8, null, 'rhoneHydraulics'],
      ['controle', -228, 'auto', 'foreman', 0, 380, null, null, null, null, null],
      ['inspection', -199, 'auto', 'operator', 0, 150, null, null, null, null, null],
      ['service', -179, 'auto', 'workshop', 520, 380, null, null, null, null, null],
      ['piece', -150, null, null, 4680, 0, null, null, 'PN-2325', 1, 730, 'rhoneTyres'],
      ['note', -121, null, 'operator', 0, 0, null, null, null, null, null],
      ['reparation', -112, 'auto', 'workshop', 1240, 720, 8, 'fait', null, null, null],
      ['reparation', -112, 'auto', 'workshop', 1240, 720, 8, 'fait', null, null, null, null, { reason: 'duplicate', after: 1 }],
      ['inspection', -80, 'auto', 'foreman', 0, 120, null, null, null, null, null],
      ['service', -54, 'auto', 'workshop', 690, 420, null, null, null, null, null],
      ['piece', -21, null, null, 190, 0, null, null, 'FA-550', 1, null, 'rhoneHydraulics'],
      ['inspection', -9, 'auto', 'operator', 0, 90, null, null, null, null, null],
    ],
    schedules: [
      { basis: 'heures', every: 500, last: 3999, lastDay: -54, due: 4500 },
      { basis: 'heures', every: 2000, last: null, lastDay: null, due: 5000 },
      { basis: 'date', everyDays: 365, lastDay: -228, dueDay: 137 },
      { basis: 'date', everyDays: 182, lastDay: -150, dueDay: 32 },
    ],
  },
  {
    slug: 'mp03',
    code: 'MP-03',
    kind: 'mini_pelle',
    brand: 'Kubota',
    model: 'KX027-4',
    year: 2022,
    serial: 'KX027-50213',
    plate: null,
    weight: 2.7,
    color: '#e8792b',
    hours: 1262,
    perDay: 2.1,
    lastRead: -2,
    routineReadings: true,
    entries: [
      ['controle', -347, 'auto', 'foreman', 0, 260, null, null, null, null, null],
      ['inspection', -318, 'auto', 'operator', 0, 90, null, null, null, null, null],
      ['piece', -290, null, null, 1350, 0, null, null, 'GC-1000', 1, 365, 'tpValais'],
      ['reparation', -251, 'auto', 'workshop', 140, 180, 2, 'fait', null, null, null],
      ['inspection', -190, 'auto', 'operator', 0, 60, null, null, null, null, null],
      ['service', -125, 1000, 'workshop', 410, 290, null, null, null, null, null],
      ['reparation', -88, 'auto', 'workshop', 95, 60, null, 'fait', null, null, null],
      ['inspection', -60, 'auto', 'operator', 0, 60, null, null, null, null, null],
      ['note', -31, null, 'operator', 0, 0, null, null, null, null, null],
      ['piece', -12, null, null, 160, 0, null, null, 'DG-027', 4, null, 'tpValais'],
    ],
    schedules: [
      { basis: 'heures', every: 500, last: 1000, lastDay: -125, due: 1500 },
      { basis: 'date', everyDays: 365, lastDay: -347, dueDay: 18 },
      { basis: 'date', everyDays: 182, lastDay: -120, dueDay: 62 },
    ],
  },
  {
    slug: 'du04',
    code: 'DU-04',
    kind: 'dumper',
    brand: 'Wacker Neuson',
    model: 'DW90',
    year: 2018,
    serial: 'WNDW90-1803311',
    plate: null,
    weight: 9,
    color: '#f3b71b',
    hours: 3538,
    perDay: 3,
    lastRead: -1,
    routineReadings: true,
    entries: [
      ['service', -345, 'auto', 'workshop', 420, 300, null, null, null, null, null],
      ['reparation', -301, 'auto', 'workshop', 680, 240, 6, 'fait', null, null, null],
      ['inspection', -262, 'auto', 'operator', 0, 120, null, null, null, null, null],
      ['controle', -205, 'auto', 'foreman', 0, 320, null, null, null, null, null],
      ['service', -179, 3000, 'workshop', 480, 320, null, null, null, null, null],
      ['piece', -140, null, null, 240, 0, null, null, 'BAT-110', 1, 730, 'electroDiesel'],
      ['reparation', -95, 'auto', 'workshop', 560, 780, 10, 'fait', null, null, null],
      ['inspection', -61, 'auto', 'operator', 0, 60, null, null, null, null, null],
      ['note', -27, null, 'foreman', 0, 0, null, null, null, null, null],
      ['reparation', -3, 'auto', 'workshop', 180, 0, null, 'en_cours', null, null, null],
    ],
    schedules: [
      { basis: 'heures', every: 500, last: 3000, lastDay: -179, due: 3500 },
      { basis: 'heures', every: 1000, last: null, lastDay: null, due: 4000 },
      { basis: 'date', everyDays: 365, lastDay: -205, dueDay: 160 },
    ],
  },
  {
    slug: 'ro05',
    code: 'RO-05',
    kind: 'rouleau',
    brand: 'Hamm',
    model: 'H 12i',
    year: 2020,
    serial: 'H12I-2006-0457',
    plate: null,
    weight: 12,
    color: '#e8792b',
    hours: 2262,
    perDay: 2.4,
    lastRead: -3,
    routineReadings: true,
    entries: [
      ['service', -317, 'auto', 'workshop', 460, 320, null, null, null, null, null],
      ['piece', -290, null, null, 320, 0, null, null, 'RB-12', 1, null, 'tpValais'],
      ['inspection', -251, 'auto', 'workshop', 0, 160, null, null, null, null, null],
      ['controle', -155, 'auto', 'foreman', 0, 300, null, null, null, null, null],
      ['inspection', -131, 'auto', 'operator', 0, 140, null, null, null, null, null],
      ['service', -109, 2000, 'workshop', 560, 380, null, null, null, null, null],
      ['reparation', -71, 'auto', 'workshop', 420, 190, 3, 'fait', null, null, null],
      ['inspection', -36, 'auto', 'operator', 0, 80, null, null, null, null, null],
    ],
    schedules: [
      { basis: 'heures', every: 500, last: 2000, lastDay: -109, due: 2500 },
      { basis: 'date', everyDays: 365, lastDay: -251, dueDay: 114 },
      { basis: 'date', everyDays: 365, lastDay: -155, dueDay: 210 },
    ],
  },
  {
    slug: 'ca06',
    code: 'CA-06',
    kind: 'camion',
    brand: 'Mercedes-Benz',
    model: 'Arocs 3242 K 8×4',
    year: 2019,
    serial: 'WDB9640421L234567',
    plate: 'VS 287 514',
    weight: 32,
    color: '#2f6fd8',
    hours: 8960,
    perDay: 6,
    lastRead: 0,
    routineReadings: true,
    entries: [
      ['controle', -343, 'auto', 'roadOffice', 0, 520, null, null, null, null, null],
      ['piece', -330, null, null, 1580, 0, null, null, 'PN-38565', 2, 730, 'rhoneTyres'],
      ['reparation', -290, 'auto', 'workshop', 260, 220, 4, 'fait', null, null, null],
      ['service', -260, 7400, 'partner', 820, 540, null, null, null, null, null],
      ['piece', -200, null, null, 520, 0, null, null, 'PF-AR2', 1, null, 'trucksMartigny'],
      ['service', -160, 8000, 'partner', 860, 560, null, null, null, null, null],
      ['reparation', -121, 'auto', 'partner', 1380, 1120, 16, 'fait', null, null, null],
      ['inspection', -90, 'auto', 'operator', 0, 60, null, null, null, null, null],
      ['service', -60, 8600, 'partner', 840, 560, null, null, null, null, null],
      ['inspection', -15, 'auto', 'operator', 0, 90, null, null, null, null, null],
      ['reparation', -6, 'auto', 'foreman', 640, 180, null, 'attente_piece', null, null, null],
    ],
    schedules: [
      { basis: 'heures', every: 600, last: 8600, lastDay: -60, due: 9200 },
      { basis: 'date', everyDays: 365, lastDay: -343, dueDay: 22 },
      { basis: 'date', everyDays: 730, lastDay: -430, dueDay: 300 },
    ],
  },
];

// ------------------------------------------------------------------ textes (messages/<langue>/demo.json)

export interface DemoEntryText {
  title: string;
  details?: string;
}

export interface DemoMachineText {
  brand?: string;
  model?: string;
  notes?: string;
  entries: Record<string, DemoEntryText>;
  schedules: Record<string, string>;
}

/** Textes du parc d'exemple dans une langue (la partie « contenu » de demo.json). */
export interface DemoTexts {
  org: string;
  people: Record<DemoPerson, string>;
  suppliers: Record<DemoSupplier, string>;
  reasons: Record<DemoReason, string>;
  machines: Record<DemoSlug, DemoMachineText>;
}

/** Texte d'une saisie (lève une erreur si la traduction manque : `node scripts/check-messages.mjs` la signale aussi). */
export function entryText(texts: DemoTexts, slug: DemoSlug, index: number): DemoEntryText {
  const t = texts.machines[slug].entries[entryKey(index)];
  if (!t) throw new Error(`Texte de démonstration manquant : machines.${slug}.entries.${entryKey(index)}`);
  return t;
}

/** Libellé d'une échéance. */
export function scheduleText(texts: DemoTexts, slug: DemoSlug, index: number): string {
  const t = texts.machines[slug].schedules[scheduleKey(index)];
  if (t == null) throw new Error(`Texte de démonstration manquant : machines.${slug}.schedules.${scheduleKey(index)}`);
  return t;
}

// Classeur Excel du parc : export (machines, carnet, échéances) et import (machines et historique d'un ancien carnet).
// Module chargé à la demande (bibliothèques .xlsx et en-têtes des quatre langues) : rien n'alourdit le garage.
// L'import accepte un classeur dans n'importe laquelle des quatre langues, quelle que soit la langue de l'interface.
import readXlsxFile from 'read-excel-file/browser';
import writeXlsxFile from 'write-excel-file/browser';
import type { SheetData as WriteSheetData } from 'write-excel-file/browser';
import domainDe from '../../../messages/de/domain.json';
import domainEn from '../../../messages/en/domain.json';
import domainFr from '../../../messages/fr/domain.json';
import domainIt from '../../../messages/it/domain.json';
import excelDe from '../../../messages/de/excel.json';
import excelEn from '../../../messages/en/excel.json';
import excelFr from '../../../messages/fr/excel.json';
import excelIt from '../../../messages/it/excel.json';
import type { MachineHealth } from '@/lib/domain';
import type { DomainText } from '@/lib/domain-text';
import type { Format } from '@/lib/format';
import { MACHINE_KIND_ORDER } from '@/lib/machine-kinds';
import type { NewEntry, NewMachine } from '@/lib/repo/types';
import type { Entry, EntryKind, Machine, MachineKind, RepairStatus } from '@/lib/types';
import { parseLocalNumber } from './numbers';

const ENTRY_KINDS: readonly EntryKind[] = ['service', 'reparation', 'piece', 'controle', 'inspection', 'note'];
const REPAIR: readonly RepairStatus[] = ['fait', 'en_cours', 'attente_piece'];
/** Garde-fou : un import plus gros se découpe en plusieurs fichiers. */
export const MAX_ROWS = 3000;

type Cols = typeof excelFr.cols;
type ColId = keyof Cols;

/** « Poids (t) » → « poidst » : comparaison sans casse, accents ni ponctuation. */
export function norm(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

const ALL_EXCEL = [excelFr, excelDe, excelIt, excelEn];
const ALL_DOMAIN = [domainFr, domainDe, domainIt, domainEn];

const HEADERS = new Map<string, ColId>();
for (const x of ALL_EXCEL) for (const [id, label] of Object.entries(x.cols)) if (!HEADERS.has(norm(label))) HEADERS.set(norm(label), id as ColId);
// Quelques intitulés courants des tableaux tenus à la main.
for (const [alias, id] of [
  ['machine', 'machine'], ['maschine', 'machine'], ['macchina', 'machine'], ['engin', 'machine'],
  ['compteur', 'meter'], ['heurescompteur', 'meter'], ['zahler', 'meter'], ['contaore', 'meter'], ['hourmeter', 'meter'],
  ['typedemachine', 'kind'], ['genre', 'kind'], ['poids', 'weight'], ['gewicht', 'weight'], ['peso', 'weight'], ['weight', 'weight'],
  ['marque', 'brand'], ['description', 'details'], ['beschreibung', 'details'], ['descrizione', 'details'],
  ['pieces', 'parts'], ['coutpieces', 'parts'], ['mainduvre', 'labour'], ['mo', 'labour'], ['type', 'kind'],
] as const) if (!HEADERS.has(alias)) HEADERS.set(alias, id);

const SHEETS = new Map<string, 'machines' | 'carnet' | 'schedules'>();
for (const x of ALL_EXCEL) for (const [id, label] of Object.entries(x.sheets)) SHEETS.set(norm(label), id as 'machines' | 'carnet' | 'schedules');

type KindTexts = Record<string, { label: string; short: string }>;
const KIND_OF = new Map<string, MachineKind>();
for (const k of MACHINE_KIND_ORDER) KIND_OF.set(norm(k), k);
// Noms complets d'abord, noms courts ensuite (sans écraser) : « Pelle » reste la pelle sur chenilles.
for (const field of ['label', 'short'] as const) {
  for (const d of ALL_DOMAIN) {
    for (const k of MACHINE_KIND_ORDER) {
      const v = (d.machineKinds as KindTexts)[k]?.[field];
      if (v && !KIND_OF.has(norm(v))) KIND_OF.set(norm(v), k);
    }
  }
}
const ENTRY_OF = new Map<string, EntryKind>();
for (const k of ENTRY_KINDS) ENTRY_OF.set(norm(k), k);
for (const d of ALL_DOMAIN) for (const k of ENTRY_KINDS) {
  const label = (d.entryKinds as Record<string, { label: string }>)[k]?.label;
  if (label && !ENTRY_OF.has(norm(label))) ENTRY_OF.set(norm(label), k);
}
const REPAIR_OF = new Map<string, RepairStatus>();
for (const k of REPAIR) REPAIR_OF.set(norm(k), k);
for (const d of ALL_DOMAIN) for (const k of REPAIR) {
  const label = (d.repairStatus as Record<string, string>)[k];
  if (label && !REPAIR_OF.has(norm(label))) REPAIR_OF.set(norm(label), k);
}

export function kindOf(value: unknown): MachineKind | null {
  return KIND_OF.get(norm(value)) ?? null;
}
export function entryKindOf(value: unknown): EntryKind | null {
  return ENTRY_OF.get(norm(value)) ?? null;
}

// ------------------------------------------------------------------ export

export interface ExportTexts {
  sheets: Record<'machines' | 'carnet' | 'schedules', string>;
  cols: Cols;
  example: { title: string; details: string; by: string };
}

export interface ExportInput {
  machines: Machine[];
  entries: Entry[];
  health: Map<string, MachineHealth>;
  f: Format;
  dt: DomainText;
  texts: ExportTexts;
  country: string;
}

/** Date AAAA-MM-JJ → Date à minuit UTC (Excel n'a pas de fuseau : la date reste la même partout). */
function day(iso: string | null | undefined): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  return m ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) : null;
}

const HEAD = { fontWeight: 'bold' as const, backgroundColor: '#F3B71B', color: '#0B0D10' };
const MONEY = '#,##0.00';

function headRow(cols: string[]): WriteSheetData[number] {
  return cols.map((value) => ({ value, ...HEAD }));
}
const txt = (v: string | null | undefined) => (v ? { value: v, type: String } : null);
const num = (v: number | string | null | undefined, format?: string) =>
  v == null || v === '' || !Number.isFinite(Number(v)) ? null : { value: Number(v), type: Number, ...(format ? { format } : {}) };
const date = (iso: string | null | undefined, format: string) => {
  const d = day(iso);
  return d ? { value: d, type: Date, format } : null;
};

const MACHINE_COLS: ColId[] = ['code', 'kind', 'weight', 'brand', 'model', 'year', 'serial', 'plate', 'hours', 'hoursAt', 'state', 'nextDue', 'notes'];
const ENTRY_COLS: ColId[] = ['date', 'machine', 'entryKind', 'title', 'details', 'meter', 'by', 'parts', 'labour', 'total', 'downtime', 'repair', 'partRef', 'partQty', 'supplier', 'removed'];
const IMPORT_MACHINE_COLS = MACHINE_COLS.filter((c) => c !== 'hoursAt' && c !== 'state' && c !== 'nextDue');
const IMPORT_ENTRY_COLS = ENTRY_COLS.filter((c) => c !== 'total' && c !== 'removed');

function dateFormat(country: string): string {
  return country === 'FR' || country === 'BE' || country === 'LU' ? 'dd/mm/yyyy' : 'dd.mm.yyyy';
}

/** Classeur complet du parc. */
export async function exportWorkbook(input: ExportInput): Promise<Blob> {
  const { machines, entries, health, dt, texts, country } = input;
  const df = dateFormat(country);
  const code = new Map(machines.map((m) => [m.id, m.code]));

  const mRows: WriteSheetData = [headRow(MACHINE_COLS.map((c) => texts.cols[c]))];
  for (const m of machines) {
    const h = health.get(m.id);
    const due = h?.dues[0];
    mRows.push([
      txt(m.code),
      txt(dt.kind(m.kind)),
      num(m.weight_t),
      txt(m.brand),
      txt(m.model),
      num(m.year),
      txt(m.serial),
      txt(m.plate),
      num(m.hours),
      date(m.hours_at, df),
      txt(dt.health(h?.state ?? 'ok')),
      txt(due ? `${due.schedule.label} · ${dt.dueText(due)}` : null),
      txt(m.notes),
    ]);
  }

  const eRows: WriteSheetData = [headRow(ENTRY_COLS.map((c) => texts.cols[c]))];
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at));
  for (const e of sorted) {
    eRows.push([
      date(e.date, df),
      txt(code.get(e.machine_id) ?? ''),
      txt(dt.entry(e.kind)),
      txt(e.title),
      txt(e.details),
      num(e.hours),
      txt(e.performed_by),
      num(e.cost_parts, MONEY),
      num(e.cost_labour, MONEY),
      num(Number(e.cost_parts) + Number(e.cost_labour), MONEY),
      num(e.downtime_hours),
      txt(e.repair_status ? dt.repair(e.repair_status) : null),
      txt(e.part_ref),
      num(e.part_qty),
      txt(e.supplier),
      txt(e.deleted_at ? e.delete_reason || '—' : null),
    ]);
  }

  const sCols: ColId[] = ['machine', 'schedule', 'due', 'state'];
  const sRows: WriteSheetData = [headRow(sCols.map((c) => texts.cols[c]))];
  for (const m of machines) {
    for (const d of health.get(m.id)?.dues ?? []) {
      sRows.push([txt(m.code), txt(d.schedule.label), txt(dt.dueText(d)), txt(dt.health(d.state))]);
    }
  }

  const widths = (cols: ColId[], wide: ColId[]) => cols.map((c) => ({ width: wide.includes(c) ? 34 : c === 'kind' || c === 'entryKind' ? 22 : 14 }));
  return writeXlsxFile([
    { data: mRows, sheet: texts.sheets.machines, columns: widths(MACHINE_COLS, ['nextDue', 'notes']), stickyRowsCount: 1 },
    { data: eRows, sheet: texts.sheets.carnet, columns: widths(ENTRY_COLS, ['title', 'details', 'removed']), stickyRowsCount: 1 },
    { data: sRows, sheet: texts.sheets.schedules, columns: widths(sCols, ['schedule', 'due']), stickyRowsCount: 1 },
  ]).toBlob();
}

/** Modèle vide : les colonnes importables et une ligne d'exemple par feuille. */
export async function templateWorkbook(input: { f: Format; dt: DomainText; texts: ExportTexts; country: string; today: string }): Promise<Blob> {
  const { dt, texts, country, today } = input;
  const df = dateFormat(country);
  const mRows: WriteSheetData = [
    headRow(IMPORT_MACHINE_COLS.map((c) => texts.cols[c])),
    [txt('PE-01'), txt(dt.kind('pelle')), num(22), txt('Caterpillar'), txt('320'), num(2019), txt('CAT0320XYZ'), null, num(6842), null],
  ];
  const eRows: WriteSheetData = [
    headRow(IMPORT_ENTRY_COLS.map((c) => texts.cols[c])),
    [date(today, df), txt('PE-01'), txt(dt.entry('service')), txt(texts.example.title), txt(texts.example.details), num(6500), txt(texts.example.by), num(420, MONEY), num(180, MONEY), null, null, null, null, null],
  ];
  return writeXlsxFile([
    { data: mRows, sheet: texts.sheets.machines, columns: IMPORT_MACHINE_COLS.map(() => ({ width: 18 })), stickyRowsCount: 1 },
    { data: eRows, sheet: texts.sheets.carnet, columns: IMPORT_ENTRY_COLS.map((c) => ({ width: c === 'title' || c === 'details' ? 30 : 16 })), stickyRowsCount: 1 },
  ]).toBlob();
}

// ------------------------------------------------------------------ import

export type ProblemReason = 'noCode' | 'kind' | 'noMachine' | 'date' | 'entryKind' | 'number' | 'noTitle' | 'dupCode' | 'tooMany';
export interface Problem {
  sheet: string;
  /** Numéro de ligne tel qu'Excel l'affiche. */
  row: number;
  reason: ProblemReason;
  value?: string;
  column?: ColId;
}

export interface MachineUpdate {
  id: string;
  code: string;
  patch: Partial<NewMachine>;
  /** Nouveau compteur, s'il dépasse l'actuel (un relevé est ajouté). */
  hours: number | null;
}

export interface ImportPlan {
  creates: NewMachine[];
  updates: MachineUpdate[];
  entries: { code: string; input: Omit<NewEntry, 'machineId'> }[];
  duplicates: number;
  problems: Problem[];
}

type Cell = string | number | boolean | Date | null;
type Rows = Cell[][];

function isBlank(v: Cell | undefined): boolean {
  return v == null || (typeof v === 'string' && v.trim() === '');
}
function str(v: Cell | undefined): string | null {
  if (isBlank(v)) return null;
  if (v instanceof Date) return isoDay(v);
  return String(v).trim().slice(0, 500);
}
function isoDay(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** Nombre d'une cellule : valeur Excel, ou texte (« 1’240.50 », « 6 842 h », « CHF 420 »). undefined = illisible. */
function number(v: Cell | undefined, f: Format): number | null | undefined {
  if (isBlank(v)) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  const cleaned = String(v).replace(/[’'`]/g, '').replace(/chf|eur|€|fr\.?|h|t/gi, '').trim();
  const n = parseLocalNumber(cleaned, f);
  return n == null ? undefined : n;
}

/** Date d'une cellule : date Excel, numéro de série, « 2026-03-14 », « 14.03.2026 », « 14/03/26 ». */
function dayOf(v: Cell | undefined): string | null | undefined {
  if (isBlank(v)) return null;
  let d: Date | null = null;
  if (v instanceof Date) d = v;
  else if (typeof v === 'number' && v > 20000 && v < 80000) d = new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 86_400_000);
  else {
    const s = String(v).trim();
    let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
    if (m) d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    else if ((m = /^(\d{1,2})[./-](\d{1,2})[./-](\d{2}|\d{4})$/.exec(s))) {
      const y = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
      d = new Date(Date.UTC(y, +m[2] - 1, +m[1]));
      if (d.getUTCDate() !== +m[1] || d.getUTCMonth() !== +m[2] - 1) d = null;
    }
  }
  if (!d || Number.isNaN(d.getTime())) return undefined;
  const y = d.getUTCFullYear();
  return y < 1950 || y > 2100 ? undefined : isoDay(d);
}

interface ParsedSheet {
  name: string;
  kind: 'machines' | 'carnet';
  cols: Map<ColId, number>;
  rows: Rows;
}

function classify(name: string, data: Rows): ParsedSheet | null {
  // L'en-tête est la première ligne non vide parmi les cinq premières (un titre peut la précéder).
  for (let i = 0; i < Math.min(5, data.length); i++) {
    const cols = new Map<ColId, number>();
    data[i].forEach((cell, j) => {
      const id = HEADERS.get(norm(cell));
      if (id && !cols.has(id)) cols.set(id, j);
    });
    const byName = SHEETS.get(norm(name));
    if (cols.has('code') && cols.has('kind') && byName !== 'carnet') return { name, kind: 'machines', cols, rows: data.slice(i + 1) };
    if (cols.has('date') && cols.has('machine') && (cols.has('title') || cols.has('entryKind'))) {
      return { name, kind: 'carnet', cols, rows: data.slice(i + 1) as Rows };
    }
    if (cols.size >= 2) break;
  }
  return null;
}

/** Ligne Excel affichée pour l'indice d'une ligne de données. */
function excelRow(sheet: ParsedSheet, data: Rows, index: number): number {
  return data.length - sheet.rows.length + index + 1;
}

export interface PlanContext {
  machines: Machine[];
  f: Format;
  /** Saisies existantes d'une machine (doublons). */
  existingEntries: (machineId: string) => Promise<Entry[]>;
}

/** Lit le classeur et prépare l'import, sans rien écrire. */
export async function planImport(file: File, ctx: PlanContext): Promise<ImportPlan> {
  const sheets = await readXlsxFile(file);
  const parsed = sheets.map((s) => ({ s, p: classify(s.sheet, s.data as Rows) })).filter((x): x is { s: (typeof sheets)[number]; p: ParsedSheet } => x.p != null);
  const plan: ImportPlan = { creates: [], updates: [], entries: [], duplicates: 0, problems: [] };
  const { f } = ctx;
  const byCode = new Map(ctx.machines.map((m) => [norm(m.code), m]));
  const planned = new Set<string>();
  let budget = MAX_ROWS;

  for (const { s, p } of parsed.filter((x) => x.p.kind === 'machines')) {
    const data = s.data as Rows;
    const get = (row: Cell[], c: ColId) => (p.cols.has(c) ? row[p.cols.get(c)!] : undefined);
    p.rows.forEach((row, i) => {
      if (row.every(isBlank)) return;
      const at = { sheet: p.name, row: excelRow(p, data, i) };
      if (budget-- <= 0) {
        if (budget === -1) plan.problems.push({ ...at, reason: 'tooMany', value: String(MAX_ROWS) });
        return;
      }
      const code = str(get(row, 'code'))?.slice(0, 40);
      if (!code) return void plan.problems.push({ ...at, reason: 'noCode' });
      if (planned.has(norm(code))) return void plan.problems.push({ ...at, reason: 'dupCode', value: code });
      const existing = byCode.get(norm(code));
      const kindRaw = get(row, 'kind');
      const kind = isBlank(kindRaw) && existing ? existing.kind : kindOf(kindRaw);
      if (!kind) return void plan.problems.push({ ...at, reason: 'kind', value: str(kindRaw) ?? '' });

      const nums: Partial<Record<'weight' | 'year' | 'hours', number | null>> = {};
      for (const c of ['weight', 'year', 'hours'] as const) {
        const n = number(get(row, c), f);
        if (n === undefined || (n != null && (n < 0 || (c === 'year' && (n < 1900 || n > 2100)) || (c === 'weight' && n > 2000)))) {
          return void plan.problems.push({ ...at, reason: 'number', value: str(get(row, c)) ?? '', column: c });
        }
        nums[c] = n;
      }
      planned.add(norm(code));
      const fields: Partial<NewMachine> = { kind };
      const text = (c: ColId, key: 'brand' | 'model' | 'serial' | 'plate' | 'notes') => {
        const v = str(get(row, c));
        if (v != null) fields[key] = v;
      };
      text('brand', 'brand');
      text('model', 'model');
      text('serial', 'serial');
      text('plate', 'plate');
      text('notes', 'notes');
      if (nums.weight != null) fields.weightT = nums.weight;
      if (nums.year != null) fields.year = Math.round(nums.year);

      if (existing) {
        const hours = nums.hours != null && nums.hours > Number(existing.hours) ? nums.hours : null;
        const changed = Object.entries(fields).some(([k, v]) => {
          const cur = { kind: existing.kind, brand: existing.brand, model: existing.model, serial: existing.serial, plate: existing.plate, notes: existing.notes, weightT: existing.weight_t == null ? null : Number(existing.weight_t), year: existing.year }[k];
          return cur !== v;
        });
        if (changed || hours != null) plan.updates.push({ id: existing.id, code: existing.code, patch: changed ? fields : {}, hours });
      } else {
        plan.creates.push({ code, ...fields, kind, hours: nums.hours ?? 0 });
      }
    });
  }

  const known = new Map<string, string>(); // code normalisé → code tel qu'écrit
  for (const m of ctx.machines) known.set(norm(m.code), m.code);
  for (const m of plan.creates) known.set(norm(m.code), m.code);

  const pending: { code: string; key: string; input: Omit<NewEntry, 'machineId'> }[] = [];
  for (const { s, p } of parsed.filter((x) => x.p.kind === 'carnet')) {
    const data = s.data as Rows;
    const get = (row: Cell[], c: ColId) => (p.cols.has(c) ? row[p.cols.get(c)!] : undefined);
    p.rows.forEach((row, i) => {
      if (row.every(isBlank)) return;
      // Saisie retirée (export) : elle reste dans le carnet d'origine, on ne la recrée pas.
      if (!isBlank(get(row, 'removed'))) return;
      const at = { sheet: p.name, row: excelRow(p, data, i) };
      if (budget-- <= 0) {
        if (budget === -1) plan.problems.push({ ...at, reason: 'tooMany', value: String(MAX_ROWS) });
        return;
      }
      const machineRaw = str(get(row, 'machine'));
      const code = machineRaw ? known.get(norm(machineRaw)) : undefined;
      if (!code) return void plan.problems.push({ ...at, reason: 'noMachine', value: machineRaw ?? '' });
      const when = dayOf(get(row, 'date'));
      if (!when) return void plan.problems.push({ ...at, reason: 'date', value: str(get(row, 'date')) ?? '' });
      const kindRaw = get(row, 'entryKind');
      const kind = isBlank(kindRaw) ? 'note' : entryKindOf(kindRaw);
      if (!kind) return void plan.problems.push({ ...at, reason: 'entryKind', value: str(kindRaw) ?? '' });
      const title = str(get(row, 'title'))?.slice(0, 200) ?? null;
      if (!title) return void plan.problems.push({ ...at, reason: 'noTitle' });

      const nums: Partial<Record<'meter' | 'parts' | 'labour' | 'downtime' | 'partQty', number | null>> = {};
      for (const c of ['meter', 'parts', 'labour', 'downtime', 'partQty'] as const) {
        const n = number(get(row, c), f);
        if (n === undefined || (n != null && n < 0)) return void plan.problems.push({ ...at, reason: 'number', value: str(get(row, c)) ?? '', column: c });
        nums[c] = n;
      }
      const repairRaw = get(row, 'repair');
      const repair = kind === 'reparation' ? (REPAIR_OF.get(norm(repairRaw)) ?? 'fait') : null;
      const input: Omit<NewEntry, 'machineId'> = {
        kind,
        date: when,
        title,
        hours: nums.meter ?? null,
        details: str(get(row, 'details')),
        performedBy: str(get(row, 'by')),
        costParts: nums.parts ?? 0,
        costLabour: nums.labour ?? 0,
        downtimeHours: nums.downtime ?? null,
        repairStatus: repair,
        partRef: str(get(row, 'partRef')),
        partQty: nums.partQty ?? null,
        supplier: str(get(row, 'supplier')),
      };
      pending.push({ code, key: entryKey(when, kind, title, nums.meter ?? null), input });
    });
  }

  // Doublons : saisies déjà au carnet (même jour, même genre, même titre, même compteur) ou répétées dans le fichier.
  const seen = new Map<string, Set<string>>();
  for (const code of new Set(pending.map((e) => e.code))) {
    const m = byCode.get(norm(code));
    const keys = new Set<string>();
    if (m) for (const e of await ctx.existingEntries(m.id)) if (!e.deleted_at) keys.add(entryKey(e.date, e.kind, e.title, e.hours == null ? null : Number(e.hours)));
    seen.set(code, keys);
  }
  for (const e of pending) {
    const keys = seen.get(e.code)!;
    if (keys.has(e.key)) {
      plan.duplicates++;
      continue;
    }
    keys.add(e.key);
    plan.entries.push({ code: e.code, input: e.input });
  }
  plan.entries.sort((a, b) => (a.input.date ?? '').localeCompare(b.input.date ?? ''));
  return plan;
}

function entryKey(date: string, kind: EntryKind, title: string, hours: number | null): string {
  return `${date}|${kind}|${norm(title)}|${hours ?? ''}`;
}

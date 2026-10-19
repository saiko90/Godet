// Formats suisses : 6’842 h, CHF 1’240.50, 14.08.2026. Fuseau de référence : Europe/Zurich.

const APOS = '’';

/** Groupe les milliers avec l'apostrophe suisse : 6842 → « 6’842 ». */
export function grp(n: number, decimals = 0): string {
  if (!Number.isFinite(n)) return '—';
  const fixed = Math.abs(n).toFixed(decimals);
  const [int, dec] = fixed.split('.');
  const g = int.replace(/\B(?=(\d{3})+(?!\d))/g, APOS);
  return (n < 0 ? '−' : '') + g + (dec ? '.' + dec : '');
}

/** Heures de compteur : « 6’842 h » (une décimale si nécessaire). */
export function hrs(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return `${grp(n, Number.isInteger(n) ? 0 : 1)} h`;
}

/** Montant arrondi au franc : « CHF 1’240 ». */
export function chf(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return `CHF ${grp(Math.round(n))}`;
}

/** Montant au centime : « CHF 1’240.50 ». */
export function chf2(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return `CHF ${grp(n, 2)}`;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Date du jour à Zurich, au format ISO (AAAA-MM-JJ). */
export function todayISO(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  return parts; // en-CA donne déjà AAAA-MM-JJ
}

/** Date ISO (ou horodatage) → « 14.08.2026 ». */
export function dateCH(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = iso.slice(0, 10).split('-');
  return d.length === 3 ? `${d[2]}.${d[1]}.${d[0]}` : iso;
}

/** Horodatage → « 14.08.2026, 09:30 » (heure de Zurich). */
export function dateTimeCH(ts: string | null | undefined): string {
  if (!ts) return '—';
  const d = new Date(ts);
  const f = new Intl.DateTimeFormat('fr-CH', { timeZone: 'Europe/Zurich', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  return f.format(d);
}

function isoToUTC(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Ajoute n jours à une date ISO. */
export function addDays(iso: string, n: number): string {
  const t = new Date(isoToUTC(iso) + Math.round(n) * 86400000);
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/** Nombre de jours de a à b (b − a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((isoToUTC(b) - isoToUTC(a)) / 86400000);
}

const MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const MONTHS_LONG = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

/** « 2026-08 » → « août » (court) ou « août 2026 » (long). */
export function monthLabel(ym: string, long = false): string {
  const [y, m] = ym.split('-').map(Number);
  return long ? `${MONTHS_LONG[m - 1]} ${y}` : MONTHS_SHORT[m - 1];
}

/** « dans 12 jours », « aujourd'hui », « il y a 3 jours ». */
export function relDays(days: number): string {
  if (days === 0) return 'aujourd’hui';
  if (days === 1) return 'demain';
  if (days === -1) return 'hier';
  return days > 0 ? `dans ${days} jours` : `il y a ${-days} jours`;
}

/** Taille de fichier lisible : « 2,4 Mo ». */
export function fileSize(bytes: number | null | undefined): string {
  if (bytes == null) return '—';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} ko`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`;
}

/** Nombre saisi par une personne (accepte « 6'842 », « 6’842,5 », « 6 842 ») → nombre, ou null. */
export function parseNumber(input: string | null | undefined): number | null {
  if (input == null) return null;
  const s = String(input).trim().replace(/[\s’'_]/g, '').replace(',', '.');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

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

const ZURICH_DAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich', year: 'numeric', month: '2-digit', day: '2-digit' });

/** Jour à Zurich d'un instant, au format ISO (AAAA-MM-JJ). */
function zurichDay(at: Date): string {
  const parts = ZURICH_DAY.formatToParts(at);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Date du jour à Zurich, au format ISO (AAAA-MM-JJ). */
export function todayISO(now: Date = new Date()): string {
  return zurichDay(now);
}

/**
 * Date ISO (« 2026-08-14 ») ou horodatage → « 14.08.2026 ».
 * Un horodatage de la base est en UTC : on affiche le jour de Zurich (00:30 à Zurich = la veille en UTC).
 */
export function dateCH(iso: string | null | undefined): string {
  if (!iso) return '—';
  let day = iso.slice(0, 10);
  if (iso.length > 10) {
    const t = new Date(iso);
    if (!Number.isNaN(t.getTime())) day = zurichDay(t);
  }
  const d = day.split('-');
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

// ============================================================================================================
// Formats selon la langue et le pays (Godet international).
// Les fonctions ci-dessus (grp, hrs, chf, dateCH…) restent pour le code pas encore migré : elles produisent les
// formats suisses en français. Nouveau code : makeFormat() côté serveur, useFormat() côté client.
// ============================================================================================================

export type FormatLocale = 'fr' | 'de' | 'it' | 'en';

export interface FormatSettings {
  /** Langue de l'interface. */
  locale: FormatLocale;
  /** Pays de l'entreprise (ISO, « CH » par défaut) : séparateurs de milliers, dates. */
  country?: string | null;
  /** Devise de l'entreprise (« CHF » par défaut). */
  currency?: string | null;
}

export interface Format {
  /** Balise BCP 47 utilisée (« de-CH », « it-IT »…). */
  readonly tag: string;
  readonly locale: FormatLocale;
  readonly country: string;
  readonly currency: string;
  /** Abréviation du jour : « j », « T », « g », « d ». */
  readonly daysShort: string;
  /** Nombre groupé : 6’842 (Suisse), 6.842 (Allemagne, Italie), 6 842 (France), 6,842 (anglais hors Suisse). */
  num(n: number | null | undefined, decimals?: number): string;
  /** Compteur : « 6’842 h » (une décimale si nécessaire). */
  hours(n: number | null | undefined): string;
  /** Montant arrondi : « CHF 1’240 », « 1.240 € ». */
  money(n: number | null | undefined): string;
  /** Montant au centime : « CHF 1’240.50 », « 1.240,50 € ». */
  money2(n: number | null | undefined): string;
  /** Date (ISO « 2026-08-14 » ou horodatage) : « 14.08.2026 », « 14/08/2026 ». */
  date(iso: string | null | undefined): string;
  /** Date et heure (fuseau de Zurich). */
  dateTime(ts: string | null | undefined): string;
  /** « 2026-08 » → « août » (court) ou « août 2026 » (long). */
  month(ym: string, long?: boolean): string;
  /** « dans 12 jours », « in 12 Tagen », « tra 12 giorni », « in 12 days », « aujourd’hui »… */
  relDays(days: number): string;
  /** « 2,4 Mo », « 2,4 MB ». */
  fileSize(bytes: number | null | undefined): string;
}

const SWISS = new Set(['CH', 'LI']);
const DAYS_SHORT: Record<FormatLocale, string> = { fr: 'j', de: 'T', it: 'g', en: 'd' };
const NBSP = ' ';

function swissGroup(n: number, decimals: number): string {
  const fixed = Math.abs(n).toFixed(decimals);
  const [int, dec] = fixed.split('.');
  const g = int.replace(/\B(?=(\d{3})+(?!\d))/g, APOS);
  return (n < 0 ? '−' : '') + g + (dec ? '.' + dec : '');
}

/** Crée les fonctions de format pour une langue, un pays et une devise. */
export function makeFormat(settings: FormatSettings): Format {
  const locale = settings.locale;
  const country = (settings.country || 'CH').toUpperCase();
  const currency = (settings.currency || (SWISS.has(country) ? 'CHF' : 'EUR')).toUpperCase();
  const tag = `${locale}-${country === 'OTHER' ? 'CH' : country}`;
  const swiss = SWISS.has(country);

  const numCache = new Map<number, Intl.NumberFormat>();
  const nf = (d: number) => {
    let f = numCache.get(d);
    if (!f) {
      f = new Intl.NumberFormat(tag, { minimumFractionDigits: d, maximumFractionDigits: d });
      numCache.set(d, f);
    }
    return f;
  };
  const moneyFmt = (d: number) =>
    new Intl.NumberFormat(tag, { style: 'currency', currency, minimumFractionDigits: d, maximumFractionDigits: d });
  const money0 = swiss ? null : moneyFmt(0);
  const money2f = swiss ? null : moneyFmt(2);

  const num = (n: number | null | undefined, decimals = 0) => {
    if (n == null || !Number.isFinite(n)) return '—';
    return swiss ? swissGroup(n, decimals) : nf(decimals).format(n);
  };

  const dateFmt = new Intl.DateTimeFormat(tag, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
  const dateTimeFmt = new Intl.DateTimeFormat(tag, {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich',
  });
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  /** Jour (UTC à midi) d'une date ISO ou jour de Zurich d'un horodatage. */
  const dayUTC = (iso: string): Date | null => {
    let day = iso.slice(0, 10);
    if (iso.length > 10) {
      const t = new Date(iso);
      if (Number.isNaN(t.getTime())) return null;
      day = todayISO(t);
    }
    const [y, m, d] = day.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(Date.UTC(y, m - 1, d, 12));
  };

  return {
    tag,
    locale,
    country,
    currency,
    daysShort: DAYS_SHORT[locale],
    num,
    hours(n) {
      if (n == null || !Number.isFinite(n)) return '—';
      return `${num(n, Number.isInteger(n) ? 0 : 1)}${NBSP}h`;
    },
    money(n) {
      if (n == null || !Number.isFinite(n)) return '—';
      return swiss ? `${currency}${NBSP}${swissGroup(Math.round(n), 0)}` : money0!.format(Math.round(n));
    },
    money2(n) {
      if (n == null || !Number.isFinite(n)) return '—';
      return swiss ? `${currency}${NBSP}${swissGroup(n, 2)}` : money2f!.format(n);
    },
    date(iso) {
      if (!iso) return '—';
      const d = dayUTC(iso);
      return d ? dateFmt.format(d) : iso;
    },
    dateTime(ts) {
      if (!ts) return '—';
      const d = new Date(ts);
      return Number.isNaN(d.getTime()) ? ts : dateTimeFmt.format(d);
    },
    month(ym, long = false) {
      const [y, m] = ym.split('-').map(Number);
      const d = new Date(Date.UTC(y, (m || 1) - 1, 15));
      return new Intl.DateTimeFormat(locale, long ? { month: 'long', year: 'numeric', timeZone: 'UTC' } : { month: 'short', timeZone: 'UTC' }).format(d);
    },
    relDays(days) {
      return rtf.format(days, 'day');
    },
    fileSize(bytes) {
      if (bytes == null) return '—';
      const u = locale === 'fr' ? ['o', 'ko', 'Mo'] : ['B', 'KB', 'MB'];
      if (bytes < 1024) return `${bytes}${NBSP}${u[0]}`;
      if (bytes < 1024 * 1024) return `${new Intl.NumberFormat(tag, { maximumFractionDigits: 0 }).format(bytes / 1024)}${NBSP}${u[1]}`;
      return `${new Intl.NumberFormat(tag, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(bytes / 1024 / 1024)}${NBSP}${u[2]}`;
    },
  };
}

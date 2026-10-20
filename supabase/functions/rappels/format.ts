// Formats des nombres et des dates selon la langue de la personne et le pays de l'entreprise.
// Reprise fidèle de `makeFormat` (src/lib/format.ts) pour ce dont les rappels ont besoin :
// « 6’842 h » et « CHF 1’240 » en Suisse dans toutes les langues, « 6.842 h » et « 1.240 € » en Allemagne, etc.

export type Locale = 'fr' | 'de' | 'it' | 'en';
export const LOCALES: readonly Locale[] = ['fr', 'de', 'it', 'en'];

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** Langue du document HTML (variantes suisses pour fr, de, it), comme `htmlLang` de l'application. */
export function htmlLang(locale: Locale): string {
  return locale === 'en' ? 'en' : `${locale}-CH`;
}

const APOS = '’';
const NBSP = '\u00a0';
const SWISS = new Set(['CH', 'LI']);
const DAY_MS = 86_400_000;

/**
 * Chiffres et montants hors de Suisse : les conventions du pays de l'entreprise, dans toutes les langues (comme
 * « 6’842 h » en Suisse), comme NUMBER_LOCALE de src/lib/format.ts. Pays absents : langue + pays.
 */
const NUMBER_LOCALE: Record<string, string> = {
  DE: 'de-DE',
  AT: 'de-AT',
  IT: 'it-IT',
  FR: 'fr-FR',
  GB: 'en-GB',
  US: 'en-US',
};

export interface Format {
  readonly locale: Locale;
  readonly country: string;
  readonly currency: string;
  num(n: number | null | undefined, decimals?: number): string;
  hours(n: number | null | undefined): string;
  money(n: number | null | undefined): string;
  date(iso: string | null | undefined): string;
}

function swissGroup(n: number, decimals: number): string {
  const fixed = Math.abs(n).toFixed(decimals);
  const [int, dec] = fixed.split('.');
  const g = int.replace(/\B(?=(\d{3})+(?!\d))/g, APOS);
  return (n < 0 ? '−' : '') + g + (dec ? '.' + dec : '');
}

export function makeFormat(settings: { locale: Locale; country?: string | null; currency?: string | null }): Format {
  const locale = settings.locale;
  const country = (settings.country || 'CH').toUpperCase();
  const currency = (settings.currency || (SWISS.has(country) ? 'CHF' : 'EUR')).toUpperCase();
  const tag = `${locale}-${country === 'OTHER' ? 'CH' : country}`;
  const swiss = SWISS.has(country);
  // Langue des chiffres, et groupes de milliers dès 1’000 dans toutes les langues (comme l'application).
  const numTag = NUMBER_LOCALE[country] ?? tag;

  const numCache = new Map<number, Intl.NumberFormat>();
  const nf = (d: number) => {
    let f = numCache.get(d);
    if (!f) {
      f = new Intl.NumberFormat(numTag, { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: 'always' });
      numCache.set(d, f);
    }
    return f;
  };
  const money0 = swiss
    ? null
    : new Intl.NumberFormat(numTag, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        useGrouping: 'always',
      });
  const dateFmt = new Intl.DateTimeFormat(tag, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });

  const num = (n: number | null | undefined, decimals = 0) => {
    if (n == null || !Number.isFinite(n)) return '—';
    return swiss ? swissGroup(n, decimals) : nf(decimals).format(n);
  };

  return {
    locale,
    country,
    currency,
    num,
    hours(n) {
      if (n == null || !Number.isFinite(n)) return '—';
      return `${num(n, Number.isInteger(n) ? 0 : 1)}${NBSP}h`;
    },
    money(n) {
      if (n == null || !Number.isFinite(n)) return '—';
      return swiss ? `${currency}${NBSP}${swissGroup(Math.round(n), 0)}` : money0!.format(Math.round(n));
    },
    date(iso) {
      if (!iso) return '—';
      let day = iso.slice(0, 10);
      if (iso.length > 10) {
        const t = new Date(iso);
        if (Number.isNaN(t.getTime())) return iso;
        day = zurichDay(t);
      }
      const [y, m, d] = day.split('-').map(Number);
      if (!y || !m || !d) return iso;
      return dateFmt.format(new Date(Date.UTC(y, m - 1, d, 12)));
    },
  };
}

// ------------------------------------------------------------------ dates (jour civil de Zurich)

const ZURICH_DAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Zurich',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const ZURICH_HOUR = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Zurich', hour: '2-digit', hourCycle: 'h23' });

/** Jour à Zurich d'un instant, au format ISO (AAAA-MM-JJ). */
export function zurichDay(at: Date): string {
  const parts = ZURICH_DAY.formatToParts(at);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Heure (0 à 23) à Zurich d'un instant. */
export function zurichHour(at: Date): number {
  return Number(ZURICH_HOUR.formatToParts(at).find((p) => p.type === 'hour')?.value ?? '0') % 24;
}

function isoToUTC(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Ajoute n jours à une date ISO. */
export function addDays(iso: string, n: number): string {
  const t = new Date(isoToUTC(iso) + Math.round(n) * DAY_MS);
  return t.toISOString().slice(0, 10);
}

/** Nombre de jours de a à b (b − a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((isoToUTC(b) - isoToUTC(a)) / DAY_MS);
}

/** Jour de la semaine ISO d'une date (1 = lundi … 7 = dimanche). */
export function isoWeekday(iso: string): number {
  const d = new Date(isoToUTC(iso)).getUTCDay();
  return d === 0 ? 7 : d;
}

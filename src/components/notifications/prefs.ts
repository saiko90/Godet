// Réglages des rappels par e-mail (table notification_prefs) : valeurs, limites, validation. Fonctions pures.
// Les mêmes valeurs par défaut et les mêmes limites sont appliquées par la base (contraintes de la table) et par la
// fonction Supabase « rappels » (supabase/functions/rappels/digest.ts).
import { parseNumber } from '@/lib/format';

export type Frequency = 'quotidien' | 'hebdo' | 'jamais';
export const FREQUENCIES: readonly Frequency[] = ['quotidien', 'hebdo', 'jamais'];

/** Valeurs par défaut quand la personne n'a encore rien enregistré : rappel hebdomadaire, 14 jours, 50 h. */
export const DEFAULT_PREFS = { frequency: 'hebdo' as Frequency, leadDays: 14, leadHours: 50 };
export const LEAD_DAYS = { min: 1, max: 90 } as const;
export const LEAD_HOURS = { min: 5, max: 500 } as const;

/** Valeurs du formulaire (les nombres restent du texte tant qu'ils sont en cours de saisie). */
export interface PrefsValues {
  enabled: boolean;
  frequency: Frequency;
  leadDays: string;
  leadHours: string;
}

export interface PrefsRow {
  email_enabled: boolean;
  frequency: string;
  lead_days: number;
  lead_hours: number;
  last_digest_at: string | null;
}

export type FieldErrors = { leadDays?: true; leadHours?: true };

export function asFrequency(value: unknown): Frequency {
  return value === 'quotidien' || value === 'jamais' ? value : 'hebdo';
}

/**
 * Valeurs affichées : celles de la personne, sinon les valeurs par défaut. Les machinistes ne reçoivent rien tant
 * qu'ils n'ont pas activé et enregistré leurs rappels : sans ligne, l'interrupteur est éteint pour eux.
 */
export function valuesFrom(row: PrefsRow | null, operatorOnly: boolean): PrefsValues {
  if (!row) {
    return {
      enabled: !operatorOnly,
      frequency: DEFAULT_PREFS.frequency,
      leadDays: String(DEFAULT_PREFS.leadDays),
      leadHours: String(DEFAULT_PREFS.leadHours),
    };
  }
  return {
    enabled: row.email_enabled,
    frequency: asFrequency(row.frequency),
    leadDays: String(row.lead_days),
    leadHours: String(row.lead_hours),
  };
}

/** Nombre entier saisi (« 14 », « 1’000 ») ou null. */
export function parseWhole(input: string): number | null {
  const n = parseNumber(input);
  return n != null && Number.isInteger(n) ? n : null;
}

function within(n: number | null, range: { min: number; max: number }): n is number {
  return n != null && n >= range.min && n <= range.max;
}

/** Vérifie la saisie ; si elle est valable, renvoie la ligne à enregistrer (sans user_id). */
export function validate(values: PrefsValues):
  | { ok: true; row: { email_enabled: boolean; frequency: Frequency; lead_days: number; lead_hours: number } }
  | { ok: false; errors: FieldErrors } {
  const days = parseWhole(values.leadDays);
  const hours = parseWhole(values.leadHours);
  const errors: FieldErrors = {};
  if (!within(days, LEAD_DAYS)) errors.leadDays = true;
  if (!within(hours, LEAD_HOURS)) errors.leadHours = true;
  if (errors.leadDays || errors.leadHours) return { ok: false, errors };
  return {
    ok: true,
    row: { email_enabled: values.enabled, frequency: values.frequency, lead_days: days!, lead_hours: hours! },
  };
}

export function sameValues(a: PrefsValues, b: PrefsValues): boolean {
  return (
    a.enabled === b.enabled &&
    a.frequency === b.frequency &&
    parseWhole(a.leadDays) === parseWhole(b.leadDays) &&
    parseWhole(a.leadHours) === parseWhole(b.leadHours)
  );
}

/** Nature d'une erreur Supabase, pour choisir le message affiché. */
export function errorKind(error: { code?: string | null; message?: string | null } | null | undefined):
  | 'network'
  | 'session'
  | 'invalid'
  | 'generic' {
  if (!error) return 'generic';
  const code = error.code ?? '';
  if (!code && /fetch|network|load failed/i.test(error.message ?? '')) return 'network';
  if (code === '42501' || code === 'PGRST301' || code === 'PGRST302' || code === '401') return 'session';
  if (code === '23514' || code === '22P02') return 'invalid';
  return 'generic';
}

/** Le plus récent de plusieurs horodatages (ou null). */
export function latest(...instants: (string | null | undefined)[]): string | null {
  let best: string | null = null;
  let bestT = -Infinity;
  for (const iso of instants) {
    if (!iso) continue;
    const t = Date.parse(iso);
    if (Number.isFinite(t) && t > bestT) {
      best = iso;
      bestT = t;
    }
  }
  return best;
}

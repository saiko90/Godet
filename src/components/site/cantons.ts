// Les 26 cantons suisses (code officiel à deux lettres). Leurs noms sont traduits dans messages/<langue>/site.json
// (zone « cantons ») : les listes sont préparées côté serveur et transmises aux formulaires.
import type { Option } from './countries';

export const CANTONS = [
  'AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR', 'JU', 'LU', 'NE',
  'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG', 'TI', 'UR', 'VD', 'VS', 'ZG', 'ZH',
] as const;

export type CantonCode = (typeof CANTONS)[number];

export function isCanton(value: unknown): value is CantonCode {
  return typeof value === 'string' && (CANTONS as readonly string[]).includes(value);
}

/** Cantons triés par nom dans la langue de l'interface (« Valais (VS) »). */
export function cantonOptions(name: (code: CantonCode) => string, collatorLocale: string): Option[] {
  const collator = new Intl.Collator(collatorLocale);
  return CANTONS.map((code) => ({ code, name: `${name(code)} (${code})` })).sort((a, b) => collator.compare(a.name, b.name));
}

/** « Valais (VS) », ou le code tel quel s'il n'est pas reconnu. */
export function cantonLabel(code: string | null | undefined, name: (code: CantonCode) => string): string | null {
  if (!code) return null;
  const upper = code.toUpperCase();
  return isCanton(upper) ? `${name(upper)} (${upper})` : code;
}

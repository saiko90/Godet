// Les 26 cantons suisses (code officiel à deux lettres), triés par nom français.
export const CANTONS = [
  { code: 'AR', name: 'Appenzell Rhodes-Extérieures' },
  { code: 'AI', name: 'Appenzell Rhodes-Intérieures' },
  { code: 'AG', name: 'Argovie' },
  { code: 'BL', name: 'Bâle-Campagne' },
  { code: 'BS', name: 'Bâle-Ville' },
  { code: 'BE', name: 'Berne' },
  { code: 'FR', name: 'Fribourg' },
  { code: 'GE', name: 'Genève' },
  { code: 'GL', name: 'Glaris' },
  { code: 'GR', name: 'Grisons' },
  { code: 'JU', name: 'Jura' },
  { code: 'LU', name: 'Lucerne' },
  { code: 'NE', name: 'Neuchâtel' },
  { code: 'NW', name: 'Nidwald' },
  { code: 'OW', name: 'Obwald' },
  { code: 'SG', name: 'Saint-Gall' },
  { code: 'SH', name: 'Schaffhouse' },
  { code: 'SZ', name: 'Schwytz' },
  { code: 'SO', name: 'Soleure' },
  { code: 'TI', name: 'Tessin' },
  { code: 'TG', name: 'Thurgovie' },
  { code: 'UR', name: 'Uri' },
  { code: 'VS', name: 'Valais' },
  { code: 'VD', name: 'Vaud' },
  { code: 'ZG', name: 'Zoug' },
  { code: 'ZH', name: 'Zurich' },
] as const;

export type CantonCode = (typeof CANTONS)[number]['code'];

export function isCanton(value: unknown): value is CantonCode {
  return typeof value === 'string' && CANTONS.some((c) => c.code === value);
}

/** « Valais (VS) », ou le code tel quel s'il n'est pas reconnu. */
export function cantonLabel(code: string | null | undefined): string | null {
  if (!code) return null;
  const c = CANTONS.find((x) => x.code === code.toUpperCase());
  return c ? `${c.name} (${c.code})` : code;
}

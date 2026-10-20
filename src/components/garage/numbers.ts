// Lecture d'un nombre saisi dans un formulaire du garage, selon le format de l'entreprise.
// Suisse : « 6’842 », « 6842,5 », « 1’240.50 » (parseNumber). Ailleurs, les séparateurs de milliers du pays sont
// aussi acceptés : « 1.240,50 » en Allemagne ou en Italie, « 1,240.50 » au Royaume-Uni. Un nombre sans groupe de
// trois chiffres après le séparateur (« 2.7 ») garde son sens décimal.
import { parseNumber, type Format } from '@/lib/format';

/** Séparateurs de milliers et décimal du format (« ’ » et « . » en Suisse, « . » et « , » en Allemagne). */
function separators(f: Format): { group: string; decimal: string } {
  const sample = f.num(1234567.5, 1);
  const group = /\d(\D)\d{3}/.exec(sample)?.[1] ?? '';
  const decimal = /(\D)\d$/.exec(sample)?.[1] ?? '.';
  return { group, decimal };
}

export function parseLocalNumber(input: string | null | undefined, f: Format): number | null {
  if (input == null) return null;
  const s = String(input).trim().replace(/[\s  ]/g, '');
  const { group, decimal } = separators(f);
  if (group === '.' && decimal === ',' && /^[+-]?\d{1,3}(\.\d{3})+(,\d*)?$/.test(s)) {
    return parseNumber(s.replace(/\./g, '').replace(',', '.'));
  }
  if (group === ',' && decimal === '.' && /^[+-]?\d{1,3}(,\d{3})+(\.\d*)?$/.test(s)) {
    return parseNumber(s.replace(/,/g, ''));
  }
  return parseNumber(s);
}

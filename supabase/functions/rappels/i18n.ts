// Textes des rappels dans la langue de la personne, au format ICU (même moteur que next-intl).
// Les textes viennent de messages/<langue>/emails.json et domain.json, recopiés dans messages.ts par sync.mjs.

import { IntlMessageFormat } from 'intl-messageformat';
import type { Locale } from './format.ts';
import { MESSAGES, type MessageTree } from './messages.ts';

export type Values = Record<string, string | number>;
export type Translate = (key: string, values?: Values) => string;

function lookup(tree: MessageTree, key: string): string | null {
  let node: string | MessageTree | undefined = tree;
  for (const part of key.split('.')) {
    if (node == null || typeof node === 'string') return null;
    node = node[part];
  }
  return typeof node === 'string' ? node : null;
}

const translators = new Map<Locale, Translate>();

/**
 * Fonction de traduction d'une langue (clés complètes : « emails.rappels.cta », « domain.due.inHours »…).
 * Une par langue pour toute l'exécution : chaque message n'est analysé qu'une fois (limite de 2 s de calcul).
 */
export function translator(locale: Locale): Translate {
  const existing = translators.get(locale);
  if (existing) return existing;
  const cache = new Map<string, IntlMessageFormat>();
  const t: Translate = (key, values) => {
    let format = cache.get(key);
    if (!format) {
      const own = lookup(MESSAGES[locale], key);
      const message = own ?? lookup(MESSAGES.fr, key);
      if (message == null) throw new Error(`Texte manquant : ${key}`);
      format = new IntlMessageFormat(message, own != null ? locale : 'fr');
      cache.set(key, format);
    }
    const out = format.format(values);
    return Array.isArray(out) ? out.join('') : String(out);
  };
  translators.set(locale, t);
  return t;
}

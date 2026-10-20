// Recopie dans la fonction « rappels » ce qu'elle partage avec l'application Next (elle ne peut pas lire le dépôt) :
// - messages.ts : textes des e-mails (messages/<langue>/emails.json : layout, rappels), textes métier utiles
//   (messages/<langue>/domain.json : types de machines, statuts de réparation, échéances) et libellés des
//   échéances créées avec chaque machine (messages/<langue>/garage.json : schedules.defaults) ;
// - layout.ts   : gabarit HTML des e-mails (src/lib/email/layout.ts).
//
// Usage (depuis la racine du dépôt) :
//   node supabase/functions/rappels/sync.mjs          écrit les deux fichiers
//   node supabase/functions/rappels/sync.mjs --check  vérifie qu'ils sont à jour (code de sortie 1 sinon)
// Après une mise à jour : redéployer la fonction (voir docs/notifications.md).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const HERE = fileURLToPath(new URL('./', import.meta.url));
const LOCALES = ['fr', 'de', 'it', 'en'];
const check = process.argv.includes('--check');

const read = (path) => readFileSync(ROOT + path, 'utf8');
const pick = (obj, keys, where) =>
  Object.fromEntries(
    keys.map((k) => {
      if (!(k in obj)) throw new Error(`${where} : clé « ${k} » absente`);
      return [k, obj[k]];
    }),
  );

const tree = {};
for (const l of LOCALES) {
  const emails = JSON.parse(read(`messages/${l}/emails.json`));
  const domain = JSON.parse(read(`messages/${l}/domain.json`));
  const garage = JSON.parse(read(`messages/${l}/garage.json`));
  tree[l] = {
    emails: pick(emails, ['layout', 'rappels'], `messages/${l}/emails.json`),
    domain: pick(domain, ['machineKinds', 'repairStatus', 'due', 'machineTitle'], `messages/${l}/domain.json`),
    garage: { schedules: { defaults: pick(garage.schedules.defaults, ['service', 'safety'], `messages/${l}/garage.json`) } },
  };
}

// Espaces insécables (typographie française) écrits en séquences \u00a0 : invisibles, ils se perdent facilement.
const json = JSON.stringify(tree, null, 2).replace(/[\u00a0\u202f]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);

const messages = `// Fichier généré par sync.mjs à partir de messages/<langue>/emails.json, domain.json et garage.json : ne pas modifier ici.
// Les textes font foi dans messages/ (français de référence, vérifiés par scripts/check-messages.mjs).

import type { Locale } from './format.ts';

export interface MessageTree {
  readonly [key: string]: string | MessageTree;
}

export const MESSAGES: Readonly<Record<Locale, MessageTree>> = ${json};
`;

const layout = `// Fichier généré par sync.mjs à partir de src/lib/email/layout.ts : ne pas modifier ici.\n\n${read('src/lib/email/layout.ts')}`;

const outputs = [
  ['messages.ts', messages],
  ['layout.ts', layout],
];

let stale = 0;
for (const [name, content] of outputs) {
  let current = null;
  try {
    current = readFileSync(HERE + name, 'utf8');
  } catch {
    current = null;
  }
  if (current === content) continue;
  if (check) {
    console.log(`✗ supabase/functions/rappels/${name} n'est pas à jour : lancez node supabase/functions/rappels/sync.mjs`);
    stale++;
  } else {
    writeFileSync(HERE + name, content);
    console.log(`✓ supabase/functions/rappels/${name} mis à jour`);
  }
}
if (check && !stale) console.log('Rappels : textes et gabarit à jour.');
process.exit(stale ? 1 : 0);

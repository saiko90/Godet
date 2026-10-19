// Vérifie que chaque langue a exactement les mêmes clés que le français, zone par zone, et les mêmes variables.
// Usage : node scripts/check-messages.mjs
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '@formatjs/icu-messageformat-parser';

const ROOT = new URL('../messages/', import.meta.url).pathname;
const BASE = 'fr';
const LOCALES = readdirSync(ROOT).filter((l) => l !== BASE);
let problems = 0;

const flat = (obj, prefix = '', out = {}) => {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flat(v, key, out);
    else out[key] = String(v);
  }
  return out;
};
// Variables ICU (y compris dans les branches plural/select) ; message invalide = problème signalé.
const vars = (s, where) => {
  const out = new Set();
  const walk = (nodes) => {
    for (const n of nodes) {
      if (n.value && typeof n.value === 'string' && n.type !== 0) out.add(n.value);
      if (n.options) for (const o of Object.values(n.options)) walk(o.value);
      if (n.children) walk(n.children);
    }
  };
  try {
    walk(parse(s, { ignoreTag: true }));
  } catch (e) {
    console.log(`✗ ${where} : message ICU invalide (${e.message})`);
    problems++;
  }
  return out;
};

for (const file of readdirSync(join(ROOT, BASE)).filter((f) => f.endsWith('.json'))) {
  const base = flat(JSON.parse(readFileSync(join(ROOT, BASE, file), 'utf8')));
  for (const l of LOCALES) {
    let other;
    try {
      other = flat(JSON.parse(readFileSync(join(ROOT, l, file), 'utf8')));
    } catch (e) {
      console.log(`✗ ${l}/${file} : illisible (${e.message})`);
      problems++;
      continue;
    }
    for (const k of Object.keys(base)) {
      if (!(k in other)) { console.log(`✗ ${l}/${file} : clé manquante ${k}`); problems++; continue; }
      const a = vars(base[k], `${BASE}/${file} ${k}`), b = vars(other[k], `${l}/${file} ${k}`);
      for (const v of a) if (!b.has(v)) { console.log(`✗ ${l}/${file} : ${k} n'utilise pas {${v}}`); problems++; }
      if (base[k].trim() && !other[k].trim()) { console.log(`✗ ${l}/${file} : ${k} vide`); problems++; }
    }
    for (const k of Object.keys(other)) if (!(k in base)) { console.log(`✗ ${l}/${file} : clé en trop ${k}`); problems++; }
  }
}
console.log(problems ? `\n${problems} problème(s)` : 'Messages : toutes les langues sont complètes.');
process.exit(problems ? 1 : 0);

// Copie les textes du module Location (messages/<langue>/rental.json + types de machines) dans la fonction Supabase
// « location » (supabase/functions/location/i18n), qui fabrique le PDF et l'e-mail. À relancer après un changement.
import { readFileSync, writeFileSync } from 'node:fs';

for (const l of ['fr', 'de', 'it', 'en']) {
  const r = JSON.parse(readFileSync(`messages/${l}/rental.json`, 'utf8'));
  const d = JSON.parse(readFileSync(`messages/${l}/domain.json`, 'utf8'));
  const pick = (obj, keys) => Object.fromEntries(keys.map((k) => [k, obj[k]]));
  const out = {
    check: pick(r.check, ['titleOut', 'titleIn', 'groups', 'states', 'fuelLevels', 'slots', 'yes', 'no', 'valid', 'invalid', 'withReserves', 'noReserves', 'agreeOut', 'agreeIn']),
    items: r.items,
    report: pick(r.report, ['item', 'result', 'worse', 'hours', 'worked', 'fuel', 'accident', 'safety', 'accessories', 'keys', 'remarks', 'terms', 'termsAccepted', 'total', 'reserves', 'signatures']),
    pdf: r.pdf,
    mail: r.mail,
    form: { deliveries: r.form.deliveries },
    kinds: Object.fromEntries(Object.entries(d.machineKinds).map(([k, v]) => [k, v.label])),
  };
  writeFileSync(`supabase/functions/location/i18n/${l}.json`, JSON.stringify(out) + '\n');
}
console.log('Textes de la fonction « location » à jour.');

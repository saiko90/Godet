// Parcs de test variés (types, peintures, poids, états, alertes) pour le laboratoire du moteur 3D.
// Les noms des modèles sont traduits (garage.labo.models.*) : `label` reçoit le nom et le poids, et compose l'étiquette.
import type { MachineKind } from '@/lib/types';
import type { MachineState, ShowroomMachine } from '@/engine/types';

export type LaboModel = 'pelle' | 'chargeuse' | 'miniPelle' | 'tombereau' | 'camionBenne' | 'rouleau' | 'grueMobile' | 'chargeuseCompacte' | 'dumper';

interface Model {
  kind: MachineKind;
  prefix: string;
  name: LaboModel;
  weight: number;
}

const MODELS: Model[] = [
  { kind: 'pelle', prefix: 'PE', name: 'pelle', weight: 21 },
  { kind: 'chargeuse', prefix: 'CH', name: 'chargeuse', weight: 15 },
  { kind: 'mini_pelle', prefix: 'MP', name: 'miniPelle', weight: 3.5 },
  { kind: 'dumper', prefix: 'DU', name: 'tombereau', weight: 28 },
  { kind: 'camion', prefix: 'CA', name: 'camionBenne', weight: 26 },
  { kind: 'rouleau', prefix: 'RO', name: 'rouleau', weight: 12 },
  { kind: 'grue', prefix: 'GR', name: 'grueMobile', weight: 40 },
  { kind: 'autre', prefix: 'CC', name: 'chargeuseCompacte', weight: 4 },
  { kind: 'mini_pelle', prefix: 'MP', name: 'miniPelle', weight: 1.8 },
  { kind: 'dumper', prefix: 'DU', name: 'dumper', weight: 6 },
  { kind: 'pelle', prefix: 'PE', name: 'pelle', weight: 30 },
];

const PAINTS = ['#f3b71b', '#f3b71b', '#e9e6df', '#f07c1a', '#f3b71b', '#3b4047', '#f3b71b', '#e9e6df', '#d9a514', '#5b6670'];
const STATES: MachineState[] = ['ok', 'warn', 'ok', 'ok', 'bad', 'ok', 'warn', 'ok', 'ok', 'ok', 'warn'];

export function demoFleet(n: number, label: (name: LaboModel, weight: number) => string, kinds?: MachineKind[]): ShowroomMachine[] {
  const counters = new Map<string, number>();
  const perKind = new Map<string, number>();
  const out: ShowroomMachine[] = [];
  for (let i = 0; i < n; i++) {
    let m: Model = MODELS[i % MODELS.length];
    if (kinds?.length) {
      // types imposés : on parcourt les variantes de chaque type (ex. tombereau puis dumper de chantier)
      const kind = kinds[i % kinds.length];
      const variants = MODELS.filter((x) => x.kind === kind);
      const k = perKind.get(kind) ?? 0;
      perKind.set(kind, k + 1);
      m = variants.length ? variants[k % variants.length] : MODELS[0];
    }
    const c = (counters.get(m.prefix) ?? 0) + 1;
    counters.set(m.prefix, c);
    const state = STATES[i % STATES.length];
    const weight = kinds?.length ? m.weight : Math.round(m.weight * (1 + ((i * 7) % 5) * 0.06) * 10) / 10;
    out.push({
      id: `m${i + 1}`,
      code: `${m.prefix}-${String(c).padStart(2, '0')}`,
      kind: m.kind,
      color: PAINTS[i % PAINTS.length],
      label: label(m.name, weight),
      state,
      alerts: state === 'ok' ? (i % 4 === 3 ? 1 : 0) : state === 'warn' ? 2 : 3,
      weightT: weight,
    });
  }
  return out;
}

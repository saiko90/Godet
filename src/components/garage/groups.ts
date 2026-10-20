// Regroupement du showroom : les machines d'un même type partagent un seul modèle 3D (« PE ×10 »).
// Un clic sur le groupe ouvre la liste de ses machines, puis la fiche de celle qu'on choisit.
import type { MachineHealth } from '@/lib/domain';
import type { Machine, MachineKind } from '@/lib/types';
import type { MachineState } from '@/engine/types';

const GROUP = 'grp:';

export const groupIdOf = (kind: MachineKind): string => `${GROUP}${kind}`;
export const isGroupId = (id: string | null | undefined): id is string => typeof id === 'string' && id.startsWith(GROUP);

/** Ce que montrent le showroom et le dock : une machine seule, ou toutes celles d'un même type. */
export interface FleetView {
  /** Identifiant de la machine, ou « grp:<type> » pour un groupe. */
  id: string;
  kind: MachineKind;
  group: boolean;
  /** Machines portées par ce plateau (une seule hors groupe), dans l'ordre du parc. */
  machines: Machine[];
  /** La pire des machines du plateau. */
  state: MachineState;
  /** Somme des points d'attention. */
  alerts: number;
}

export interface FleetViews {
  list: FleetView[];
  byId: Map<string, FleetView>;
  /** Machine → plateau qui la porte (elle-même ou son groupe). */
  viewOf: Map<string, string>;
}

const RANK: Record<MachineState, number> = { ok: 0, warn: 1, bad: 2 };

/**
 * Plateaux du showroom. Regrouper n'a de sens que s'il reste au moins deux plateaux et qu'au moins un type compte
 * plusieurs machines : un parc d'un seul type garde une machine par plateau (le hall ne paraît pas vide).
 */
export function fleetViews(machines: Machine[], health: Map<string, MachineHealth>, grouped: boolean): FleetViews {
  const byKind = new Map<MachineKind, Machine[]>();
  for (const m of machines) byKind.set(m.kind, [...(byKind.get(m.kind) ?? []), m]);
  const active = grouped && byKind.size >= 2 && byKind.size < machines.length;

  const list: FleetView[] = [];
  const seen = new Set<MachineKind>();
  for (const m of machines) {
    const same = byKind.get(m.kind) ?? [m];
    if (active && same.length > 1) {
      if (seen.has(m.kind)) continue;
      seen.add(m.kind);
      list.push(viewFor(groupIdOf(m.kind), m.kind, true, same, health));
    } else {
      list.push(viewFor(m.id, m.kind, false, [m], health));
    }
  }
  const byId = new Map(list.map((v) => [v.id, v]));
  const viewOf = new Map<string, string>();
  for (const v of list) for (const m of v.machines) viewOf.set(m.id, v.id);
  return { list, byId, viewOf };
}

function viewFor(id: string, kind: MachineKind, group: boolean, machines: Machine[], health: Map<string, MachineHealth>): FleetView {
  let state: MachineState = 'ok';
  let alerts = 0;
  for (const m of machines) {
    const h = health.get(m.id);
    if (!h) continue;
    if (RANK[h.state] > RANK[state]) state = h.state;
    alerts += h.alerts;
  }
  return { id, kind, group, machines, state, alerts };
}

/** Peinture la plus fréquente du groupe (à égalité : celle de la première machine). */
export function groupColor(machines: Machine[]): string {
  const counts = new Map<string, number>();
  let best = machines[0]?.color ?? '#f3b71b';
  let bestN = 0;
  for (const m of machines) {
    const n = (counts.get(m.color) ?? 0) + 1;
    counts.set(m.color, n);
    if (n > bestN) {
      best = m.color;
      bestN = n;
    }
  }
  return best;
}

/** Poids médian du groupe (taille du modèle 3D), ou null si aucun poids n'est connu. */
export function groupWeight(machines: Machine[]): number | null {
  const w = machines
    .map((m) => (m.weight_t == null ? NaN : Number(m.weight_t)))
    .filter((x) => Number.isFinite(x) && x > 0)
    .sort((a, b) => a - b);
  if (!w.length) return null;
  return w[Math.floor((w.length - 1) / 2)];
}

/** Machines d'un groupe dans l'ordre de la liste : les plus urgentes d'abord, puis par code. */
export function sortForList(machines: Machine[], health: Map<string, MachineHealth>): Machine[] {
  return [...machines].sort((a, b) => {
    const ra = RANK[health.get(a.id)?.state ?? 'ok'];
    const rb = RANK[health.get(b.id)?.state ?? 'ok'];
    if (ra !== rb) return rb - ra;
    return a.code.localeCompare(b.code, undefined, { numeric: true });
  });
}

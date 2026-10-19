// Catalogue des modèles : un gabarit par type de machine (et variante), construit une seule fois et partagé
// par toutes les machines de ce type.
import type { MachineKind } from '@/lib/types';
import type { MachineTemplate } from './kit';
import { buildAutre } from './autre';
import { buildCamion } from './camion';
import { buildChargeuse } from './chargeuse';
import { buildDumper } from './dumper';
import { buildGrue } from './grue';
import { buildMiniPelle } from './miniPelle';
import { buildPelle } from './pelle';
import { buildRouleau } from './rouleau';

/** Variante du modèle selon le type et le poids (mini-pelle à arceau ou cabine, dumper articulé ou de chantier). */
export function templateKey(kind: MachineKind, weightT?: number | null): string {
  const w = weightT ?? 0;
  switch (kind) {
    case 'mini_pelle':
      return w > 0 && w <= 2.5 ? 'mini_pelle:canopy' : 'mini_pelle:cab';
    case 'dumper':
      return w >= 15 ? 'dumper:tombereau' : 'dumper:chantier';
    default:
      return kind;
  }
}

function build(key: string): MachineTemplate {
  switch (key) {
    case 'pelle':
      return buildPelle();
    case 'mini_pelle:canopy':
      return buildMiniPelle(true);
    case 'mini_pelle:cab':
      return buildMiniPelle(false);
    case 'chargeuse':
      return buildChargeuse();
    case 'dumper:tombereau':
      return buildDumper(true);
    case 'dumper:chantier':
      return buildDumper(false);
    case 'camion':
      return buildCamion();
    case 'rouleau':
      return buildRouleau();
    case 'grue':
      return buildGrue();
    default:
      return buildAutre();
  }
}

export class TemplateCache {
  private map = new Map<string, MachineTemplate>();

  has(key: string): boolean {
    return this.map.has(key);
  }

  get(kind: MachineKind, weightT?: number | null): MachineTemplate {
    const key = templateKey(kind, weightT);
    let t = this.map.get(key);
    if (!t) {
      t = build(key);
      this.map.set(key, t);
    }
    return t;
  }

  /** Libère les gabarits qui ne servent plus. */
  prune(used: Set<string>): void {
    for (const [key, t] of this.map) {
      if (used.has(key)) continue;
      disposeTemplate(t);
      this.map.delete(key);
    }
  }

  dispose(): void {
    for (const t of this.map.values()) disposeTemplate(t);
    this.map.clear();
  }
}

function disposeTemplate(t: MachineTemplate): void {
  for (const p of t.parts) for (const m of p.meshes) m.geo.dispose();
  for (const b of t.baked) b.geo.dispose();
}

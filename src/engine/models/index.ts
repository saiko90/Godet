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
import { buildPellePneus } from './pellePneus';
import { buildPelleAraignee } from './pelleAraignee';
import { buildTractopelle } from './tractopelle';
import { buildBulldozer } from './bulldozer';
import { buildNiveleuse } from './niveleuse';
import { buildMiniDumper } from './miniDumper';
import { buildCamionGrue } from './camionGrue';
import { buildCamionMalaxeur } from './camionMalaxeur';
import { buildGrueTour } from './grueTour';
import { buildChariotTelescopique } from './chariotTelescopique';
import { buildChariotElevateur } from './chariotElevateur';
import { buildNacelleCiseaux } from './nacelleCiseaux';
import { buildNacelleArticulee } from './nacelleArticulee';
import { buildNacelleTelescopique } from './nacelleTelescopique';
import { buildRouleauTandem } from './rouleauTandem';
import { buildPlaqueVibrante } from './plaqueVibrante';
import { buildFinisseur } from './finisseur';
import { buildFraiseuse } from './fraiseuse';
import { buildPompeBeton } from './pompeBeton';
import { buildForeuse } from './foreuse';
import { buildConcasseur } from './concasseur';
import { buildCrible } from './crible';
import { buildGroupeElectrogene } from './groupeElectrogene';
import { buildCompresseur } from './compresseur';

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
    case 'pelle_pneus':
      return buildPellePneus();
    case 'pelle_araignee':
      return buildPelleAraignee();
    case 'tractopelle':
      return buildTractopelle();
    case 'bulldozer':
      return buildBulldozer();
    case 'niveleuse':
      return buildNiveleuse();
    case 'mini_dumper':
      return buildMiniDumper();
    case 'camion_grue':
      return buildCamionGrue();
    case 'camion_malaxeur':
      return buildCamionMalaxeur();
    case 'grue_tour':
      return buildGrueTour();
    case 'chariot_telescopique':
      return buildChariotTelescopique();
    case 'chariot_elevateur':
      return buildChariotElevateur();
    case 'nacelle_ciseaux':
      return buildNacelleCiseaux();
    case 'nacelle_articulee':
      return buildNacelleArticulee();
    case 'nacelle_telescopique':
      return buildNacelleTelescopique();
    case 'rouleau_tandem':
      return buildRouleauTandem();
    case 'plaque_vibrante':
      return buildPlaqueVibrante();
    case 'finisseur':
      return buildFinisseur();
    case 'fraiseuse':
      return buildFraiseuse();
    case 'pompe_beton':
      return buildPompeBeton();
    case 'foreuse':
      return buildForeuse();
    case 'concasseur':
      return buildConcasseur();
    case 'crible':
      return buildCrible();
    case 'groupe_electrogene':
      return buildGroupeElectrogene();
    case 'compresseur':
      return buildCompresseur();
    case 'chargeuse_compacte':
      return buildAutre();
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

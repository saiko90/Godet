// Catalogue des types de machines, rangés par famille (sélecteur de la fiche « machine »).
// Libellés : messages/<langue>/domain.json (machineKinds, machineCategories) ; préfixes de code :
// messages/<langue>/garage.json (codePrefix) ; modèles 3D : src/engine/models ; icônes : KindIcon.tsx.
import type { MachineKind } from '@/lib/types';

export type MachineCategory = 'terrassement' | 'transport' | 'levage' | 'routes' | 'divers';

/** Familles de machines, dans l'ordre d'affichage, avec leurs types. */
export const MACHINE_CATEGORIES: readonly { id: MachineCategory; kinds: readonly MachineKind[] }[] = [
  { id: 'terrassement', kinds: ['pelle', 'pelle_pneus', 'mini_pelle', 'pelle_araignee', 'chargeuse', 'chargeuse_compacte', 'tractopelle', 'bulldozer', 'niveleuse'] },
  { id: 'transport', kinds: ['dumper', 'mini_dumper', 'camion', 'camion_grue', 'camion_malaxeur'] },
  { id: 'levage', kinds: ['grue', 'grue_tour', 'chariot_telescopique', 'chariot_elevateur', 'nacelle_ciseaux', 'nacelle_articulee', 'nacelle_telescopique'] },
  { id: 'routes', kinds: ['rouleau', 'rouleau_tandem', 'plaque_vibrante', 'finisseur', 'fraiseuse'] },
  { id: 'divers', kinds: ['pompe_beton', 'foreuse', 'concasseur', 'crible', 'groupe_electrogene', 'compresseur', 'autre'] },
];

/** Tous les types, dans l'ordre du catalogue. */
export const MACHINE_KIND_ORDER: readonly MachineKind[] = MACHINE_CATEGORIES.flatMap((c) => c.kinds);

/** Famille d'un type de machine. */
export function categoryOf(kind: MachineKind): MachineCategory {
  return MACHINE_CATEGORIES.find((c) => c.kinds.includes(kind))?.id ?? 'divers';
}

export function isMachineKind(value: unknown): value is MachineKind {
  return typeof value === 'string' && (MACHINE_KIND_ORDER as readonly string[]).includes(value);
}

/** Poids typique (t) d'une machine de chaque type : exemple du champ « Poids » (et ordre de grandeur des modèles 3D). */
export const TYPICAL_WEIGHT: Record<MachineKind, number> = {
  pelle: 21,
  pelle_pneus: 18,
  mini_pelle: 2.7,
  pelle_araignee: 10,
  chargeuse: 18,
  chargeuse_compacte: 4,
  tractopelle: 8,
  bulldozer: 20,
  niveleuse: 17,
  dumper: 9,
  mini_dumper: 2.5,
  camion: 32,
  camion_grue: 26,
  camion_malaxeur: 32,
  grue: 40,
  grue_tour: 24,
  chariot_telescopique: 11,
  chariot_elevateur: 5,
  nacelle_ciseaux: 3.8,
  nacelle_articulee: 6.9,
  nacelle_telescopique: 10.5,
  rouleau: 12,
  rouleau_tandem: 9,
  plaque_vibrante: 0.45,
  finisseur: 18,
  fraiseuse: 19,
  pompe_beton: 32,
  foreuse: 12,
  concasseur: 30,
  crible: 25,
  groupe_electrogene: 1.9,
  compresseur: 1,
  autre: 5,
};

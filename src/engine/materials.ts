// Matériaux : une banque qui suit tous les matériaux éclairés (intensité de l'environnement réglable d'un coup
// pour l'allumage du hall, vernis coupé en qualité basse, libération mémoire à la fin).
// Règle anti « blocs noirs » : jamais de rugosité nulle (valeurs infinies dans les reflets en demi-flottant).
import * as THREE from 'three';
import type { MatKey } from './models/kit';
import { codeTexture } from './textures';

const MIN_ROUGHNESS = 0.08;

interface Tracked {
  m: THREE.MeshStandardMaterial;
  env: number;
}

export class MaterialBank {
  private lit: Tracked[] = [];
  private others = new Set<THREE.Material>();
  private paints = new Set<THREE.MeshPhysicalMaterial>();
  private envMap: THREE.Texture | null = null;
  private envLevel = 1;
  private clearcoat = true;

  /** Matériau standard suivi (réagit à l'environnement). */
  std(p: THREE.MeshStandardMaterialParameters, env = 1): THREE.MeshStandardMaterial {
    const m = new THREE.MeshStandardMaterial(p);
    m.roughness = Math.max(MIN_ROUGHNESS, m.roughness);
    this.track(m, env);
    return m;
  }

  phys(p: THREE.MeshPhysicalMaterialParameters, env = 1): THREE.MeshPhysicalMaterial {
    const m = new THREE.MeshPhysicalMaterial(p);
    m.roughness = Math.max(MIN_ROUGHNESS, m.roughness);
    m.clearcoatRoughness = Math.max(MIN_ROUGHNESS, m.clearcoatRoughness);
    this.track(m, env);
    return m;
  }

  /** Peinture vernie d'une carrosserie (une par machine : sa couleur peut changer en douceur). */
  paint(color: THREE.ColorRepresentation): THREE.MeshPhysicalMaterial {
    const m = this.phys({ color, metalness: 0.18, roughness: 0.34, clearcoat: 1, clearcoatRoughness: 0.1 }, 1.0);
    m.userData.clearcoat = 1;
    if (!this.clearcoat) m.clearcoat = 0;
    this.paints.add(m);
    return m;
  }

  /** Matériau non éclairé (néons, halos) : seulement suivi pour la libération. */
  keep<T extends THREE.Material>(m: T): T {
    this.others.add(m);
    return m;
  }

  private track(m: THREE.MeshStandardMaterial, env: number): void {
    this.lit.push({ m, env });
    m.envMapIntensity = env * this.envLevel;
    if (this.envMap) m.envMap = this.envMap;
  }

  setEnvMap(tex: THREE.Texture | null): void {
    this.envMap = tex;
    for (const t of this.lit) {
      t.m.envMap = tex;
      t.m.needsUpdate = true;
    }
  }

  /** Niveau global de l'environnement (0 = hall éteint, 1 = allumé). */
  setEnvLevel(level: number): void {
    this.envLevel = level;
    for (const t of this.lit) t.m.envMapIntensity = t.env * level;
  }

  setClearcoat(on: boolean): void {
    this.clearcoat = on;
    for (const m of this.paints) m.clearcoat = on ? (m.userData.clearcoat as number) || 1 : 0;
  }

  /** Libère un matériau (et ses textures propres). */
  release(m: THREE.Material): void {
    const i = this.lit.findIndex((t) => t.m === m);
    if (i >= 0) this.lit.splice(i, 1);
    this.others.delete(m);
    if (m instanceof THREE.MeshPhysicalMaterial) this.paints.delete(m);
    const mm = m as THREE.Material & { map?: THREE.Texture | null };
    if (mm.map && mm.userData.ownMap) mm.map.dispose();
    m.dispose();
  }

  dispose(): void {
    for (const t of this.lit) {
      const mm = t.m as THREE.MeshStandardMaterial;
      if (mm.map && mm.userData.ownMap) mm.map.dispose();
      t.m.dispose();
    }
    for (const m of this.others) m.dispose();
    this.lit = [];
    this.others.clear();
    this.paints.clear();
  }
}

/** Matériaux communs à toutes les machines (acier, caoutchouc, verre…). */
export type SharedMachineMats = Record<Exclude<MatKey, 'paint' | 'lamp' | 'beacon' | 'decal'>, THREE.Material>;

export function sharedMachineMaterials(bank: MaterialBank): SharedMachineMats {
  const glass = bank.phys(
    {
      color: 0x0b1117,
      metalness: 0.1,
      roughness: 0.08,
      transparent: true,
      opacity: 0.6,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      depthWrite: false,
      side: THREE.DoubleSide,
    },
    1.7,
  );
  return {
    trim: bank.std({ color: 0x1c1f23, metalness: 0.38, roughness: 0.5 }, 0.85),
    steelDark: bank.std({ color: 0x2a2d32, metalness: 0.72, roughness: 0.42 }, 0.9),
    steel: bank.std({ color: 0x9aa0a8, metalness: 0.9, roughness: 0.28 }, 1),
    chrome: bank.std({ color: 0xe9ecf0, metalness: 1, roughness: 0.14 }, 1.4),
    rubber: bank.std({ color: 0x131416, metalness: 0, roughness: 0.82 }, 0.6),
    track: bank.std({ color: 0x18191c, metalness: 0.6, roughness: 0.52 }, 0.8),
    glass,
    interior: bank.std({ color: 0x0f1012, metalness: 0.1, roughness: 0.85 }, 0.5),
    black: bank.std({ color: 0x08090a, metalness: 0.25, roughness: 0.62 }, 0.5),
    tail: bank.std({ color: 0x4a0806, emissive: new THREE.Color(1, 0.12, 0.05), emissiveIntensity: 0.9, roughness: 0.25 }, 0.6),
    amber: bank.std({ color: 0x4a2a05, emissive: new THREE.Color(1, 0.45, 0.05), emissiveIntensity: 0.5, roughness: 0.25 }, 0.6),
    mirror: bank.std({ color: 0x9aa3ad, metalness: 1, roughness: 0.1 }, 1.5),
  };
}

/** Matériaux propres à une machine : peinture, phares, gyrophare et plaque de code. */
export interface OwnMachineMats {
  paint: THREE.MeshPhysicalMaterial;
  lamp: THREE.MeshStandardMaterial;
  beacon: THREE.MeshStandardMaterial;
  decal: THREE.MeshStandardMaterial;
}

/** Peinture claire (jaune, blanc, orange) : code peint en sombre ; peinture foncée : code clair. */
export function isLightPaint(color: string): boolean {
  const c = new THREE.Color(color);
  const l = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  return l > 0.28;
}

export function ownMachineMaterials(bank: MaterialBank, color: string, code: string): OwnMachineMats {
  const paint = bank.paint(color);
  const lamp = bank.std(
    { color: 0xc9ced6, metalness: 0.6, roughness: 0.12, emissive: new THREE.Color(1, 0.94, 0.84), emissiveIntensity: 0.06 },
    1.3,
  );
  const beacon = bank.std(
    {
      color: 0x6a3a08,
      emissive: new THREE.Color(1, 0.46, 0.04),
      emissiveIntensity: 0.18,
      roughness: 0.2,
      transparent: true,
      opacity: 0.92,
    },
    0.8,
  );
  const decal = bank.std(
    {
      map: codeTexture(code, isLightPaint(color)),
      transparent: true,
      roughness: 0.45,
      metalness: 0,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      depthWrite: false,
    },
    0.6,
  );
  decal.userData.ownMap = true;
  return { paint, lamp, beacon, decal };
}

export function releaseOwn(bank: MaterialBank, own: OwnMachineMats): void {
  bank.release(own.paint);
  bank.release(own.lamp);
  bank.release(own.beacon);
  bank.release(own.decal);
}

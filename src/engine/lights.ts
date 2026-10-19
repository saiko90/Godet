// Éclairage : environnement de reflets (pièce synthétique avec bandeaux lumineux), lumières d'ambiance,
// trois projecteurs réels qui suivent la caméra (machine visée et ses voisines ; les autres baies ont un
// éclairage simulé), et la lumière orange du gyrophare de la machine réveillée.
// Nombre de lumières fixe (pas de recompilation des matériaux) ; jamais de lumière collée à une surface.
import * as THREE from 'three';
import { DECK_Y, type Slot } from './layout';
import type { QualityPreset } from './quality';
import { damp } from './tween';

/** Carte d'environnement : boîte sombre et bandeaux lumineux (plafond, côtés, mur ambré du fond). */
export function buildEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const env = new THREE.Scene();
  const disposables: { dispose(): void }[] = [];
  const boxGeo = new THREE.BoxGeometry(70, 32, 70);
  const boxMat = new THREE.MeshBasicMaterial({ color: 0x040405, side: THREE.BackSide });
  disposables.push(boxGeo, boxMat);
  env.add(new THREE.Mesh(boxGeo, boxMat));
  const strip = (w: number, h: number, pos: [number, number, number], rot: [number, number, number], col: number, k: number) => {
    const g = new THREE.PlaneGeometry(w, h);
    const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide });
    disposables.push(g, m);
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(...pos);
    mesh.rotation.set(...rot);
    env.add(mesh);
  };
  // bandeaux du plafond (le long du hall) et néons transversaux
  for (const x of [-4, 4]) strip(1.2, 60, [x, 15, 0], [Math.PI / 2, 0, 0], 0xfff4e6, 6);
  for (const z of [-20, -6, 8, 22]) strip(10, 0.5, [0, 15, z], [Math.PI / 2, 0, 0], 0xfff4e6, 4);
  // panneaux latéraux doux (vitrages éclairés)
  for (const s of [-1, 1]) {
    strip(1.6, 11, [s * 30, 7, -4], [0, -s * (Math.PI / 2), 0], 0xfff0dd, 2.4);
    strip(1.6, 11, [s * 30, 7, 12], [0, -s * (Math.PI / 2), 0], 0xfff0dd, 1.8);
    strip(40, 4, [s * 31, 3, 0], [0, -s * (Math.PI / 2), 0], 0x1a2638, 1.0);
  }
  // mur du fond ambré et lueur d'entrée froide
  strip(52, 0.7, [0, 1.2, -32], [0, 0, 0], 0xffa030, 3.2);
  strip(52, 0.4, [0, 12, -32], [0, 0, 0], 0xffa030, 2.4);
  strip(24, 6, [0, 6, 33], [0, Math.PI, 0], 0xcfdcff, 0.7);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromScene(env, 0.035).texture;
  pmrem.dispose();
  for (const d of disposables) d.dispose();
  return tex;
}

interface SpotRec {
  light: THREE.SpotLight;
  bay: number;
  want: number;
  level: number;
  /** Intensité pleine selon le rôle (vedette ou voisine). */
  full: number;
  tint: THREE.Color;
}

const WARM = new THREE.Color(1, 0.94, 0.86);

export class Lights {
  readonly group = new THREE.Group();
  readonly hemi: THREE.HemisphereLight;
  readonly fill: THREE.DirectionalLight;
  readonly rim: THREE.DirectionalLight;
  readonly beacon: THREE.PointLight;
  private spots: SpotRec[] = [];
  private slots: Slot[] = [];
  private height = 12.5;
  /** Niveau général (allumage du hall). */
  ambient = 0;
  spotsLevel = 0;
  private beaconTarget = new THREE.Vector3();
  beaconLevel = 0;

  constructor() {
    this.hemi = new THREE.HemisphereLight(0x9aa6b8, 0x0a0a0a, 0);
    this.fill = new THREE.DirectionalLight(0xdfe6f2, 0);
    this.fill.position.set(-6, 10, 18);
    this.rim = new THREE.DirectionalLight(0xcfdcff, 0);
    this.rim.position.set(4, 9, -14);
    this.beacon = new THREE.PointLight(0xff8a1c, 0, 9, 2);
    this.beacon.position.set(0, 4, 0);
    this.group.add(this.hemi, this.fill, this.fill.target, this.rim, this.rim.target, this.beacon);
    for (let i = 0; i < 3; i++) {
      const light = new THREE.SpotLight(0xfff0dc, 0, 0, 0.5, 0.55, 2);
      light.shadow.bias = -0.0004;
      light.shadow.normalBias = 0.035;
      light.shadow.camera.near = 5;
      light.shadow.camera.far = 18;
      light.position.set(0, 12, 0);
      this.group.add(light, light.target);
      this.spots.push({ light, bay: -1, want: -1, level: 0, full: i === 0 ? 480 : 340, tint: WARM.clone() });
    }
  }

  setLayout(slots: Slot[], height: number): void {
    this.slots = slots;
    this.height = height;
    for (const s of this.spots) {
      if (s.bay >= slots.length) {
        s.bay = -1;
        s.level = 0;
      }
      if (s.want >= slots.length) s.want = -1;
    }
  }

  /** Qualité : nombre de projecteurs actifs, ombres portées. Change le nombre de lumières (recompilation). */
  setQuality(q: QualityPreset): void {
    this.spots.forEach((s, i) => {
      s.light.visible = i < q.spots;
      const shadow = i < q.shadows;
      s.light.castShadow = shadow;
      const size = i === 0 ? q.shadowSize : Math.max(512, q.shadowSize / 2);
      if (s.light.shadow.mapSize.x !== size) {
        s.light.shadow.mapSize.set(size, size);
        if (s.light.shadow.map) {
          s.light.shadow.map.dispose();
          s.light.shadow.map = null;
        }
      }
    });
  }

  /** Baies à éclairer : la première reçoit le projecteur vedette (et son ombre). */
  assign(bays: number[]): void {
    this.spots.forEach((s, i) => {
      s.want = bays[i] ?? -1;
    });
  }

  setTint(bay: number, color: THREE.Color): void {
    for (const s of this.spots) if (s.bay === bay) s.tint.copy(color);
  }

  /** Bouge le gyrophare (position monde du dôme) ; level 0..1 (déjà modulé par le clignotement). */
  setBeacon(pos: THREE.Vector3 | null, level: number): void {
    if (pos) this.beaconTarget.copy(pos).add(new THREE.Vector3(0, 0.45, 0));
    this.beaconLevel = pos ? level : 0;
  }

  /** Part d'éclairage réel de chaque baie (pour atténuer la flaque simulée). */
  realOf(bay: number): number {
    let v = 0;
    for (const s of this.spots) if (s.bay === bay && s.light.visible) v = Math.max(v, s.level);
    return v;
  }

  /** Avance les fondus des projecteurs ; renvoie true si quelque chose bouge (ombres à recalculer). */
  update(dt: number, tintOf: (bay: number) => THREE.Color): { moving: boolean; shadowsDirty: boolean } {
    let moving = false;
    let shadowsDirty = false;
    this.hemi.intensity = 0.22 * this.ambient;
    this.fill.intensity = 0.42 * this.ambient;
    this.rim.intensity = 0.75 * this.ambient;
    for (const s of this.spots) {
      if (s.want !== s.bay) {
        // fondu de sortie, déplacement, puis fondu d'entrée
        s.level = damp(s.level, 0, 14, dt);
        moving = true;
        if (s.level < 0.03) {
          s.level = 0;
          s.bay = s.want;
          if (s.bay >= 0) this.place(s);
          shadowsDirty = true;
        }
      } else if (s.bay >= 0 && s.level < 1) {
        s.level = damp(s.level, 1, 5, dt);
        if (s.level > 0.995) s.level = 1;
        moving = true;
      }
      if (s.bay >= 0) s.tint.lerp(tintOf(s.bay), 1 - Math.exp(-6 * dt));
      s.light.color.copy(s.tint);
      s.light.intensity = s.full * s.level * this.spotsLevel;
    }
    // gyrophare : la lumière suit le dôme (au-dessus, jamais au contact)
    this.beacon.position.copy(this.beaconTarget);
    this.beacon.intensity = 7 * this.beaconLevel;
    return { moving, shadowsDirty };
  }

  private place(s: SpotRec): void {
    const slot = this.slots[s.bay];
    if (!slot) return;
    const H = this.height;
    s.light.position.set(slot.x, H - 1.2, slot.z + 0.9);
    s.light.target.position.set(slot.x, DECK_Y + 0.6, slot.z);
    s.light.angle = Math.atan((slot.radius + 0.9) / (H - 1.6));
    s.light.penumbra = 0.55;
    s.light.target.updateMatrixWorld();
    s.light.updateMatrixWorld();
  }

  /** Les projecteurs ont fini de bouger ? */
  get settled(): boolean {
    return this.spots.every((s) => s.want === s.bay && (s.bay < 0 || s.level >= 1));
  }

  dispose(): void {
    for (const s of this.spots) {
      s.light.shadow.map?.dispose();
      s.light.dispose();
    }
    this.hemi.dispose();
    this.fill.dispose();
    this.rim.dispose();
    this.beacon.dispose();
    this.group.removeFromParent();
  }
}

// Une machine du parc dans la scène : version figée (au repos, très peu d'appels de dessin) ou articulée
// (pendant une animation), poses interpolées, phares et gyrophare.
import * as THREE from 'three';
import { clamp, easeInOut, type Ease, type Timeline, type Tween } from '../tween';
import {
  UNIT,
  anchorsIn,
  applyJoints,
  canonMat,
  linkMatrix,
  pistonMatrices,
  type MachineTemplate,
  type MatKey,
  type Pose,
} from './kit';

export type MatResolver = (key: MatKey) => THREE.Material;

interface Articulated {
  group: THREE.Group;
  objs: THREE.Object3D[];
  pistons: { barrel: THREE.Mesh; rod: THREE.Mesh; i: number }[];
  links: { mesh: THREE.Mesh; i: number }[];
}

const NO_SHADOW: MatKey[] = ['glass', 'decal', 'lamp', 'beacon', 'tail', 'amber'];

function meshFor(geo: THREE.BufferGeometry, mat: THREE.Material, key: MatKey): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  const cast = !NO_SHADOW.includes(key);
  m.castShadow = cast;
  m.receiveShadow = key !== 'glass' && key !== 'decal';
  // le verre et les plaques se dessinent après les surfaces opaques
  if (key === 'glass') m.renderOrder = 2;
  if (key === 'decal') m.renderOrder = 1;
  return m;
}

export class MachineView {
  /** Racine placée sur le plateau tournant : échelle de la machine. */
  readonly root = new THREE.Group();
  /** Modèle recentré sur l'axe du plateau. */
  readonly model = new THREE.Group();
  private baked = new THREE.Group();
  private art: Articulated | null = null;
  pose: Pose;
  private poseTween: Tween | null = null;
  /** Niveau des phares (0..1) et du gyrophare (0..1). */
  lamps = 0;
  beacon = 0;
  /** Vibration (rouleau) 0..1. */
  vibration = 0;
  /** Respiration au repos 0..1 (machine visée). */
  breath = 0;
  /** Une animation est en cours (mouvement des bras). */
  busy = 0;
  private inv = new THREE.Matrix4();
  private tmpM = new THREE.Matrix4();
  private tmpM2 = new THREE.Matrix4();

  constructor(
    readonly tpl: MachineTemplate,
    private mat: MatResolver,
    readonly scale: number,
  ) {
    this.pose = { ...tpl.rest };
    this.root.scale.setScalar(scale);
    this.model.position.copy(tpl.offset);
    this.root.add(this.model);
    for (const b of tpl.baked) this.baked.add(meshFor(b.geo, mat(b.mat), b.mat));
    this.model.add(this.baked);
  }

  /** Exclut (ou non) la machine de la passe de reflet du sol (machines lointaines : couche 2 seulement). */
  setReflected(on: boolean): void {
    if (this.reflected === on) return;
    this.reflected = on;
    this.root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.layers.set(on ? 0 : 2);
    });
  }

  private reflected = true;

  /** Hauteur et rayon réels (échelle comprise). */
  get height(): number {
    return this.tpl.height * this.scale;
  }

  get radius(): number {
    return this.tpl.radius * this.scale;
  }

  get articulated(): boolean {
    return !!this.art;
  }

  /** Passe en version articulée (animation) ou revient à la version figée (au repos). */
  articulate(on: boolean): void {
    if (on && !this.art) {
      const tpl = this.tpl;
      const group = new THREE.Group();
      const objs = tpl.parts.map((p) => {
        const o = new THREE.Object3D();
        o.position.copy(p.pos);
        o.rotation.copy(p.rot);
        for (const m of p.meshes) o.add(meshFor(m.geo, this.mat(m.mat), m.mat));
        return o;
      });
      tpl.parts.forEach((p, i) => (p.parent >= 0 ? objs[p.parent] : group).add(objs[i]));
      const pistons = tpl.pistons.map((pd, i) => {
        const barrel = meshFor(UNIT.barrel, this.mat(canonMat(pd.barrel)), pd.barrel);
        const rod = meshFor(UNIT.rod, this.mat(canonMat(pd.rod)), pd.rod);
        barrel.matrixAutoUpdate = false;
        rod.matrixAutoUpdate = false;
        objs[pd.parent].add(barrel, rod);
        return { barrel, rod, i };
      });
      const links = tpl.links.map((ld, i) => {
        const mesh = meshFor(ld.round ? UNIT.cyl : UNIT.box, this.mat(canonMat(ld.mat)), ld.mat);
        mesh.matrixAutoUpdate = false;
        objs[ld.parent].add(mesh);
        return { mesh, i };
      });
      this.art = { group, objs, pistons, links };
      if (!this.reflected) group.traverse((o) => (o as THREE.Mesh).isMesh && o.layers.set(2));
      this.model.add(group);
      this.baked.visible = false;
      this.syncArticulated(0);
    } else if (!on && this.art) {
      this.model.remove(this.art.group);
      this.art = null;
      this.baked.visible = true;
    }
  }

  /** Remplace un matériau (peinture changée, qualité…). */
  refreshMaterials(): void {
    this.baked.children.forEach((c, i) => {
      const b = this.tpl.baked[i];
      (c as THREE.Mesh).material = this.mat(b.mat);
    });
    if (this.art) {
      const on = true;
      this.articulate(false);
      this.articulate(on);
    }
  }

  /** La pose courante est-elle celle du repos ? */
  atRest(eps = 1e-3): boolean {
    for (const k in this.tpl.rest) if (Math.abs((this.pose[k] ?? 0) - this.tpl.rest[k]) > eps) return false;
    return true;
  }

  /** Interpole la pose vers une cible (liaisons non citées inchangées). */
  poseTo(tl: Timeline, target: Pose, dur: number, ease: Ease = easeInOut): Promise<boolean> {
    if (this.poseTween) this.poseTween.cancel();
    const from: Pose = { ...this.pose };
    const keys = Object.keys(target).filter((k) => k in this.tpl.rest);
    const t = tl.tween(
      dur,
      (e) => {
        for (const k of keys) this.pose[k] = from[k] + (target[k] - from[k]) * e;
      },
      ease,
    );
    this.poseTween = t;
    return t.done;
  }

  stopPose(): void {
    if (this.poseTween) this.poseTween.cancel();
    this.poseTween = null;
  }

  /** Met à jour les pièces articulées (pose, respiration, vibration). */
  update(time: number): void {
    if (!this.art) return;
    this.syncArticulated(time);
  }

  private syncArticulated(time: number): void {
    const art = this.art;
    if (!art) return;
    const tpl = this.tpl;
    let pose = this.pose;
    if (this.breath > 0 && tpl.breathe) {
      pose = { ...this.pose };
      const s = Math.sin(time * 0.9) * this.breath;
      for (const k in tpl.breathe) pose[k] = (pose[k] ?? 0) + tpl.breathe[k] * s;
    }
    applyJoints(art.objs, tpl.parts, tpl.joints, pose);
    if (this.vibration > 0 && tpl.vibrate) {
      const i = tpl.parts.findIndex((p) => p.name === tpl.vibrate);
      if (i >= 0) {
        const o = art.objs[i];
        const a = 0.012 * this.vibration;
        o.position.y = tpl.parts[i].pos.y + Math.sin(time * 95) * a;
        o.position.x = tpl.parts[i].pos.x + Math.sin(time * 71 + 1) * a * 0.5;
      }
    }
    art.group.updateMatrixWorld(true);
    for (const p of art.pistons) {
      const pd = tpl.pistons[p.i];
      const { a, b, len } = anchorsIn(art.objs, pd.parent, pd.a, pd.b, this.inv);
      if (pistonMatrices(a, b, len, pd.rb, pd.rr, this.tmpM, this.tmpM2)) {
        p.barrel.matrix.copy(this.tmpM);
        p.rod.matrix.copy(this.tmpM2);
        p.barrel.matrixWorldNeedsUpdate = true;
        p.rod.matrixWorldNeedsUpdate = true;
      }
    }
    for (const l of art.links) {
      const ld = tpl.links[l.i];
      const { a, b } = anchorsIn(art.objs, ld.parent, ld.a, ld.b, this.inv);
      if (linkMatrix(a, b, ld.w, ld.d, this.tmpM)) {
        l.mesh.matrix.copy(this.tmpM);
        l.mesh.matrixWorldNeedsUpdate = true;
      }
    }
    art.group.updateMatrixWorld(true);
  }

  /** Position monde du premier gyrophare (pour la lumière orange). */
  beaconWorld(out: THREE.Vector3): THREE.Vector3 | null {
    const b = this.tpl.beacons[0];
    if (!b) return null;
    if (this.art) {
      out.copy(b.anchor.p).applyMatrix4(this.art.objs[b.anchor.part].matrixWorld);
    } else {
      out.copy(b.rest).sub(this.tpl.offset);
      this.model.localToWorld(out);
    }
    return out;
  }

  /** Clignotement du gyrophare (rotation simulée) et phares, appliqués aux matériaux propres. */
  applyLights(time: number, lamp: THREE.MeshStandardMaterial, beacon: THREE.MeshStandardMaterial): number {
    lamp.emissiveIntensity = 0.06 + this.lamps * 5.5;
    const flash = this.beacon > 0 ? Math.pow(0.5 + 0.5 * Math.sin(time * 8.5), 4) * this.beacon : 0;
    beacon.emissiveIntensity = 0.18 + flash * 5;
    return flash;
  }

  /** Niveau global d'activité (pour savoir s'il faut continuer à rendre). */
  get animating(): boolean {
    return this.busy > 0 || !!this.poseTween?.running || this.beacon > 0 || this.vibration > 0 || this.breath > 0;
  }

  dispose(): void {
    this.stopPose();
    this.articulate(false);
    this.root.removeFromParent();
  }
}

/** Échelle d'une machine selon son poids, bornée, puis ajustée pour tenir sur la plateforme. */
export function machineScale(tpl: MachineTemplate, weightT: number | null | undefined, platformRadius: number): number {
  const w = weightT && weightT > 0 ? weightT : tpl.refWeight;
  const byWeight = clamp(Math.cbrt(w / tpl.refWeight), tpl.minScale, tpl.maxScale);
  const fit = (platformRadius - 0.35) / Math.max(0.5, tpl.radius);
  return Math.min(byWeight, fit);
}

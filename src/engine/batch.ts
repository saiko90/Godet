// Fusion des éléments statiques du décor par matériau (un appel de dessin par matériau) et maillages instanciés
// pour les éléments répétés.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { normalizeGeometry } from './models/kit';

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();

export type V3 = [number, number, number];

export function compose(pos: V3, rot: V3 = [0, 0, 0], scale: V3 = [1, 1, 1], out = new THREE.Matrix4()): THREE.Matrix4 {
  return out.compose(_p.set(...pos), _q.setFromEuler(_e.set(...rot)), _s.set(...scale));
}

interface BuildOpts {
  cast?: boolean;
  receive?: boolean;
  renderOrder?: number;
  layer?: number;
}

/** Accumule des géométries par matériau puis les fusionne. */
export class Batch {
  private map = new Map<THREE.Material, { geos: THREE.BufferGeometry[]; opts: BuildOpts }>();

  add(mat: THREE.Material, geo: THREE.BufferGeometry, pos: V3 = [0, 0, 0], rot?: V3, scale?: V3, opts: BuildOpts = {}): void {
    geo.applyMatrix4(compose(pos, rot, scale, _m));
    const g = normalizeGeometry(geo);
    const rec = this.map.get(mat);
    if (rec) rec.geos.push(g);
    else this.map.set(mat, { geos: [g], opts });
  }

  box(mat: THREE.Material, size: V3, pos: V3, rot?: V3, opts?: BuildOpts): void {
    this.add(mat, new THREE.BoxGeometry(...size), pos, rot, undefined, opts);
  }

  /** Crée un maillage par matériau dans le groupe. */
  build(group: THREE.Group): THREE.Mesh[] {
    const out: THREE.Mesh[] = [];
    for (const [mat, rec] of this.map) {
      const geo = rec.geos.length === 1 ? rec.geos[0] : mergeGeometries(rec.geos, false);
      if (rec.geos.length > 1) for (const g of rec.geos) g.dispose();
      if (!geo) continue;
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = !!rec.opts.cast;
      mesh.receiveShadow = rec.opts.receive !== false;
      if (rec.opts.renderOrder) mesh.renderOrder = rec.opts.renderOrder;
      if (rec.opts.layer) mesh.layers.set(rec.opts.layer);
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      group.add(mesh);
      out.push(mesh);
    }
    this.map.clear();
    return out;
  }
}

/** Maillage instancié à partir d'une liste de matrices (et de couleurs facultatives). */
export function instanced(
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  matrices: THREE.Matrix4[],
  colors?: THREE.Color[],
): THREE.InstancedMesh {
  const n = Math.max(1, matrices.length);
  const mesh = new THREE.InstancedMesh(geo, mat, n);
  matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
  if (colors) colors.forEach((c, i) => mesh.setColorAt(i, c));
  mesh.count = matrices.length;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
  mesh.frustumCulled = matrices.length > 0;
  return mesh;
}

/** Libère géométries (et matériaux si demandé) d'un sous-arbre. */
export function disposeTree(root: THREE.Object3D, materials = false): void {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    if (materials && m.material) {
      const list = Array.isArray(m.material) ? m.material : [m.material];
      for (const mat of list) mat.dispose();
    }
    if ((o as THREE.InstancedMesh).isInstancedMesh) (o as THREE.InstancedMesh).dispose();
  });
}

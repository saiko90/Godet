// Boîte à outils de modélisation procédurale des machines.
// Un modèle est fait de pièces rigides (châssis, tourelle, flèche, godet…) articulées par des liaisons.
// Toutes les primitives d'une pièce sont fusionnées par matériau (une géométrie par couple pièce × matériau) ;
// on en tire aussi une version « figée » au repos (une géométrie par matériau pour toute la machine), affichée
// tant que la machine ne bouge pas : peu d'appels de dessin, même avec 30 machines.
// Les géométries d'un type de machine sont partagées par toutes les machines de ce type.
// Repère : avant de la machine vers +X, haut vers +Y, côtés vers ±Z, sol en y = 0. Unités : mètres.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export type MatKey =
  | 'paint'
  | 'trim'
  | 'steel'
  | 'steelDark'
  | 'chrome'
  | 'rubber'
  | 'track'
  | 'glass'
  | 'interior'
  | 'black'
  | 'lamp'
  | 'beacon'
  | 'tail'
  | 'amber'
  | 'decal'
  | 'mirror';

export type V3 = [number, number, number];
export type JointKind = 'rx' | 'ry' | 'rz' | 'tx' | 'ty' | 'tz';
export type Pose = Record<string, number>;

export interface JointDef {
  name: string;
  part: number;
  kind: JointKind;
  rest: number;
}

export interface PoseStep {
  pose: Pose;
  dur: number;
  /** Son joué pendant le mouvement. */
  sound?: 'hydraulic' | 'none';
}

export interface Anchor {
  part: number;
  p: THREE.Vector3;
}

export interface PistonDef {
  parent: number;
  a: Anchor;
  b: Anchor;
  rb: number;
  rr: number;
  barrel: MatKey;
  rod: MatKey;
}

export interface LinkDef {
  parent: number;
  a: Anchor;
  b: Anchor;
  w: number;
  d: number;
  mat: MatKey;
  round: boolean;
}

export interface TemplatePart {
  name: string;
  parent: number;
  pos: THREE.Vector3;
  rot: THREE.Euler;
  meshes: { mat: MatKey; geo: THREE.BufferGeometry }[];
}

export interface TemplateMeta {
  /** Poids de référence du modèle (t) : l'échelle d'une machine suit la racine cubique du rapport des poids. */
  refWeight: number;
  /** Bornes d'échelle (avant l'ajustement à la plateforme). */
  minScale: number;
  maxScale: number;
  /** Mouvements du réveil (« wake »), puis retour au repos. */
  wake: PoseStep[];
  /** Petit mouvement d'acquiescement (service, enregistrement). */
  nod: PoseStep[];
  /** Respiration au repos de la machine visée : amplitude par liaison. */
  breathe?: Pose;
  /** Pièce qui vibre au réveil (cylindre du rouleau). */
  vibrate?: string;
}

export interface MachineTemplate extends TemplateMeta {
  key: string;
  parts: TemplatePart[];
  joints: JointDef[];
  pistons: PistonDef[];
  links: LinkDef[];
  rest: Pose;
  /** Version figée au repos : une géométrie par matériau, dans le repère du modèle. */
  baked: { mat: MatKey; geo: THREE.BufferGeometry }[];
  /** Décalage à appliquer au modèle pour centrer son emprise sur l'axe de la plateforme. */
  offset: THREE.Vector3;
  /** Rayon horizontal maximal autour de l'axe (après centrage), hauteur, emprise au sol. */
  radius: number;
  height: number;
  footprint: { w: number; d: number };
  /** Boîte englobante au repos (après centrage). */
  bounds: THREE.Box3;
  /** Gyrophares : position au repos (repère centré) et ancrage articulé. */
  beacons: { anchor: Anchor; rest: THREE.Vector3 }[];
}

// ------------------------------------------------------------------ formes 2D utiles

/** Rectangle aux coins arrondis (rayon arrière rr, rayon avant rf), dans le plan XY. */
export function roundedRect(x0: number, y0: number, x1: number, y1: number, rr: number, rf = rr): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(x0 + rr, y0);
  s.lineTo(x1 - rf, y0);
  s.absarc(x1 - rf, y0 + rf, rf, -Math.PI / 2, 0, false);
  s.lineTo(x1, y1 - rf);
  s.absarc(x1 - rf, y1 - rf, rf, 0, Math.PI / 2, false);
  s.lineTo(x0 + rr, y1);
  s.absarc(x0 + rr, y1 - rr, rr, Math.PI / 2, Math.PI, false);
  s.lineTo(x0, y0 + rr);
  s.absarc(x0 + rr, y0 + rr, rr, Math.PI, Math.PI * 1.5, false);
  return s;
}

/** Polygone (liste de points [x, y]) avec coins adoucis de rayon r. */
export function softPolygon(pts: [number, number][], r: number): THREE.Shape {
  const s = new THREE.Shape();
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p = new THREE.Vector2(...pts[i]);
    const a = new THREE.Vector2(...pts[(i - 1 + n) % n]);
    const b = new THREE.Vector2(...pts[(i + 1) % n]);
    const da = a.clone().sub(p);
    const db = b.clone().sub(p);
    const rr = Math.min(r, da.length() * 0.45, db.length() * 0.45);
    const p0 = p.clone().add(da.normalize().multiplyScalar(rr));
    const p1 = p.clone().add(db.normalize().multiplyScalar(rr));
    if (i === 0) s.moveTo(p0.x, p0.y);
    else s.lineTo(p0.x, p0.y);
    s.quadraticCurveTo(p.x, p.y, p1.x, p1.y);
  }
  s.closePath();
  return s;
}

function capArc(shape: THREE.Shape, c: THREE.Vector2, d: THREE.Vector2, h: number, forward: boolean): void {
  const n = new THREE.Vector2(-d.y, d.x);
  const start = forward ? n : n.clone().negate();
  const mid = forward ? d : d.clone().negate();
  const a0 = Math.atan2(start.y, start.x);
  const am = Math.atan2(mid.y, mid.x);
  let delta = am - a0;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;
  const sign = Math.sign(delta) || 1;
  for (let k = 1; k < 8; k++) {
    const a = a0 + sign * (k / 8) * Math.PI;
    shape.lineTo(c.x + Math.cos(a) * h, c.y + Math.sin(a) * h);
  }
}

export interface Beam2D {
  shape: THREE.Shape;
  P: (t: number) => THREE.Vector2;
  D: (t: number) => THREE.Vector2;
  H: (t: number) => number;
  /** Point sur le bord : side = +1 dessus, -1 dessous, extra = décalage au-delà du bord. */
  edge: (t: number, side: number, extra?: number) => THREE.Vector2;
}

/** Poutre courbe (flèche, balancier) : courbe de Bézier quadratique, demi-hauteur variable, bouts arrondis. */
export function beam2D(p0: [number, number], p1: [number, number], p2: [number, number], h0: number, h1: number, bulge = 0.08): Beam2D {
  const P = (t: number) =>
    new THREE.Vector2(
      (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
      (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1],
    );
  const D = (t: number) =>
    new THREE.Vector2(
      2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]),
      2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]),
    ).normalize();
  const H = (t: number) => h0 + (h1 - h0) * t + Math.sin(Math.PI * t) * bulge;
  const N = 30;
  const up: THREE.Vector2[] = [];
  const lo: THREE.Vector2[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const p = P(t);
    const d = D(t);
    const n = new THREE.Vector2(-d.y, d.x);
    const h = H(t);
    up.push(p.clone().addScaledVector(n, h));
    lo.push(p.clone().addScaledVector(n, -h));
  }
  const shape = new THREE.Shape();
  shape.moveTo(up[0].x, up[0].y);
  up.forEach((v) => shape.lineTo(v.x, v.y));
  capArc(shape, P(1), D(1), H(1), true);
  for (let i = N; i >= 0; i--) shape.lineTo(lo[i].x, lo[i].y);
  capArc(shape, P(0), D(0), H(0), false);
  const edge = (t: number, side: number, extra = 0) => {
    const p = P(t);
    const d = D(t);
    const n = new THREE.Vector2(-d.y, d.x);
    const h = H(t) + extra;
    return new THREE.Vector2(p.x + n.x * h * side, p.y + n.y * h * side);
  };
  return { shape, P, D, H, edge };
}

/** Piste d'une chenille (stade : deux droites et deux demi-cercles), paramétrée par l'abscisse curviligne. */
export function stadium(L: number, r: number, cy: number) {
  const straight = L - 2 * r;
  const xR = straight / 2;
  const xL = -straight / 2;
  const per = 2 * straight + 2 * Math.PI * r;
  return {
    per,
    at(s0: number): { x: number; y: number; a: number } {
      let s = ((s0 % per) + per) % per;
      if (s < straight) return { x: xL + s, y: cy + r, a: 0 };
      s -= straight;
      if (s < Math.PI * r) {
        const th = Math.PI / 2 - s / r;
        return { x: xR + r * Math.cos(th), y: cy + r * Math.sin(th), a: th - Math.PI / 2 };
      }
      s -= Math.PI * r;
      if (s < straight) return { x: xR - s, y: cy - r, a: Math.PI };
      s -= straight;
      const th = -Math.PI / 2 - s / r;
      return { x: xL + r * Math.cos(th), y: cy + r * Math.sin(th), a: th - Math.PI / 2 };
    },
  };
}

/** Forme du plan XY extrudée selon Z (centrée), sans l'ajouter : à transformer avant Kit.add. */
export function extrudeGeo(shape: THREE.Shape, depth: number, bevel = 0, curve = 12): THREE.ExtrudeGeometry {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.001, depth - 2 * bevel),
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: curve,
  });
  g.translate(0, 0, -(depth - 2 * bevel) / 2);
  return g;
}

// ------------------------------------------------------------------ géométries unitaires partagées

const UP = new THREE.Vector3(0, 1, 0);

/** Corps de vérin : cylindre unitaire aux extrémités chanfreinées (hauteur 1, rayon 1, centré). */
function unitBarrel(): THREE.BufferGeometry {
  const pts = [
    new THREE.Vector2(0, -0.5),
    new THREE.Vector2(0.86, -0.5),
    new THREE.Vector2(1, -0.47),
    new THREE.Vector2(1, 0.44),
    new THREE.Vector2(1.08, 0.46),
    new THREE.Vector2(1.08, 0.5),
    new THREE.Vector2(0, 0.5),
  ];
  return new THREE.LatheGeometry(pts, 18);
}

export const UNIT = {
  barrel: unitBarrel(),
  rod: new THREE.CylinderGeometry(1, 1, 1, 14),
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 10),
};

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _d = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();

/** Positionne un vérin entre deux points (repère du parent). len0 : longueur au repos. */
export function pistonMatrices(
  a: THREE.Vector3,
  b: THREE.Vector3,
  len0: number,
  rb: number,
  rr: number,
  barrel: THREE.Matrix4,
  rod: THREE.Matrix4,
): boolean {
  _d.subVectors(b, a);
  const len = _d.length();
  if (len < 1e-4) return false;
  _d.divideScalar(len);
  _q.setFromUnitVectors(UP, _d);
  const bl = Math.max(0.1, Math.min(len0 * 0.6, len - 0.12));
  const rl = Math.max(0.12, len - bl + 0.15);
  _a.copy(a).addScaledVector(_d, bl / 2);
  barrel.compose(_a, _q, _s.set(rb, bl, rb));
  _b.copy(b).addScaledVector(_d, -rl / 2);
  rod.compose(_b, _q, _s.set(rr, rl, rr));
  return true;
}

/** Positionne une biellette (ou un câble) entre deux points. */
export function linkMatrix(a: THREE.Vector3, b: THREE.Vector3, w: number, d: number, out: THREE.Matrix4): boolean {
  _d.subVectors(b, a);
  const len = _d.length();
  if (len < 1e-4) return false;
  _d.divideScalar(len);
  _q.setFromUnitVectors(UP, _d);
  _a.copy(a).addScaledVector(_d, 0.5 * len);
  out.compose(_a, _q, _s.set(w, len, d));
  return true;
}

// ------------------------------------------------------------------ boîte à outils

/** Ne garde que position, normale et coordonnées de texture, sans index : fusion possible. */
export function normalizeGeometry(g: THREE.BufferGeometry): THREE.BufferGeometry {
  let out = g;
  if (g.index) {
    out = g.toNonIndexed();
    g.dispose();
  }
  for (const k of Object.keys(out.attributes)) {
    if (k !== 'position' && k !== 'normal' && k !== 'uv') out.deleteAttribute(k);
  }
  if (!out.getAttribute('normal')) out.computeVertexNormals();
  if (!out.getAttribute('uv')) {
    const n = out.getAttribute('position').count;
    out.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
  }
  out.clearGroups();
  out.morphAttributes = {};
  return out;
}

function merge(list: THREE.BufferGeometry[]): THREE.BufferGeometry {
  if (list.length === 1) return list[0];
  const m = mergeGeometries(list, false);
  for (const g of list) g.dispose();
  if (!m) throw new Error('Fusion de géométries impossible');
  return m;
}

const _m = new THREE.Matrix4();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _sc = new THREE.Vector3();

/**
 * Matériaux d'aspect voisin regroupés au moment de la fusion (un appel de dessin de moins chacun) :
 * l'intérieur de cabine rejoint le noir mat, les patins de chenille l'acier sombre, les miroirs le chrome.
 */
const CANON: Partial<Record<MatKey, MatKey>> = { interior: 'black', track: 'steelDark', mirror: 'chrome' };
export const canonMat = (k: MatKey): MatKey => CANON[k] ?? k;

interface PartRec {
  name: string;
  parent: number;
  pos: THREE.Vector3;
  rot: THREE.Euler;
  buckets: Map<MatKey, THREE.BufferGeometry[]>;
}

export class Kit {
  private parts: PartRec[] = [];
  private joints: JointDef[] = [];
  private pistons: PistonDef[] = [];
  private links: LinkDef[] = [];
  private beacons: Anchor[] = [];

  constructor(readonly key: string) {
    this.part('root', -1, [0, 0, 0]);
  }

  /** Nouvelle pièce rigide, articulée sur son parent au point pos. Renvoie son numéro. */
  part(name: string, parent: number, pos: V3, rot: V3 = [0, 0, 0]): number {
    this.parts.push({ name, parent, pos: new THREE.Vector3(...pos), rot: new THREE.Euler(...rot), buckets: new Map() });
    return this.parts.length - 1;
  }

  joint(name: string, part: number, kind: JointKind, rest = 0): void {
    this.joints.push({ name, part, kind, rest });
  }

  /** Ajoute une géométrie (transformée en place) à une pièce. */
  add(part: number, mat: MatKey, geo: THREE.BufferGeometry, pos: V3 = [0, 0, 0], rot: V3 = [0, 0, 0], scale: V3 = [1, 1, 1]): void {
    _m.compose(_p.set(...pos), new THREE.Quaternion().setFromEuler(_e.set(...rot)), _sc.set(...scale));
    geo.applyMatrix4(_m);
    const g = normalizeGeometry(geo);
    const rec = this.parts[part];
    const key = canonMat(mat);
    const list = rec.buckets.get(key);
    if (list) list.push(g);
    else rec.buckets.set(key, [g]);
  }

  box(part: number, mat: MatKey, size: V3, pos: V3, rot?: V3): void {
    this.add(part, mat, new THREE.BoxGeometry(...size), pos, rot);
  }

  /** Boîte aux arêtes arrondies (rayon borné à la plus petite demi-dimension). */
  rbox(part: number, mat: MatKey, size: V3, radius: number, pos: V3, rot?: V3, seg = 3): void {
    const r = Math.min(radius, Math.min(...size) * 0.49);
    this.add(part, mat, new RoundedBoxGeometry(size[0], size[1], size[2], seg, r), pos, rot);
  }

  /** Cylindre d'axe Y (rayons haut et bas). */
  cyl(part: number, mat: MatKey, r: number | [number, number], h: number, pos: V3, rot?: V3, seg = 20, open = false): void {
    const [rt, rb] = typeof r === 'number' ? [r, r] : r;
    this.add(part, mat, new THREE.CylinderGeometry(rt, rb, h, seg, 1, open), pos, rot);
  }

  cylX(part: number, mat: MatKey, r: number, len: number, pos: V3, seg = 20): void {
    this.cyl(part, mat, r, len, pos, [0, 0, Math.PI / 2], seg);
  }

  cylZ(part: number, mat: MatKey, r: number, len: number, pos: V3, seg = 20): void {
    this.cyl(part, mat, r, len, pos, [Math.PI / 2, 0, 0], seg);
  }

  sphere(part: number, mat: MatKey, r: number, pos: V3, seg = 16, hemi = false, rot?: V3): void {
    this.add(part, mat, new THREE.SphereGeometry(r, seg, Math.max(6, Math.round(seg * 0.6)), 0, Math.PI * 2, 0, hemi ? Math.PI / 2 : Math.PI), pos, rot);
  }

  torus(part: number, mat: MatKey, R: number, r: number, pos: V3, rot?: V3, seg: [number, number] = [8, 32], arc = Math.PI * 2): void {
    this.add(part, mat, new THREE.TorusGeometry(R, r, seg[0], seg[1], arc), pos, rot);
  }

  /** Profil tourné autour de l'axe Y (points [rayon, y]). */
  lathe(part: number, mat: MatKey, pts: [number, number][], pos: V3, rot?: V3, seg = 24): void {
    this.add(part, mat, new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg), pos, rot);
  }

  /** Forme du plan XY extrudée selon Z, centrée sur z. */
  extrude(part: number, mat: MatKey, shape: THREE.Shape, depth: number, pos: V3 = [0, 0, 0], rot?: V3, bevel = 0.025, curve = 12): void {
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: Math.max(0.001, depth - 2 * bevel),
      bevelEnabled: bevel > 0,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 2,
      curveSegments: curve,
    });
    g.translate(0, 0, -(depth - 2 * bevel) / 2);
    this.add(part, mat, g, pos, rot);
  }

  /** Forme vue de dessus (plan XZ, x vers l'avant, y du plan = z monde) extrudée vers le haut depuis y0. */
  slab(part: number, mat: MatKey, shape: THREE.Shape, height: number, y0: number, bevel = 0.025, curve = 14): void {
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: Math.max(0.001, height - 2 * bevel),
      bevelEnabled: bevel > 0,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 2,
      curveSegments: curve,
    });
    // le plan XY de la forme devient XZ ; l'extrusion (Z) devient la hauteur (Y)
    g.rotateX(-Math.PI / 2);
    g.translate(0, y0 + bevel, 0);
    this.add(part, mat, g, [0, 0, 0]);
  }

  /** Tuyau souple qui passe par des points (flexibles, câbles). */
  hose(part: number, mat: MatKey, pts: V3[], r: number, seg = 32): void {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
    this.add(part, mat, new THREE.TubeGeometry(curve, seg, r, 7, false));
  }

  /** Main courante / barre : segments droits et rotules aux angles. */
  rail(part: number, mat: MatKey, pts: V3[], r: number): void {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = new THREE.Vector3(...pts[i]);
      const b = new THREE.Vector3(...pts[i + 1]);
      const len = a.distanceTo(b);
      if (len < 1e-4) continue;
      const g = new THREE.CylinderGeometry(r, r, len, 8, 1, true);
      const q = new THREE.Quaternion().setFromUnitVectors(UP, b.clone().sub(a).normalize());
      g.applyQuaternion(q);
      const mid = a.clone().add(b).multiplyScalar(0.5);
      this.add(part, mat, g, [mid.x, mid.y, mid.z]);
    }
    for (const p of pts) this.sphere(part, mat, r * 1.05, p, 8);
  }

  /** Plaque de code (texture de la machine). */
  decal(part: number, w: number, h: number, pos: V3, ry: number): void {
    this.add(part, 'decal', new THREE.PlaneGeometry(w, h), pos, [0, ry, 0]);
  }

  /** Phare : boîtier sombre et optique éclairante, tournés vers dir (+x par défaut). */
  lamp(part: number, pos: V3, size = 0.12, ry = 0, round = false): void {
    if (round) {
      this.cyl(part, 'trim', size * 0.62, size * 0.5, pos, [0, ry, Math.PI / 2], 16);
      const c = Math.cos(ry);
      const s = Math.sin(ry);
      this.cyl(part, 'lamp', size * 0.5, 0.02, [pos[0] + c * size * 0.26, pos[1], pos[2] - s * size * 0.26], [0, ry, Math.PI / 2], 16);
    } else {
      this.rbox(part, 'trim', [size * 0.7, size * 0.75, size * 1.25], size * 0.12, pos, [0, ry, 0], 2);
      const c = Math.cos(ry);
      const s = Math.sin(ry);
      this.rbox(part, 'lamp', [0.03, size * 0.55, size * 1.05], 0.01, [pos[0] + c * size * 0.36, pos[1], pos[2] - s * size * 0.36], [0, ry, 0], 1);
    }
  }

  /** Gyrophare orange sur son socle. */
  beacon(part: number, pos: V3, r = 0.085): void {
    this.cyl(part, 'trim', [r * 0.95, r * 1.05], 0.05, pos, undefined, 16);
    this.cyl(part, 'beacon', [r * 0.78, r * 0.9], r * 0.9, [pos[0], pos[1] + 0.025 + r * 0.45, pos[2]], undefined, 16);
    this.sphere(part, 'beacon', r * 0.78, [pos[0], pos[1] + 0.025 + r * 0.9, pos[2]], 16, true);
    this.beacons.push({ part, p: new THREE.Vector3(pos[0], pos[1] + r * 1.2, pos[2]) });
  }

  /** Rétroviseur sur son bras. side : ±1 (côté z). */
  mirror(part: number, base: V3, side: number, reach = 0.32, h = 0.24): void {
    const tip: V3 = [base[0] + 0.05, base[1] + 0.06, base[2] + side * reach];
    this.rail(part, 'trim', [base, [base[0] + 0.03, base[1] + 0.05, base[2] + side * reach * 0.6], tip], 0.012);
    this.rbox(part, 'trim', [0.05, h, 0.16], 0.02, [tip[0], tip[1] + h * 0.35, tip[2]], [0, side * 0.25, 0], 2);
    this.box(part, 'mirror', [0.008, h * 0.86, 0.14], [tip[0] - 0.028, tip[1] + h * 0.35, tip[2]], [0, side * 0.25, 0]);
  }

  /** Grille d'aération : lamelles horizontales sur une face (normale ±x ou ±z). */
  grille(part: number, center: V3, w: number, h: number, n: number, normal: 'x' | 'z', sign = 1): void {
    const slatH = (h / n) * 0.42;
    for (let i = 0; i < n; i++) {
      const y = center[1] - h / 2 + (i + 0.5) * (h / n);
      if (normal === 'x') this.box(part, 'black', [0.03, slatH, w], [center[0] + sign * 0.005, y, center[2]], [0, 0, sign * 0.35]);
      else this.box(part, 'black', [w, slatH, 0.03], [center[0], y, center[2] + sign * 0.005], [sign * 0.35, 0, 0]);
    }
  }

  piston(parent: number, a: [number, V3], b: [number, V3], rb = 0.1, rr = 0.055, barrel: MatKey = 'trim', rod: MatKey = 'chrome'): void {
    this.pistons.push({
      parent,
      a: { part: a[0], p: new THREE.Vector3(...a[1]) },
      b: { part: b[0], p: new THREE.Vector3(...b[1]) },
      rb,
      rr,
      barrel,
      rod,
    });
  }

  link(parent: number, a: [number, V3], b: [number, V3], w: number, d: number, mat: MatKey = 'trim', round = false): void {
    this.links.push({
      parent,
      a: { part: a[0], p: new THREE.Vector3(...a[1]) },
      b: { part: b[0], p: new THREE.Vector3(...b[1]) },
      w,
      d,
      mat,
      round,
    });
  }

  // ---------------------------------------------------------------- assemblage

  build(meta: TemplateMeta): MachineTemplate {
    const parts: TemplatePart[] = this.parts.map((p) => ({
      name: p.name,
      parent: p.parent,
      pos: p.pos.clone(),
      rot: p.rot.clone(),
      meshes: [...p.buckets].map(([mat, list]) => ({ mat, geo: merge(list) })),
    }));
    const rest: Pose = {};
    for (const j of this.joints) rest[j.name] = j.rest;

    // Pose de repos → matrices des pièces dans le repère du modèle.
    const objs = poseObjects(parts, this.joints, rest);
    const bake = new Map<MatKey, THREE.BufferGeometry[]>();
    const push = (m: MatKey, g: THREE.BufferGeometry) => {
      const mat = canonMat(m);
      const l = bake.get(mat);
      if (l) l.push(g);
      else bake.set(mat, [g]);
    };
    parts.forEach((p, i) => {
      for (const m of p.meshes) push(m.mat, m.geo.clone().applyMatrix4(objs[i].matrixWorld));
    });
    const bm = new THREE.Matrix4();
    const rm = new THREE.Matrix4();
    const inv = new THREE.Matrix4();
    for (const pd of this.pistons) {
      const { a, b, len } = anchorsIn(objs, pd.parent, pd.a, pd.b, inv);
      if (!pistonMatrices(a, b, len, pd.rb, pd.rr, bm, rm)) continue;
      const pw = objs[pd.parent].matrixWorld;
      push(pd.barrel, normalizeGeometry(UNIT.barrel.clone()).applyMatrix4(bm.premultiply(pw)));
      push(pd.rod, normalizeGeometry(UNIT.rod.clone()).applyMatrix4(rm.premultiply(pw)));
    }
    for (const ld of this.links) {
      const { a, b } = anchorsIn(objs, ld.parent, ld.a, ld.b, inv);
      if (!linkMatrix(a, b, ld.w, ld.d, bm)) continue;
      push(ld.mat, normalizeGeometry((ld.round ? UNIT.cyl : UNIT.box).clone()).applyMatrix4(bm.premultiply(objs[ld.parent].matrixWorld)));
    }
    const baked = [...bake].map(([mat, list]) => ({ mat, geo: merge(list) }));

    // Emprise : boîte englobante, centrage horizontal et rayon réel autour de l'axe.
    const box = new THREE.Box3();
    for (const b of baked) {
      b.geo.computeBoundingBox();
      if (b.geo.boundingBox) box.union(b.geo.boundingBox);
    }
    const cx = (box.min.x + box.max.x) / 2;
    const cz = (box.min.z + box.max.z) / 2;
    let r2 = 0;
    for (const b of baked) {
      const pos = b.geo.getAttribute('position');
      for (let i = 0; i < pos.count; i++) {
        const dx = pos.getX(i) - cx;
        const dz = pos.getZ(i) - cz;
        const d2 = dx * dx + dz * dz;
        if (d2 > r2) r2 = d2;
      }
    }
    const offset = new THREE.Vector3(-cx, -Math.min(0, box.min.y), -cz);
    const bounds = box.clone().translate(offset);
    const beacons = this.beacons.map((anchor) => ({
      anchor,
      rest: anchor.p.clone().applyMatrix4(objs[anchor.part].matrixWorld).add(offset),
    }));

    return {
      ...meta,
      key: this.key,
      parts,
      joints: this.joints,
      pistons: this.pistons,
      links: this.links,
      rest,
      baked,
      offset,
      radius: Math.sqrt(r2),
      height: bounds.max.y,
      footprint: { w: box.max.x - box.min.x, d: box.max.z - box.min.z },
      bounds,
      beacons,
    };
  }
}

/** Construit la hiérarchie des pièces dans une pose donnée (matrices à jour). */
export function poseObjects(parts: TemplatePart[], joints: JointDef[], pose: Pose): THREE.Object3D[] {
  const root = new THREE.Group();
  const objs = parts.map((p) => {
    const o = new THREE.Object3D();
    o.position.copy(p.pos);
    o.rotation.copy(p.rot);
    return o;
  });
  parts.forEach((p, i) => (p.parent >= 0 ? objs[p.parent] : root).add(objs[i]));
  applyJoints(objs, parts, joints, pose);
  root.updateMatrixWorld(true);
  return objs;
}

/** Applique les valeurs des liaisons (rotation ou translation ajoutée à la position de base). */
export function applyJoints(objs: THREE.Object3D[], parts: TemplatePart[], joints: JointDef[], pose: Pose): void {
  for (const j of joints) {
    const v = pose[j.name] ?? j.rest;
    const o = objs[j.part];
    const base = parts[j.part];
    switch (j.kind) {
      case 'rx':
        o.rotation.x = base.rot.x + v;
        break;
      case 'ry':
        o.rotation.y = base.rot.y + v;
        break;
      case 'rz':
        o.rotation.z = base.rot.z + v;
        break;
      case 'tx':
        o.position.x = base.pos.x + v;
        break;
      case 'ty':
        o.position.y = base.pos.y + v;
        break;
      case 'tz':
        o.position.z = base.pos.z + v;
        break;
    }
  }
}

const _wa = new THREE.Vector3();
const _wb = new THREE.Vector3();
const _restLen = new WeakMap<object, number>();

/** Points d'ancrage d'un vérin dans le repère de son parent, et longueur au repos (mémorisée). */
export function anchorsIn(
  objs: THREE.Object3D[],
  parent: number,
  A: Anchor,
  B: Anchor,
  inv: THREE.Matrix4,
): { a: THREE.Vector3; b: THREE.Vector3; len: number } {
  _wa.copy(A.p).applyMatrix4(objs[A.part].matrixWorld);
  _wb.copy(B.p).applyMatrix4(objs[B.part].matrixWorld);
  inv.copy(objs[parent].matrixWorld).invert();
  _wa.applyMatrix4(inv);
  _wb.applyMatrix4(inv);
  let len = _restLen.get(A);
  if (len === undefined) {
    len = _wa.distanceTo(_wb);
    _restLen.set(A, len);
  }
  return { a: _wa, b: _wb, len };
}

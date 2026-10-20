// Camion malaxeur quatre essieux (8×4, ≈ 32 t chargé) : porteur de chantier à cabine courte avancée, toupie de
// 9 m³ inclinée de 13° (classe Liebherr HTM 905 / Stetter AM 9 C), bandes hélicoïdales peintes, trémie de
// chargement, goulotte orientable, réservoir d'eau, échelle et plate-forme arrière.
// Longueur 9,9 m (goulotte comprise), largeur 2,5 m (toupie Ø 2,34 m), hauteur 4,0 m (trémie).
import * as THREE from 'three';
import { Kit, softPolygon, type MachineTemplate, type MatKey, type V3 } from './kit';
import { TRUCK, bar, strut, truckChassis } from './camionGrue';

/** Inclinaison de la toupie (montant vers l'arrière). */
const ALPHA = 0.23;
/** Centre de la face avant de la toupie (bride du réducteur), dans le repère du porteur. */
const FX = 1.55;
const FY = 2.2;
/** Profil de la toupie : [rayon, abscisse u sur l'axe depuis la face avant]. Poire : fond bombé, virole, cône arrière. */
const DRUM: [number, number][] = [
  [0, 0],
  [0.3, 0],
  [0.55, 0.06],
  [0.85, 0.22],
  [1.05, 0.45],
  [1.14, 0.75],
  [1.17, 1.05],
  [1.17, 1.65],
  [1.13, 2.05],
  [1.03, 2.6],
  [0.88, 3.2],
  [0.72, 3.8],
  [0.58, 4.35],
  [0.47, 4.8],
  [0.43, 5.05],
  [0.42, 5.25],
];
const DL = 5.25;

/** Rayon de la toupie à l'abscisse u (interpolation du profil). */
function drumR(u: number): number {
  for (let i = 1; i < DRUM.length; i++) {
    const [r0, u0] = DRUM[i - 1];
    const [r1, u1] = DRUM[i];
    if (u <= u1 && u1 > u0) return r0 + ((r1 - r0) * (u - u0)) / (u1 - u0);
  }
  return DRUM[DRUM.length - 1][0];
}

/** Point de l'axe de la toupie (repère du porteur) à l'abscisse u. */
function axisAt(u: number): [number, number] {
  return [FX - Math.cos(ALPHA) * u, FY + Math.sin(ALPHA) * u];
}

/** Bande hélicoïdale peinte sur la toupie (repère du tour : axe y, comme un profil tourné), puis couchée sur z. */
function helixBand(k: Kit, part: number, mat: MatKey, u0: number, u1: number, pitch: number, phase: number, width: number): void {
  const n = 150;
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= n; i++) {
    const u = u0 + ((u1 - u0) * i) / n;
    const a = phase + (2 * Math.PI * (u - u0)) / pitch;
    for (const e of [-width / 2, width / 2]) {
      const r = drumR(u + e) + 0.012;
      pos.push(r * Math.sin(a), u + e, r * Math.cos(a));
    }
    if (i < n) {
      const j = 2 * i;
      idx.push(j, j + 2, j + 1, j + 1, j + 2, j + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  g.rotateX(Math.PI / 2);
  k.add(part, mat, g);
}

export function buildCamionMalaxeur(): MachineTemplate {
  const k = new Kit('camion_malaxeur');
  const chassis = k.part('chassis', 0, [0, 0, 0]);
  truckChassis(k, chassis, {
    front: [2.95, 1.1],
    rear: [-2.25, -3.6],
    tail: -4.9,
    guards: [[-1.66, -0.5]],
    tank: [-0.4, 0.42],
    batteryX: 0.0,
    stackX: 2.22,
  });
  const { frameTop: FT } = TRUCK;
  const SUB = FT + 0.14; // dessus du faux-châssis
  const ca = Math.cos(ALPHA);
  const sa = Math.sin(ALPHA);
  /** Rotation qui couche un cylindre (axe y) le long de l'axe de la toupie. */
  const ALONG: V3 = [0, 0, Math.PI / 2 - ALPHA];

  // ---------------------------------------------------------------- faux-châssis et bâti avant
  for (const s of [-1, 1]) k.box(chassis, 'trim', [7.1, 0.14, 0.1], [-1.3, FT + 0.07, s * 0.43]);
  const front = softPolygon(
    [
      [1.38, SUB],
      [2.18, SUB],
      [2.1, 1.95],
      [1.86, 2.1],
      [1.5, 2.1],
    ],
    0.06,
  );
  for (const s of [-1, 1]) k.extrude(chassis, 'trim', front, 0.08, [0, 0, s * 0.38], undefined, 0.012, 4);
  k.box(chassis, 'trim', [0.5, 0.08, 0.84], [1.8, SUB + 0.04, 0]);
  // réducteur (bride sur la toupie) et moteur hydraulique, dans l'axe
  {
    const [gx, gy] = axisAt(-0.16);
    k.cyl(chassis, 'steelDark', 0.28, 0.32, [gx, gy, 0], ALONG, 20);
    const [mx, my] = axisAt(-0.42);
    k.cyl(chassis, 'trim', 0.13, 0.22, [mx, my, 0], ALONG, 12);
    k.cyl(chassis, 'steelDark', [0.3, 0.3], 0.04, [gx - 0.15 * ca, gy + 0.15 * sa, 0], ALONG, 20);
  }
  // réservoir d'eau sur le bâti avant, ses supports et sa jauge
  k.cylZ(chassis, 'paint', 0.32, 1.24, [1.97, 3.15, 0], 20);
  for (const s of [-1, 1]) {
    k.cylZ(chassis, 'trim', 0.335, 0.05, [1.97, 3.15, s * 0.5], 20);
    k.box(chassis, 'trim', [0.08, 0.8, 0.08], [1.97, 2.45, s * 0.42]);
  }
  k.cyl(chassis, 'black', 0.07, 0.06, [1.97, 3.49, 0.3], undefined, 10);
  k.box(chassis, 'steel', [0.02, 0.3, 0.05], [2.3, 3.15, -0.3]);
  // réservoir d'huile et flexibles d'entraînement
  k.box(chassis, 'trim', [0.3, 0.42, 0.34], [2.05, 1.5, 0.62]);
  for (const z of [0.12, 0.2]) k.hose(chassis, 'rubber', [[2.3, 1.05, z], [2.24, 1.5, z + 0.05], [2.08, 1.95, z]], 0.022, 10);

  // ---------------------------------------------------------------- toupie (tourne sur son axe incliné)
  // Repère de la toupie : axe z le long de l'axe incliné (liaison rz, appliquée en premier), origine sur la bride.
  const drum = k.part('drum', chassis, [FX, FY, 0], [-Math.PI / 2, ALPHA - Math.PI / 2, 0]);
  k.joint('spin', drum, 'rz', 0);
  const ON_AXIS: V3 = [Math.PI / 2, 0, 0];
  k.lathe(drum, 'paint', DRUM, [0, 0, 0], ON_AXIS, 40);
  helixBand(k, drum, 'trim', 0.55, 4.7, 1.95, 0, 0.18);
  helixBand(k, drum, 'trim', 0.55, 4.7, 1.95, Math.PI, 0.18);
  // chemin de roulement, cerclages, bouche (intérieur sombre)
  const ring = (u: number, w: number, h: number, mat: MatKey) => {
    const r = drumR(u);
    k.lathe(
      drum,
      mat,
      [
        [r - 0.01, u - w / 2],
        [r + h, u - w / 2],
        [r + h, u + w / 2],
        [r - 0.01, u + w / 2],
        [r - 0.01, u - w / 2],
      ],
      [0, 0, 0],
      ON_AXIS,
      32,
    );
  };
  ring(4.3, 0.14, 0.05, 'steel');
  ring(0.62, 0.05, 0.02, 'trim');
  ring(DL - 0.06, 0.12, 0.03, 'trim');
  k.cyl(drum, 'black', 0.4, 0.02, [0, 0, DL - 0.12], ON_AXIS, 20);
  // trou d'homme boulonné sur la virole
  {
    const a = 2.2;
    const r = drumR(1.35) + 0.015;
    k.rbox(drum, 'paint', [0.42, 0.04, 0.56], 0.04, [r * Math.sin(a), -r * Math.cos(a), 1.35], [0, 0, a], 1);
    for (const [dt, du] of [
      [-0.16, -0.22],
      [0.16, -0.22],
      [-0.16, 0.22],
      [0.16, 0.22],
    ]) {
      const t = a + dt / r;
      k.box(drum, 'steel', [0.04, 0.03, 0.04], [(r + 0.02) * Math.sin(t), -(r + 0.02) * Math.cos(t), 1.35 + du], [0, 0, t]);
    }
  }

  // ---------------------------------------------------------------- bâti arrière : galets, trémie, entonnoir
  // Cadre ouvert de chaque côté : montant avant (galets), jambe arrière inclinée (trémie), diagonale.
  for (const s of [-1, 1]) {
    const z = s * 0.56;
    strut(k, chassis, 'trim', [-2.5, SUB, z], [-2.74, 2.44, z], 0.14);
    strut(k, chassis, 'trim', [-3.42, SUB, z], [-4.2, 3.5, z], 0.14);
    strut(k, chassis, 'trim', [-2.74, 2.44, z], [-3.86, 3.5, z], 0.1);
    strut(k, chassis, 'trim', [-3.62, 3.56, z], [-4.3, 3.56, z], 0.1);
    k.box(chassis, 'trim', [1.1, 0.1, 0.12], [-2.95, SUB + 0.05, z]);
  }
  k.box(chassis, 'trim', [0.2, 0.12, 1.24], [-2.75, 2.42, 0]);
  k.box(chassis, 'trim', [0.14, 0.1, 1.24], [-3.95, 3.55, 0]);
  k.box(chassis, 'trim', [0.12, 0.1, 1.24], [-3.6, SUB + 0.45, 0]);
  // galets d'appui sous le chemin de roulement
  {
    const [cx, cy] = axisAt(4.3);
    const rr = drumR(4.3) + 0.05 + 0.11;
    for (const s of [-1, 1]) {
      const px = cx - rr * 0.82 * sa;
      const py = cy - rr * 0.82 * ca;
      k.cyl(chassis, 'steelDark', 0.11, 0.14, [px, py, s * rr * 0.57], ALONG, 14);
      k.box(chassis, 'trim', [0.24, py - 2.42, 0.1], [px, (py + 2.42) / 2, s * rr * 0.57]);
    }
  }
  // trémie de chargement (carrée, paroi épaisse), bec vers la bouche de la toupie
  const HX = -3.98;
  k.lathe(
    chassis,
    'paint',
    [
      [0.2, 3.62],
      [0.25, 3.62],
      [0.72, 3.94],
      [0.72, 4.0],
      [0.66, 4.0],
      [0.2, 3.66],
      [0.2, 3.62],
    ],
    [HX, 0, 0],
    [0, Math.PI / 4, 0],
    4,
  );
  {
    const [ox, oy] = axisAt(DL - 0.05);
    bar(k, chassis, 'paint', [HX, 3.66, 0], [ox - 0.05, oy + 0.05, 0], 0.17, 12);
  }
  // entonnoir de vidange et sa console
  k.lathe(
    chassis,
    'steelDark',
    [
      [0.15, 2.66],
      [0.18, 2.66],
      [0.36, 3.02],
      [0.33, 3.02],
      [0.13, 2.7],
      [0.15, 2.66],
    ],
    [-3.98, 0, 0],
    undefined,
    16,
  );
  for (const s of [-1, 1]) bar(k, chassis, 'trim', [-3.98, 2.9, s * 0.3], [-4.2, 3.4, s * 0.52], 0.03);
  // goulottes de rallonge rangées à plat sous la toupie (côté gauche), sur deux consoles
  const trough = (len: number, rad: number): THREE.ExtrudeGeometry => {
    const s = new THREE.Shape();
    s.absarc(0, 0, rad + 0.02, Math.PI, 2 * Math.PI, false);
    s.absarc(0, 0, rad, 2 * Math.PI, Math.PI, true);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false, curveSegments: 6 });
    g.rotateY(Math.PI / 2);
    return g;
  };
  for (let i = 0; i < 2; i++) k.add(chassis, 'steel', trough(1.05, 0.19 - i * 0.03), [-1.62 + i * 0.04, 1.62 - i * 0.02, -0.92]);
  for (const x of [-0.8, -1.45]) k.box(chassis, 'trim', [0.06, 0.06, 0.62], [x, SUB + 0.1, -0.78]);

  // ---------------------------------------------------------------- échelle, plate-forme et garde-corps (droite)
  const LX = -4.46;
  const PY = 3.22; // plate-forme
  for (const z of [0.66, 1.06]) k.box(chassis, 'trim', [0.05, PY - 0.4, 0.05], [LX, (PY + 0.4) / 2, z]);
  for (let y = 0.6; y < PY - 0.1; y += 0.3) k.box(chassis, 'black', [0.04, 0.035, 0.4], [LX, y, 0.86]);
  k.box(chassis, 'trim', [0.8, 0.04, 0.5], [-4.02, PY, 0.86]);
  for (const z of [0.66, 1.06]) k.box(chassis, 'trim', [0.05, 0.74, 0.05], [LX, PY + 0.37, z]);
  bar(k, chassis, 'trim', [LX, PY + 0.74, 1.06], [-3.62, PY + 0.74, 1.06], 0.022);
  bar(k, chassis, 'trim', [-3.62, PY + 0.74, 1.06], [-3.62, PY, 1.06], 0.022);
  bar(k, chassis, 'trim', [LX, PY + 0.38, 1.06], [-3.62, PY + 0.38, 1.06], 0.018);
  bar(k, chassis, 'trim', [-3.62, PY, 0.66], [-3.4, SUB + 0.4, 0.62], 0.03);
  k.box(chassis, 'trim', [0.05, 0.05, 0.2], [LX, 1.0, 0.56]);
  // pupitre de commande arrière (gauche), enrouleur du tuyau d'eau (droite), feux de travail
  k.box(chassis, 'trim', [0.12, 0.3, 0.36], [-3.5, 1.75, -0.9]);
  k.box(chassis, 'trim', [0.06, 0.06, 0.12], [-3.55, 1.75, -0.66]);
  for (let i = 0; i < 3; i++) bar(k, chassis, 'black', [-3.57, 1.72, -0.98 + i * 0.08], [-3.68, 1.82, -0.98 + i * 0.08], 0.01, 5);
  k.torus(chassis, 'rubber', 0.24, 0.045, [-2.7, 1.72, 0.92], undefined, [6, 20]);
  k.cylZ(chassis, 'steel', 0.07, 0.16, [-2.7, 1.72, 0.92], 10);
  k.cylZ(chassis, 'steel', 0.03, 0.3, [-2.7, 1.72, 0.7], 8);
  for (const s of [-1, 1]) k.box(chassis, 'lamp', [0.03, 0.08, 0.14], [-4.29, 3.5, s * 0.56]);

  // ---------------------------------------------------------------- goulotte orientable
  // Repère retourné (π autour de y) : x vers l'arrière ; orientation négative = vers la gauche (z−).
  const chute = k.part('chute', chassis, [-3.98, 2.6, 0], [0, Math.PI, 0]);
  k.joint('chute', chute, 'ry', 0);
  k.cyl(chute, 'steelDark', 0.17, 0.08, [0, 0.02, 0], undefined, 16);
  k.box(chute, 'trim', [0.24, 0.1, 0.5], [0.08, -0.06, 0]);
  const tilt = k.part('chuteTilt', chute, [0.12, -0.08, 0], [0, 0, -0.3]);
  k.joint('chuteTilt', tilt, 'rz', 0);
  k.add(tilt, 'steel', trough(1.42, 0.22), [0.02, 0.22, 0]);
  k.box(tilt, 'trim', [0.06, 0.1, 0.5], [0.04, 0.12, 0]);
  k.box(tilt, 'trim', [0.05, 0.04, 0.5], [1.42, 0.0, 0]);
  k.piston(chute, [chute, [-0.05, 0.3, 0]], [tilt, [0.7, 0.26, 0]], 0.04, 0.025);

  return k.build({
    refWeight: 32,
    minScale: 0.9,
    maxScale: 1.06,
    wake: [
      { pose: { spin: 2.6 }, dur: 1.8 },
      { pose: { spin: 5.2, chute: -1.15, chuteTilt: -0.22 }, dur: 1.8 },
      { pose: { spin: 3.6 }, dur: 1.4 },
      { pose: { spin: 0, chute: 0, chuteTilt: 0 }, dur: 2.2 },
    ],
    nod: [
      { pose: { spin: 0.9 }, dur: 0.5 },
      { pose: { spin: 0 }, dur: 0.55 },
    ],
    breathe: { spin: 0.08 },
  });
}

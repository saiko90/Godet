// Nacelle télescopique automotrice (≈ 10,5 t, classe Genie S-65 / JLG 660SJ : hauteur de travail 22 m, déport
// 17 m) : châssis tout-terrain à quatre roues, tourelle avec capots latéraux et gros contrepoids arrière, flèche
// droite à trois éléments (base, intermédiaire, volée) articulée en haut de la tourelle et posée sur un
// repose-flèche à l'avant, pendulaire (jib) replié vers le bas et panier de 2,44 m sur rotateur, gardé horizontal
// en toute position.
// Gabarit replié : 9,2 m × 2,49 m × 2,65 m, empattement 2,53 m, garde au sol 0,37 m.
// Panier : « level » = −(boom + jib).
import * as THREE from 'three';
import { Kit, roundedRect, softPolygon, type MachineTemplate, type V3 } from './kit';
import { wheel } from './parts';

const R = 0.51; // pneus 355/55 D625
const TW = 0.355;
const ZW = 1.07; // demi-voie
const XA = 1.265; // demi-empattement
const TURRET_Y = 1.06; // dessus de la couronne d'orientation
const PIVOT: [number, number] = [-1.35, 1.25]; // axe de flèche (repère tourelle)
const BOOM0 = -0.045; // flèche posée, légèrement inclinée vers l'avant
const LB = 6.45; // de l'axe de flèche à l'axe du pendulaire (flèche rentrée)
const LJ = 1.35; // pendulaire
const JIB0 = -1.0; // pendulaire replié vers le bas
const FLOOR = -0.45; // plancher du panier sous l'axe du rotateur
const RAIL = 1.1;

/** Tube droit entre deux points (lisses de garde-corps). */
function bar(k: Kit, part: number, a: V3, b: V3, r: number): void {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const g = new THREE.CylinderGeometry(r, r, va.distanceTo(vb), 8, 1, true);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize()));
  const m = va.add(vb).multiplyScalar(0.5);
  k.add(part, 'steel', g, [m.x, m.y, m.z]);
}

/** Angle du panier qui le garde horizontal. */
const basket = (boom: number, jib: number) => -(boom + jib);

export function buildNacelleTelescopique(): MachineTemplate {
  const k = new Kit('nacelle_telescopique');

  // ---------------------------------------------------------------- châssis
  const chassis = k.part('chassis', 0, [0, 0, 0]);
  // profil réduit de l'arrondi (0,04) : faces finies de y = 0,42 à 1,0 et jusqu'à x = ±1,86
  const frame = softPolygon(
    [
      [-1.74, 0.46],
      [1.74, 0.46],
      [1.82, 0.62],
      [1.74, 0.96],
      [-1.74, 0.96],
      [-1.82, 0.62],
    ],
    0.08,
  );
  k.extrude(chassis, 'paint', frame, 1.4, [0, 0, 0], undefined, 0.04, 8);
  k.box(chassis, 'steelDark', [3.3, 0.08, 1.2], [0, 0.4, 0]);
  k.box(chassis, 'trim', [3.4, 0.02, 1.32], [0, 1.005, 0]);
  k.cyl(chassis, 'black', [0.9, 0.92], 0.06, [0, TURRET_Y - 0.03, 0], undefined, 36);
  for (const x of [-XA, XA]) {
    k.cylZ(chassis, 'steelDark', 0.11, 2 * ZW - 0.3, [x, R, 0], 14);
    k.rbox(chassis, 'steelDark', [0.4, 0.34, 0.5], 0.05, [x, R, 0], undefined, 1);
    for (const s of [-1, 1]) {
      k.cylZ(chassis, 'steelDark', 0.2, 0.18, [x, R, s * (ZW - 0.3)], 16);
      wheel(k, chassis, [x, R, s * ZW], R, TW, { side: s, rim: 'paint', tread: 'lug' });
    }
  }
  // pare-chocs, anneaux d'arrimage, feux, repose-flèche avant
  for (const sx of [-1, 1]) {
    k.rbox(chassis, 'trim', [0.12, 0.24, 1.3], 0.04, [sx * 1.9, 0.62, 0], undefined, 1);
    for (const s of [-1, 1]) {
      k.torus(chassis, 'steel', 0.05, 0.015, [sx * 1.97, 0.5, s * 0.48], [0, Math.PI / 2, 0], [6, 12]);
      if (sx > 0) k.lamp(chassis, [1.99, 0.64, s * 0.45], 0.1);
      else k.rbox(chassis, 'tail', [0.03, 0.09, 0.16], 0.012, [-1.965, 0.64, s * 0.45], undefined, 1);
    }
  }
  k.rbox(chassis, 'trim', [0.14, 0.84, 0.14], 0.03, [1.6, 1.42, 0], undefined, 1);
  k.rbox(chassis, 'trim', [0.3, 0.06, 0.5], 0.02, [1.6, 1.86, 0], undefined, 1);
  k.box(chassis, 'rubber', [0.26, 0.04, 0.46], [1.6, 1.905, 0]);

  // ---------------------------------------------------------------- tourelle
  const turret = k.part('turret', chassis, [0, TURRET_Y, 0]);
  k.joint('slew', turret, 'ry', 0);
  k.cyl(turret, 'trim', 0.86, 0.1, [0, 0.05, 0], undefined, 36);
  k.rbox(turret, 'trim', [3.3, 0.16, 0.62], 0.03, [-0.55, 0.12, 0], undefined, 1);
  // capots latéraux : moteur à droite (grilles, échappement), réservoirs à gauche (pupitre au sol)
  for (const s of [-1, 1]) {
    // vu de dessus, y de la forme = −z ; contour réduit de l'arrondi (0,04) : faces finies de |z| = 0,3 à 1,05
    k.slab(turret, 'paint', roundedRect(-1.46, s > 0 ? -1.01 : 0.34, 0.58, s > 0 ? -0.34 : 1.01, 0.06, 0.2), 0.9, 0.04, 0.04, 8);
    k.decal(turret, 0.6, 0.15, [-0.55, 0.55, s * 1.053], s > 0 ? 0 : Math.PI);
    k.box(turret, 'black', [0.012, 0.7, 0.012], [0.05, 0.5, s * 1.052]);
  }
  k.grille(turret, [0.32, 0.5, 1.052], 0.4, 0.4, 5, 'z', 1);
  for (let i = 0; i < 6; i++) k.box(turret, 'black', [0.06, 0.012, 0.5], [-1.2 + i * 0.13, 0.945, 0.68]);
  k.cyl(turret, 'trim', 0.05, 0.22, [-0.25, 1.04, 0.85], undefined, 12);
  k.cyl(turret, 'chrome', 0.055, 0.06, [-0.25, 1.17, 0.85], undefined, 12);
  k.rbox(turret, 'trim', [0.42, 0.32, 0.06], 0.02, [-0.2, 0.55, -1.08], undefined, 1);
  k.cyl(turret, 'tail', 0.035, 0.04, [-0.3, 0.6, -1.12], [Math.PI / 2, 0, 0], 12);
  k.box(turret, 'steel', [0.04, 0.04, 0.03], [-0.1, 0.6, -1.12]);
  k.cyl(turret, 'steel', 0.05, 0.05, [-0.9, 0.95, -0.7], undefined, 12); // bouchon de réservoir
  // contrepoids arrière (débord en rotation), feux et gyrophare
  k.slab(turret, 'paint', roundedRect(-2.25, -1.0, -1.5, 1.0, 0.38, 0.03), 1.08, 0.0, 0.05, 12);
  k.slab(turret, 'trim', roundedRect(-2.32, -1.07, -1.44, 1.07, 0.43, 0.04), 0.08, 0.02, 0.0, 12);
  k.grille(turret, [-2.31, 0.62, 0], 0.7, 0.3, 4, 'x', -1);
  k.beacon(turret, [-1.75, 1.08, -0.7], 0.08);
  // flasques de pied de flèche et chape du vérin de levage
  for (const s of [-1, 1]) {
    const plate = softPolygon(
      [
        [-1.82, 0.1],
        [-0.86, 0.1],
        [-1.0, 1.08],
        [-1.2, 1.46],
        [-1.52, 1.46],
        [-1.82, 1.12],
      ],
      0.1,
    );
    k.extrude(turret, 'paint', plate, 0.06, [0, 0, s * 0.27], undefined, 0.012, 8);
    k.box(turret, 'trim', [0.24, 0.24, 0.05], [1.0, 0.18, s * 0.15]);
  }
  k.cylZ(turret, 'steel', 0.08, 0.66, [PIVOT[0], PIVOT[1], 0], 12);
  k.cylZ(turret, 'steel', 0.05, 0.36, [1.0, 0.18, 0], 10);

  // ---------------------------------------------------------------- flèche à trois éléments
  const boom = k.part('boom', turret, [PIVOT[0], PIVOT[1], 0]);
  k.joint('boom', boom, 'rz', BOOM0);
  k.rbox(boom, 'paint', [6.05, 0.5, 0.42], 0.05, [2.675, 0, 0], undefined, 2);
  k.cylZ(boom, 'trim', 0.21, 0.46, [0, 0, 0], 18);
  k.box(boom, 'trim', [0.06, 0.51, 0.43], [5.68, 0, 0]);
  k.rbox(boom, 'trim', [0.34, 0.12, 0.26], 0.03, [1.2, -0.29, 0], undefined, 1);
  // chemin de câbles et flexibles sur le flanc droit
  k.rbox(boom, 'black', [4.6, 0.1, 0.06], 0.02, [2.85, 0.1, 0.24], undefined, 1);
  for (const dy of [-0.02, 0.05]) k.hose(boom, 'rubber', [[0.25, dy - 0.05, 0.235], [1.5, dy, 0.24], [3.5, dy, 0.24], [5.4, dy, 0.235]], 0.02, 24);
  for (const s of [-1, 1]) k.decal(boom, 0.8, 0.2, [3.3, -0.08, s * 0.213], s > 0 ? 0 : Math.PI);

  const tele1 = k.part('tele1', boom, [0, 0, 0]);
  k.joint('tele1', tele1, 'tx', 0);
  k.rbox(tele1, 'paint', [5.7, 0.42, 0.34], 0.045, [3.15, 0, 0], undefined, 2);
  k.box(tele1, 'trim', [0.05, 0.43, 0.35], [5.98, 0, 0]);
  for (const s of [-1, 1]) k.box(tele1, 'black', [0.14, 0.1, 0.02], [5.86, 0.1, s * 0.175]);

  const tele2 = k.part('tele2', tele1, [0, 0, 0]);
  k.joint('tele2', tele2, 'tx', 0);
  k.rbox(tele2, 'paint', [5.6, 0.34, 0.27], 0.04, [3.5, 0, 0], undefined, 2);
  k.rbox(tele2, 'trim', [0.28, 0.4, 0.3], 0.04, [LB - 0.08, -0.04, 0], undefined, 1);
  k.cylZ(tele2, 'steel', 0.05, 0.38, [LB, -0.05, 0], 10);
  k.box(tele2, 'trim', [0.14, 0.08, 0.14], [5.9, -0.2, 0]);

  // ---------------------------------------------------------------- pendulaire, rotateur et panier
  const jib = k.part('jib', tele2, [LB, -0.05, 0]);
  k.joint('jib', jib, 'rz', JIB0);
  k.rbox(jib, 'paint', [LJ + 0.14, 0.2, 0.22], 0.04, [LJ / 2, 0, 0], undefined, 2);
  k.box(jib, 'trim', [0.12, 0.06, 0.12], [0.35, -0.13, 0]);
  k.cylZ(jib, 'steel', 0.045, 0.32, [LJ, 0, 0], 10);

  const bkt = k.part('basket', jib, [LJ, 0, 0]);
  k.joint('level', bkt, 'rz', basket(BOOM0, JIB0));
  k.cyl(bkt, 'trim', 0.12, 0.42, [0.02, -0.12, 0], undefined, 16);
  const cage = k.part('cage', bkt, [0.02, 0, 0]);
  k.joint('rotate', cage, 'ry', 0);
  k.box(cage, 'trim', [0.24, 0.12, 0.34], [0.12, -0.36, 0]);
  const px0 = 0.14;
  const px1 = 1.05;
  const pz = 1.22;
  k.rbox(cage, 'paint', [px1 - px0, 0.08, 2 * pz], 0.02, [(px0 + px1) / 2, FLOOR - 0.04, 0], undefined, 1);
  k.box(cage, 'trim', [px1 - px0 - 0.04, 0.012, 2 * pz - 0.04], [(px0 + px1) / 2, FLOOR + 0.002, 0]);
  for (const s of [-1, 1]) {
    k.box(cage, 'paint', [px1 - px0, 0.15, 0.02], [(px0 + px1) / 2, FLOOR + 0.075, s * (pz - 0.01)]);
    k.box(cage, 'paint', [0.02, 0.15, 2 * pz], [s > 0 ? px1 - 0.01 : px0 + 0.01, FLOOR + 0.075, 0]);
  }
  const rx0 = px0 + 0.03;
  const rx1 = px1 - 0.03;
  const rz = pz - 0.03;
  const ring: [number, number][] = [
    [rx0, -rz],
    [rx1, -rz],
    [rx1, -rz / 3],
    [rx1, rz / 3],
    [rx1, rz],
    [rx0, rz],
    [rx0, rz / 3],
    [rx0, -rz / 3],
    [rx0, -rz],
  ];
  for (let i = 0; i < ring.length - 1; i++) {
    const [x, z] = ring[i];
    const [nx, nz] = ring[i + 1];
    k.cyl(cage, 'steel', 0.022, RAIL + 0.022, [x, FLOOR + RAIL / 2 + 0.011, z], undefined, 8);
    k.sphere(cage, 'steel', 0.024, [x, FLOOR + RAIL + 0.022, z], 8);
    bar(k, cage, [x, FLOOR + RAIL, z], [nx, FLOOR + RAIL, nz], 0.022);
    bar(k, cage, [x, FLOOR + RAIL * 0.52, z], [nx, FLOOR + RAIL * 0.52, nz], 0.018);
  }
  // pupitre de commande sur la lisse avant, pédale, projecteur de travail
  k.rbox(cage, 'trim', [0.14, 0.26, 0.5], 0.03, [rx1 - 0.08, FLOOR + RAIL - 0.12, -0.5], undefined, 2);
  k.box(cage, 'black', [0.1, 0.02, 0.44], [rx1 - 0.12, FLOOR + RAIL + 0.01, -0.5]);
  k.cyl(cage, 'black', 0.012, 0.09, [rx1 - 0.12, FLOOR + RAIL + 0.06, -0.64], undefined, 8);
  k.sphere(cage, 'black', 0.024, [rx1 - 0.12, FLOOR + RAIL + 0.11, -0.64], 10);
  k.cyl(cage, 'tail', 0.028, 0.03, [rx1 - 0.12, FLOOR + RAIL + 0.03, -0.34], undefined, 12);
  k.rbox(cage, 'black', [0.3, 0.06, 0.22], 0.02, [0.5, FLOOR + 0.03, -0.5], undefined, 1);
  k.lamp(cage, [rx1 + 0.04, FLOOR + RAIL - 0.1, 0.6], 0.1);

  // ---------------------------------------------------------------- vérins
  k.piston(turret, [turret, [1.0, 0.18, 0]], [boom, [1.2, -0.33, 0]], 0.13, 0.08);
  k.piston(tele2, [tele2, [5.9, -0.2, 0]], [jib, [0.35, -0.13, 0]], 0.06, 0.038);

  return k.build({
    refWeight: 10.5,
    minScale: 0.85,
    maxScale: 1.15,
    wake: [
      { pose: { boom: 0.45, jib: -0.2, level: basket(0.45, -0.2) }, dur: 1.7 },
      { pose: { tele1: 1.6, tele2: 1.6, jib: 0.2, level: basket(0.45, 0.2) }, dur: 1.6 },
      { pose: { slew: -0.4, rotate: -0.45 }, dur: 1.3 },
      { pose: { slew: 0, rotate: 0, tele1: 0, tele2: 0 }, dur: 1.6 },
      { pose: { boom: BOOM0, jib: JIB0, level: basket(BOOM0, JIB0) }, dur: 1.6 },
    ],
    nod: [
      { pose: { jib: JIB0 + 0.12, level: basket(BOOM0, JIB0 + 0.12) }, dur: 0.45 },
      { pose: { jib: JIB0, level: basket(BOOM0, JIB0) }, dur: 0.5 },
    ],
    breathe: { jib: 0.006, level: -0.006 },
  });
}

// Bulldozer (≈ 20 t, gabarit d'un CAT D6 ou d'un Komatsu D61) : chenilles acier longues et basses, capot
// moteur à l'avant derrière une grille de radiateur massive, cabine ROPS à l'arrière, réservoir arrière ;
// lame semi-U (tablier incurvé, ailes rabattues, lame d'attaque et becs) sur bras de poussée extérieurs,
// deux vérins de levage et deux vérins d'inclinaison ; défonceuse arrière à parallélogramme et trois dents.
// Repères : chenilles de 3,4 m (2,6 m au sol), voie 1,9 m, lame de 3,3 m × 1,25 m, toit de cabine à 3,15 m.
import * as THREE from 'three';
import { Kit, beam2D, extrudeGeo, softPolygon, type MachineTemplate, type V3 } from './kit';
import { cabin, exhaust, ladder, track } from './parts';

const TL = 3.4; // longueur des chenilles (barbotin et roue folle compris)
const TR = 0.42; // rayon du barbotin et de la roue folle
const TW = 0.56; // largeur des patins
const TZ = 0.95; // demi-voie
// bras de poussée : tourillons sur les longerons, rotules sous le dos de la lame
const XT = -0.2;
const YT = 0.5;
const ZP = 1.36;
const XB = 2.45;
const YB = 0.32;
const BH = 1.27; // hauteur du tablier
const BC = 1.28; // demi-largeur de la partie droite du tablier (ailes au-delà, lame de 3,3 m)
const WING = 0.42; // largeur d'une aile
const WA = 0.42; // angle des ailes (rad)
// défonceuse : articulations du parallélogramme sur le bâti et sur le porte-dents (repos : relevée)
const L0: [number, number] = [-1.9, 0.5];
const L1: [number, number] = [-2.55, 0.68];
const U0: [number, number] = [-1.9, 0.95];
const U1: [number, number] = [-2.55, 1.13];

/** Profil du tablier (plan latéral, repère de la machine) : face avant concave, dos bombé. */
function moldboard(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(2.92, 0.02);
  s.quadraticCurveTo(2.5, 0.55, 2.78, BH);
  s.lineTo(2.68, BH + 0.02);
  s.quadraticCurveTo(2.38, 0.58, 2.8, 0.02);
  s.closePath();
  return s;
}

export function buildBulldozer(): MachineTemplate {
  const k = new Kit('bulldozer');

  // ---------------------------------------------------------------- train de chenilles et bâti
  const body = k.part('body', 0, [0, 0, 0]);
  for (const s of [-1, 1]) {
    track(k, body, { length: TL, radius: TR, cy: TR + 0.06, width: TW, z: s * TZ, rollers: 7 });
    // tourillon du bras de poussée, entre les brins de la chenille
    k.cylZ(body, 'steelDark', 0.13, 0.42, [XT, YT, s * (ZP - 0.2)], 16);
    // garde-boue (plateforme) au-dessus de la chenille, tôle antidérapante
    k.rbox(body, 'paint', [2.95, 0.06, 0.62], 0.02, [-0.1, 1.06, s * 0.94], undefined, 1);
    k.box(body, 'black', [2.8, 0.01, 0.52], [-0.12, 1.095, s * 0.94]);
    k.box(body, 'paint', [0.06, 0.16, 0.62], [1.42, 1.1, s * 0.94], [0, 0, -0.5]);
  }
  k.rbox(body, 'trim', [3.4, 0.6, 1.1], 0.05, [0.05, 0.75, 0], undefined, 1);
  // carter de protection sous le nez
  k.box(body, 'steelDark', [0.7, 0.06, 1.1], [1.62, 0.5, 0], [0, 0, 0.3]);

  // capot moteur (profil latéral extrudé sur la largeur), ouïes, plaque du code
  const hood = softPolygon(
    [
      [0.15, 1.04],
      [1.85, 1.04],
      [1.85, 1.9],
      [1.7, 1.99],
      [0.15, 2.16],
    ],
    0.08,
  );
  k.extrude(body, 'paint', hood, 1.2, [0, 0, 0], undefined, 0.03, 8);
  k.box(body, 'trim', [1.72, 0.06, 1.26], [0.98, 1.07, 0]);
  for (const s of [-1, 1]) {
    k.grille(body, [1.3, 1.5, s * 0.632], 0.5, 0.36, 5, 'z', s);
    k.decal(body, 0.62, 0.155, [0.62, 1.42, s * 0.632], s > 0 ? 0 : Math.PI);
  }
  for (let i = 0; i < 6; i++) k.box(body, 'black', [0.05, 0.015, 0.9], [0.55 + i * 0.13, 2.152 - i * 0.0143, 0], [0, 0, -0.11]);
  exhaust(k, body, [1.3, 2.03, 0.3], 0.58, 0.075);
  k.cyl(body, 'trim', 0.11, 0.26, [1.3, 2.15, -0.3], undefined, 16);
  k.cyl(body, 'black', 0.12, 0.07, [1.3, 2.31, -0.3], undefined, 16);

  // grille de radiateur massive (cadre peint, lamelles), phares, pattes des vérins de levage
  k.rbox(body, 'paint', [0.26, 1.3, 1.38], 0.05, [1.98, 1.41, 0], undefined, 2);
  k.box(body, 'black', [0.02, 1.02, 1.08], [2.11, 1.43, 0]);
  for (let i = 0; i < 10; i++) k.box(body, 'trim', [0.04, 0.035, 1.1], [2.13, 0.98 + i * 0.1, 0]);
  for (const z of [-0.36, 0, 0.36]) k.box(body, 'trim', [0.05, 1.04, 0.05], [2.135, 1.43, z]);
  for (const s of [-1, 1]) {
    k.lamp(body, [2.04, 2.12, s * 0.5], 0.12);
    k.rbox(body, 'trim', [0.3, 0.26, 0.12], 0.03, [1.78, 1.84, s * 0.74], undefined, 1);
    k.cylZ(body, 'steel', 0.05, 0.2, [1.74, 1.86, s * 0.78], 10);
  }

  // plateforme et cabine ROPS (montants renforcés), réservoir arrière, mains courantes, marchepied
  k.rbox(body, 'paint', [1.76, 0.3, 1.6], 0.04, [-0.62, 1.2, 0], undefined, 2);
  cabin(k, body, {
    x0: -1.42,
    x1: 0.18,
    y0: 1.34,
    h: 1.66,
    w: 1.5,
    zc: 0,
    lean: 0.06,
    leanBack: 0.04,
    roof: 'paint',
    frame: 'trim',
    post: 0.1,
    door: 'left',
    beacon: 'right',
    lights: 2,
    rearLights: 2,
  });
  k.mirror(body, [0.16, 2.3, -0.78], -1, 0.16);
  k.mirror(body, [0.16, 2.3, 0.78], 1, 0.16);
  k.rbox(body, 'paint', [0.42, 0.72, 1.7], 0.06, [-1.68, 1.41, 0], undefined, 2);
  for (const s of [-1, 1]) {
    k.rbox(body, 'tail', [0.04, 0.1, 0.18], 0.02, [-1.9, 1.62, s * 0.66], undefined, 1);
    k.lamp(body, [-1.88, 1.4, s * 0.66], 0.1, Math.PI);
    k.rail(body, 'trim', [[-1.2, 1.12, s * 1.2], [-1.2, 1.55, s * 1.2], [-0.2, 1.55, s * 1.2], [0.3, 1.12, s * 1.2]], 0.02);
  }
  k.rail(body, 'trim', [[-1.9, 1.5, -0.55], [-1.97, 1.6, -0.45], [-1.97, 1.6, 0.45], [-1.9, 1.5, 0.55]], 0.02);
  ladder(k, body, -1.62, -1.34, 0.36, 1.02, -1.32, 3);
  k.box(body, 'trim', [0.34, 0.04, 0.1], [-1.48, 1.02, -1.29]);

  // ---------------------------------------------------------------- bras de poussée et lame semi-U
  const arm = beam2D([0, 0], [(XB - XT) / 2, (YB - YT) / 2 + 0.05], [XB - XT, YB - YT], 0.13, 0.1, 0);
  const pushL = k.part('pushL', body, [XT, YT, -ZP]);
  k.joint('lift', pushL, 'rz', 0);
  // le bras droit est coaxial au gauche : pour incliner la lame (rotation autour de la rotule gauche), il pivote
  // d'un angle complémentaire (tiltArm ≈ −1,04 × tilt) afin que sa rotule suive le coin droit de la lame
  const pushR = k.part('pushR', pushL, [0, 0, 2 * ZP]);
  k.joint('tiltArm', pushR, 'rz', 0);
  const tiltAt: V3 = [1.95, YB - YT + 0.18, 0];
  for (const p of [pushL, pushR]) {
    k.extrude(p, 'paint', arm.shape, 0.16, [0, 0, 0], undefined, 0.02, 8);
    // flexible du vérin d'inclinaison le long du dessus du bras
    const hz = p === pushL ? -0.05 : 0.05;
    const pts: V3[] = [];
    for (const t of [0.08, 0.3, 0.52, 0.7]) {
      const e = arm.edge(t, 1, 0.025);
      pts.push([e.x, e.y, hz]);
    }
    k.hose(p, 'rubber', pts, 0.022, 16);
    k.cylZ(p, 'trim', 0.15, 0.24, [0, 0, 0], 16);
    k.sphere(p, 'steelDark', 0.12, [XB - XT, YB - YT, 0], 12);
    k.rbox(p, 'trim', [0.2, 0.12, 0.14], 0.03, [tiltAt[0], tiltAt[1] - 0.04, 0], undefined, 1);
  }

  const blade = k.part('blade', pushL, [XB - XT, YB - YT, 0]);
  k.joint('tilt', blade, 'rx', 0);
  // repère de la lame : origine sur la rotule gauche (x − XB, y − YB, z + ZP)
  const B = (x: number, y: number, z: number): V3 => [x - XB, y - YB, z + ZP];
  const prof = moldboard();
  const centre = extrudeGeo(prof, 2 * BC + 0.06, 0.012, 24);
  k.add(blade, 'paint', centre, B(0, 0, 0));
  // ailes rabattues vers l'avant (pivot vertical à x = 2.65 sur le bord du tablier) et flasques d'extrémité
  const side = new THREE.Shape([
    new THREE.Vector2(2.92, 0.02),
    new THREE.Vector2(2.66, 0.5),
    new THREE.Vector2(2.78, BH),
    new THREE.Vector2(2.5, BH),
    new THREE.Vector2(2.4, 0.5),
    new THREE.Vector2(2.6, 0.02),
  ]);
  for (const s of [-1, 1]) {
    const wing = extrudeGeo(prof, WING, 0.012, 24);
    wing.translate(-2.65, 0, s * (WING / 2));
    wing.rotateY(s * WA);
    k.add(blade, 'paint', wing, B(2.65, 0, s * BC));
    const plate = extrudeGeo(side, 0.04, 0.01, 4);
    plate.translate(-2.65, 0, s * WING);
    plate.rotateY(s * WA);
    k.add(blade, 'paint', plate, B(2.65, 0, s * BC));
    // lame d'attaque de l'aile et bec d'angle
    const edge = new THREE.BoxGeometry(0.12, 0.06, WING);
    edge.rotateZ(0.35);
    edge.translate(2.88 - 2.65, 0.05, s * (WING / 2));
    edge.rotateY(s * WA);
    k.add(blade, 'steel', edge, B(2.65, 0, s * BC));
    const bit = new THREE.BoxGeometry(0.2, 0.1, 0.1);
    bit.translate(2.86 - 2.65, 0.06, s * (WING - 0.05));
    bit.rotateY(s * WA);
    k.add(blade, 'steel', bit, B(2.65, 0, s * BC));
  }
  // lame d'attaque centrale (segments boulonnés)
  for (let i = 0; i < 3; i++) {
    const z = -BC + ((i + 0.5) * 2 * BC) / 3;
    k.box(blade, 'steel', [0.12, 0.06, (2 * BC) / 3 - 0.02], B(2.88, 0.05, z), [0, 0, 0.35]);
  }
  // dos : poutres horizontales, nervures, chapes des vérins et des rotules
  k.rbox(blade, 'paint', [0.2, 0.2, 2 * BC + 0.1], 0.03, B(2.54, 0.32, 0), undefined, 1);
  k.rbox(blade, 'paint', [0.17, 0.18, 2 * BC], 0.03, B(2.5, 1.01, 0), undefined, 1);
  for (const z of [-1.0, -0.45, 0.45, 1.0]) k.box(blade, 'paint', [0.16, 0.72, 0.05], B(2.52, 0.66, z), [0, 0, -0.1]);
  for (const s of [-1, 1]) {
    k.box(blade, 'trim', [0.18, 0.2, 0.14], B(2.47, 0.7, s * 0.8));
    k.box(blade, 'trim', [0.26, 0.16, 0.12], B(2.5, 1.1, s * ZP));
    k.box(blade, 'trim', [0.3, 0.24, 0.2], B(2.52, YB, s * ZP));
  }

  // vérins de levage (sur la grille de radiateur) et d'inclinaison (bras → haut de la lame)
  for (const s of [-1, 1]) {
    k.piston(body, [body, [1.74, 1.86, s * 0.8]], [blade, B(2.42, 0.7, s * 0.8)], 0.1, 0.06);
    k.piston(s < 0 ? pushL : pushR, [s < 0 ? pushL : pushR, tiltAt], [blade, B(2.42, 1.1, s * ZP)], 0.085, 0.05);
  }

  // ---------------------------------------------------------------- défonceuse arrière (parallélogramme)
  k.rbox(body, 'trim', [0.32, 0.78, 1.3], 0.04, [-1.8, 0.76, 0], undefined, 1);
  const ripper = k.part('ripper', body, [L0[0], L0[1], 0]);
  k.joint('ripper', ripper, 'rz', 0);
  const l1: [number, number] = [L1[0] - L0[0], L1[1] - L0[1]];
  for (const z of [-0.45, 0.45]) {
    k.rbox(ripper, 'paint', [Math.hypot(l1[0], l1[1]) + 0.16, 0.16, 0.12], 0.04, [l1[0] / 2, l1[1] / 2, z], [0, 0, Math.atan2(l1[1], l1[0])], 1);
  }
  k.cylZ(ripper, 'steel', 0.06, 1.06, [0, 0, 0], 12);
  // porte-dents maintenu vertical par le parallélogramme : ripBar = −ripper dans les poses
  const bar = k.part('ripBar', ripper, [l1[0], l1[1], 0]);
  k.joint('ripBar', bar, 'rz', 0);
  // porte-dents (repère : origine sur l'articulation basse arrière)
  const R = (x: number, y: number, z: number): V3 => [x - L1[0], y - L1[1], z];
  k.rbox(bar, 'paint', [0.26, 0.28, 1.84], 0.04, R(-2.6, 1.0, 0), undefined, 1);
  for (const z of [-0.53, 0.53]) k.box(bar, 'paint', [0.28, 0.62, 0.06], R(-2.56, 0.9, z));
  k.cylZ(bar, 'steel', 0.06, 1.06, R(L1[0], L1[1], 0), 12);
  k.cylZ(bar, 'steel', 0.06, 1.06, R(U1[0], U1[1], 0), 12);
  const shank = softPolygon(
    [
      [-2.7, 1.34],
      [-2.53, 1.34],
      [-2.53, 0.58],
      [-2.44, 0.33],
      [-2.52, 0.25],
      [-2.7, 0.5],
    ],
    0.04,
  );
  for (const z of [-0.62, 0, 0.62]) {
    const g = extrudeGeo(shank, 0.08, 0.01, 6);
    g.translate(-L1[0], -L1[1], z);
    k.add(bar, 'steelDark', g);
    k.box(bar, 'steel', [0.16, 0.06, 0.09], R(-2.47, 0.27, z), [0, 0, -0.75]);
  }
  for (const z of [-0.45, 0.45]) {
    k.link(body, [body, [U0[0], U0[1], z]], [bar, R(U1[0], U1[1], z)], 0.12, 0.1, 'paint');
    k.piston(body, [body, [-1.96, 1.1, z * 0.55]], [bar, R(-2.5, 0.86, z * 0.55)], 0.09, 0.05);
  }

  return k.build({
    refWeight: 20,
    minScale: 0.86,
    maxScale: 1.18,
    wake: [
      { pose: { lift: 0.22 }, dur: 1.5 },
      { pose: { tilt: 0.1, tiltArm: -0.104 }, dur: 1.0 },
      { pose: { tilt: -0.1, tiltArm: 0.104 }, dur: 1.3 },
      { pose: { tilt: 0, tiltArm: 0, ripper: 0.37, ripBar: -0.37 }, dur: 1.4 },
      { pose: { lift: 0, ripper: 0, ripBar: 0 }, dur: 1.8 },
    ],
    nod: [
      { pose: { lift: 0.07 }, dur: 0.45 },
      { pose: { lift: 0 }, dur: 0.5 },
    ],
    breathe: { lift: 0.004 },
  });
}

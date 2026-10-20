// Niveleuse (≈ 17 t, gabarit d'une CAT 140 ou d'une Volvo G946) : châssis avant en col de cygne sur essieu
// directeur à roues inclinables, tandem arrière à quatre roues 14.00-24, moteur à l'arrière, cabine au-dessus du
// tandem ; timon en A sur rotule avant, cercle et lame de 3,66 m (déport latéral) suspendus sous le châssis
// par deux vérins de levage et un vérin de déport du cercle ; plaque de poussée avant.
// Repères : empattement 6 m, longueur 9 m, largeur aux roues 2,4 m, toit de cabine à 3,35 m.
import * as THREE from 'three';
import { Kit, softPolygon, type MachineTemplate, type MatKey, type V3 } from './kit';
import { cabin, exhaust, ladder, wheel } from './parts';

const R = 0.66; // rayon des pneus 14.00-24
const TW = 0.37; // largeur des pneus
const ZW = 1.0; // demi-voie
const XF = 3.85; // essieu avant
const XT = -2.15; // axe du tandem (empattement 6 m)
const DT = 0.76; // demi-entraxe des roues du tandem
const DB: V3 = [3.35, 1.05, 0]; // rotule avant du timon
const CC: V3 = [1.0, 0.86, 0]; // centre du cercle
const CR = 0.8; // rayon du cercle
const BL = 3.66; // longueur de la lame
const BLADE_ANGLE = 0.6; // angle de la lame au repos (talon à gauche)

/** Poutre de section carrée entre deux points (repère de la pièce). */
function strut(k: Kit, part: number, mat: MatKey, a: V3, b: V3, s: number): void {
  const A = new THREE.Vector3(...a);
  const d = new THREE.Vector3(...b).sub(A);
  const g = new THREE.BoxGeometry(s, d.length(), s);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()));
  const m = A.addScaledVector(d, 0.5);
  k.add(part, mat, g, [m.x, m.y, m.z]);
}

export function buildNiveleuse(): MachineTemplate {
  const k = new Kit('niveleuse');

  // ---------------------------------------------------------------- châssis arrière, tandem, moteur
  const body = k.part('body', 0, [0, 0, 0]);
  k.rbox(body, 'trim', [4.1, 0.45, 0.9], 0.05, [-2.25, 1.08, 0], undefined, 1);
  for (const s of [-1, 1]) {
    // carter du tandem (oscillant) et ses deux roues
    k.rbox(body, 'paint', [2.1, 0.52, 0.2], 0.06, [XT, R, s * 0.74], undefined, 2);
    k.cylZ(body, 'steelDark', 0.2, 0.36, [XT, R, s * 0.52], 18);
    for (const dx of [-DT, DT]) wheel(k, body, [XT + dx, R, s * ZW], R, TW, { side: s, rim: 'paint', tread: 'lug', rimRatio: 0.58 });
    // garde-boue continu au-dessus du tandem
    k.rbox(body, 'paint', [2.95, 0.05, 0.46], 0.02, [XT, 1.41, s * ZW], undefined, 1);
    for (const dx of [-1.48, 1.48]) k.rbox(body, 'paint', [0.05, 0.3, 0.46], 0.02, [XT + dx, 1.27, s * ZW], [0, 0, dx > 0 ? -0.35 : 0.35], 1);
    k.box(body, 'black', [2.9, 0.012, 0.42], [XT, 1.437, s * ZW]);
  }
  // capot moteur (profil latéral extrudé), grilles, plaque du code, mains courantes
  const hood = softPolygon(
    [
      [-4.2, 1.28],
      [-2.02, 1.28],
      [-2.02, 2.32],
      [-3.85, 2.32],
      [-4.2, 2.02],
    ],
    0.12,
  );
  k.extrude(body, 'paint', hood, 1.24, [0, 0, 0], undefined, 0.03, 8);
  k.box(body, 'trim', [2.2, 0.06, 1.3], [-3.1, 1.3, 0]);
  k.grille(body, [-4.235, 1.72, 0], 0.9, 0.5, 6, 'x', -1);
  for (const s of [-1, 1]) {
    k.grille(body, [-2.75, 1.8, s * 0.652], 0.62, 0.42, 6, 'z', s);
    k.decal(body, 0.62, 0.155, [-3.5, 1.6, s * 0.652], s > 0 ? 0 : Math.PI);
    k.rail(body, 'trim', [[-3.75, 2.35, s * 0.55], [-3.75, 2.55, s * 0.55], [-2.3, 2.55, s * 0.55], [-2.3, 2.35, s * 0.55]], 0.018);
    // feux arrière sur le pare-chocs, phares de recul en haut du capot
    k.rbox(body, 'tail', [0.04, 0.1, 0.18], 0.02, [-4.4, 1.1, s * 0.62], undefined, 1);
    k.lamp(body, [-4.28, 2.2, s * 0.45], 0.1, Math.PI);
  }
  for (let i = 0; i < 6; i++) k.box(body, 'black', [0.05, 0.015, 0.8], [-3.6 + i * 0.13, 2.355, 0]);
  k.rbox(body, 'trim', [0.14, 0.34, 1.6], 0.03, [-4.32, 1.05, 0], undefined, 1);
  k.rbox(body, 'steelDark', [0.16, 0.12, 0.2], 0.03, [-4.4, 0.86, 0], undefined, 1);
  exhaust(k, body, [-2.45, 2.32, 0.34], 0.55, 0.075);
  k.cyl(body, 'trim', 0.11, 0.28, [-2.45, 2.46, -0.34], undefined, 16);
  k.cyl(body, 'black', 0.12, 0.07, [-2.45, 2.63, -0.34], undefined, 16);

  // ---------------------------------------------------------------- cabine au-dessus du tandem
  k.rbox(body, 'paint', [1.66, 0.24, 1.5], 0.04, [-1.2, 1.4, 0], undefined, 2);
  cabin(k, body, {
    x0: -2.0,
    x1: -0.4,
    y0: 1.5,
    h: 1.72,
    w: 1.46,
    zc: 0,
    lean: 0.06,
    leanBack: 0.05,
    roof: 'paint',
    frame: 'trim',
    post: 0.08,
    door: 'left',
    beacon: 'right',
    lights: 2,
    rearLights: 2,
  });
  for (const s of [-1, 1]) k.mirror(body, [-0.42, 2.45, s * 0.75], s, 0.24);
  ladder(k, body, -0.66, -0.4, 0.42, 1.38, -1.0, 4);

  // ---------------------------------------------------------------- châssis avant en col de cygne
  const beam = softPolygon(
    [
      [-0.42, 1.44],
      [0.12, 2.05],
      [3.5, 1.86],
      [4.2, 1.56],
      [4.2, 1.12],
      [3.45, 1.42],
      [0.42, 1.6],
      [-0.08, 1.04],
      [-0.42, 1.04],
    ],
    0.14,
  );
  k.extrude(body, 'paint', beam, 0.4, [0, 0, 0], undefined, 0.03, 8);
  // articulation (charnière verticale) et vérins d'articulation
  for (const y of [1.02, 1.42]) k.cyl(body, 'steelDark', 0.12, 0.14, [-0.3, y, 0], undefined, 14);
  for (const s of [-1, 1]) k.piston(body, [body, [-0.75, 1.05, s * 0.5]], [body, [0.2, 1.42, s * 0.26]], 0.07, 0.04);
  // groupe de levage (selle) et support de la rotule du timon
  k.rbox(body, 'trim', [0.32, 0.52, 0.6], 0.04, [1.25, 1.82, 0], undefined, 1);
  k.rbox(body, 'trim', [0.3, 0.42, 0.26], 0.04, [DB[0], DB[1] + 0.3, 0], undefined, 1);
  // plaque de poussée avant, phares, clignotants
  k.rbox(body, 'paint', [0.26, 0.72, 1.1], 0.04, [4.35, 0.92, 0], undefined, 2);
  k.box(body, 'black', [0.04, 0.12, 1.0], [4.49, 0.72, 0]);
  for (const s of [-1, 1]) {
    k.lamp(body, [4.22, 1.62, s * 0.3], 0.13);
    k.rbox(body, 'amber', [0.04, 0.06, 0.12], 0.015, [4.5, 1.18, s * 0.46], undefined, 1);
    k.decal(body, 0.62, 0.155, [2.2, 1.73, s * 0.232], s > 0 ? 0 : Math.PI);
  }

  // ---------------------------------------------------------------- essieu avant : roues inclinables et directrices
  k.rbox(body, 'trim', [0.42, 0.22, 0.52], 0.04, [XF, 1.18, 0], undefined, 1);
  k.rbox(body, 'steelDark', [0.24, 0.2, 0.5], 0.04, [XF, 1.02, 0], undefined, 1);
  for (const s of [-1, 1]) strut(k, body, 'steelDark', [XF, 1.0, s * 0.22], [XF, R + 0.02, s * 0.8], 0.2);
  const kn: number[] = [];
  for (const s of [-1, 1]) {
    // fusée : inclinaison et braquage autour du centre de la roue (la roue reste posée)
    const p = k.part(s < 0 ? 'knuckleL' : 'knuckleR', body, [XF, R, s * ZW]);
    k.joint('lean', p, 'rx', 0);
    k.joint('steer', p, 'ry', 0);
    const kz = -s * 0.14;
    k.cyl(p, 'steelDark', 0.1, 0.34, [0, 0, kz], undefined, 14);
    // bras supérieur (barre d'inclinaison) et bras de direction (barre d'accouplement)
    strut(k, p, 'trim', [0, 0.1, kz], [-0.28, 0.44, kz], 0.09);
    k.box(p, 'trim', [0.36, 0.08, 0.08], [-0.16, -0.06, kz]);
    wheel(k, p, [0, 0, 0], R, TW, { side: s, rim: 'paint', tread: 'lug', rimRatio: 0.58 });
    kn.push(p);
  }
  k.link(body, [kn[0], [-0.28, 0.44, 0.14]], [kn[1], [-0.28, 0.44, -0.14]], 0.07, 0.07, 'trim', true);
  k.link(body, [kn[0], [-0.32, -0.06, 0.14]], [kn[1], [-0.32, -0.06, -0.14]], 0.05, 0.05, 'steelDark', true);
  k.piston(body, [body, [XF - 0.12, 1.02, -0.22]], [kn[1], [-0.2, 0.34, -0.14]], 0.06, 0.035);

  // ---------------------------------------------------------------- timon en A (rotule avant)
  const db = k.part('drawbar', body, DB);
  k.joint('drawbar', db, 'rz', 0);
  const D = (x: number, y: number, z: number): V3 => [x - DB[0], y - DB[1], z - DB[2]];
  k.sphere(db, 'steelDark', 0.13, [0, 0, 0], 14);
  for (const s of [-1, 1]) strut(k, db, 'paint', [-0.1, 0, s * 0.08], D(0.62, 0.98, s * 0.8), 0.16);
  strut(k, db, 'paint', D(0.62, 0.98, -0.8), D(0.62, 0.98, 0.8), 0.16);
  strut(k, db, 'paint', D(2.05, 1.01, -0.41), D(2.05, 1.01, 0.41), 0.12);
  k.box(db, 'paint', [1.0, 0.05, 1.3], D(1.0, 0.98, 0));
  // moteur et réducteur d'orientation du cercle
  k.rbox(db, 'trim', [0.3, 0.16, 0.24], 0.03, D(1.45, 1.06, 0.3), undefined, 1);
  k.cyl(db, 'steelDark', 0.08, 0.24, D(1.45, 1.24, 0.3), undefined, 12);
  for (const s of [-1, 1]) k.box(db, 'trim', [0.14, 0.12, 0.1], D(0.66, 1.08, s * 0.8));
  k.box(db, 'trim', [0.14, 0.12, 0.1], D(0.9, 1.08, 0.72));

  // ---------------------------------------------------------------- cercle (orientation) et lame (déport)
  const circle = k.part('circle', db, D(CC[0], CC[1], 0), [0, BLADE_ANGLE, 0]);
  k.joint('circle', circle, 'ry', 0);
  k.lathe(
    circle,
    'steelDark',
    [
      [CR - 0.08, -0.05],
      [CR + 0.06, -0.05],
      [CR + 0.06, 0.05],
      [CR - 0.08, 0.05],
      [CR - 0.08, -0.05],
    ],
    [0, 0, 0],
    undefined,
    40,
  );
  for (const s of [-1, 1]) {
    strut(k, circle, 'paint', [-0.04, -0.02, s * 0.74], [-0.2, -0.5, s * 0.62], 0.12);
    k.box(circle, 'trim', [0.18, 0.2, 0.14], [-0.2, -0.52, s * 0.62]);
  }
  k.box(circle, 'trim', [0.24, 0.1, 0.08], [-0.22, -0.25, -0.62]);

  const blade = k.part('moldboard', circle, [0, 0, 0]);
  k.joint('shift', blade, 'tz', 0);
  const mb = new THREE.Shape();
  mb.moveTo(0.14, -0.74);
  mb.quadraticCurveTo(-0.16, -0.45, 0.04, -0.13);
  mb.lineTo(-0.03, -0.12);
  mb.quadraticCurveTo(-0.24, -0.45, 0.06, -0.74);
  mb.closePath();
  k.extrude(blade, 'paint', mb, BL, [0, 0, 0], undefined, 0.012, 14);
  // lame d'attaque, becs, glissières arrière, flasques d'extrémité
  k.box(blade, 'steel', [0.1, 0.05, BL + 0.04], [0.12, -0.72, 0], [0, 0, 0.5]);
  for (const s of [-1, 1]) {
    k.box(blade, 'steel', [0.16, 0.12, 0.08], [0.1, -0.69, s * (BL / 2 - 0.02)], [0, 0, 0.5]);
    k.box(blade, 'paint', [0.24, 0.6, 0.03], [-0.04, -0.44, s * (BL / 2 + 0.01)], [0, 0, -0.1]);
  }
  for (const [x, y] of [
    [-0.16, -0.31],
    [-0.1, -0.59],
  ]) k.cylZ(blade, 'steel', 0.04, BL - 0.4, [x, y, 0], 10);
  k.box(blade, 'trim', [0.28, 0.12, 0.08], [-0.22, -0.25, 1.5]);

  // ---------------------------------------------------------------- vérins : levage, déport du cercle, déport de la lame
  for (const s of [-1, 1]) {
    k.box(body, 'trim', [0.16, 0.16, 0.1], [1.25, 1.88, s * 0.34]);
    k.piston(body, [body, [1.25, 1.88, s * 0.34]], [db, D(0.66, 1.08, s * 0.8)], 0.08, 0.05);
  }
  k.piston(body, [body, [1.25, 1.62, -0.3]], [db, D(0.9, 1.08, 0.72)], 0.07, 0.04);
  k.piston(circle, [circle, [-0.32, -0.25, -0.62]], [blade, [-0.32, -0.25, 1.5]], 0.06, 0.035);

  return k.build({
    refWeight: 17,
    minScale: 0.86,
    maxScale: 1.15,
    wake: [
      { pose: { drawbar: 0.03, steer: 0.22, lean: 0.12 }, dur: 1.4 },
      { pose: { circle: -0.4, shift: 0.42 }, dur: 1.6 },
      { pose: { circle: 0.25, shift: -0.35, steer: -0.2, lean: -0.12 }, dur: 1.8 },
      { pose: { drawbar: 0, circle: 0, shift: 0, steer: 0, lean: 0 }, dur: 1.8 },
    ],
    nod: [
      { pose: { circle: -0.15 }, dur: 0.45 },
      { pose: { circle: 0 }, dur: 0.5 },
    ],
    breathe: { circle: 0.006 },
  });
}

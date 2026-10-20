// Rouleau tandem articulé (≈ 9 t, classe Hamm HD+ 90 / Bomag BW 154 / Ammann ARX 90) : deux cylindres lisses
// (Ø 1,20 m × 1,68 m, entraxe 3,40 m) dans leurs cadres, articulation centrale avec vérin de direction, poste de
// conduite central (siège et colonne de direction sur une console coulissante, arceau ROPS deux montants à toit),
// réservoir d'eau sur le cadre avant, moteur sur le cadre arrière, rampes d'arrosage et racleurs devant et
// derrière chaque cylindre.
// Gabarit : 5,1 × 1,84 × 3,05 m (toit de l'arceau).
import * as THREE from 'three';
import { Kit, softPolygon, type MachineTemplate, type V3 } from './kit';
import { exhaust, ladder } from './parts';

const RD = 0.6; // rayon des cylindres
const DW = 1.68; // largeur des cylindres
const XD = 1.7; // axe des cylindres à ±1,70 m de l'articulation
const ZP = DW / 2 + 0.05; // plan médian des flasques des cadres
const PT = 0.05; // épaisseur des flasques
const ZO = ZP + PT / 2; // face extérieure des flasques
const HW = 1.84; // largeur des capots
const FLOOR = 1.3; // dessous du plancher du poste de conduite
const FY = FLOOR + 0.08; // dessus du plancher
const XR = -0.74; // montants de l'arceau ROPS
const ROOF = 2.9; // dessous du toit

/** Profil de tour à arêtes vives : chaque point intérieur est doublé (normales non lissées aux angles). */
const crisp = (pts: [number, number][]): [number, number][] =>
  pts.flatMap((p, i) => (i === 0 || i === pts.length - 1 ? [p] : [p, p]));

/** Cylindre lisse d'axe z (repère de la pièce) : virole et chants, flasques renfoncés, moyeux et boulons. */
function drum(k: Kit, part: number): void {
  const t = 0.028;
  const h = DW / 2;
  const rec = 0.07;
  k.lathe(
    part,
    'steel',
    crisp([
      [RD - t, -(h - rec)],
      [RD - t, -h],
      [RD, -h],
      [RD, h],
      [RD - t, h],
      [RD - t, h - rec],
    ]),
    [0, 0, 0],
    [Math.PI / 2, 0, 0],
    24,
  );
  for (const s of [-1, 1]) {
    const z0 = h - rec;
    k.cylZ(part, 'steelDark', RD - t, 0.02, [0, 0, s * (z0 - 0.01)], 24);
    // moyeu (porte-tampons) jusqu'au flasque du cadre, couronne de boulons
    const z1 = ZP - PT / 2;
    k.cylZ(part, 'trim', 0.25, z1 - z0, [0, 0, (s * (z0 + z1)) / 2], 24);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      k.cylZ(part, 'steel', 0.022, 0.03, [Math.cos(a) * 0.4, Math.sin(a) * 0.4, s * (z0 + 0.005)], 8);
    }
  }
}

/**
 * Cadre d'un cylindre (dir = +1 avant, −1 arrière) : flasques peints en fourche jusqu'au moyeu, moteurs de
 * translation et de vibration, traverse intérieure, anneaux de levage, racleurs des deux côtés, rampe d'arrosage
 * côté extérieur.
 */
function drumFrame(k: Kit, part: number, dir: number): void {
  const cx = dir * XD;
  const plate = softPolygon(
    [
      [cx - 0.74, 1.3],
      [cx + 0.74, 1.3],
      [cx + 0.74, 0.76],
      [cx + 0.24, 0.36],
      [cx - 0.24, 0.36],
      [cx - 0.74, 0.76],
    ],
    0.1,
  );
  for (const s of [-1, 1]) {
    k.extrude(part, 'paint', plate, PT, [0, 0, s * ZP], undefined, 0.012, 8);
    // moteur sur le flasque, couvercle et vis
    k.cylZ(part, 'steelDark', 0.2, 0.05, [cx, RD, s * (ZO + 0.025)], 24);
    k.cylZ(part, 'trim', 0.12, 0.05, [cx, RD, s * (ZO + 0.07)], 18);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      k.cylZ(part, 'steel', 0.016, 0.02, [cx + Math.cos(a) * 0.16, RD + Math.sin(a) * 0.16, s * (ZO + 0.055)], 6);
    }
    // anneau de levage sur le flasque, côté extérieur
    k.torus(part, 'steelDark', 0.05, 0.014, [cx + dir * 0.6, 1.14, s * (ZO + 0.015)], [0, 0, 0], [6, 14]);
  }
  // traverse intérieure (côté articulation)
  k.rbox(part, 'paint', [0.12, 0.5, 2 * ZP], 0.03, [cx - dir * 0.7, 1.04, 0], undefined, 2);

  // racleurs : lame contre la virole et support entre les flasques, de part et d'autre du cylindre
  for (const phi of [0.36, Math.PI - 0.36]) {
    const c = Math.cos(phi);
    const sn = Math.sin(phi);
    k.box(part, 'black', [0.1, 0.014, DW - 0.04], [cx + c * (RD + 0.055), RD + sn * (RD + 0.055), 0], [0, 0, phi]);
    k.box(part, 'steelDark', [0.06, 0.12, 2 * ZP - PT], [cx + c * (RD + 0.13), RD + sn * (RD + 0.13), 0], [0, 0, phi]);
  }
  // rampe d'arrosage côté extérieur, buses dirigées vers la virole
  const phi = dir > 0 ? 0.86 : Math.PI - 0.86;
  const c = Math.cos(phi);
  const sn = Math.sin(phi);
  k.cylZ(part, 'steel', 0.024, 2 * ZP - PT, [cx + c * (RD + 0.17), RD + sn * (RD + 0.17), 0], 10);
  for (let i = 0; i < 7; i++) {
    const z = -DW / 2 + 0.12 + (i * (DW - 0.24)) / 6;
    k.cyl(part, 'trim', 0.012, 0.07, [cx + c * (RD + 0.12), RD + sn * (RD + 0.12), z], [0, 0, phi - Math.PI / 2], 6);
  }
}

/** Capot (profil latéral extrudé sur la largeur) et son bandeau graphite à la base. */
function hood(k: Kit, part: number, profile: [number, number][], x0: number, x1: number): void {
  k.extrude(part, 'paint', softPolygon(profile, 0.12), HW, [0, 0, 0], undefined, 0.05, 10);
  k.rbox(part, 'trim', [x1 - x0, 0.09, HW + 0.02], 0.025, [(x0 + x1) / 2, 1.27, 0], undefined, 2);
}

/** Volant incliné vers le conducteur (assis vers −x). */
function steeringWheel(k: Kit, part: number, pos: V3, tilt: number): void {
  const ring = new THREE.TorusGeometry(0.19, 0.019, 8, 24);
  ring.rotateX(-Math.PI / 2);
  ring.rotateZ(tilt);
  k.add(part, 'black', ring, pos);
  const hub = new THREE.CylinderGeometry(0.045, 0.05, 0.05, 14);
  hub.rotateZ(tilt);
  k.add(part, 'black', hub, pos);
  for (const a of [Math.PI / 2, (7 * Math.PI) / 6, (11 * Math.PI) / 6]) {
    const sp = new THREE.BoxGeometry(0.19, 0.012, 0.03);
    sp.translate(0.095, 0, 0);
    sp.rotateY(a);
    sp.rotateZ(tilt);
    k.add(part, 'black', sp, pos);
  }
}

export function buildRouleauTandem(): MachineTemplate {
  const k = new Kit('rouleau_tandem');

  // ---------------------------------------------------------------- cadre arrière : moteur, poste de conduite
  const rear = k.part('rear', 0, [0, 0, 0]);
  drumFrame(k, rear, -1);
  const drumR = k.part('drumR', rear, [-XD, RD, 0]);
  drum(k, drumR);

  // capot moteur, arrière incliné
  hood(
    k,
    rear,
    [
      [-0.92, 1.3],
      [-2.42, 1.3],
      [-2.42, 1.6],
      [-2.28, 1.8],
      [-1.08, 1.87],
      [-0.92, 1.83],
    ],
    -2.47,
    -0.87,
  );
  // grille arrière, ouïes latérales, feux
  k.grille(rear, [-2.475, 1.55, 0], 1.1, 0.34, 5, 'x', -1);
  for (const s of [-1, 1]) {
    k.grille(rear, [-1.75, 1.6, s * (HW / 2)], 0.9, 0.3, 4, 'z', s);
    k.rbox(rear, 'tail', [0.05, 0.1, 0.16], 0.02, [-2.475, 1.4, s * 0.74], undefined, 1);
    k.rbox(rear, 'amber', [0.05, 0.06, 0.1], 0.015, [-2.475, 1.4, s * 0.57], undefined, 1);
  }
  // pare-chocs arrière et anneau de remorquage
  k.rbox(rear, 'black', [0.08, 0.1, 1.5], 0.03, [-2.47, 1.2, 0], undefined, 1);
  k.torus(rear, 'steelDark', 0.055, 0.018, [-2.52, 1.2, 0], [0, 0, 0], [6, 14]);
  // échappement, bouchon du réservoir de carburant
  exhaust(k, rear, [-1.3, 1.88, 0.62], 0.42, 0.055);
  k.cyl(rear, 'trim', 0.07, 0.05, [-1.25, 1.9, -0.5], undefined, 16);

  // longeron sous le plancher jusqu'à la rotule de l'articulation, chape du vérin de direction
  k.rbox(rear, 'trim', [0.84, 0.46, 0.64], 0.05, [-0.6, 0.99, 0], undefined, 2);
  k.box(rear, 'trim', [0.3, 0.22, 0.36], [-0.2, 0.92, 0]);
  k.cyl(rear, 'steelDark', 0.17, 0.24, [0, 0.92, 0], undefined, 20);
  k.box(rear, 'steelDark', [0.12, 0.12, 0.16], [-0.6, 0.92, 0.38]);

  // ---------------------------------------------------------------- poste de conduite
  k.rbox(rear, 'trim', [1.4, 0.08, 1.66], 0.03, [-0.14, FLOOR + 0.04, 0], undefined, 2);
  k.box(rear, 'black', [1.24, 0.008, 1.5], [-0.14, FY + 0.004, 0]);
  // glissières de la console siège-direction
  for (const x of [-0.3, 0.3]) k.box(rear, 'steel', [0.05, 0.02, 1.3], [x, FY + 0.01, 0]);
  // garde-corps latéraux : complet à droite, ouvert à gauche devant l'échelle
  k.rail(rear, 'trim', [[0.5, FY, 0.8], [0.5, FY + 0.92, 0.8], [XR + 0.06, FY + 0.92, 0.8]], 0.02);
  k.rail(rear, 'trim', [[0.5, FY + 0.46, 0.8], [XR + 0.06, FY + 0.46, 0.8]], 0.016);
  k.rail(rear, 'trim', [[0.5, FY, -0.8], [0.5, FY + 0.92, -0.8], [-0.22, FY + 0.92, -0.8], [-0.22, FY, -0.8]], 0.02);
  k.rail(rear, 'trim', [[0.5, FY + 0.46, -0.8], [-0.22, FY + 0.46, -0.8]], 0.016);
  // accès côté gauche : échelle et jambe de force
  ladder(k, rear, -0.66, -0.36, 0.34, FLOOR - 0.01, -0.82, 4);
  k.rail(rear, 'trim', [[-0.51, 0.36, -0.82], [-0.51, 0.82, -0.32]], 0.02);

  // console coulissante : siège à accoudoirs, levier de translation, colonne de direction et volant
  const seat = k.part('seat', rear, [0, 0, 0]);
  k.joint('seat', seat, 'tz', 0);
  const sx = -0.3;
  k.rbox(seat, 'trim', [0.98, 0.04, 0.54], 0.015, [0, FY + 0.04, 0], undefined, 1);
  k.rbox(seat, 'trim', [0.42, 0.3, 0.46], 0.04, [sx, FY + 0.2, 0], undefined, 2);
  k.cyl(seat, 'steelDark', 0.09, 0.1, [sx, FY + 0.39, 0], undefined, 16);
  k.rbox(seat, 'interior', [0.5, 0.12, 0.52], 0.05, [sx + 0.02, FY + 0.5, 0], undefined, 2);
  k.rbox(seat, 'interior', [0.12, 0.66, 0.5], 0.05, [sx - 0.24, FY + 0.85, 0], [0, 0, 0.14], 2);
  for (const s of [-1, 1]) k.rbox(seat, 'interior', [0.36, 0.07, 0.1], 0.03, [sx + 0.02, FY + 0.7, s * 0.31], undefined, 1);
  k.rbox(seat, 'trim', [0.2, 0.08, 0.14], 0.02, [sx + 0.12, FY + 0.75, 0.31], undefined, 1);
  k.cyl(seat, 'black', 0.016, 0.14, [sx + 0.15, FY + 0.85, 0.31], [0, 0, -0.25], 8);
  k.sphere(seat, 'black', 0.034, [sx + 0.168, FY + 0.92, 0.31], 10);
  k.rbox(seat, 'trim', [0.14, 0.86, 0.2], 0.04, [0.33, FY + 0.44, 0], [0, 0, 0.17], 2);
  k.rbox(seat, 'trim', [0.2, 0.12, 0.42], 0.04, [0.26, FY + 0.88, 0], [0, 0, 0.5], 2);
  k.box(seat, 'glass', [0.01, 0.08, 0.26], [0.205, FY + 0.9, 0], [0, 0, 0.5]);
  steeringWheel(k, seat, [0.18, FY + 0.99, 0], 0.62);

  // arceau ROPS : deux montants rabattables, traverse, toit débordant vers l'avant
  for (const s of [-1, 1]) {
    k.rbox(rear, 'trim', [0.1, ROOF - FY, 0.1], 0.025, [XR, (FY + ROOF) / 2, s * 0.74], undefined, 2);
    k.box(rear, 'steelDark', [0.16, 0.12, 0.14], [XR, 2.12, s * 0.74]);
    k.cylZ(rear, 'steel', 0.025, 0.18, [XR + 0.04, 2.12, s * 0.74], 10);
    k.box(rear, 'trim', [0.18, 0.06, 0.16], [XR, FY + 0.03, s * 0.74]);
    // longeron sous le toit
    k.box(rear, 'trim', [1.28, 0.06, 0.06], [XR + 0.58, ROOF - 0.03, s * 0.74]);
  }
  k.rbox(rear, 'trim', [0.1, 0.1, 1.58], 0.025, [XR, ROOF - 0.05, 0], undefined, 2);
  k.rbox(rear, 'trim', [1.5, 0.05, 1.68], 0.02, [-0.18, ROOF + 0.02, 0], undefined, 1);
  k.rbox(rear, 'paint', [1.56, 0.07, 1.76], 0.03, [-0.18, ROOF + 0.075, 0], undefined, 2);
  k.rbox(rear, 'paint', [1.3, 0.05, 1.5], 0.025, [-0.2, ROOF + 0.12, 0], undefined, 2);
  for (const s of [-1, 1]) {
    k.lamp(rear, [0.58, ROOF + 0.06, s * 0.6], 0.11);
    k.lamp(rear, [-0.96, ROOF + 0.06, s * 0.6], 0.1, Math.PI);
    k.mirror(rear, [0.5, ROOF - 0.04, s * 0.74], s, 0.14, 0.2);
  }
  k.beacon(rear, [-0.62, ROOF + 0.145, 0.5]);

  // ---------------------------------------------------------------- articulation et cadre avant (réservoir d'eau)
  const front = k.part('front', 0, [0, 0, 0]);
  k.joint('steer', front, 'ry', 0);
  drumFrame(k, front, 1);
  // chapes de l'articulation autour de la rotule, axe vertical
  for (const y of [1.08, 0.76]) {
    k.cyl(front, 'steelDark', 0.2, 0.07, [0, y, 0], undefined, 20);
    k.box(front, 'steelDark', [0.4, 0.07, 0.4], [0.2, y, 0]);
  }
  k.cyl(front, 'steel', 0.06, 0.42, [0, 0.92, 0], undefined, 12);
  // timon jusqu'à la traverse du cadre, chape du vérin de direction
  k.rbox(front, 'trim', [0.7, 0.4, 0.6], 0.05, [0.66, 0.92, 0], undefined, 2);
  k.box(front, 'steelDark', [0.12, 0.12, 0.12], [0.52, 0.92, 0.34]);
  // réservoir d'eau : capot avant à dessus incliné, bouchon de remplissage
  hood(
    k,
    front,
    [
      [1.01, 1.3],
      [2.42, 1.3],
      [2.42, 1.48],
      [2.28, 1.6],
      [1.16, 1.68],
      [1.01, 1.62],
    ],
    0.96,
    2.47,
  );
  k.cyl(front, 'trim', 0.1, 0.05, [1.42, 1.725, 0], undefined, 18);
  k.cyl(front, 'black', 0.07, 0.03, [1.42, 1.76, 0], undefined, 16);
  // phares et clignotants avant, pare-chocs, plaque du code
  for (const s of [-1, 1]) {
    k.lamp(front, [2.48, 1.46, s * 0.62], 0.13);
    k.rbox(front, 'amber', [0.05, 0.06, 0.1], 0.015, [2.475, 1.46, s * 0.82], undefined, 1);
    k.decal(front, 0.6, 0.15, [1.72, 1.47, s * (HW / 2 + 0.002)], s > 0 ? 0 : Math.PI);
  }
  k.rbox(front, 'black', [0.08, 0.1, 1.5], 0.03, [2.47, 1.2, 0], undefined, 1);

  const drumF = k.part('drumF', front, [XD, RD, 0]);
  drum(k, drumF);

  // vérin de direction (côté droit de l'articulation)
  k.piston(rear, [rear, [-0.6, 0.92, 0.44]], [front, [0.52, 0.92, 0.4]], 0.065, 0.038);

  return k.build({
    refWeight: 9,
    minScale: 0.85,
    maxScale: 1.2,
    vibrate: ['drumF', 'drumR'],
    wake: [
      { pose: { steer: 0.3, seat: -0.26 }, dur: 1.8 },
      { pose: { steer: -0.28, seat: 0.26 }, dur: 2.2 },
      { pose: { steer: 0, seat: 0 }, dur: 1.6 },
    ],
    nod: [
      { pose: { steer: 0.08 }, dur: 0.45 },
      { pose: { steer: 0 }, dur: 0.5 },
    ],
    breathe: { steer: 0.004 },
  });
}

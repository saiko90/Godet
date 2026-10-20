// Nacelle articulée automotrice (≈ 6,9 t, classe Genie Z-45/25J RT / Haulotte HA16 RTJ / JLG 450AJ : hauteur de
// travail 16 m, déport 7,5 m) : châssis tout-terrain à quatre roues, tourelle à rotation continue sans débord
// arrière (contrepoids et capots dans un rayon de 1,12 m), bras inférieur en parallélogramme (bielles et
// rehausse qui reste verticale), flèche supérieure télescopique, pendulaire (jib) et panier à garde-corps,
// pupitre et rotateur, gardé horizontal en toute position.
// Gabarit replié : 6,5 m × 2,29 m × 2,13 m, empattement 2,03 m, garde au sol 0,37 m.
// Parallélogramme : la bielle inférieure (liaison « riser ») porte la rehausse, qui tourne de l'angle opposé
// (liaison « knuckle » = −riser) ; la bielle supérieure est dessinée entre la tourelle et la rehausse.
// Panier : « level » = −(boom + jib).
import * as THREE from 'three';
import { Kit, softPolygon, type MachineTemplate, type V3 } from './kit';
import { wheel } from './parts';

const R = 0.43; // pneus 315/55 D20
const TW = 0.315;
const ZW = 0.99; // demi-voie
const XA = 1.015; // demi-empattement
const TURRET_Y = 1.0; // dessus de la couronne d'orientation
const TAIL = 1.12; // rayon arrière de la tourelle (sans débord)
const T1: [number, number] = [0.42, 0.32]; // pivot de la bielle inférieure (repère tourelle)
const LINK_DY = 0.3; // écart des deux bielles
const LR = 1.35; // longueur des bielles
const RISER0 = Math.PI - 0.06; // bielles repliées vers l'arrière
const RISER_UP = 1.9; // bielles levées
const KB: [number, number] = [0.05, 0.5]; // pivot de la flèche sur la rehausse
const LF = 4.82; // de l'axe de flèche à l'axe du pendulaire (flèche rentrée)
const LJ = 1.0; // pendulaire
const JIB0 = -Math.PI / 2; // pendulaire replié vers le bas
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

/**
 * Contour de tourelle vu de dessus entre zIn et zOut (côté s), arrondi sur le cercle de rotation arrière.
 * Le contour est réduit de l'arrondi des arêtes (inset) pour que les faces finies tombent sur les cotes.
 */
function podShape(s: number, zIn: number, zOut: number, xFront: number, inset: number): THREE.Shape {
  const r = TAIL - inset;
  const z0 = zIn + inset;
  const z1 = zOut - inset;
  const pts: [number, number][] = [
    [xFront - inset, z0],
    [xFront - inset, z1],
  ];
  const a0 = Math.asin(z1 / r);
  const a1 = Math.asin(z0 / r);
  for (let i = 0; i <= 8; i++) {
    const a = a0 + ((a1 - a0) * i) / 8;
    pts.push([-Math.cos(a) * r, Math.sin(a) * r]);
  }
  // le plan de la forme a y = −z monde
  return softPolygon(
    pts.map(([x, z]) => [x, -s * z] as [number, number]),
    0.05,
  );
}

/** Angle du panier qui le garde horizontal. */
const basket = (boom: number, jib: number) => -(boom + jib);

export function buildNacelleArticulee(): MachineTemplate {
  const k = new Kit('nacelle_articulee');

  // ---------------------------------------------------------------- châssis
  const chassis = k.part('chassis', 0, [0, 0, 0]);
  // profil réduit de l'arrondi (0,04) : faces finies de y = 0,45 à 0,95, bouts chanfreinés jusqu'à x = ±1,62
  const frame = softPolygon(
    [
      [-1.5, 0.49],
      [1.5, 0.49],
      [1.58, 0.64],
      [1.5, 0.91],
      [-1.5, 0.91],
      [-1.58, 0.64],
    ],
    0.08,
  );
  k.extrude(chassis, 'paint', frame, 1.3, [0, 0, 0], undefined, 0.04, 8);
  k.box(chassis, 'steelDark', [2.9, 0.08, 1.1], [0, 0.42, 0]);
  k.box(chassis, 'trim', [2.96, 0.02, 1.22], [0, 0.955, 0]);
  k.cyl(chassis, 'black', [0.8, 0.82], 0.06, [0, TURRET_Y - 0.03, 0], undefined, 36);
  for (const x of [-XA, XA]) {
    k.cylZ(chassis, 'steelDark', 0.1, 2 * ZW - 0.3, [x, R, 0], 14);
    k.rbox(chassis, 'steelDark', [0.36, 0.3, 0.46], 0.05, [x, R, 0], undefined, 1);
    for (const s of [-1, 1]) {
      k.cylZ(chassis, 'steelDark', 0.17, 0.16, [x, R, s * (ZW - 0.26)], 16);
      wheel(k, chassis, [x, R, s * ZW], R, TW, { side: s, rim: 'paint', tread: 'lug' });
    }
  }
  // pare-chocs, anneaux d'arrimage, feux de circulation
  for (const sx of [-1, 1]) {
    k.rbox(chassis, 'trim', [0.12, 0.26, 1.36], 0.04, [sx * 1.58, 0.62, 0], undefined, 1);
    for (const s of [-1, 1]) {
      k.torus(chassis, 'steel', 0.045, 0.014, [sx * 1.65, 0.5, s * 0.5], [0, Math.PI / 2, 0], [6, 12]);
      if (sx > 0) k.lamp(chassis, [1.64, 0.7, s * 0.42], 0.1);
      else k.rbox(chassis, 'tail', [0.03, 0.09, 0.16], 0.012, [-1.645, 0.7, s * 0.42], undefined, 1);
    }
  }

  // ---------------------------------------------------------------- tourelle (sans débord arrière)
  const turret = k.part('turret', chassis, [0, TURRET_Y, 0]);
  k.joint('slew', turret, 'ry', 0);
  k.cyl(turret, 'trim', 0.78, 0.08, [0, 0.04, 0], undefined, 36);
  // contrepoids bas entre les capots, sous la rehausse repliée
  const cw = new THREE.Shape();
  const a = Math.asin(0.25 / TAIL);
  cw.moveTo(-0.6, -0.25);
  cw.lineTo(-0.6, 0.25);
  cw.absarc(0, 0, TAIL, Math.PI - a, Math.PI + a, false);
  cw.closePath();
  k.slab(turret, 'paint', cw, 0.2, 0.06, 0.02, 8);
  k.box(turret, 'trim', [1.9, 0.08, 0.5], [-0.2, 0.08, 0]);
  for (const s of [-1, 1]) {
    k.slab(turret, 'paint', podShape(s, 0.25, 1.0, 0.75, 0.04), 0.74, 0.06, 0.04, 8);
    k.slab(turret, 'trim', podShape(s, 0.24, 1.01, 0.76, 0), 0.06, 0.0, 0.0, 8);
    k.decal(turret, 0.56, 0.14, [-0.05, 0.5, s * 1.003], s > 0 ? 0 : Math.PI);
  }
  // capot moteur (droite) : grilles et échappement ; capot gauche : pupitre de commande au sol
  k.grille(turret, [0.35, 0.42, 1.001], 0.5, 0.36, 5, 'z', 1);
  // joints et poignées des portes de capot
  for (const s of [-1, 1]) {
    k.box(turret, 'black', [0.012, 0.6, 0.012], [-0.32, 0.43, s * 1.003]);
    k.box(turret, 'steel', [0.1, 0.025, 0.025], [-0.42, 0.62, s * 1.012]);
  }
  for (let i = 0; i < 5; i++) k.box(turret, 'black', [0.05, 0.012, 0.5], [-0.1 + i * 0.11, 0.8, 0.62]);
  k.cyl(turret, 'trim', 0.045, 0.18, [-0.45, 0.88, 0.75], undefined, 12);
  k.cyl(turret, 'chrome', 0.05, 0.05, [-0.45, 0.99, 0.75], undefined, 12);
  k.rbox(turret, 'trim', [0.4, 0.3, 0.06], 0.02, [0.3, 0.5, -1.02], undefined, 1);
  k.cyl(turret, 'tail', 0.035, 0.04, [0.2, 0.55, -1.06], [Math.PI / 2, 0, 0], 12);
  k.box(turret, 'steel', [0.04, 0.04, 0.03], [0.4, 0.55, -1.06]);
  k.beacon(turret, [-0.5, 0.8, -0.62], 0.075);
  // montants du parallélogramme et appui de flèche
  for (const s of [-1, 1]) {
    const post = softPolygon(
      [
        [0.24, 0.05],
        [0.7, 0.05],
        [0.62, 0.72],
        [0.32, 0.72],
      ],
      0.06,
    );
    k.extrude(turret, 'paint', post, 0.05, [0, 0, s * 0.215], undefined, 0.01, 6);
  }
  k.cylZ(turret, 'steel', 0.045, 0.52, [T1[0], T1[1], 0], 10);
  k.cylZ(turret, 'steel', 0.045, 0.52, [T1[0], T1[1] + LINK_DY, 0], 10);
  k.box(turret, 'rubber', [0.2, 0.03, 0.4], [0.47, 0.72, 0]);
  // axe de pied du vérin du parallélogramme
  k.cylZ(turret, 'steel', 0.04, 0.2, [-0.75, 0.08, 0], 10);

  // ---------------------------------------------------------------- parallélogramme : bielles et rehausse
  const link = k.part('riser', turret, [T1[0], T1[1], 0]);
  k.joint('riser', link, 'rz', RISER0);
  for (const s of [-1, 1]) k.rbox(link, 'paint', [LR + 0.16, 0.16, 0.05], 0.04, [LR / 2, 0, s * 0.15], undefined, 1);
  // entretoises (la première porte la tête du vérin)
  for (const x of [0.35, LR * 0.7]) k.cylZ(link, 'trim', 0.04, 0.3, [x, 0.06, 0], 10);
  k.cylZ(link, 'steel', 0.04, 0.42, [LR, 0, 0], 10);

  const knuckle = k.part('knuckle', link, [LR, 0, 0]);
  k.joint('knuckle', knuckle, 'rz', -RISER0);
  k.rbox(knuckle, 'paint', [0.26, 0.74, 0.22], 0.04, [0.02, 0.25, 0], undefined, 2);
  k.cylZ(knuckle, 'steel', 0.04, 0.42, [0, LINK_DY, 0], 10);
  k.cylZ(knuckle, 'trim', 0.07, 0.26, [0.12, 0, 0], 12);

  // ---------------------------------------------------------------- flèche supérieure télescopique
  const boom = k.part('boom', knuckle, [KB[0], KB[1], 0]);
  k.joint('boom', boom, 'rz', 0);
  k.rbox(boom, 'paint', [4.7, 0.36, 0.3], 0.05, [2.1, 0, 0], undefined, 2);
  k.cylZ(boom, 'trim', 0.17, 0.34, [0, 0, 0], 18);
  k.cylZ(boom, 'steel', 0.05, 0.4, [0, 0, 0], 10);
  k.box(boom, 'trim', [0.05, 0.37, 0.31], [4.43, 0, 0]);
  k.rbox(boom, 'trim', [0.3, 0.1, 0.18], 0.03, [1.1, -0.2, 0], undefined, 1);
  // flexibles et chemin de câbles sur le flanc droit
  for (const dy of [0.05, 0.11]) k.hose(boom, 'rubber', [[0.1, dy, 0.17], [1.5, dy, 0.172], [3.0, dy - 0.01, 0.172], [4.3, dy - 0.02, 0.17]], 0.018, 24);
  for (const x of [1.0, 2.2, 3.4]) k.box(boom, 'black', [0.05, 0.12, 0.03], [x, 0.08, 0.17]);

  const fly = k.part('fly', boom, [0, 0, 0]);
  k.joint('tele', fly, 'tx', 0);
  k.rbox(fly, 'paint', [3.8, 0.28, 0.23], 0.04, [2.85, -0.02, 0], undefined, 2);
  k.rbox(fly, 'trim', [0.26, 0.32, 0.27], 0.04, [LF - 0.04, -0.02, 0], undefined, 1);
  k.cylZ(fly, 'steel', 0.045, 0.34, [LF, -0.02, 0], 10);
  k.box(fly, 'trim', [0.14, 0.08, 0.14], [4.0, -0.2, 0]);

  // ---------------------------------------------------------------- pendulaire (jib) et panier
  const jib = k.part('jib', fly, [LF, -0.02, 0]);
  k.joint('jib', jib, 'rz', JIB0);
  k.rbox(jib, 'paint', [LJ + 0.12, 0.18, 0.2], 0.04, [LJ / 2, 0, 0], undefined, 2);
  k.box(jib, 'trim', [0.12, 0.06, 0.12], [0.35, -0.12, 0]);
  k.cylZ(jib, 'steel', 0.04, 0.3, [LJ, 0, 0], 10);

  const bkt = k.part('basket', jib, [LJ, 0, 0]);
  k.joint('level', bkt, 'rz', basket(0, JIB0));
  // rotateur et bras de fixation
  k.cyl(bkt, 'trim', 0.11, 0.4, [0.02, -0.12, 0], undefined, 16);
  k.box(bkt, 'trim', [0.2, 0.12, 0.3], [0.12, -0.36, 0]);
  // plancher, plinthes
  const px0 = 0.16;
  const px1 = 0.92;
  const pz = 0.915;
  k.rbox(bkt, 'paint', [px1 - px0, 0.08, 2 * pz], 0.02, [(px0 + px1) / 2, FLOOR - 0.04, 0], undefined, 1);
  k.box(bkt, 'trim', [px1 - px0 - 0.04, 0.012, 2 * pz - 0.04], [(px0 + px1) / 2, FLOOR + 0.002, 0]);
  for (const s of [-1, 1]) {
    k.box(bkt, 'paint', [px1 - px0, 0.15, 0.02], [(px0 + px1) / 2, FLOOR + 0.075, s * (pz - 0.01)]);
    k.box(bkt, 'paint', [0.02, 0.15, 2 * pz], [s > 0 ? px1 - 0.01 : px0 + 0.01, FLOOR + 0.075, 0]);
  }
  // garde-corps (montants aux coins et au milieu des grands côtés, lisses haute et intermédiaire)
  const rx0 = px0 + 0.03;
  const rx1 = px1 - 0.03;
  const rz = pz - 0.03;
  const ring: [number, number][] = [
    [rx0, -rz],
    [rx1, -rz],
    [rx1, 0],
    [rx1, rz],
    [rx0, rz],
    [rx0, 0],
    [rx0, -rz],
  ];
  for (let i = 0; i < ring.length - 1; i++) {
    const [x, z] = ring[i];
    const [nx, nz] = ring[i + 1];
    k.cyl(bkt, 'steel', 0.022, RAIL + 0.022, [x, FLOOR + RAIL / 2 + 0.011, z], undefined, 8);
    k.sphere(bkt, 'steel', 0.024, [x, FLOOR + RAIL + 0.022, z], 8);
    bar(k, bkt, [x, FLOOR + RAIL, z], [nx, FLOOR + RAIL, nz], 0.022);
    bar(k, bkt, [x, FLOOR + RAIL * 0.52, z], [nx, FLOOR + RAIL * 0.52, nz], 0.018);
  }
  // pupitre de commande sur la lisse avant, pédale de validation
  k.rbox(bkt, 'trim', [0.14, 0.26, 0.46], 0.03, [rx1 - 0.08, FLOOR + RAIL - 0.12, -0.3], undefined, 2);
  k.box(bkt, 'black', [0.1, 0.02, 0.4], [rx1 - 0.12, FLOOR + RAIL + 0.01, -0.3]);
  k.cyl(bkt, 'black', 0.012, 0.09, [rx1 - 0.12, FLOOR + RAIL + 0.06, -0.42], undefined, 8);
  k.sphere(bkt, 'black', 0.024, [rx1 - 0.12, FLOOR + RAIL + 0.11, -0.42], 10);
  k.cyl(bkt, 'tail', 0.028, 0.03, [rx1 - 0.12, FLOOR + RAIL + 0.03, -0.16], undefined, 12);
  k.rbox(bkt, 'black', [0.3, 0.06, 0.22], 0.02, [0.45, FLOOR + 0.03, -0.3], undefined, 1);

  // ---------------------------------------------------------------- vérins et bielle supérieure
  for (const s of [-1, 1]) k.link(turret, [turret, [T1[0], T1[1] + LINK_DY, s * 0.15]], [knuckle, [0, LINK_DY, s * 0.15]], 0.13, 0.05, 'paint');
  k.piston(turret, [turret, [-0.75, 0.08, 0]], [link, [0.35, 0.1, 0]], 0.075, 0.045);
  k.piston(knuckle, [knuckle, [0.12, 0, 0]], [boom, [1.1, -0.22, 0]], 0.08, 0.05);
  k.piston(fly, [fly, [4.0, -0.2, 0]], [jib, [0.35, -0.12, 0]], 0.055, 0.035);

  const up = { riser: RISER_UP, knuckle: -RISER_UP };
  return k.build({
    refWeight: 6.9,
    minScale: 0.85,
    maxScale: 1.25,
    wake: [
      { pose: { slew: -0.55, ...up }, dur: 1.5 },
      { pose: { boom: 0.65, jib: -0.35, level: basket(0.65, -0.35) }, dur: 1.5 },
      { pose: { tele: 1.3, jib: 0.15, level: basket(0.65, 0.15) }, dur: 1.3 },
      { pose: { slew: -0.15, tele: 0.4 }, dur: 1.3 },
      { pose: { slew: 0, riser: RISER0, knuckle: -RISER0, boom: 0, tele: 0, jib: JIB0, level: basket(0, JIB0) }, dur: 1.9 },
    ],
    nod: [
      { pose: { jib: JIB0 + 0.12, level: basket(0, JIB0 + 0.12) }, dur: 0.45 },
      { pose: { jib: JIB0, level: basket(0, JIB0) }, dur: 0.5 },
    ],
    breathe: { jib: 0.006, level: -0.006 },
  });
}

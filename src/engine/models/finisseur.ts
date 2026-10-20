// Finisseur sur chenilles (≈ 18 t, classe Vögele Super 1800-3 / Dynapac SD2550) : trémie avant à ailes
// rabattables et rouleaux de poussée, tapis d'alimentation, caisse moteur, poste de conduite à deux sièges et
// pupitres latéraux sous toit télescopique, vis de répartition à l'arrière, table de pose tractée par deux
// bras (vérins de nivellement et de levage), sabots latéraux, passerelle et pupitres de table.
// Gabarit : 6,4 × 3,3 (trémie ouverte ; 2,5 table de base) × 3,9 m (toit relevé ; 3,2 m abaissé).
import * as THREE from 'three';
import { Kit, softPolygon, type MachineTemplate, type V3 } from './kit';
import { exhaust, track } from './parts';

const TR = 0.26; // rayon des roues de chenille
const TL = 3.3; // longueur de chenille
const TX = 0.2; // centre des chenilles
const TZ = 1.04; // demi-voie
const BW = 2.44; // largeur de la caisse
const BF = 0.92; // face avant de la caisse (profil, hors arrondi)
const BR = -1.4; // face arrière de la caisse
const DECK = 1.92; // plancher du poste (profil, hors arrondi)
/** Trémie : charnières des ailes (y, z), étendue en x, largeur et pente du fond des ailes. */
const HY = 0.7;
const HZ = 0.62;
const HX0 = 1.0;
const HX1 = 2.6;
const WL = 0.97;
const WS = 0.22;
/** Vis de répartition (x, y, rayon) et point de traction des bras de la table. */
const AX = -1.74;
const AY = 0.31;
const AR = 0.19;
const T: V3 = [0.7, 0.62, 0];
const ZA = 1.32; // bras de traction et vérins, à l'extérieur de la caisse
/** Table (repère des bras) : avant, arrière de la table de base, arrière de la passerelle. */
const SX0 = -2.78;
const SX1 = -3.65;
const SX2 = -4.05;
const ROOF = 3.7; // dessous du toit relevé

/** Spire de vis d'axe z (hélicoïde visible des deux côtés, normales analytiques), sens hand = ±1. */
function flight(k: Kit, part: number, x: number, y: number, z0: number, z1: number, rIn: number, rOut: number, pitch: number, hand: number): void {
  const turns = Math.abs(z1 - z0) / pitch;
  const n = Math.max(8, Math.round(turns * 22));
  const dz = (z1 - z0) / n;
  const da = (hand * 2 * Math.PI * turns) / n;
  const c = dz / da;
  const pos: number[] = [];
  const nor: number[] = [];
  const P = (r: number, i: number): THREE.Vector3 => new THREE.Vector3(x + r * Math.cos(i * da), y + r * Math.sin(i * da), z0 + i * dz);
  const N = (r: number, i: number, sg: number): THREE.Vector3 =>
    new THREE.Vector3(c * Math.sin(i * da), -c * Math.cos(i * da), r).normalize().multiplyScalar(sg * Math.sign(da));
  const tri = (v: [number, number][], sg: number) => {
    for (const [r, i] of v) {
      const p = P(r, i);
      const q = N(r, i, sg);
      pos.push(p.x, p.y, p.z);
      nor.push(q.x, q.y, q.z);
    }
  };
  for (let i = 0; i < n; i++) {
    tri([[rIn, i], [rOut, i], [rOut, i + 1]], 1);
    tri([[rIn, i], [rOut, i + 1], [rIn, i + 1]], 1);
    tri([[rIn, i], [rOut, i + 1], [rOut, i]], -1);
    tri([[rIn, i], [rIn, i + 1], [rOut, i + 1]], -1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  k.add(part, 'steel', g);
}

/**
 * Aile de trémie (s = −1 gauche, +1 droite), dans le repère de sa charnière : fond incliné vers l'extérieur,
 * paroi latérale à bord roulé, parois avant (basse côté intérieur) et arrière, nervure, chape du vérin.
 */
function wing(k: Kit, part: number, s: number): void {
  const len = HX1 - HX0;
  const a = Math.atan2(WS, WL);
  k.box(part, 'steelDark', [len, 0.035, Math.hypot(WL, WS)], [0, WS / 2, (s * WL) / 2], [-s * a, 0, 0]);
  k.box(part, 'paint', [len, 0.42, 0.04], [0, WS + 0.21, s * (WL + 0.02)]);
  k.cylX(part, 'paint', 0.03, len + 0.02, [0, WS + 0.43, s * (WL + 0.02)], 10);
  k.rbox(part, 'paint', [0.09, 0.38, 0.03], 0.012, [0, WS + 0.2, s * (WL + 0.055)], undefined, 1);
  // parois avant et arrière : profil dans le plan (largeur, hauteur), extrudé selon x
  const ry = -s * (Math.PI / 2);
  const front = softPolygon([[0, 0], [WL + 0.02, WS], [WL + 0.02, WS + 0.42], [0, 0.3]], 0.03);
  const back = softPolygon([[0, 0], [WL + 0.02, WS], [WL + 0.02, WS + 0.42], [0, WS + 0.42]], 0.03);
  k.extrude(part, 'paint', front, 0.04, [len / 2 - 0.02, 0, 0], [0, ry, 0], 0.006, 4);
  k.extrude(part, 'paint', back, 0.04, [-len / 2 + 0.02, 0, 0], [0, ry, 0], 0.006, 4);
  k.box(part, 'steelDark', [0.08, 0.14, 0.08], [len / 2 - 0.2, 0.05, s * 0.5]);
}

export function buildFinisseur(): MachineTemplate {
  const k = new Kit('finisseur');

  // ---------------------------------------------------------------- chenilles et châssis
  const under = k.part('under', 0, [TX, 0, 0]);
  for (const s of [-1, 1]) track(k, under, { length: TL, radius: TR, cy: TR + 0.0875, width: 0.32, z: s * TZ, rubber: true, rollers: 7 });
  const body = k.part('body', 0, [0, 0, 0]);
  for (const s of [-1, 1]) k.rbox(body, 'steelDark', [HX1 - BR + 0.1, 0.36, 0.14], 0.03, [(HX1 + BR) / 2 + 0.05, 0.5, s * 0.74], undefined, 2);
  for (const x of [-1.2, 0, 1.4, 2.45]) k.box(body, 'steelDark', [0.12, 0.2, 1.36], [x, 0.44, 0]);

  // ---------------------------------------------------------------- trémie : tapis, rouleaux de poussée
  for (const s of [-1, 1]) {
    k.box(body, 'black', [HX1 - HX0, 0.04, 0.56], [(HX0 + HX1) / 2, HY - 0.02, s * 0.31]);
    for (let i = 0; i < 10; i++) k.box(body, 'steelDark', [0.04, 0.025, 0.54], [HX0 + 0.08 + i * 0.16, HY + 0.005, s * 0.31]);
  }
  k.box(body, 'steelDark', [HX1 - HX0, 0.06, 0.06], [(HX0 + HX1) / 2, HY + 0.01, 0]);
  k.box(body, 'steelDark', [0.04, 0.26, 2 * HZ], [HX1 - 0.02, HY + 0.13, 0]);
  k.rbox(body, 'trim', [0.14, 0.34, 1.7], 0.03, [HX1 + 0.08, 0.52, 0], undefined, 2);
  for (const s of [-1, 1]) {
    k.cylZ(body, 'steelDark', 0.15, 0.5, [HX1 + 0.25, 0.52, s * 0.55], 20);
    k.cylZ(body, 'steel', 0.05, 0.62, [HX1 + 0.25, 0.52, s * 0.55], 10);
    for (const z of [0.27, 0.83]) k.box(body, 'trim', [0.26, 0.1, 0.05], [HX1 + 0.18, 0.52, s * z]);
  }

  // ---------------------------------------------------------------- caisse : moteur, tunnel, poste de conduite
  const prof = softPolygon(
    [
      [BF, 0.75],
      [BF, 1.55],
      [0.76, 1.98],
      [-0.22, 2.03],
      [-0.28, DECK],
      [BR, DECK],
      [BR, 0.75],
    ],
    0.1,
  );
  k.extrude(body, 'paint', prof, BW, [0, 0, 0], undefined, 0.04, 10);
  k.rbox(body, 'trim', [BF - BR + 0.12, 0.09, BW + 0.04], 0.025, [(BF + BR) / 2, 0.75, 0], undefined, 2);
  // flancs deux tons : panneau graphite bas (réservoirs), trappes de visite
  for (const s of [-1, 1]) {
    k.rbox(body, 'trim', [BF - BR + 0.04, 0.3, 0.02], 0.008, [(BF + BR) / 2, 0.96, s * (BW / 2 + 0.008)], undefined, 1);
    for (const x of [-0.95, 0.1]) k.box(body, 'black', [0.012, 0.22, 0.004], [x, 0.96, s * (BW / 2 + 0.019)]);
    k.cyl(body, 'steel', 0.05, 0.03, [0.6, 0.96, s * (BW / 2 + 0.03)], [Math.PI / 2, 0, 0], 14);
  }
  // bouches du tunnel de matériau (avant et arrière)
  k.box(body, 'black', [0.02, 0.3, 1.1], [BF + 0.045, 0.88, 0]);
  k.box(body, 'black', [0.02, 0.28, 1.1], [BR - 0.045, 0.92, 0]);
  // ouïes, plaque du code, grille de toit moteur, phares avant
  for (const s of [-1, 1]) {
    k.grille(body, [0.32, 1.55, s * (BW / 2)], 0.72, 0.36, 5, 'z', s);
    k.decal(body, 0.66, 0.165, [-0.8, 1.38, s * (BW / 2 + 0.002)], s > 0 ? 0 : Math.PI);
    k.lamp(body, [BF + 0.07, 1.72, s * 0.98], 0.13);
  }
  for (let i = 0; i < 6; i++) k.box(body, 'black', [0.05, 0.02, 1.5], [-0.05 + i * 0.12, 2.06 - i * 0.005, 0]);
  exhaust(k, body, [0.55, 2.04, 0.92], 1.12, 0.07);
  k.cyl(body, 'black', 0.12, 0.32, [0.55, 2.2, -0.92], undefined, 18);
  k.cyl(body, 'trim', 0.13, 0.04, [0.55, 2.38, -0.92], undefined, 18);
  // feux arrière, marchepieds aux angles arrière
  for (const s of [-1, 1]) {
    k.rbox(body, 'tail', [0.04, 0.1, 0.16], 0.015, [BR - 0.045, 1.62, s * 0.62], undefined, 1);
    for (const z of [0.9, 1.18]) k.box(body, 'trim', [0.05, 1.12, 0.04], [BR - 0.065, 1.38, s * z]);
    for (const y of [0.96, 1.32, 1.68]) k.box(body, 'black', [0.2, 0.03, 0.3], [BR - 0.12, y, s * 1.04]);
  }
  // plancher caillebotis, sièges et pupitres latéraux
  k.box(body, 'black', [1.12, 0.03, BW - 0.06], [(BR - 0.28) / 2, DECK + 0.055, 0]);
  for (const s of [-1, 1]) {
    const z = s * 0.68;
    k.rbox(body, 'trim', [0.34, 0.36, 0.4], 0.03, [-1.02, DECK + 0.25, z], undefined, 2);
    k.rbox(body, 'interior', [0.46, 0.1, 0.48], 0.04, [-1.0, DECK + 0.48, z], undefined, 2);
    k.rbox(body, 'interior', [0.1, 0.56, 0.46], 0.04, [-1.24, DECK + 0.79, z], [0, 0, 0.12], 2);
    k.box(body, 'trim', [0.1, 0.55, 0.1], [-0.55, DECK + 0.34, z]);
    k.rbox(body, 'trim', [0.34, 0.1, 0.56], 0.03, [-0.58, DECK + 0.64, z], [0, 0, 0.35], 2);
    k.box(body, 'glass', [0.16, 0.006, 0.24], [-0.6, DECK + 0.7, z - s * 0.08], [0, 0, 0.35]);
    k.cyl(body, 'black', 0.014, 0.12, [-0.54, DECK + 0.74, z + s * 0.14], [0, 0, 0.35], 8);
    k.sphere(body, 'black', 0.03, [-0.56, DECK + 0.8, z + s * 0.14], 10);
  }
  // garde-corps arrière du poste
  k.rail(body, 'trim', [[BR + 0.04, DECK + 0.08, -1.12], [BR + 0.04, DECK + 1.0, -1.12], [BR + 0.04, DECK + 1.0, 1.12], [BR + 0.04, DECK + 0.08, 1.12]], 0.022);
  k.rail(body, 'trim', [[BR + 0.04, DECK + 0.55, -1.12], [BR + 0.04, DECK + 0.55, 1.12]], 0.018);
  // fourreaux des montants du toit
  const posts: [number, number][] = [
    [-0.36, -1.12],
    [-0.36, 1.12],
    [BR + 0.04, -1.16],
    [BR + 0.04, 1.16],
  ];
  for (const [x, z] of posts) k.cyl(body, 'trim', 0.05, 1.02, [x, DECK + 0.55, z], undefined, 12);

  // ---------------------------------------------------------------- toit télescopique
  const roof = k.part('roof', body, [0, 0, 0]);
  k.joint('roof', roof, 'ty', 0);
  for (const [x, z] of posts) k.cyl(roof, 'steel', 0.036, 1.04, [x, ROOF - 0.5, z], undefined, 10);
  k.rbox(roof, 'trim', [2.08, 0.06, 2.64], 0.025, [-0.73, ROOF + 0.03, 0], undefined, 2);
  k.rbox(roof, 'paint', [2.0, 0.09, 2.56], 0.04, [-0.73, ROOF + 0.1, 0], undefined, 2);
  k.rbox(roof, 'paint', [1.7, 0.06, 2.2], 0.03, [-0.76, ROOF + 0.16, 0], undefined, 2);
  for (const s of [-1, 1]) {
    k.lamp(roof, [0.3, ROOF, s * 0.9], 0.12);
    k.lamp(roof, [-1.75, ROOF, s * 0.9], 0.11, Math.PI);
    k.lamp(roof, [-1.75, ROOF, s * 0.35], 0.11, Math.PI);
    k.mirror(roof, [0.28, ROOF - 0.04, s * 1.26], s, 0.12, 0.2);
  }
  k.beacon(roof, [-1.4, ROOF + 0.19, 0.8]);

  // ---------------------------------------------------------------- ailes de trémie et vérins
  for (const s of [-1, 1]) {
    const w = k.part(s < 0 ? 'wingL' : 'wingR', body, [(HX0 + HX1) / 2, HY, s * HZ]);
    k.joint(s < 0 ? 'wingL' : 'wingR', w, 'rx', 0);
    wing(k, w, s);
    k.cylX(body, 'steel', 0.03, HX1 - HX0, [(HX0 + HX1) / 2, HY, s * HZ], 10);
    const lx = (HX1 - HX0) / 2 - 0.2;
    k.piston(body, [body, [(HX0 + HX1) / 2 + lx, 0.4, s * HZ]], [w, [lx, 0, s * 0.5]], 0.06, 0.035);
  }

  // ---------------------------------------------------------------- vis de répartition
  k.cylZ(body, 'steelDark', 0.05, 2.5, [AX, AY, 0], 12);
  for (const s of [-1, 1]) flight(k, body, AX, AY, s * 0.12, s * 1.24, 0.05, AR, 0.38, s);
  k.rbox(body, 'trim', [0.26, 0.5, 0.2], 0.03, [AX + 0.1, 0.5, 0], undefined, 2);
  k.rbox(body, 'trim', [0.14, 0.14, 2.5], 0.03, [AX, 0.62, 0], undefined, 2);
  for (const s of [-1, 1]) {
    k.box(body, 'trim', [0.1, 0.36, 0.05], [AX, 0.44, s * 1.275]);
    k.cylZ(body, 'steelDark', 0.07, 0.07, [AX, AY, s * 1.27], 14);
    k.box(body, 'steelDark', [0.34, 0.12, 0.12], [(AX + BR) / 2, 0.62, s * 0.8]);
  }

  // ---------------------------------------------------------------- bras de traction et table de pose
  const screed = k.part('screed', 0, T);
  k.joint('screed', screed, 'rz', 0);
  const armEnd: [number, number] = [-2.85, -0.1];
  for (const s of [-1, 1]) {
    const len = Math.hypot(armEnd[0], armEnd[1]) + 0.1;
    k.rbox(screed, 'paint', [len, 0.2, 0.1], 0.03, [armEnd[0] / 2, armEnd[1] / 2, s * ZA], [0, 0, Math.atan2(armEnd[1], armEnd[0]) + Math.PI], 2);
    k.cylZ(screed, 'steel', 0.05, 0.22, [0, 0, s * (ZA - 0.03)], 12);
    k.box(screed, 'steelDark', [0.1, 0.08, 0.08], [-2.6, 0.04, s * ZA]);
    k.box(screed, 'steelDark', [0.2, 0.14, 0.14], [SX0 - 0.02, -0.06, s * 1.25]);
    // points d'articulation sur la caisse : chape du bras, chapes des vérins
    k.box(body, 'steelDark', [0.3, 0.3, 0.06], [T[0], T[1] + 0.06, s * 1.24]);
    k.box(body, 'steelDark', [0.14, 0.12, 0.14], [T[0], 1.52, s * 1.27]);
    k.box(body, 'steelDark', [0.14, 0.14, 0.14], [-1.3, 1.6, s * 1.27]);
  }
  // table de base : caisson, semelle lisseuse, dameur
  const sp = softPolygon(
    [
      [SX0, -0.55],
      [SX0, -0.05],
      [SX0 - 0.12, 0.1],
      [SX1 + 0.05, 0.1],
      [SX1, 0],
      [SX1, -0.55],
    ],
    0.06,
  );
  k.extrude(screed, 'paint', sp, 2.4, [0, 0, 0], undefined, 0.03, 8);
  k.box(screed, 'steelDark', [SX0 - SX1 + 0.06, 0.07, 2.44], [(SX0 + SX1) / 2, -0.585, 0]);
  k.box(screed, 'steel', [0.06, 0.1, 2.38], [SX0 + 0.04, -0.53, 0]);
  k.rbox(screed, 'trim', [0.5, 0.08, 2.2], 0.02, [(SX0 + SX1) / 2 - 0.1, 0.12, 0], undefined, 1);
  for (const s of [-1, 1]) for (const z of [0.35, 0.8]) k.box(screed, 'black', [0.26, 0.03, 0.03], [(SX0 + SX1) / 2 - 0.1, 0.175, s * z]);
  // sabots latéraux
  const gate = softPolygon(
    [
      [SX0 + 0.22, -0.62],
      [SX1 - 0.1, -0.62],
      [SX1 - 0.1, -0.16],
      [SX0 + 0.04, -0.16],
      [SX0 + 0.04, -0.4],
    ],
    0.04,
  );
  for (const s of [-1, 1]) k.extrude(screed, 'paint', gate, 0.03, [0, 0, s * 1.25], undefined, 0.006, 6);
  // passerelle arrière, garde-corps, pupitres de table et feux de gabarit
  k.box(screed, 'black', [SX1 - SX2, 0.03, 2.4], [(SX1 + SX2) / 2, -0.235, 0]);
  k.box(screed, 'steelDark', [0.03, 0.12, 2.4], [SX2, -0.2, 0]);
  for (const s of [-1, 1]) k.box(screed, 'steelDark', [SX1 - SX2, 0.12, 0.03], [(SX1 + SX2) / 2, -0.24, s * 1.2]);
  k.rail(screed, 'trim', [[SX2 + 0.04, -0.22, -1.12], [SX2 + 0.04, 0.6, -1.12], [SX2 + 0.04, 0.6, 1.12], [SX2 + 0.04, -0.22, 1.12]], 0.02);
  for (const s of [-1, 1]) {
    k.box(screed, 'trim', [0.06, 0.5, 0.06], [SX1 + 0.12, 0.33, s * 0.98]);
    k.rbox(screed, 'trim', [0.16, 0.26, 0.34], 0.03, [SX1 + 0.1, 0.66, s * 0.98], [0, 0, 0.45], 2);
    k.box(screed, 'glass', [0.006, 0.14, 0.2], [SX1 + 0.03, 0.68, s * 0.98], [0, 0, 0.45]);
    k.rbox(screed, 'amber', [0.06, 0.06, 0.06], 0.015, [SX2 + 0.04, 0.66, s * 1.12], undefined, 1);
  }

  // vérins de nivellement (points de traction) et de levage de la table
  for (const s of [-1, 1]) {
    k.piston(body, [body, [T[0], 1.52, s * ZA]], [screed, [0, 0.12, s * ZA]], 0.065, 0.04);
    k.piston(body, [body, [-1.3, 1.6, s * ZA]], [screed, [-2.6, 0.06, s * ZA]], 0.07, 0.042);
  }

  return k.build({
    refWeight: 18,
    minScale: 0.85,
    maxScale: 1.15,
    wake: [
      { pose: { wingL: 1.05, wingR: -1.05 }, dur: 1.7 },
      { pose: { screed: -0.1, roof: -0.7 }, dur: 1.6 },
      { pose: { screed: 0, roof: 0 }, dur: 1.5 },
      { pose: { wingL: 0, wingR: 0 }, dur: 1.5 },
    ],
    nod: [
      { pose: { wingL: 0.2, wingR: -0.2 }, dur: 0.5 },
      { pose: { wingL: 0, wingR: 0 }, dur: 0.5 },
    ],
    breathe: { wingL: 0.006, wingR: -0.006 },
  });
}

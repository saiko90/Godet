// Nacelle à ciseaux tout-terrain (≈ 3,8 t, classe Genie GS-3369 RT / Haulotte Compact 12 DX : hauteur de
// travail 12 m, plancher à 10 m) : châssis à quatre pneus à crampons, coffres latéraux, stabilisateurs aux
// quatre coins, protections de nids-de-poule, ciseaux à quatre étages (bras extérieurs et intérieurs, tubes de
// liaison, vérin de levage), plateforme à garde-corps et plinthes, extension coulissante, pupitre de commande.
// Gabarit : 3,12 m (3,7 m avec stabilisateurs) × 1,75 m × 2,59 m garde-corps levés, plancher à 1,47 m,
// empattement 2,29 m.
// Ciseaux : chaque étage est un X de deux paires de bras (a : extérieurs, b : intérieurs). Chaque bras est
// articulé sur le précédent (pied fixe arrière, pied avant glissant) : les liaisons valent θ, −2θ, 2θ, … puis θ
// pour la plateforme, toutes proportionnelles à θ : une interpolation linéaire entre deux poses garde la
// géométrie exacte à chaque instant.
import * as THREE from 'three';
import { Kit, roundedRect, type MachineTemplate, type Pose, type V3 } from './kit';
import { fender, wheel } from './parts';

const R = 0.33; // pneus 26 × 12
const TW = 0.3;
const ZW = 0.725; // demi-voie
const XA = 1.145; // demi-empattement
const L = 2.55; // entraxe d'un bras
const LEVELS = 4;
const XS = -1.25; // pieds fixes (arrière) des ciseaux
const YB = 0.82; // axe des pieds sur le châssis
const ZO = 0.6; // bras extérieurs
const ZI = 0.5; // bras intérieurs
const H0 = 0.125; // hauteur d'un étage replié
const TH0 = Math.asin(H0 / L);
const DECK = 0.15; // de l'axe des pieds de plateforme au dessus du plancher
const PL0 = -0.2; // plateforme : arrière (repère de la plateforme, axe des pieds en 0)
const PL1 = 2.59; // plateforme : avant
const PZ = 0.8; // demi-largeur de la plateforme
const RAIL = 1.1; // hauteur des garde-corps

/** Angle des bras pour une hauteur de plancher donnée (m). */
function thetaFor(floor: number): number {
  return Math.asin((floor - DECK - YB) / (LEVELS * L));
}

/** Valeurs des liaisons des ciseaux pour un angle θ des bras. */
function scissorPose(th: number): Pose {
  const p: Pose = {};
  for (let i = 0; i < LEVELS; i++) {
    p[`a${i}`] = i === 0 ? th : 2 * th;
    p[`b${i}`] = -2 * th;
  }
  p.deck = th;
  return p;
}

/** Paire de bras (côtés ±z) entre x0 et x1 du repère de la pièce, bouts arrondis. */
function armPair(k: Kit, part: number, x0: number, x1: number, z: number): void {
  const shape = roundedRect(x0 - 0.065, -0.06, x1 + 0.065, 0.06, 0.06);
  for (const s of [-1, 1]) k.extrude(part, 'paint', shape, 0.07, [0, 0, s * z], undefined, 0, 3);
}

/** Tube de liaison entre les deux côtés, avec ses axes qui dépassent. */
function crossTube(k: Kit, part: number, x: number, z: number, r = 0.045): void {
  k.cylZ(part, 'trim', r, 2 * z, [x, 0, 0], 14);
  k.cylZ(part, 'steel', 0.03, 2 * z + 0.12, [x, 0, 0], 10);
}

/** Tube droit entre deux points (sans rotule : lisses et montants de garde-corps). */
function bar(k: Kit, part: number, a: V3, b: V3, r: number): void {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const g = new THREE.CylinderGeometry(r, r, va.distanceTo(vb), 8, 1, true);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize()));
  const m = va.add(vb).multiplyScalar(0.5);
  k.add(part, 'steel', g, [m.x, m.y, m.z]);
}

/** Garde-corps : montants, lisses haute et intermédiaire le long d'une suite de points (x, z). */
function guardRail(k: Kit, part: number, pts: [number, number][], y0: number): void {
  for (let i = 0; i < pts.length; i++) {
    const [x, z] = pts[i];
    k.cyl(part, 'steel', 0.022, RAIL + 0.022, [x, y0 + RAIL / 2 + 0.011, z], undefined, 8);
    k.sphere(part, 'steel', 0.024, [x, y0 + RAIL + 0.022, z], 8);
    if (i === 0) continue;
    const [px, pz] = pts[i - 1];
    bar(k, part, [px, y0 + RAIL, pz], [x, y0 + RAIL, z], 0.022);
    bar(k, part, [px, y0 + RAIL * 0.52, pz], [x, y0 + RAIL * 0.52, z], 0.018);
  }
}

export function buildNacelleCiseaux(): MachineTemplate {
  const k = new Kit('nacelle_ciseaux');

  // ---------------------------------------------------------------- châssis
  const chassis = k.part('chassis', 0, [0, 0, 0]);
  k.rbox(chassis, 'paint', [2.8, 0.44, 1.1], 0.05, [0, 0.54, 0], undefined, 2);
  k.box(chassis, 'steelDark', [2.6, 0.08, 0.9], [0, 0.29, 0]);
  for (const x of [-XA, XA]) {
    k.cylZ(chassis, 'steelDark', 0.08, 2 * ZW - 0.2, [x, R, 0], 12);
    for (const s of [-1, 1]) {
      wheel(k, chassis, [x, R, s * ZW], R, TW, { side: s, rim: 'paint', tread: 'lug', lugs: 14 });
      fender(k, chassis, [x, R, s * ZW], R + 0.05, TW + 0.06, 0.35, Math.PI - 0.35, 'black', 0.035);
    }
  }
  // coffres latéraux entre les roues : moteur (droite, grille) et réservoirs (gauche), plaque du code
  for (const s of [-1, 1]) {
    k.rbox(chassis, 'paint', [1.5, 0.44, 0.3], 0.05, [0, 0.5, s * 0.71], undefined, 2);
    k.box(chassis, 'black', [1.52, 0.03, 0.32], [0, 0.28, s * 0.71]);
    k.decal(chassis, 0.56, 0.14, [-0.32, 0.56, s * 0.862], s > 0 ? 0 : Math.PI);
  }
  k.grille(chassis, [0.4, 0.55, 0.861], 0.5, 0.26, 4, 'z', 1);
  // portes des coffres : joints et poignées ; sortie d'échappement sous le coffre moteur
  for (const s of [-1, 1]) {
    k.box(chassis, 'black', [0.012, 0.36, 0.012], [0.08, 0.5, s * 0.862]);
    k.box(chassis, 'steel', [0.1, 0.025, 0.025], [-0.02, 0.62, s * 0.872]);
  }
  k.cyl(chassis, 'trim', 0.035, 0.24, [0.74, 0.36, 0.8], [Math.PI / 2, 0, 0], 10);
  k.cyl(chassis, 'chrome', 0.04, 0.05, [0.74, 0.36, 0.93], [Math.PI / 2, 0, 0], 10);
  k.cyl(chassis, 'steel', 0.045, 0.05, [0.4, 0.74, -0.71], undefined, 12);
  // pupitre de commande au sol (côté droit) : boîtier, clé, arrêt d'urgence
  k.rbox(chassis, 'trim', [0.3, 0.22, 0.06], 0.02, [-0.48, 0.52, 0.89], undefined, 1);
  k.cyl(chassis, 'tail', 0.035, 0.04, [-0.54, 0.55, 0.93], [Math.PI / 2, 0, 0], 12);
  k.box(chassis, 'steel', [0.03, 0.03, 0.03], [-0.4, 0.55, 0.93]);
  // pare-chocs, feux, gyrophares, anneaux d'arrimage
  for (const sx of [-1, 1]) {
    k.rbox(chassis, 'trim', [0.18, 0.3, 1.5], 0.04, [sx * 1.47, 0.5, 0], undefined, 2);
    for (const s of [-1, 1]) {
      if (sx > 0) k.lamp(chassis, [1.57, 0.55, s * 0.42], 0.1);
      else k.rbox(chassis, 'tail', [0.03, 0.08, 0.14], 0.012, [-1.565, 0.55, s * 0.42], undefined, 1);
      k.torus(chassis, 'steel', 0.04, 0.012, [sx * 1.565, 0.38, s * 0.62], [0, Math.PI / 2, 0], [6, 12]);
    }
  }
  k.beacon(chassis, [-1.47, 0.65, 0.52], 0.07);
  k.beacon(chassis, [1.47, 0.65, -0.52], 0.07);
  // chapes des pieds fixes et glissières des pieds avant
  for (const s of [-1, 1]) {
    k.box(chassis, 'trim', [0.24, 0.12, 0.05], [XS, YB - 0.06, s * (ZO + 0.065)]);
    k.box(chassis, 'trim', [0.55, 0.02, 0.09], [1.12, 0.755, s * (ZI - 0.07)]);
  }
  // échelle d'accès arrière
  for (const s of [-1, 1]) k.box(chassis, 'trim', [0.04, 1.08, 0.04], [-1.585, 0.86, s * 0.2]);
  for (let i = 0; i < 4; i++) k.box(chassis, 'black', [0.06, 0.03, 0.38], [-1.585, 0.48 + i * 0.25, 0]);

  // stabilisateurs aux quatre coins : fourreaux fixes, jambes et patins mobiles
  for (const sx of [-1, 1]) {
    for (const s of [-1, 1]) {
      k.rbox(chassis, 'trim', [0.15, 0.5, 0.15], 0.03, [sx * 1.66, 0.58, s * 0.6], undefined, 1);
      k.box(chassis, 'trim', [0.12, 0.12, 0.1], [sx * 1.58, 0.62, s * 0.6]);
    }
  }
  const jacks = k.part('jacks', chassis, [0, 0, 0]);
  k.joint('jacks', jacks, 'ty', 0);
  for (const sx of [-1, 1]) {
    for (const s of [-1, 1]) {
      k.cyl(jacks, 'chrome', 0.045, 0.3, [sx * 1.66, 0.3, s * 0.6], undefined, 12);
      k.cyl(jacks, 'steelDark', [0.12, 0.14], 0.05, [sx * 1.66, 0.155, s * 0.6], undefined, 18);
    }
  }
  // protections de nids-de-poule (descendent dès que la plateforme monte)
  const pothole = k.part('pothole', chassis, [0, 0, 0]);
  k.joint('pothole', pothole, 'ty', 0);
  for (const s of [-1, 1]) k.rbox(pothole, 'steelDark', [1.36, 0.08, 0.05], 0.015, [0, 0.25, s * 0.8], undefined, 1);

  // ---------------------------------------------------------------- ciseaux
  let parent = chassis;
  let at: V3 = [XS, YB, 0];
  const armsA: number[] = [];
  const armsB: number[] = [];
  for (let i = 0; i < LEVELS; i++) {
    // bras extérieurs : du pied arrière (axe) vers l'avant et le haut
    const a = k.part(`a${i}`, parent, at);
    k.joint(`a${i}`, a, 'rz', i === 0 ? TH0 : 2 * TH0);
    armPair(k, a, 0, L, ZO);
    crossTube(k, a, 0, ZO);
    crossTube(k, a, L, ZO);
    for (const s of [-1, 1]) k.cylZ(a, 'steel', 0.035, ZO - ZI + 0.12, [L / 2, 0, s * (ZO + ZI) / 2], 10);
    // bras intérieurs : articulés au centre, de l'arrière-haut (−L/2) vers l'avant-bas (+L/2)
    const b = k.part(`b${i}`, a, [L / 2, 0, 0]);
    k.joint(`b${i}`, b, 'rz', -2 * TH0);
    armPair(k, b, -L / 2, L / 2, ZI);
    armsA.push(a);
    armsB.push(b);
    parent = b;
    at = [-L / 2, 0, 0];
  }
  // galets du pied avant glissant (premier étage) et axe des pieds de plateforme (dernier étage)
  crossTube(k, armsB[0], L / 2, ZI, 0.04);
  for (const s of [-1, 1]) k.cylZ(armsB[0], 'steelDark', 0.055, 0.05, [L / 2, 0, s * (ZI - 0.07)], 14);
  crossTube(k, armsB[LEVELS - 1], -L / 2, ZI, 0.04);
  for (const s of [-1, 1]) k.cylZ(armsA[LEVELS - 1], 'steelDark', 0.06, 0.05, [L, 0, s * (ZO - 0.07)], 14);

  // ---------------------------------------------------------------- plateforme
  const deck = k.part('deck', armsB[LEVELS - 1], [-L / 2, 0, 0]);
  k.joint('deck', deck, 'rz', TH0);
  const len = PL1 - PL0;
  const xm = (PL0 + PL1) / 2;
  k.rbox(deck, 'paint', [len, 0.1, 2 * PZ], 0.025, [xm, 0.08, 0], undefined, 2);
  k.box(deck, 'trim', [len - 0.04, 0.02, 2 * PZ - 0.04], [xm, DECK - 0.01, 0]);
  // chapes et glissières sous le plancher
  for (const s of [-1, 1]) {
    k.box(deck, 'trim', [0.24, 0.1, 0.05], [0, 0.0, s * (ZI + 0.065)]);
    k.box(deck, 'trim', [0.62, 0.05, 0.08], [2.25, 0.02, s * (ZO - 0.07)]);
  }
  // plinthes (côtés et arrière ; l'avant est fermé par l'extension)
  for (const s of [-1, 1]) k.box(deck, 'paint', [len - 0.06, 0.15, 0.025], [xm + 0.02, DECK + 0.075, s * (PZ - 0.0125)]);
  k.box(deck, 'paint', [0.025, 0.15, 2 * PZ - 0.04], [PL0 + 0.0125, DECK + 0.075, 0]);
  // garde-corps latéraux et arrière avec portillon d'accès
  const xr = PL0 + 0.03;
  for (const s of [-1, 1]) {
    guardRail(k, deck, [[2.55, s * 0.78], [1.65, s * 0.78], [0.75, s * 0.78], [xr, s * 0.78], [xr, s * 0.3]], DECK);
  }
  for (const y of [DECK + RAIL, DECK + RAIL * 0.52]) bar(k, deck, [xr - 0.02, y, -0.27], [xr - 0.02, y, 0.27], 0.016);
  // pupitre de commande accroché à la lisse gauche
  k.rbox(deck, 'trim', [0.34, 0.2, 0.12], 0.025, [2.15, DECK + 0.96, -0.64], undefined, 2);
  k.box(deck, 'black', [0.04, 0.12, 0.08], [2.04, DECK + 1.05, -0.71]);
  k.box(deck, 'black', [0.04, 0.12, 0.08], [2.26, DECK + 1.05, -0.71]);
  k.cyl(deck, 'black', 0.012, 0.09, [2.22, DECK + 1.1, -0.64], undefined, 8);
  k.sphere(deck, 'black', 0.025, [2.22, DECK + 1.15, -0.64], 10);
  k.cyl(deck, 'tail', 0.028, 0.03, [2.07, DECK + 1.075, -0.64], undefined, 12);

  // extension coulissante vers l'avant
  const ext = k.part('extension', deck, [0, 0, 0]);
  k.joint('ext', ext, 'tx', 0);
  const e0 = 0.88;
  const e1 = 2.63;
  k.box(ext, 'trim', [e1 - e0, 0.025, 1.5], [(e0 + e1) / 2, DECK + 0.0125, 0]);
  k.box(ext, 'paint', [0.025, 0.15, 1.52], [e1, DECK + 0.075, 0]);
  for (const s of [-1, 1]) k.box(ext, 'paint', [e1 - e0, 0.15, 0.02], [(e0 + e1) / 2, DECK + 0.075, s * 0.75]);
  guardRail(k, ext, [[1.0, -0.735], [e1 - 0.02, -0.735], [e1 - 0.02, 0.735], [1.0, 0.735]], DECK);
  k.rbox(ext, 'black', [0.05, 0.06, 0.24], 0.015, [e1 - 0.04, DECK + RAIL - 0.08, 0], undefined, 1);

  // ---------------------------------------------------------------- vérin de levage (du pied fixe au 2e étage)
  k.piston(armsA[0], [armsA[0], [0, 0, 0]], [armsA[1], [L, 0, 0]], 0.085, 0.05);

  const half = thetaFor(3.5);
  const full = thetaFor(6.0);
  return k.build({
    refWeight: 3.8,
    minScale: 0.9,
    maxScale: 1.4,
    wake: [
      { pose: { jacks: -0.13 }, dur: 1.0 },
      { pose: { ...scissorPose(half), pothole: -0.15 }, dur: 1.8 },
      { pose: { ...scissorPose(full), ext: 1.0 }, dur: 1.8 },
      { pose: { ...scissorPose(TH0), ext: 0, pothole: 0 }, dur: 2.2 },
      { pose: { jacks: 0 }, dur: 0.9 },
    ],
    nod: [
      { pose: scissorPose(thetaFor(1.75)), dur: 0.5 },
      { pose: scissorPose(TH0), dur: 0.55 },
    ],
    // respiration : les amplitudes suivent les mêmes rapports (θ, −2θ, 2θ…), la plateforme monte de 1,5 cm
    breathe: scissorPose(0.0015),
  });
}

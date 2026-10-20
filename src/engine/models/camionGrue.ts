// Camion-grue trois essieux (6×4, ≈ 26 t) : porteur de chantier à cabine courte avancée, grue auxiliaire
// articulée derrière la cabine (classe Palfinger PK 23 / Hiab / Fassi, ≈ 21 t·m, deux rallonges hydrauliques)
// repliée en Z sur le pont (bras principal vers l'arrière, bras articulé dessous), stabilisateurs hydrauliques,
// pont plat à ridelles.
// Longueur 9,3 m, largeur 2,5 m (3,2 m aux rétroviseurs), hauteur 3,6 m aux gyrophares.
// Le porteur (cabine, châssis, essieux) est partagé avec le camion malaxeur et la pompe à béton.
import * as THREE from 'three';
import { Kit, beam2D, extrudeGeo, softPolygon, type MachineTemplate, type MatKey, type V3 } from './kit';
import { exhaust, wheel } from './parts';

// ==================================================================== porteur commun

/** Cotes communes des porteurs de chantier (m) : pneus 315/80 R22.5, cabine courte de 2,44 m de large. */
export const TRUCK = {
  /** Rayon des roues. */
  R: 0.53,
  /** Dessus des longerons. */
  frameTop: 1.13,
  /** Paroi arrière et face avant de la cabine (avant du pare-chocs : 4,26). */
  cabBack: 2.34,
  cabFront: 4.1,
  /** Bas de caisse, ligne de ceinture (bas des vitres), bas du toit. */
  cabBottom: 1.16,
  belt: 2.12,
  roof: 3.16,
  /** Demi-largeur de la cabine. */
  halfW: 1.22,
} as const;

export interface TruckOpts {
  /** Essieux avant directeurs (x, de l'avant vers l'arrière) : roues simples. */
  front: number[];
  /** Essieux arrière moteurs : roues jumelées. */
  rear: number[];
  /** Bout arrière des longerons. */
  tail: number;
  /** Protections latérales (deux côtés) : intervalles [x arrière, x avant] libres entre les roues. */
  guards: [number, number][];
  /** Réservoir de carburant (côté droit, z+) : [x arrière, x avant]. */
  tank: [number, number];
  /** Coffre à batteries (côté gauche, z−) : abscisse du centre. */
  batteryX: number;
  /** Pot d'échappement vertical derrière la cabine (côté gauche) : abscisse. */
  stackX: number;
}

/** Barre ou tube droit entre deux points (bras de rétroviseur, poignée, entretoise). */
export function bar(k: Kit, part: number, mat: MatKey, a: V3, b: V3, r: number, seg = 6): void {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const g = new THREE.CylinderGeometry(r, r, va.distanceTo(vb), seg);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize()));
  const m = va.add(vb).multiplyScalar(0.5);
  k.add(part, mat, g, [m.x, m.y, m.z]);
}

/** Poutre de section carrée (côté w) entre deux points (cadres, consoles, jambes de support). */
export function strut(k: Kit, part: number, mat: MatKey, a: V3, b: V3, w: number): void {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const g = new THREE.BoxGeometry(w, va.distanceTo(vb), w);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize()));
  const m = va.add(vb).multiplyScalar(0.5);
  k.add(part, mat, g, [m.x, m.y, m.z]);
}

/** Aile de roue noire légère (peu de segments) : arc extrudé sur la largeur, d'angle a0 à a1 autour de z. */
function arch(k: Kit, part: number, pos: V3, r: number, w: number, a0: number, a1: number): void {
  const s = new THREE.Shape();
  s.absarc(0, 0, r + 0.04, a0, a1, false);
  s.absarc(0, 0, r, a1, a0, true);
  s.closePath();
  k.extrude(part, 'black', s, w, pos, undefined, 0, 9);
}

/** Phare de travail économe tourné vers l'avant : boîtier et optique. */
function spot(k: Kit, part: number, pos: V3, size: number): void {
  k.box(part, 'trim', [size * 0.7, size * 0.75, size * 1.2], pos);
  k.box(part, 'lamp', [0.02, size * 0.55, size], [pos[0] + size * 0.36, pos[1], pos[2]]);
}

/** Cabine courte avancée : caisse basse, montants, toit, vitrages, intérieur, calandre, pare-chocs, rétroviseurs. */
function truckCab(k: Kit, p: number): void {
  const { cabBack: X0, cabFront: X1, cabBottom: Y0, belt: YB, roof: YR, halfW: HW } = TRUCK;
  const LEAN = 0.16; // recul du haut du pare-brise
  const XP = X1 - 0.06; // axe des montants avant au niveau de la ceinture
  const xPil = (y: number) => XP - (LEAN * (y - YB)) / (YR - YB);
  const rake = Math.atan2(LEAN, YR - YB);
  const B = 0.04; // bordure de l'extrusion (elle élargit le profil d'autant)
  const DX = X0 + 0.42; // arrière de la porte

  // caisse basse : profil latéral extrudé sur la largeur (face avant à peine inclinée)
  const lower = softPolygon(
    [
      [X0 + B, Y0 + B],
      [X1 - B, Y0 + B],
      [X1 - 0.03 - B, YB - B],
      [X0 + B, YB - B],
    ],
    0.07,
  );
  k.extrude(p, 'paint', lower, 2 * HW, [0, 0, 0], undefined, B, 8);
  // bloc arrière (montants arrière et paroi), montants avant inclinés, toit débordant bombé
  k.rbox(p, 'paint', [0.4, YR - YB + 0.04, 2 * HW], 0.04, [X0 + 0.2, (YB + YR) / 2, 0], undefined, 2);
  for (const s of [-1, 1]) {
    k.rbox(p, 'paint', [0.09, Math.hypot(LEAN, YR - YB) + 0.04, 0.08], 0.02, [XP - LEAN / 2, (YB + YR) / 2, s * (HW - 0.04)], [0, 0, rake], 1);
  }
  const rx0 = X0 - 0.02;
  const rx1 = xPil(YR) + 0.1;
  k.rbox(p, 'paint', [rx1 - rx0, 0.12, 2 * HW + 0.02], 0.05, [(rx0 + rx1) / 2, YR + 0.06, 0], undefined, 2);
  k.box(p, 'paint', [rx1 - rx0 - 0.34, 0.06, 2 * HW - 0.34], [(rx0 + rx1) / 2 - 0.06, YR + 0.13, 0]);

  // pare-brise en retrait des montants, joints noirs, essuie-glaces au repos
  {
    const yb = YB + 0.03;
    const yt = YR - 0.02;
    const g = new THREE.PlaneGeometry(2 * HW - 0.14, (yt - yb) / Math.cos(rake));
    g.rotateY(Math.PI / 2);
    g.rotateZ(rake);
    k.add(p, 'glass', g, [xPil((yb + yt) / 2) - 0.005, (yb + yt) / 2, 0]);
    for (const y of [YB + 0.015, YR - 0.01]) k.box(p, 'black', [0.05, 0.035, 2 * HW - 0.12], [xPil(y) + 0.005, y, 0], [0, 0, rake]);
    for (const z of [-0.42, 0.42]) k.box(p, 'black', [0.025, 0.025, 0.72], [xPil(YB + 0.07) + 0.02, YB + 0.07, z]);
  }
  // vitres de portes (trapèze suivant le montant) et leur joint noir
  for (const s of [-1, 1]) {
    const y0 = YB + 0.04;
    const y1 = YR - 0.04;
    const win: [number, number][] = [
      [DX + 0.03, y0],
      [xPil(y0) - 0.05, y0],
      [xPil(y1) - 0.05, y1],
      [DX + 0.03, y1],
    ];
    k.add(p, 'glass', new THREE.ShapeGeometry(softPolygon(win, 0.04), 3), [0, 0, s * (HW - 0.012)]);
    const seal = softPolygon(
      [
        [DX, YB],
        [xPil(YB) - 0.02, YB],
        [xPil(YR) - 0.02, YR],
        [DX, YR],
      ],
      0.05,
    );
    seal.holes.push(softPolygon(win, 0.04));
    k.extrude(p, 'black', seal, 0.012, [0, 0, s * (HW - 0.004)], undefined, 0, 3);
  }

  // intérieur sombre vu à travers les vitres : plancher, garnissages, tableau de bord, volant, sièges
  k.box(p, 'interior', [1.28, 0.02, 2 * HW - 0.1], [3.39, YB + 0.01, 0]);
  k.box(p, 'interior', [0.02, YR - YB, 2 * HW - 0.1], [X0 + 0.41, (YB + YR) / 2, 0]);
  k.box(p, 'interior', [1.28, 0.02, 2 * HW - 0.1], [3.39, YR - 0.012, 0]);
  const dash = softPolygon(
    [
      [3.56, YB],
      [3.98, YB],
      [3.94, YB + 0.2],
      [3.7, YB + 0.27],
      [3.58, YB + 0.18],
    ],
    0.04,
  );
  k.extrude(p, 'interior', dash, 2 * HW - 0.16, [0, 0, 0], undefined, 0, 3);
  {
    const wheelGeo = new THREE.TorusGeometry(0.21, 0.022, 5, 20);
    wheelGeo.rotateX(Math.PI / 2);
    wheelGeo.rotateZ(0.55);
    k.add(p, 'black', wheelGeo, [3.6, YB + 0.38, -0.6]);
    k.cyl(p, 'black', 0.03, 0.34, [3.7, YB + 0.24, -0.6], [0, 0, 0.55], 6);
  }
  for (const s of [-1, 1]) {
    k.rbox(p, 'interior', [0.14, 0.62, 0.5], 0.05, [2.98, YB + 0.31, s * 0.6], [0, 0, 0.12], 1);
    k.rbox(p, 'interior', [0.12, 0.2, 0.3], 0.05, [2.93, YB + 0.72, s * 0.6], [0, 0, 0.12], 1);
  }

  // face avant : calandre noire à lames peintes, barre chromée
  const gx = (y: number) => X1 - (0.03 * (y - Y0)) / (YB - Y0);
  const tilt = Math.atan2(0.03, YB - Y0);
  k.box(p, 'black', [0.03, 0.66, 1.62], [gx(1.64) + 0.006, 1.64, 0], [0, 0, tilt]);
  for (let i = 0; i < 5; i++) {
    const y = 1.38 + i * 0.12;
    k.box(p, 'paint', [0.03, 0.045, 1.52], [gx(y) + 0.022, y, 0], [0, 0, tilt]);
  }
  k.box(p, 'chrome', [0.025, 0.035, 1.68], [gx(2.0) + 0.014, 2.0, 0], [0, 0, tilt]);
  // pare-chocs acier trois pièces, phares protégés, clignotants, antibrouillards, crochet
  k.rbox(p, 'trim', [0.26, 0.38, 2 * HW + 0.04], 0.05, [X1 + 0.03, 0.97, 0], undefined, 2);
  for (const z of [-0.6, 0.6]) k.box(p, 'black', [0.02, 0.36, 0.03], [X1 + 0.165, 0.97, z]);
  k.box(p, 'steel', [0.08, 0.1, 0.18], [X1 + 0.18, 0.88, 0]);
  for (const s of [-1, 1]) {
    k.box(p, 'black', [0.03, 0.17, 0.44], [X1 + 0.16, 1.02, s * 0.88]);
    k.box(p, 'lamp', [0.03, 0.12, 0.38], [X1 + 0.168, 1.02, s * 0.88]);
    for (const dz of [-0.1, 0.1]) k.box(p, 'black', [0.015, 0.16, 0.015], [X1 + 0.185, 1.02, s * 0.88 + dz]);
    k.box(p, 'amber', [0.03, 0.07, 0.13], [X1 + 0.163, 1.02, s * 1.15]);
    k.cylX(p, 'trim', 0.06, 0.05, [X1 + 0.16, 0.86, s * 0.36], 12);
    k.cylX(p, 'lamp', 0.048, 0.02, [X1 + 0.18, 0.86, s * 0.36], 12);
  }

  // côtés : marchepieds devant la roue, joints de porte, poignées, plaque du code, déflecteurs d'angle
  for (const s of [-1, 1]) {
    const z = s * HW;
    for (const x of [3.5, 3.96]) k.box(p, 'trim', [0.03, 0.66, 0.26], [x, 0.84, s * 1.1]);
    k.box(p, 'trim', [0.46, 0.66, 0.03], [3.73, 0.84, s * 0.98]);
    for (const y of [0.58, 0.9]) k.box(p, 'black', [0.43, 0.035, 0.24], [3.73, y, s * 1.1]);
    for (const x of [DX, 3.98]) k.box(p, 'black', [0.012, YB - Y0 - 0.12, 0.006], [x, (Y0 + YB) / 2 + 0.03, z + s * 0.002]);
    k.box(p, 'steel', [0.16, 0.03, 0.035], [DX + 0.14, YB - 0.16, z + s * 0.016]);
    // poignée de montée le long de l'avant de la porte
    const zh = z + s * 0.06;
    bar(k, p, 'steel', [3.88, 1.35, zh], [3.88, 1.95, zh], 0.016);
    for (const y of [1.36, 1.94]) bar(k, p, 'steel', [3.88, y, z], [3.88, y, zh], 0.014);
    k.decal(p, 0.62, 0.155, [3.2, 1.62, z + s * 0.004], s > 0 ? 0 : Math.PI);
    k.box(p, 'amber', [0.1, 0.05, 0.02], [3.72, 1.42, z + s * 0.008]);
    const ym = (YB + YR) / 2 - 0.04;
    k.box(p, 'trim', [0.17, YR - YB - 0.14, 0.03], [xPil(ym) - 0.05, ym, s * (HW + 0.018)], [0, 0, rake]);
    // rétroviseurs principal et grand-angle sur leur potence
    const zm = s * (HW + 0.3);
    const zb = zm - s * 0.09;
    bar(k, p, 'trim', [xPil(2.95), 2.95, z], [4.01, 2.98, zb], 0.018);
    bar(k, p, 'trim', [xPil(2.28), 2.28, z], [4.01, 2.26, zb], 0.018);
    bar(k, p, 'trim', [4.01, 2.98, zb], [4.01, 2.26, zb], 0.016);
    k.rbox(p, 'trim', [0.08, 0.42, 0.2], 0.03, [4.02, 2.72, zm], undefined, 1);
    k.box(p, 'mirror', [0.008, 0.36, 0.16], [3.977, 2.72, zm]);
    k.rbox(p, 'trim', [0.08, 0.22, 0.2], 0.03, [4.02, 2.36, zm], undefined, 1);
    k.box(p, 'mirror', [0.008, 0.17, 0.16], [3.977, 2.36, zm]);
  }
  // pare-soleil, rétroviseur avant (côté passager), rampe de toit : gyrophares et phares
  k.rbox(p, 'black', [0.34, 0.04, 2 * HW - 0.16], 0.015, [xPil(YR) + 0.13, YR, 0], [0, 0, -0.32], 1);
  bar(k, p, 'trim', [xPil(YR) + 0.06, YR + 0.12, 0.98], [4.16, YR + 0.12, 0.98], 0.015);
  bar(k, p, 'trim', [4.16, YR + 0.12, 0.98], [4.22, YR + 0.02, 0.98], 0.015);
  k.rbox(p, 'trim', [0.24, 0.05, 0.22], 0.02, [4.22, YR - 0.02, 0.98], [0, 0, -0.3], 1);
  k.rbox(p, 'trim', [0.16, 0.06, 1.9], 0.02, [3.5, YR + 0.2, 0], undefined, 1);
  for (const s of [-1, 1]) k.box(p, 'trim', [0.08, 0.06, 0.06], [3.5, YR + 0.15, s * 0.7]);
  k.beacon(p, [3.5, YR + 0.23, -0.82], 0.085);
  k.beacon(p, [3.5, YR + 0.23, 0.82], 0.085);
  for (const z of [-0.3, 0.3]) spot(k, p, [3.57, YR + 0.3, z], 0.13);
  // prise d'air sur la paroi arrière (côté droit)
  k.rbox(p, 'black', [0.12, 1.1, 0.34], 0.04, [X0 - 0.06, 2.74, 0.86], undefined, 1);
  k.rbox(p, 'trim', [0.26, 0.1, 0.38], 0.03, [X0 - 0.05, 3.32, 0.86], undefined, 1);
}

/** Porteur complet : cabine, longerons, essieux et roues, équipements latéraux et arrière (sur la pièce p). */
export function truckChassis(k: Kit, p: number, o: TruckOpts): void {
  const { R } = TRUCK;
  truckCab(k, p);

  // longerons et traverses
  const xf = 3.92;
  const len = xf - o.tail;
  for (const s of [-1, 1]) k.box(p, 'trim', [len, 0.27, 0.08], [(xf + o.tail) / 2, 0.995, s * 0.43]);
  const nc = Math.round(len / 1.4);
  for (let i = 0; i <= nc; i++) k.box(p, 'trim', [0.09, 0.2, 0.78], [o.tail + 0.1 + (i * (len - 0.4)) / nc, 1.0, 0]);

  // essieux avant : poutre, ressorts à lames, barre de direction, roues simples, ailes
  o.front.forEach((x, i) => {
    k.box(p, 'steelDark', [0.12, 0.13, 1.72], [x, R - 0.02, 0]);
    k.cylZ(p, 'steelDark', 0.03, 1.7, [x - 0.22, R - 0.06, 0], 6);
    for (const s of [-1, 1]) {
      k.box(p, 'steelDark', [0.16, 0.12, 0.12], [x, 0.63, s * 0.43]);
      k.rbox(p, 'steelDark', [1.3, 0.09, 0.09], 0.03, [x, 0.73, s * 0.43], undefined, 1);
      for (const dx of [-0.6, 0.6]) k.box(p, 'trim', [0.06, 0.14, 0.08], [x + dx, 0.8, s * 0.43]);
      k.cyl(p, 'trim', 0.035, 0.36, [x + 0.24, 0.72, s * 0.52], undefined, 6);
      wheel(k, p, [x, R, s * 1.02], R, 0.36, { side: s, rim: 'steel', tread: 'road', rimRatio: 0.66 });
      // premier essieu : passage de roue sous la cabine ; suivants : aile noire et bavette
      if (i === 0) arch(k, p, [x, R, s * 1.02], R + 0.05, 0.42, 0.35, Math.PI - 0.12);
      else {
        arch(k, p, [x, R, s * 1.02], R + 0.06, 0.44, 0.2, Math.PI - 0.2);
        k.box(p, 'black', [0.02, 0.38, 0.4], [x - 0.6, 0.5, s * 1.02]);
      }
    }
  });

  // essieux arrière : ponts, roues jumelées, bogie, garde-boue et bavettes
  for (const x of o.rear) {
    k.cylZ(p, 'steelDark', 0.11, 1.56, [x, R, 0], 12);
    k.rbox(p, 'steelDark', [0.42, 0.4, 0.5], 0.08, [x, R, 0], undefined, 1);
    for (const s of [-1, 1]) wheel(k, p, [x, R, s * 0.86], R, 0.3, { side: s, rim: 'steel', tread: 'road', rimRatio: 0.66, dual: true });
  }
  const xa = o.rear[0];
  const xb = o.rear[o.rear.length - 1];
  const xm = (xa + xb) / 2;
  for (const s of [-1, 1]) {
    k.rbox(p, 'steelDark', [xa - xb + 0.5, 0.11, 0.1], 0.03, [xm, 0.72, s * 0.5], undefined, 1);
    for (const x of o.rear) k.box(p, 'steelDark', [0.16, 0.06, 0.12], [x, 0.64, s * 0.5]);
    k.box(p, 'trim', [0.4, 0.3, 0.12], [xm, 0.86, s * 0.5]);
    k.box(p, 'black', [xa - xb + 1.3, 0.04, 0.78], [xm, R + 0.63, s * 0.86]);
    for (const x of [xa + 0.65, xb - 0.65]) k.box(p, 'black', [0.03, 0.2, 0.74], [x, R + 0.53, s * 0.86]);
    k.box(p, 'black', [0.02, 0.66, 0.62], [xb - 0.64, 0.64, s * 0.86]);
  }

  // protections latérales et feux de gabarit
  for (const [g0, g1] of o.guards) {
    for (const s of [-1, 1]) {
      for (const y of [0.5, 0.78]) k.box(p, 'trim', [g1 - g0, 0.07, 0.04], [(g0 + g1) / 2, y, s * 1.17]);
      for (const x of [g0 + 0.1, g1 - 0.1]) {
        k.box(p, 'trim', [0.05, 0.42, 0.05], [x, 0.7, s * 1.13]);
        k.box(p, 'trim', [0.05, 0.05, 0.68], [x, 0.89, s * 0.8]);
      }
      k.box(p, 'amber', [0.08, 0.04, 0.03], [(g0 + g1) / 2, 0.78, s * 1.2]);
    }
  }
  // réservoir (droite), coffre à batteries (gauche), réservoir d'air
  const [t0, t1] = o.tank;
  k.cylX(p, 'steel', 0.3, t1 - t0, [(t0 + t1) / 2, 0.86, 0.86], 20);
  for (const x of [t0 + 0.12, t1 - 0.12]) k.cylX(p, 'trim', 0.31, 0.05, [x, 0.86, 0.86], 20);
  k.cyl(p, 'black', 0.06, 0.05, [t1 - 0.25, 1.18, 0.86], undefined, 10);
  for (const x of [t0 + 0.12, t1 - 0.12]) k.box(p, 'trim', [0.07, 0.1, 0.14], [x, 0.98, 0.53]);
  k.rbox(p, 'trim', [0.66, 0.46, 0.4], 0.04, [o.batteryX, 0.86, -0.78], undefined, 1);
  k.box(p, 'trim', [0.5, 0.06, 0.14], [o.batteryX, 0.72, -0.53]);
  k.box(p, 'black', [0.6, 0.02, 0.36], [o.batteryX, 1.1, -0.78]);
  k.cylX(p, 'steel', 0.12, 0.7, [o.batteryX, 0.74, -0.3], 12);

  // échappement : pot vertical derrière la cabine, tenu par un collier sur la paroi arrière
  exhaust(k, p, [o.stackX, 1.12, -1.02], 2.2, 0.075);
  k.cylZ(p, 'trim', 0.07, 0.56, [o.stackX, 1.08, -0.75], 10);
  k.box(p, 'trim', [TRUCK.cabBack - o.stackX, 0.05, 0.05], [(TRUCK.cabBack + o.stackX) / 2, 2.8, -1.02]);

  // arrière : barre anti-encastrement, rampe de feux, plaque
  const xt = o.tail;
  k.box(p, 'trim', [0.1, 0.12, 2.3], [xt - 0.05, 0.52, 0]);
  for (const s of [-1, 1]) k.box(p, 'trim', [0.08, 0.36, 0.08], [xt + 0.02, 0.72, s * 0.43]);
  k.box(p, 'trim', [0.08, 0.2, 2.3], [xt - 0.02, 0.86, 0]);
  for (const s of [-1, 1]) {
    k.rbox(p, 'tail', [0.05, 0.13, 0.3], 0.02, [xt - 0.075, 0.86, s * 0.86], undefined, 1);
    k.box(p, 'amber', [0.05, 0.1, 0.11], [xt - 0.075, 0.86, s * 1.08]);
    k.box(p, 'lamp', [0.04, 0.08, 0.1], [xt - 0.07, 0.86, s * 0.6]);
  }
  k.box(p, 'black', [0.012, 0.14, 0.52], [xt - 0.07, 0.86, 0]);
}

// ==================================================================== grue auxiliaire

/** Profil de bras polygonal (hauteur h, largeur w, arêtes chanfreinées) le long de x, de x0 à x1, centré en y. */
function polyBeam(k: Kit, part: number, mat: MatKey, x0: number, x1: number, y: number, h: number, w: number): void {
  const c = Math.min(h, w) * 0.3;
  const shape = softPolygon(
    [
      [-w / 2, -h / 2 + c],
      [-w / 2 + c, -h / 2],
      [w / 2 - c, -h / 2],
      [w / 2, -h / 2 + c],
      [w / 2, h / 2 - c],
      [w / 2 - c, h / 2],
      [-w / 2 + c, h / 2],
      [-w / 2, h / 2 - c],
    ],
    0.012,
  );
  const g = extrudeGeo(shape, x1 - x0, 0, 3);
  g.rotateY(Math.PI / 2);
  k.add(part, mat, g, [(x0 + x1) / 2, y, 0]);
}

export function buildCamionGrue(): MachineTemplate {
  const k = new Kit('camion_grue');
  const chassis = k.part('chassis', 0, [0, 0, 0]);
  truckChassis(k, chassis, {
    front: [2.95],
    rear: [-1.95, -3.3],
    tail: -4.85,
    guards: [[-1.35, 0.3]],
    tank: [0.42, 1.38],
    batteryX: 0.95,
    stackX: 2.22,
  });

  // ---------------------------------------------------------------- pont plat à ridelles
  const BX0 = -4.95; // arrière du pont
  const BX1 = 1.04; // avant du pont
  const FLOOR = 1.4; // dessus du plancher
  const BL = BX1 - BX0;
  const BC = (BX0 + BX1) / 2;
  for (const s of [-1, 1]) k.box(chassis, 'trim', [BL - 0.1, 0.12, 0.1], [BC, 1.19, s * 0.43]);
  for (let i = 0; i <= 10; i++) k.box(chassis, 'trim', [0.08, 0.1, 2.4], [BX0 + 0.12 + (i * (BL - 0.24)) / 10, 1.3, 0]);
  k.box(chassis, 'steelDark', [BL, 0.05, 2.42], [BC, FLOOR - 0.025, 0]);
  for (const s of [-1, 1]) k.box(chassis, 'trim', [BL, 0.15, 0.06], [BC, FLOOR - 0.07, s * 1.22]);
  k.box(chassis, 'trim', [0.06, 0.15, 2.5], [BX0, FLOOR - 0.07, 0]);
  // ridelles peintes : deux panneaux par côté, ridelles arrière et avant ; rainures, ranchers, verrous
  const SH = 0.5; // hauteur des ridelles
  const panel = (x0: number, x1: number, z: number, along: 'x' | 'z') => {
    const l = Math.abs(x1 - x0);
    const c = (x0 + x1) / 2;
    if (along === 'x') {
      k.box(chassis, 'paint', [l - 0.03, SH, 0.04], [c, FLOOR + SH / 2, z]);
      for (const y of [0.17, 0.33]) k.box(chassis, 'trim', [l - 0.08, 0.012, 0.045], [c, FLOOR + y, z]);
      k.box(chassis, 'paint', [l - 0.03, 0.04, 0.06], [c, FLOOR + SH - 0.02, z]);
    } else {
      k.box(chassis, 'paint', [0.04, SH, l - 0.03], [z, FLOOR + SH / 2, c]);
      for (const y of [0.17, 0.33]) k.box(chassis, 'trim', [0.045, 0.012, l - 0.08], [z, FLOOR + y, c]);
      k.box(chassis, 'paint', [0.06, 0.04, l - 0.03], [z, FLOOR + SH - 0.02, c]);
    }
  };
  for (const s of [-1, 1]) {
    const z = s * 1.2;
    panel(BX0, BC, z, 'x');
    panel(BC, BX1, z, 'x');
    for (const x of [BX0 + 0.04, BC, BX1 - 0.04]) k.box(chassis, 'trim', [0.07, SH + 0.06, 0.07], [x, FLOOR + SH / 2 + 0.02, z + s * 0.02]);
    for (const x of [BX0 + 0.25, BC - 0.2, BC + 0.2, BX1 - 0.25]) k.box(chassis, 'black', [0.1, 0.05, 0.03], [x, FLOOR + SH - 0.08, z + s * 0.03]);
  }
  panel(-1.18, 1.18, BX0 + 0.02, 'z');
  panel(-1.18, 1.18, BX1 - 0.02, 'z');
  // support de flèche (repose-grue) sur le plancher
  k.box(chassis, 'trim', [0.14, 0.98, 0.14], [-1.42, FLOOR + 0.49, 0]);
  k.box(chassis, 'trim', [0.5, 0.06, 0.5], [-1.42, FLOOR + 0.03, 0]);
  k.rbox(chassis, 'rubber', [0.32, 0.06, 0.36], 0.02, [-1.42, FLOOR + 1.0, 0], undefined, 1);
  for (const s of [-1, 1]) bar(k, chassis, 'trim', [-1.42, FLOOR + 0.6, 0], [-1.42, FLOOR + 0.04, s * 0.22], 0.025);
  // feux de gabarit arrière du pont
  for (const s of [-1, 1]) k.box(chassis, 'amber', [0.03, 0.05, 0.08], [BX0 - 0.03, FLOOR - 0.07, s * 1.1]);

  // ---------------------------------------------------------------- embase de la grue (fixe)
  const CX = 1.65; // axe de rotation de la colonne
  const BASE_Y = 1.48; // dessus du caisson des stabilisateurs
  k.box(chassis, 'trim', [0.9, 0.08, 0.92], [CX, 1.17, 0]);
  k.rbox(chassis, 'paint', [0.44, 0.3, 2.1], 0.03, [CX, 1.33, 0], undefined, 2);
  // carter du mécanisme d'orientation (crémaillère) devant la colonne
  k.cylZ(chassis, 'paint', 0.14, 1.24, [CX + 0.3, 1.62, 0], 16);
  for (const s of [-1, 1]) k.cylZ(chassis, 'trim', 0.15, 0.05, [CX + 0.3, 1.62, s * 0.64], 16);
  k.box(chassis, 'paint', [0.3, 0.1, 0.8], [CX + 0.18, 1.5, 0]);
  // réservoir d'huile et pupitres de commande des deux côtés
  k.rbox(chassis, 'trim', [0.46, 0.42, 0.3], 0.04, [CX - 0.02, 0.95, -0.62], undefined, 1);
  k.cyl(chassis, 'steel', 0.04, 0.06, [CX + 0.1, 1.19, -0.62], undefined, 8);
  for (const s of [-1, 1]) {
    k.box(chassis, 'trim', [0.32, 0.12, 0.1], [CX + 0.3, 1.12, s * 0.98]);
    for (let i = 0; i < 5; i++) {
      const x = CX + 0.17 + i * 0.065;
      bar(k, chassis, 'black', [x, 1.16, s * 1.0], [x, 1.33, s * 1.08], 0.011, 5);
      k.box(chassis, 'black', [0.035, 0.05, 0.035], [x, 1.34, s * 1.085]);
    }
  }

  // stabilisateurs : poutres télescopiques transversales, vérins verticaux, patins
  const stab = (s: number, name: string, leg: string) => {
    const beam = k.part(name, chassis, [CX, 1.33, 0]);
    k.joint(name, beam, 'tz', 0);
    k.box(beam, 'paint', [0.3, 0.2, 1.0], [0, 0, s * 0.56]);
    k.box(beam, 'trim', [0.34, 0.26, 0.06], [0, 0, s * 1.06]);
    k.cyl(beam, 'paint', 0.1, 0.6, [0, -0.04, s * 1.15], undefined, 14);
    k.cyl(beam, 'trim', 0.115, 0.06, [0, 0.27, s * 1.15], undefined, 14);
    k.cyl(beam, 'trim', 0.11, 0.05, [0, -0.33, s * 1.15], undefined, 14);
    const foot = k.part(leg, beam, [0, 0, s * 1.15]);
    k.joint(leg, foot, 'ty', 0);
    k.cyl(foot, 'chrome', 0.065, 1.0, [0, -0.36, 0], undefined, 10);
    k.cyl(foot, 'trim', [0.12, 0.17], 0.07, [0, -0.88, 0], undefined, 16);
    k.cyl(foot, 'steelDark', 0.08, 0.06, [0, -0.83, 0], undefined, 10);
  };
  stab(-1, 'stabG', 'piedG');
  stab(1, 'stabD', 'piedD');

  // ---------------------------------------------------------------- colonne orientable
  const column = k.part('column', chassis, [CX, BASE_Y, 0]);
  k.joint('slew', column, 'ry', 0);
  k.cyl(column, 'steelDark', [0.34, 0.37], 0.12, [0, 0.06, 0], undefined, 24);
  const colProfile = softPolygon(
    [
      [-0.3, 0.1],
      [0.24, 0.1],
      [0.17, 1.3],
      [0.02, 1.64],
      [-0.24, 1.6],
      [-0.3, 1.2],
    ],
    0.08,
  );
  k.extrude(column, 'paint', colProfile, 0.46, [0, 0, 0], undefined, 0.03, 8);
  k.cylZ(column, 'trim', 0.14, 0.56, [-0.1, 1.47, 0], 16);
  k.cylZ(column, 'steel', 0.05, 0.62, [-0.1, 1.47, 0], 10);
  k.box(column, 'trim', [0.12, 0.16, 0.22], [-0.33, 0.2, 0]);
  k.cylZ(column, 'steel', 0.035, 0.28, [-0.33, 0.2, 0], 8);
  for (const s of [-1, 1]) k.decal(column, 0.4, 0.1, [0.0, 0.72, s * 0.235], s > 0 ? 0 : Math.PI);
  // flexibles du distributeur vers la flèche
  for (const z of [-0.16, 0.16]) k.hose(column, 'rubber', [[0.15, 0.2, z], [0.2, 0.7, z * 1.2], [0.12, 1.25, z * 1.3], [-0.05, 1.68, z]], 0.02, 12);

  // ---------------------------------------------------------------- bras principal (couché vers l'arrière)
  // Repère retourné (rotation de π autour de y) : x le long du bras, angle positif = levée.
  const L1 = 3.6;
  const boom = k.part('boom', column, [-0.1, 1.47, 0], [0, Math.PI, 0]);
  k.joint('boom', boom, 'rz', 0);
  const bm = beam2D([0, 0], [1.8, 0.03], [L1, 0], 0.2, 0.15, 0.02);
  k.extrude(boom, 'paint', bm.shape, 0.3, [0, 0, 0], undefined, 0.03, 10);
  k.cylZ(boom, 'trim', 0.15, 0.4, [0, 0, 0], 16);
  k.rbox(boom, 'paint', [0.34, 0.22, 0.32], 0.04, [L1 - 0.04, -0.16, 0], undefined, 1);
  k.cylZ(boom, 'trim', 0.12, 0.4, [L1, -0.2, 0], 14);
  k.cylZ(boom, 'steel', 0.045, 0.44, [L1, -0.2, 0], 8);
  k.box(boom, 'trim', [0.2, 0.12, 0.22], [0.5, -0.2, 0]);
  k.box(boom, 'trim', [0.2, 0.1, 0.22], [2.0, 0.2, 0]);
  for (const z of [-0.18, -0.21]) {
    const pts: V3[] = [];
    for (const t of [0.05, 0.3, 0.55, 0.8, 0.95]) {
      const e = bm.edge(t, 1, -0.06);
      pts.push([e.x, e.y, z]);
    }
    k.hose(boom, 'rubber', pts, 0.016, 16);
  }

  // ---------------------------------------------------------------- bras articulé replié sous le bras principal
  // Repère retourné de π autour de z (au repos : x vers l'avant, y vers le bas) ; angle positif = dépliage.
  const jib = k.part('jib', boom, [L1, -0.2, 0], [0, 0, Math.PI]);
  k.joint('jib', jib, 'rz', 0);
  const JY = 0.18; // axe du profil sous l'articulation
  polyBeam(k, jib, 'paint', -0.08, 2.5, JY, 0.3, 0.26);
  polyBeam(k, jib, 'trim', 2.47, 2.53, JY, 0.33, 0.29);
  k.rbox(jib, 'paint', [0.3, 0.26, 0.3], 0.04, [0.05, 0.08, 0], undefined, 1);
  k.cylZ(jib, 'trim', 0.11, 0.42, [0, 0, 0], 14);
  // biellette de commande : deux flasques vers l'axe du vérin d'articulation
  const lever = softPolygon(
    [
      [0.1, 0.06],
      [-0.06, 0.1],
      [-0.52, -0.42],
      [-0.42, -0.52],
      [0.06, -0.08],
    ],
    0.05,
  );
  for (const z of [-0.12, 0.12]) k.extrude(jib, 'paint', lever, 0.04, [0, 0, z], undefined, 0.008, 4);
  k.cylZ(jib, 'steel', 0.05, 0.3, [-0.46, -0.46, 0], 8);
  // rallonges hydrauliques emboîtées
  const ext1 = k.part('ext1', jib, [0, JY, 0]);
  k.joint('tele1', ext1, 'tx', 0);
  polyBeam(k, ext1, 'paint', 0.6, 2.64, 0, 0.24, 0.2);
  polyBeam(k, ext1, 'trim', 2.61, 2.66, 0, 0.27, 0.23);
  const ext2 = k.part('ext2', ext1, [0, 0, 0]);
  k.joint('tele2', ext2, 'tx', 0);
  polyBeam(k, ext2, 'paint', 0.8, 2.78, 0, 0.19, 0.16);
  k.rbox(ext2, 'trim', [0.14, 0.22, 0.2], 0.03, [2.82, 0.02, 0], undefined, 1);
  k.cylZ(ext2, 'steel', 0.04, 0.24, [2.84, 0.1, 0], 8);

  // crochet : suspendu à la dernière rallonge, gardé vertical par sa liaison (compense levée et dépliage)
  const hook = k.part('hook', ext2, [2.84, 0.1, 0], [0, 0, Math.PI]);
  k.joint('hook', hook, 'rz', 0);
  k.torus(hook, 'steel', 0.045, 0.014, [0, -0.04, 0], [Math.PI / 2, 0, 0], [5, 12]);
  k.cyl(hook, 'steelDark', 0.04, 0.1, [0, -0.13, 0], undefined, 10);
  k.rbox(hook, 'paint', [0.15, 0.2, 0.09], 0.03, [0, -0.28, 0], undefined, 1);
  k.cyl(hook, 'steel', 0.025, 0.1, [0, -0.42, 0], undefined, 8);
  k.torus(hook, 'steel', 0.075, 0.026, [0.0, -0.53, 0], [0, 0, 0.9], [6, 14], Math.PI * 1.45);
  k.box(hook, 'black', [0.012, 0.12, 0.02], [0.065, -0.5, 0], [0, 0, -0.4]);

  // ---------------------------------------------------------------- vérins
  k.piston(column, [column, [-0.33, 0.2, 0]], [boom, [0.5, -0.24, 0]], 0.13, 0.08);
  k.piston(boom, [boom, [2.0, 0.24, 0]], [jib, [-0.46, -0.46, 0]], 0.09, 0.055);

  // Le crochet suit la somme levée + dépliage, au signe près : il reste vertical.
  const B_UP = 1.2;
  const J_OUT = 1.55;
  return k.build({
    refWeight: 26,
    minScale: 0.9,
    maxScale: 1.08,
    wake: [
      { pose: { stabG: -0.85, stabD: 0.85, piedG: -0.42, piedD: -0.42 }, dur: 1.1 },
      { pose: { boom: B_UP, hook: -B_UP }, dur: 1.5 },
      { pose: { jib: J_OUT, hook: -B_UP - J_OUT, tele1: 1.0, tele2: 1.0, slew: -0.75 }, dur: 2.0 },
      { pose: { jib: 0, hook: -B_UP, tele1: 0, tele2: 0, slew: 0 }, dur: 1.7 },
      { pose: { boom: 0, hook: 0, stabG: 0, stabD: 0, piedG: 0, piedD: 0 }, dur: 1.6 },
    ],
    nod: [
      { pose: { boom: 0.06, hook: -0.06 }, dur: 0.5 },
      { pose: { boom: 0, hook: 0 }, dur: 0.5 },
    ],
    breathe: { hook: 0.05 },
  });
}

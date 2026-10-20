// Grue à tour à montage automatisé (classe Liebherr 42 K / Potain Igo T 70) en position de transport : châssis
// sur essieu de transport tandem et timon, quatre stabilisateurs repliés le long du châssis, plate-forme tournante
// lestée de blocs, tour télescopique en treillis couchée vers l'arrière sur le lest, flèche en treillis repliée
// sur la tour, chariot et moufle en bout de flèche. Longueur 11,8 m (timon compris), largeur 2,5 m, hauteur 3,7 m.
import * as THREE from 'three';
import { Kit, softPolygon, type MachineTemplate, type MatKey, type V3 } from './kit';
import { wheel } from './parts';

/** Poutre de section carrée (côté w) entre deux points. */
function strut(k: Kit, part: number, mat: MatKey, a: V3, b: V3, w: number): void {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const g = new THREE.BoxGeometry(w, va.distanceTo(vb), w);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize()));
  const m = va.add(vb).multiplyScalar(0.5);
  k.add(part, mat, g, [m.x, m.y, m.z]);
}

/**
 * Treillis droit le long de x, de x0 à x1 : membrures aux coins de la section (positions [y, z], dans l'ordre du
 * contour) et, sur chaque face, diagonales en zigzag (Warren) avec montants aux nœuds.
 */
function lattice(k: Kit, part: number, mat: MatKey, x0: number, x1: number, corners: [number, number][], chord: number, brace: number, panel: number): void {
  const n = Math.max(1, Math.round((x1 - x0) / panel));
  const dx = (x1 - x0) / n;
  for (const [y, z] of corners) k.box(part, mat, [x1 - x0, chord, chord], [(x0 + x1) / 2, y, z]);
  corners.forEach(([ya, za], i) => {
    const [yb, zb] = corners[(i + 1) % corners.length];
    for (let j = 0; j <= n; j++) {
      const x = x0 + j * dx;
      strut(k, part, mat, [x, ya, za], [x, yb, zb], brace);
      if (j < n) {
        const flip = (j + i) % 2 === 0;
        strut(k, part, mat, [x, flip ? ya : yb, flip ? za : zb], [x + dx, flip ? yb : ya, flip ? zb : za], brace);
      }
    }
  });
}

export function buildGrueTour(): MachineTemplate {
  const k = new Kit('grue_tour');
  const R = 0.5; // roues de l'essieu de transport (385/55 R22.5)
  const base = k.part('base', 0, [0, 0, 0]);

  // ---------------------------------------------------------------- châssis (croix de base repliée)
  k.rbox(base, 'paint', [4.3, 0.5, 1.4], 0.04, [-0.15, 0.87, 0], undefined, 2);
  k.box(base, 'trim', [4.34, 0.06, 1.44], [-0.15, 1.1, 0]);
  for (const s of [-1, 1]) k.decal(base, 0.62, 0.155, [0.9, 0.84, s * 0.702], s > 0 ? 0 : Math.PI);
  // couronne d'orientation et plate-forme tournante (bloquée en transport)
  k.cyl(base, 'steelDark', 0.72, 0.1, [0, 1.17, 0], undefined, 32);
  k.box(base, 'trim', [4.0, 0.18, 2.1], [-0.25, 1.31, 0]);
  k.box(base, 'paint', [4.04, 0.05, 2.14], [-0.25, 1.4, 0]);

  // lest : deux rangées de blocs à l'arrière de la plate-forme, retenus par des ranchers
  for (const y of [1.535, 1.775]) {
    for (const s of [-1, 1]) k.rbox(base, 'steel', [1.4, 0.24, 1.02], 0.03, [-1.5, y, s * 0.525], undefined, 1);
  }
  for (const s of [-1, 1]) k.box(base, 'trim', [0.06, 0.52, 0.06], [-0.78, 1.66, s * 1.02]);
  // armoire électrique (gyrophare, phare de travail), treuil de levage
  k.rbox(base, 'paint', [0.5, 0.75, 0.42], 0.03, [0.5, 1.78, 0.76], undefined, 1);
  k.box(base, 'black', [0.01, 0.6, 0.34], [0.755, 1.78, 0.76]);
  k.grille(base, [0.5, 1.98, 0.975], 0.3, 0.2, 4, 'z', 1);
  k.box(base, 'steel', [0.03, 0.08, 0.03], [0.77, 1.82, 0.62]);
  k.beacon(base, [0.5, 2.15, 0.86], 0.08);
  k.box(base, 'trim', [0.12, 0.1, 0.16], [0.68, 2.2, 0.66]);
  k.box(base, 'lamp', [0.02, 0.07, 0.12], [0.745, 2.2, 0.66]);
  k.cylZ(base, 'steelDark', 0.22, 0.5, [-0.3, 1.66, -0.62], 18);
  for (const z of [-0.37, -0.87]) k.cylZ(base, 'trim', 0.25, 0.03, [-0.3, 1.66, z], 18);
  k.cyl(base, 'trim', 0.12, 0.34, [-0.3, 1.66, -0.2], [Math.PI / 2, 0, 0], 12);
  // paliers de pied de tour
  const foot = softPolygon(
    [
      [1.12, 1.4],
      [1.78, 1.4],
      [1.62, 2.02],
      [1.3, 2.02],
    ],
    0.06,
  );
  for (const s of [-1, 1]) k.extrude(base, 'paint', foot, 0.06, [0, 0, s * 0.56], undefined, 0.01, 4);
  k.cylZ(base, 'steel', 0.05, 1.26, [1.45, 1.9, 0], 10);

  // ---------------------------------------------------------------- essieu de transport tandem, feux, timon
  k.box(base, 'trim', [2.3, 0.16, 0.9], [-2.05, 0.6, 0]);
  for (const x of [-1.4, -2.55]) {
    k.cylZ(base, 'steelDark', 0.08, 1.86, [x, R, 0], 10);
    for (const s of [-1, 1]) wheel(k, base, [x, R, s * 0.95], R, 0.38, { side: s, rim: 'steel', tread: 'road', rimRatio: 0.62 });
  }
  for (const s of [-1, 1]) {
    k.rbox(base, 'steelDark', [1.45, 0.1, 0.1], 0.03, [-1.975, 0.62, s * 0.5], undefined, 1);
    k.box(base, 'black', [2.4, 0.03, 0.24], [-1.975, 1.05, s * 1.04]);
    k.box(base, 'trim', [0.05, 0.05, 0.6], [-1.975, 1.02, s * 0.75]);
    k.box(base, 'black', [0.02, 0.4, 0.36], [-3.14, 0.62, s * 0.95]);
  }
  k.box(base, 'trim', [0.1, 0.18, 2.2], [-3.22, 0.72, 0]);
  for (const s of [-1, 1]) {
    k.rbox(base, 'tail', [0.04, 0.12, 0.28], 0.02, [-3.28, 0.74, s * 0.82], undefined, 1);
    k.box(base, 'amber', [0.04, 0.09, 0.1], [-3.28, 0.74, s * 1.03]);
    for (const x of [-1.0, 0.8]) k.box(base, 'amber', [0.08, 0.04, 0.03], [x, 0.74, s * 0.712]);
  }
  k.box(base, 'black', [0.01, 0.13, 0.5], [-3.275, 0.74, 0]);
  // timon en A, anneau d'attelage, béquille avant
  for (const s of [-1, 1]) strut(k, base, 'trim', [1.9, 0.78, s * 0.45], [3.5, 0.8, s * 0.07], 0.11);
  k.rbox(base, 'trim', [0.4, 0.14, 0.2], 0.03, [3.6, 0.8, 0], undefined, 1);
  k.torus(base, 'steel', 0.09, 0.03, [3.88, 0.8, 0], [Math.PI / 2, 0, 0], [6, 16]);
  k.cyl(base, 'trim', 0.045, 0.72, [3.48, 0.42, 0], undefined, 8);
  k.box(base, 'trim', [0.26, 0.03, 0.26], [3.48, 0.035, 0]);
  k.cylZ(base, 'black', 0.02, 0.2, [3.48, 0.66, 0.12], 6);

  // ---------------------------------------------------------------- stabilisateurs repliés le long du châssis
  const OY = 1.18;
  const stab = (name: string, pad: string, x: number, s: number, dir: number) => {
    const arm = k.part(name, base, [x, OY, s * 0.8]);
    k.joint(name, arm, 'ry', 0);
    k.cyl(arm, 'trim', 0.12, 0.3, [0, 0, 0], undefined, 12);
    k.box(arm, 'paint', [1.64, 0.22, 0.2], [dir * 0.86, 0, 0]);
    k.cyl(arm, 'paint', 0.08, 0.56, [dir * 1.72, 0.0, 0], undefined, 12);
    k.cyl(arm, 'trim', 0.095, 0.05, [dir * 1.72, 0.3, 0], undefined, 12);
    const jack = k.part(pad, arm, [dir * 1.72, 0, 0]);
    k.joint(pad, jack, 'ty', 0);
    k.cyl(jack, 'chrome', 0.045, 1.0, [0, -0.43, 0], undefined, 8);
    k.cyl(jack, 'trim', [0.17, 0.21], 0.06, [0, -0.88, 0], undefined, 16);
  };
  stab('stabAvG', 'patinAvG', 1.82, -1, -1);
  stab('stabAvD', 'patinAvD', 1.82, 1, -1);
  stab('stabArG', 'patinArG', -2.22, -1, 1);
  stab('stabArD', 'patinArD', -2.22, 1, 1);

  // ---------------------------------------------------------------- tour télescopique (couchée vers l'arrière)
  // Repère retourné (π autour de y) : x du pied vers la tête, y vers le haut au repos ; angle positif = levée.
  const tower = k.part('tower', base, [1.45, 1.9, 0], [0, Math.PI, 0]);
  k.joint('raise', tower, 'rz', 0);
  const TL = 7.9; // élément extérieur
  lattice(
    k,
    tower,
    'paint',
    0.3,
    TL,
    [
      [0.05, 0.45],
      [0.95, 0.45],
      [0.95, -0.45],
      [0.05, -0.45],
    ],
    0.09,
    0.045,
    0.95,
  );
  // élément intérieur sorti d'un mètre, tête de tour
  lattice(
    k,
    tower,
    'paint',
    TL - 0.3,
    TL + 1.0,
    [
      [0.14, 0.36],
      [0.86, 0.36],
      [0.86, -0.36],
      [0.14, -0.36],
    ],
    0.07,
    0.04,
    0.65,
  );
  k.rbox(tower, 'paint', [0.3, 0.98, 1.0], 0.03, [0.15, 0.5, 0], undefined, 1);
  for (const s of [-1, 1]) k.box(tower, 'paint', [0.3, 0.3, 0.06], [0.05, 0.12, s * 0.47]);
  k.cylZ(tower, 'trim', 0.1, 1.08, [0, 0, 0], 12);
  k.rbox(tower, 'paint', [0.32, 0.86, 0.86], 0.03, [TL + 1.12, 0.5, 0], undefined, 1);
  for (const s of [-1, 1]) k.box(tower, 'paint', [0.36, 0.14, 0.06], [TL + 1.12, 0.98, s * 0.4]);
  k.cylZ(tower, 'trim', 0.07, 0.92, [TL + 1.12, 1.0, 0], 10);
  for (const s of [-1, 1]) k.box(tower, 'trim', [0.16, 0.12, 0.08], [1.6, -0.02, s * 0.3]);
  // vérins de relevage de la tour, de la plate-forme au treillis
  for (const s of [-1, 1]) k.piston(base, [base, [1.25, 1.45, s * 0.3]], [tower, [1.6, -0.06, -s * 0.3]], 0.085, 0.05);

  // ---------------------------------------------------------------- flèche repliée sur la tour
  // Retournée par rapport à la tour : au repos x vers l'avant (le long de la tour), y vers le haut ; positif = dépliage.
  const JL = 9.8;
  const jib = k.part('jib', tower, [TL + 1.12, 1.0, 0], [0, Math.PI, 0]);
  k.joint('jib', jib, 'rz', 0);
  lattice(
    k,
    jib,
    'paint',
    0.25,
    JL,
    [
      [0.05, 0.36],
      [0.68, 0],
      [0.05, -0.36],
    ],
    0.075,
    0.04,
    0.9,
  );
  for (const s of [-1, 1]) k.extrude(jib, 'paint', softPolygon([[-0.12, -0.06], [0.42, 0.0], [0.4, 0.2], [0.0, 0.14]], 0.04), 0.05, [0, 0, s * 0.4], undefined, 0.01, 4);
  k.cylZ(jib, 'steel', 0.05, 0.9, [0, 0, 0], 8);
  k.rbox(jib, 'paint', [0.3, 0.62, 0.7], 0.03, [JL + 0.1, 0.36, 0], undefined, 1);
  k.cylZ(jib, 'steelDark', 0.16, 0.08, [JL + 0.2, 0.3, 0], 16);
  // tirants de flèche couchés le long de la membrure supérieure
  for (const s of [-1, 1]) strut(k, jib, 'trim', [0.4, 0.72, s * 0.05], [5.6, 0.72, s * 0.05], 0.03);

  // chariot en bout de flèche, moufle suspendu (liaison opposée au tangage de la flèche : reste vertical)
  const trolley = k.part('trolley', jib, [JL - 0.3, 0, 0]);
  k.box(trolley, 'paint', [0.56, 0.12, 0.86], [0, -0.07, 0]);
  for (const s of [-1, 1]) for (const dx of [-0.18, 0.18]) k.cylZ(trolley, 'steel', 0.05, 0.05, [dx, 0.02, s * 0.36], 10);
  k.cylZ(trolley, 'steelDark', 0.08, 0.2, [0, -0.17, 0], 12);
  const hook = k.part('hook', trolley, [0, -0.17, 0]);
  k.joint('hook', hook, 'rz', 0);
  for (const s of [-1, 1]) k.box(hook, 'black', [0.012, 0.36, 0.012], [0, -0.2, s * 0.06]);
  for (const s of [-1, 1]) k.rbox(hook, 'paint', [0.32, 0.36, 0.05], 0.04, [0, -0.52, s * 0.09], undefined, 1);
  k.cylZ(hook, 'steelDark', 0.13, 0.12, [0, -0.5, 0], 14);
  k.cyl(hook, 'steel', 0.03, 0.14, [0, -0.76, 0], undefined, 8);
  k.torus(hook, 'steel', 0.09, 0.03, [0.0, -0.9, 0], [0, 0, 0.9], [6, 16], Math.PI * 1.45);

  // Le moufle compense le tangage de la flèche : hook = raise − jib.
  return k.build({
    refWeight: 24,
    minScale: 0.85,
    maxScale: 1.12,
    wake: [
      {
        pose: { stabAvG: -1.3, stabAvD: 1.3, stabArG: 1.3, stabArD: -1.3, patinAvG: -0.24, patinAvD: -0.24, patinArG: -0.24, patinArD: -0.24 },
        dur: 1.4,
      },
      { pose: { raise: 0.55, hook: 0.55 }, dur: 1.7 },
      { pose: { raise: 1.0, jib: 0.5, hook: 0.5 }, dur: 1.6 },
      { pose: { raise: 0, jib: 0, hook: 0 }, dur: 2.1 },
      { pose: { stabAvG: 0, stabAvD: 0, stabArG: 0, stabArD: 0, patinAvG: 0, patinAvD: 0, patinArG: 0, patinArD: 0 }, dur: 1.0 },
    ],
    nod: [
      { pose: { raise: 0.05, hook: 0.05 }, dur: 0.55 },
      { pose: { raise: 0, hook: 0 }, dur: 0.55 },
    ],
    breathe: { hook: 0.05 },
  });
}

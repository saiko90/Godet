// Pompe à béton automotrice quatre essieux (8×4, ≈ 32 t) : flèche de 36 m en quatre bras repliés en Z sur le
// porteur (classe Schwing S 36 X / Putzmeister M 36 : bras de 7,7 + 7,2 + 7,0 + 8,4 m), tourelle derrière la cabine,
// tuyau de refoulement le long des bras, flexible de bout, stabilisateurs avant en X télescopiques et arrière
// pivotants, trémie à agitateur, cylindres de pompage, réservoir d'eau. Longueur 11,2 m, largeur 2,5 m, hauteur 3,9 m.
import { Kit, beam2D, softPolygon, type MachineTemplate, type V3 } from './kit';
import { TRUCK, bar, truckChassis } from './camionGrue';

/** Bras de flèche : longueur (axe à axe), hauteurs au pied et en bout, largeur, axe du profil au-dessus de son
 * articulation (o), articulation suivante au-dessus de l'axe (kn). */
interface Arm {
  L: number;
  h0: number;
  h1: number;
  w: number;
  o: number;
  kn: number;
}

const ARMS: Arm[] = [
  { L: 7.7, h0: 0.54, h1: 0.4, w: 0.38, o: 0, kn: 0.15 },
  { L: 7.2, h0: 0.44, h1: 0.32, w: 0.34, o: 0.32, kn: 0.13 },
  { L: 7.0, h0: 0.36, h1: 0.28, w: 0.3, o: 0.27, kn: 0.12 },
  { L: 8.4, h0: 0.28, h1: 0.22, w: 0.26, o: 0.23, kn: 0 },
];
/** Tuyau de refoulement : côté gauche (z monde). */
const PIPE_Z = -0.36;

export function buildPompeBeton(): MachineTemplate {
  const k = new Kit('pompe_beton');
  const chassis = k.part('chassis', 0, [0, 0, 0]);
  truckChassis(k, chassis, {
    front: [2.95, 1.1],
    rear: [-3.05, -4.4],
    tail: -6.2,
    guards: [[-1.95, -0.62]],
    tank: [-0.4, 0.42],
    batteryX: 0.0,
    stackX: 2.26,
  });
  const { frameTop: FT } = TRUCK;

  // ---------------------------------------------------------------- caisson des stabilisateurs avant
  const SX = 1.47; // axe de la tourelle
  k.box(chassis, 'trim', [1.0, 0.05, 1.0], [SX, FT + 0.025, 0]);
  k.rbox(chassis, 'paint', [1.05, 0.57, 1.9], 0.04, [SX, 1.465, 0], undefined, 1);
  for (const s of [-1, 1]) k.decal(chassis, 0.6, 0.15, [SX, 1.48, s * 0.952], s > 0 ? 0 : Math.PI);

  // stabilisateurs avant en X : poutres télescopiques diagonales, vérins verticaux, patins
  const BETA = 1.16; // angle des poutres (66°) depuis l'avant vers le côté
  const frontStab = (s: number, name: string, leg: string, y: number) => {
    const beam = k.part(name, chassis, [SX, y, 0], [0, -s * BETA, 0]);
    k.joint(name, beam, 'tx', 0);
    k.box(beam, 'paint', [2.1, 0.22, 0.24], [0.1, 0, 0]);
    k.box(beam, 'trim', [0.06, 0.26, 0.28], [1.15, 0, 0]);
    k.cyl(beam, 'paint', 0.11, 0.8, [1.2, 0.0, 0], undefined, 14);
    k.cyl(beam, 'trim', 0.125, 0.06, [1.2, 0.42, 0], undefined, 14);
    const foot = k.part(leg, beam, [1.2, 0, 0]);
    k.joint(leg, foot, 'ty', 0);
    k.cyl(foot, 'chrome', 0.07, 1.1, [0, 0.6 - y + 0.62, 0], undefined, 10);
    k.cyl(foot, 'trim', [0.13, 0.19], 0.07, [0, 0.6 - y + 0.035, 0], undefined, 16);
  };
  frontStab(-1, 'stabAvG', 'piedAvG', 1.36);
  frontStab(1, 'stabAvD', 'piedAvD', 1.6);

  // stabilisateurs arrière pivotants : bras le long du châssis au repos
  const RY = 1.38;
  const rearStab = (s: number, name: string, leg: string) => {
    const arm = k.part(name, chassis, [-0.55, RY, s * 0.93]);
    k.joint(name, arm, 'ry', 0);
    k.cyl(arm, 'trim', 0.13, 0.32, [0, 0, 0], undefined, 14);
    k.box(arm, 'paint', [1.6, 0.22, 0.2], [-0.84, 0, 0]);
    k.cyl(arm, 'paint', 0.1, 0.75, [-1.65, -0.02, 0], undefined, 14);
    k.cyl(arm, 'trim', 0.115, 0.06, [-1.65, 0.37, 0], undefined, 14);
    const foot = k.part(leg, arm, [-1.65, 0, 0]);
    k.joint(leg, foot, 'ty', 0);
    k.cyl(foot, 'chrome', 0.065, 1.0, [0, 0.6 - RY + 0.55, 0], undefined, 10);
    k.cyl(foot, 'trim', [0.12, 0.18], 0.07, [0, 0.6 - RY + 0.035, 0], undefined, 16);
  };
  rearStab(-1, 'stabArG', 'piedArG');
  rearStab(1, 'stabArD', 'piedArD');
  for (const s of [-1, 1]) k.box(chassis, 'trim', [0.3, 0.2, 0.5], [-0.55, RY - 0.12, s * 0.66]);

  // ---------------------------------------------------------------- groupe de pompage arrière
  // réservoir d'huile (gauche) et coffre à outils (droite) derrière le caisson avant
  for (const s of [-1, 1]) k.box(chassis, 'trim', [1.1, 0.12, 0.5], [0.27, FT + 0.06, s * 0.72]);
  k.rbox(chassis, 'trim', [1.1, 0.6, 0.38], 0.04, [0.27, 1.55, -0.76], undefined, 1);
  k.cyl(chassis, 'steel', 0.05, 0.06, [0.6, 1.88, -0.76], undefined, 8);
  k.rbox(chassis, 'paint', [1.1, 0.6, 0.38], 0.04, [0.27, 1.55, 0.76], undefined, 1);
  for (const x of [-0.05, 0.6]) k.box(chassis, 'steel', [0.12, 0.03, 0.03], [x, 1.7, 0.96]);
  // vérins d'entraînement, boîte à eau, cylindres de pompage
  for (const z of [-0.17, 0.17]) {
    k.cylX(chassis, 'steelDark', 0.09, 1.6, [-2.15, 1.3, z], 12);
    k.cylX(chassis, 'chrome', 0.05, 0.4, [-1.15, 1.3, z], 8);
    k.cylX(chassis, 'steelDark', 0.125, 2.1, [-4.4, 1.3, z], 16);
    for (const x of [-3.5, -5.3]) k.cylX(chassis, 'trim', 0.14, 0.06, [x, 1.3, z], 16);
  }
  k.rbox(chassis, 'paint', [0.4, 0.46, 0.64], 0.03, [-3.15, 1.38, 0], undefined, 1);
  k.box(chassis, 'trim', [5.0, 0.06, 0.7], [-3.1, FT + 0.03, 0]);
  // réservoir d'eau au-dessus des vérins, sur ses berceaux
  k.rbox(chassis, 'paint', [1.9, 0.52, 1.2], 0.06, [-1.95, 1.81, 0], undefined, 2);
  for (const x of [-1.2, -2.7]) k.box(chassis, 'trim', [0.08, 0.36, 0.6], [x, 1.4, 0]);
  k.cyl(chassis, 'black', 0.08, 0.05, [-2.5, 2.08, 0.3], undefined, 10);
  // trémie à agitateur, creuse : flancs trapézoïdaux, parois inclinées (peau peinte, doublure sombre), arbre à
  // pales sous la grille, moteur d'agitateur, bavette
  const hopper = softPolygon(
    [
      [-5.6, 1.15],
      [-6.2, 1.15],
      [-6.48, 1.62],
      [-5.44, 1.62],
    ],
    0.04,
  );
  for (const s of [-1, 1]) {
    k.extrude(chassis, 'paint', hopper, 0.03, [0, 0, s * 0.92], undefined, 0, 4);
    k.extrude(chassis, 'steelDark', hopper, 0.02, [0, 0, s * 0.895], undefined, 0, 4);
  }
  const wall = (x0: number, y0: number, x1: number, y1: number) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const tilt = Math.atan2(x0 - x1, y1 - y0);
    const inward = Math.sign((x0 + x1) / 2 + 5.9) * -0.022; // doublure côté intérieur
    k.box(chassis, 'paint', [0.03, len, 1.86], [(x0 + x1) / 2, (y0 + y1) / 2, 0], [0, 0, tilt]);
    k.box(chassis, 'steelDark', [0.02, len, 1.8], [(x0 + x1) / 2 + inward, (y0 + y1) / 2, 0], [0, 0, tilt]);
  };
  wall(-5.6, 1.15, -5.44, 1.62);
  wall(-6.2, 1.15, -6.48, 1.62);
  k.box(chassis, 'paint', [0.62, 0.03, 1.86], [-5.9, 1.16, 0]);
  k.box(chassis, 'steelDark', [0.6, 0.02, 1.8], [-5.9, 1.185, 0]);
  k.cylZ(chassis, 'steel', 0.045, 1.82, [-5.92, 1.4, 0], 10);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI * 2) / 3;
    const z = -0.7 + i * 0.28;
    k.box(chassis, 'steel', [0.05, 0.36, 0.1], [-5.92 + Math.sin(a) * 0.12, 1.4 + Math.cos(a) * 0.12, z], [0, 0, -a]);
  }
  for (let i = 0; i < 6; i++) k.box(chassis, 'trim', [1.0, 0.03, 0.03], [-5.96, 1.64, -0.75 + i * 0.3]);
  k.box(chassis, 'trim', [0.04, 0.03, 1.84], [-5.96, 1.64, 0]);
  k.cylZ(chassis, 'steelDark', 0.1, 0.24, [-5.92, 1.4, 1.06], 12);
  k.rbox(chassis, 'rubber', [0.05, 0.22, 1.7], 0.02, [-6.5, 1.72, 0], undefined, 1);
  // support arrière de la flèche
  for (const s of [-1, 1]) k.box(chassis, 'trim', [0.1, 2.18 - FT - 0.06, 0.1], [-5.2, (2.18 + FT + 0.06) / 2, s * 0.62]);
  k.box(chassis, 'trim', [0.14, 0.08, 1.34], [-5.2, 2.2, 0]);
  k.rbox(chassis, 'rubber', [0.3, 0.05, 0.42], 0.02, [-5.2, 2.245, 0], undefined, 1);
  // conduite de refoulement le long du châssis, jusqu'à la tourelle
  bar(k, chassis, 'steel', [-5.48, 1.3, -0.2], [-5.3, 1.45, -0.45], 0.07, 10);
  bar(k, chassis, 'steel', [-5.3, 1.45, -0.45], [0.92, 1.45, -0.45], 0.07, 10);
  for (const x of [-4.4, -3.0, -1.6, -0.2]) k.box(chassis, 'black', [0.06, 0.18, 0.18], [x, 1.45, -0.45]);

  // ---------------------------------------------------------------- tourelle orientable
  const turret = k.part('turret', chassis, [SX, 1.75, 0]);
  k.joint('slew', turret, 'ry', 0);
  k.cyl(turret, 'steelDark', 0.6, 0.1, [0, 0.05, 0], undefined, 28);
  k.cyl(turret, 'paint', [0.5, 0.56], 0.3, [0, 0.25, 0], undefined, 24);
  const head = softPolygon(
    [
      [-0.62, 0.3],
      [0.38, 0.3],
      [0.26, 0.6],
      [-0.08, 1.02],
      [-0.46, 1.02],
      [-0.66, 0.7],
    ],
    0.08,
  );
  for (const s of [-1, 1]) k.extrude(turret, 'paint', head, 0.08, [0, 0, s * 0.24], undefined, 0.015, 6);
  k.box(turret, 'paint', [0.86, 0.22, 0.44], [-0.12, 0.42, 0]);
  k.cylZ(turret, 'trim', 0.16, 0.6, [-0.27, 0.73, 0], 16);
  k.box(turret, 'trim', [0.16, 0.2, 0.3], [-0.64, 0.42, 0]);
  k.cyl(turret, 'steelDark', 0.1, 0.32, [0.3, 0.42, 0.4], undefined, 12);
  bar(k, turret, 'steel', [-0.05, 0.08, PIPE_Z], [-0.2, 0.58, PIPE_Z], 0.07, 10);
  bar(k, turret, 'steel', [-0.2, 0.58, PIPE_Z], [-0.27, 0.73, PIPE_Z], 0.07, 10);

  // ---------------------------------------------------------------- flèche en quatre bras repliés en Z
  // Chaque bras est retourné (π autour de y) par rapport au précédent : x part de son articulation le long du
  // bras, y vers le haut au repos, angle positif = levée ou dépliage ; le z local change de signe à chaque bras.
  const parts: number[] = [];
  let parent = turret;
  let pos: V3 = [-0.27, 0.73, 0];
  ARMS.forEach((a, i) => {
    const n = i + 1;
    const zs = n % 2 === 0 ? 1 : -1; // signe du z monde du z local
    const part = k.part(`a${n}`, parent, pos, [0, Math.PI, 0]);
    k.joint(`a${n}`, part, 'rz', 0);
    parts.push(part);
    const bm = beam2D([0, a.o], [a.L / 2, a.o], [a.L, a.o], a.h0 / 2, a.h1 / 2, 0.01);
    k.extrude(part, 'paint', bm.shape, a.w, [0, 0, 0], undefined, 0.025, 6);
    // pied du bras (chape vers l'articulation), axes, décor
    if (a.o > 0) k.rbox(part, 'paint', [0.46, a.o + 0.22, a.w - 0.02], 0.04, [0.06, a.o / 2 - 0.02, 0], undefined, 1);
    k.cylZ(part, 'trim', Math.min(0.16, a.h0 * 0.36), a.w + 0.1, [0, 0, 0], 14);
    k.cylZ(part, 'steel', 0.05, a.w + 0.2, [0, 0, 0], 8);
    // tuyau de refoulement (côté gauche) avec colliers et coudes vers les articulations
    const zp = PIPE_Z * zs;
    const end = n === ARMS.length ? 0.06 : 0; // le dernier tuyau dépasse vers le flexible
    bar(k, part, 'steel', [0, 0, zp], [0.35, a.o, zp], 0.07, 10);
    bar(k, part, 'steel', [0.35, a.o, zp], [a.L - 0.35, a.o, zp], 0.07, 10);
    bar(k, part, 'steel', [a.L - 0.35, a.o, zp], [a.L + end, a.o + a.kn, zp], 0.07, 10);
    k.cylZ(part, 'steelDark', 0.1, 0.16, [0, 0, zp], 12);
    const nc = Math.floor(a.L / 1.5);
    for (let c = 1; c <= nc; c++) {
      const x = (c * a.L) / (nc + 1);
      k.box(part, 'black', [0.06, 0.17, 0.17], [x, a.o, zp]);
      k.box(part, 'black', [0.05, 0.05, Math.abs(zp) - a.w / 2 + 0.02], [x, a.o, (Math.sign(zp) * (Math.abs(zp) + a.w / 2)) / 2]);
    }
    if (n === 1) for (const s of [-1, 1]) k.decal(part, 0.6, 0.15, [2.6, 0.14, s * (a.w / 2 + 0.004)], s > 0 ? 0 : Math.PI);
    // bras suivant : articulé en bout, replié au-dessus
    parent = part;
    pos = [a.L, a.o + a.kn, 0];
  });
  const [a1, , , a4] = parts;
  k.rbox(a1, 'trim', [0.26, 0.1, 0.26], 0.02, [1.9, -0.27, 0], undefined, 1);

  // vérins : levée du premier bras sous le bras, vérins d'articulation à droite des bras (biellettes en bout)
  k.piston(turret, [turret, [-0.64, 0.42, 0]], [a1, [1.9, -0.31, 0]], 0.17, 0.11);
  ARMS.slice(0, 3).forEach((a, i) => {
    const n = i + 1;
    const zs = n % 2 === 0 ? 1 : -1;
    const zw = a.w / 2 + 0.12; // plan des vérins (z monde)
    const cur = parts[i];
    const next = parts[i + 1];
    k.box(cur, 'trim', [0.2, 0.12, 0.1], [a.L - 1.9, a.o, zs * (a.w / 2 + 0.05)]);
    // flasques du levier sur le pied du bras suivant (repère du bras suivant : z de signe opposé)
    const lever = softPolygon(
      [
        [0.12, 0.08],
        [-0.36, -0.02],
        [-0.36, -0.2],
        [0.08, -0.12],
      ],
      0.05,
    );
    k.extrude(next, 'paint', lever, 0.05, [0, 0, -zs * zw], undefined, 0.01, 4);
    const r = 0.012 * (3 - i); // vérins plus gros vers le pied de la flèche
    k.piston(cur, [cur, [a.L - 1.9, a.o, zs * zw]], [next, [-0.3, -0.1, -zs * zw]], 0.075 + r, 0.045 + r * 0.66);
  });

  // flexible de bout : suspendu au bout du dernier bras, gardé vertical (liaison opposée au tangage du bras)
  const last = ARMS[3];
  const hose = k.part('endHose', a4, [last.L + 0.1, last.o - 0.04, PIPE_Z]);
  k.joint('hose', hose, 'rz', 0);
  k.sphere(a4, 'steel', 0.085, [last.L + 0.08, last.o, PIPE_Z], 10);
  k.cyl(hose, 'steelDark', 0.09, 0.16, [0, -0.1, 0], undefined, 12);
  k.hose(hose, 'rubber', [[0, -0.16, 0], [0.03, -0.55, 0], [-0.03, -0.95, 0], [0, -1.2, 0]], 0.065, 16);
  k.cyl(hose, 'trim', 0.075, 0.1, [0, -1.25, 0], undefined, 12);

  // Le flexible compense le tangage du dernier bras : hose = a1 − a2 + a3 − a4.
  return k.build({
    refWeight: 32,
    minScale: 0.88,
    maxScale: 1.08,
    wake: [
      {
        pose: { stabAvG: 2.0, stabAvD: 2.0, stabArG: -0.85, stabArD: 0.85, piedAvG: -0.56, piedAvD: -0.56, piedArG: -0.56, piedArD: -0.56 },
        dur: 1.6,
      },
      { pose: { a1: 0.5, a2: 0.6, slew: 0.3, hose: -0.1 }, dur: 2.0 },
      { pose: { a3: 0.24, slew: 0.45, hose: 0.14 }, dur: 1.2 },
      { pose: { a1: 0, a2: 0, a3: 0, slew: 0, hose: 0 }, dur: 2.0 },
      { pose: { stabAvG: 0, stabAvD: 0, stabArG: 0, stabArD: 0, piedAvG: 0, piedAvD: 0, piedArG: 0, piedArD: 0 }, dur: 1.2 },
    ],
    nod: [
      { pose: { a1: 0.04, hose: 0.04 }, dur: 0.5 },
      { pose: { a1: 0, hose: 0 }, dur: 0.55 },
    ],
    breathe: { hose: 0.04 },
  });
}

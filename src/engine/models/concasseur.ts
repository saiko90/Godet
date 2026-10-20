// Concasseur mobile à mâchoires sur chenilles (≈ 30 t, classe Kleemann MOBICAT MC 100 R / Rubble Master) :
// à l'arrière la trémie d'alimentation (rehausses repliables) sur l'alimentateur vibrant et sa grille de
// précriblage, au milieu le concasseur à mâchoires et ses volants d'inertie, puis le groupe de puissance posé
// au-dessus de la bande principale ; à l'avant la bande de déchargement inclinée, en deux tronçons, avec bavettes
// et séparateur magnétique (overband) ; sur le côté gauche la bande latérale de précriblage ; passerelles,
// garde-corps et échelle.
// Au repos, la machine est en position de transport : tête de la bande principale repliée vers le haut et
// l'arrière, bande latérale relevée, rehausses de trémie rabattues vers l'intérieur. Le réveil met
// l'alimentateur en vibration et le volant en rotation, déploie les bandes, ouvre la trémie et règle la bande
// principale, puis replie tout exactement en position de transport.
// Encombrement de transport ≈ 10,6 × 3,2 × 4,0 m (longueur de travail ≈ 13,8 m).
import { Kit, softPolygon, type MachineTemplate, type MatKey } from './kit';
import { exhaust, ladder, track } from './parts';

// ------------------------------------------------------------------ convoyeur à bande (partagé avec le crible)

export interface ConveyorOpts {
  /** Entraxe des tambours (axe x de la pièce, tambour de queue en x = 0) et largeur de bande. */
  len: number;
  belt: number;
  /** Rayon des tambours (axes à y = 0, la bande passe dessus). Défaut 0,16. */
  drum?: number;
  /** Hauteur des longerons sous la bande (défaut 0,24) et des bavettes au-dessus (défaut 0,16 ; 0 : aucune). */
  depth?: number;
  skirt?: number;
  /** Bavettes : de x = skirtFrom à x = skirtTo (défaut : sur presque toute la longueur). */
  skirtFrom?: number;
  skirtTo?: number;
  /** Tambours de queue et de tête (absents aux jonctions entre tronçons d'une même bande). Défaut : présents. */
  tailDrum?: boolean;
  headDrum?: boolean;
  /** Pas des stations de rouleaux de retour. Défaut 0,9 m. */
  pitch?: number;
  /** Matériau des longerons et des bavettes. Défaut : peinture de la machine. */
  mat?: MatKey;
  /** Moteur hydraulique d'entraînement sur le tambour de tête, côté z+ (1) ou z− (−1). */
  motor?: 1 | -1;
}

/**
 * Convoyeur à bande dans le repère d'une pièce : longerons à lèvre graphite, bande et brin de retour,
 * tambours habillés de bande, paliers, bavettes, traverses et rouleaux de retour suspendus.
 */
export function conveyor(k: Kit, part: number, o: ConveyorOpts): void {
  const rd = o.drum ?? 0.16;
  const depth = o.depth ?? 0.24;
  const skirt = o.skirt ?? 0.16;
  const mat = o.mat ?? 'paint';
  const { len, belt } = o;
  const zs = belt / 2 + 0.09; // axe des longerons
  const top = rd + 0.012; // dessus de la bande
  const sTop = rd - 0.03; // dessus des longerons
  const sBot = sTop - depth; // dessous des longerons
  // longerons et lèvres basses
  for (const s of [-1, 1]) {
    k.box(part, mat, [len + 0.1, depth, 0.05], [len / 2, sTop - depth / 2, s * zs]);
    k.box(part, 'trim', [len + 0.1, 0.035, 0.11], [len / 2, sBot + 0.0175, s * (zs + 0.02)]);
  }
  // bande (brin porteur et brin de retour)
  k.box(part, 'rubber', [len, 0.024, belt], [len / 2, rd, 0]);
  k.box(part, 'rubber', [len, 0.02, belt], [len / 2, -rd, 0]);
  // tambours habillés de bande, moyeux, arbres et paliers
  const drums: number[] = [];
  if (o.tailDrum !== false) drums.push(0);
  if (o.headDrum !== false) drums.push(len);
  for (const x of drums) {
    k.cylZ(part, 'rubber', rd + 0.012, belt, [x, 0, 0], 20);
    k.cylZ(part, 'steelDark', rd * 0.8, belt + 0.06, [x, 0, 0], 16);
    k.cylZ(part, 'steel', 0.035, 2 * zs + 0.2, [x, 0, 0], 10);
    for (const s of [-1, 1]) k.box(part, 'trim', [0.15, 0.13, 0.07], [x, 0, s * (zs + 0.07)]);
  }
  // bavettes (sur les longerons) et joints caoutchouc le long des bords de bande
  if (skirt > 0) {
    const x0 = o.skirtFrom ?? 0.25;
    const x1 = o.skirtTo ?? len - rd - 0.15;
    for (const s of [-1, 1]) {
      k.box(part, mat, [x1 - x0, top + skirt - sTop, 0.04], [(x0 + x1) / 2, (sTop + top + skirt) / 2, s * zs]);
      k.box(part, 'black', [x1 - x0, 0.05, 0.03], [(x0 + x1) / 2, top + 0.025, s * (belt / 2 + 0.035)]);
    }
  }
  // moteur hydraulique d'entraînement en bout d'arbre du tambour de tête, flexibles le long du longeron
  if (o.motor) {
    const zm = o.motor * (zs + 0.2);
    k.cylZ(part, 'trim', 0.085, 0.16, [len, 0, zm], 14);
    k.cylZ(part, 'steel', 0.05, 0.04, [len, 0, zm + o.motor * 0.1], 10);
    for (const dy of [-0.04, 0.04]) {
      k.hose(part, 'rubber', [[len - 0.02, dy, zm], [len - 0.3, sBot + 0.05 + dy, o.motor * (zs + 0.12)], [len - 1.2, sBot + 0.06 + dy, o.motor * (zs + 0.05)]], 0.018, 12);
    }
    k.box(part, 'black', [0.05, 0.14, 0.05], [len - 1.2, sBot + 0.06, o.motor * (zs + 0.05)]);
  }
  // traverses et rouleaux de retour suspendus
  const pitch = o.pitch ?? 0.9;
  const n = Math.max(1, Math.floor((len - 0.8) / pitch));
  for (let i = 0; i <= n; i++) {
    const x = 0.4 + (i * (len - 0.8)) / n;
    k.box(part, 'steelDark', [0.06, 0.06, 2 * zs], [x, sBot + 0.03, 0]);
    k.cylZ(part, 'steel', 0.04, belt + 0.04, [x, -rd - 0.05, 0], 10);
    for (const s of [-1, 1]) k.box(part, 'steelDark', [0.04, sBot + rd + 0.05, 0.03], [x, (sBot - rd - 0.05) / 2, s * (belt / 2 + 0.05)]);
  }
}

// ------------------------------------------------------------------ concasseur

// train de chenilles (pièce centrée sur TX)
const TX = -0.9;
const TL = 3.9;
const TR = 0.38;
const TCY = 0.42;
const TW = 0.5;
const TZ = 1.0;
// châssis
const CH_X0 = -6.65;
const CH_X1 = 1.5;
const CH_Y0 = 0.85;
const CH_Y1 = 1.35;
const CH_Z = 0.6;
// alimentateur et trémie
const HOP_X0 = -6.6;
const HOP_X1 = -3.75;
const HOP_Z = 0.63;
const HINGE_Y = 2.95;
const FLAP = 0.75; // hauteur des rehausses
const FLAP_IN = 0.785; // rehausses latérales rabattues vers l'intérieur (transport, rad)
const FLAP_OPEN = 0.8; // évasement des rehausses latérales en travail
const FLAP_B_OPEN = 0.7; // évasement de la rehausse arrière en travail (verticale au transport)
// concasseur et volant
const JAW_X0 = -3.5;
const JAW_X1 = -1.72;
const JAW_TOP = 2.6;
const JAW_Z = 0.72;
const FLY: [number, number] = [-2.3, 1.95];
const FLY_R = 0.62;
// groupe de puissance
const PU_X0 = -1.55;
const PU_X1 = 0.75;
const PU_TOP = 2.95;
const PU_Z = 1.0;
// passerelles
const PLAT_Y = 2.65;
// bande principale (800 mm) : axe des tambours, tronçon bas fixe, tronçon incliné réglable articulé au coude,
// tête repliable articulée en haut des bavettes
const BELT_Y = 0.648;
const BELT_X0 = -3.6;
const BEND_X = 1.0;
const INCL = 0.37;
const MID_LEN = 2.9;
const HEAD_LEN = 3.0;
const FOLD_Y = 0.16 + 0.012 + 0.16; // dessus des bavettes (rayon du tambour + bande + bavette)
const FOLD_REST = 2.27; // tête repliée de 130° (transport)
// bande latérale (gauche) : articulation et angles
const SIDE_X = -3.85;
const SIDE_Z = -1.25;
const SIDE_REST = 1.4;
const SIDE_OPEN = 0.38;

export function buildConcasseur(): MachineTemplate {
  const k = new Kit('concasseur');

  // ================================================================ châssis et chenilles
  const chassis = k.part('chassis', 0, [0, 0, 0]);
  const under = k.part('under', chassis, [TX, 0, 0]);
  for (const s of [-1, 1]) {
    track(k, under, { length: TL, radius: TR, cy: TCY, width: TW, z: s * TZ, rollers: 6 });
    // flasques reliant les longerons de chenille au châssis
    for (const x of [-1.15, 1.15]) {
      k.box(under, 'steelDark', [0.5, 0.62, 0.08], [x, 0.6, s * 0.7]);
      k.box(under, 'steelDark', [0.5, 0.2, 0.22], [x, 0.42, s * 0.8]);
    }
  }
  for (const s of [-1, 1]) k.box(chassis, 'trim', [CH_X1 - CH_X0, CH_Y1 - CH_Y0, 0.12], [(CH_X0 + CH_X1) / 2, (CH_Y0 + CH_Y1) / 2, s * CH_Z]);
  for (const x of [-6.45, -5.1, -3.95]) k.box(chassis, 'trim', [0.14, 0.3, 2 * CH_Z], [x, CH_Y0 + 0.15, 0]);
  k.box(chassis, 'trim', [0.14, 0.14, 2 * CH_Z], [CH_X1 - 0.07, CH_Y1 - 0.07, 0]);

  // béquilles hydrauliques arrière (rentrées)
  for (const s of [-1, 1]) {
    k.box(chassis, 'steelDark', [0.2, 0.3, 0.14], [-6.35, 1.25, s * 0.74]);
    k.cyl(chassis, 'trim', 0.08, 0.6, [-6.35, 1.1, s * 0.84], undefined, 14);
    k.cyl(chassis, 'chrome', 0.045, 0.3, [-6.35, 0.68, s * 0.84], undefined, 10);
    k.cyl(chassis, 'steelDark', 0.15, 0.04, [-6.35, 0.52, s * 0.84], undefined, 16);
  }

  // ================================================================ caisson de l'alimentateur et trémie fixe
  for (const s of [-1, 1]) {
    k.box(chassis, 'paint', [3.1, 1.0, 0.06], [-5.15, 1.85, s * 0.69]);
    k.box(chassis, 'trim', [3.12, 0.08, 0.07], [-5.15, CH_Y1 + 0.04, s * 0.69]);
    k.box(chassis, 'trim', [3.12, 0.05, 0.07], [-5.15, 2.33, s * 0.69]);
    for (const x of [-6.0, -5.2, -4.4]) k.box(chassis, 'paint', [0.07, 0.86, 0.04], [x, 1.84, s * 0.735]);
    // ressorts de l'alimentateur
    for (const x of [-6.3, -4.0]) {
      k.cyl(chassis, 'steelDark', 0.09, 0.03, [x, 2.365, s * 0.6], undefined, 12);
      k.cyl(chassis, 'steel', 0.065, 0.18, [x, 2.45, s * 0.6], undefined, 12);
    }
    k.box(chassis, 'paint', [HOP_X1 - HOP_X0, HINGE_Y - 2.62, 0.05], [(HOP_X0 + HOP_X1) / 2, (2.62 + HINGE_Y) / 2, s * HOP_Z]);
    for (const x of [HOP_X0 - 0.06, HOP_X1 - 0.02]) k.box(chassis, 'paint', [0.1, HINGE_Y - 2.35, 0.1], [x, (2.35 + HINGE_Y) / 2, s * 0.67]);
  }
  k.box(chassis, 'paint', [0.06, 1.0, 1.44], [CH_X0 - 0.03, 1.85, 0]);
  k.box(chassis, 'paint', [0.05, HINGE_Y - 2.62, 2 * HOP_Z], [HOP_X0 - 0.08, (2.62 + HINGE_Y) / 2, 0]);
  // feux arrière
  for (const s of [-1, 1]) {
    k.rbox(chassis, 'tail', [0.04, 0.1, 0.18], 0.015, [CH_X0 - 0.07, 1.55, s * 0.5], undefined, 1);
    k.rbox(chassis, 'amber', [0.04, 0.08, 0.1], 0.015, [CH_X0 - 0.07, 1.55, s * 0.3], undefined, 1);
    k.lamp(chassis, [CH_X0 - 0.09, 1.82, s * 0.5], 0.1, Math.PI);
  }

  // rehausses repliables de la trémie (gauche, droite, arrière), rabattues au repos
  const flapL = k.part('flapL', chassis, [(HOP_X0 + HOP_X1) / 2, HINGE_Y, -HOP_Z]);
  k.joint('hopperL', flapL, 'rx', FLAP_IN);
  const flapR = k.part('flapR', chassis, [(HOP_X0 + HOP_X1) / 2, HINGE_Y, HOP_Z]);
  k.joint('hopperR', flapR, 'rx', -FLAP_IN);
  const flapB = k.part('flapB', chassis, [HOP_X0 - 0.08, HINGE_Y, 0]);
  k.joint('hopperB', flapB, 'rz', 0);
  const fl = HOP_X1 - HOP_X0;
  for (const [p, s] of [
    [flapL, -1],
    [flapR, 1],
  ] as const) {
    k.box(p, 'paint', [fl, FLAP, 0.05], [0, FLAP / 2, 0]);
    for (const x of [-fl / 3, 0, fl / 3]) k.box(p, 'trim', [0.07, FLAP - 0.06, 0.03], [x, FLAP / 2, s * 0.04]);
    k.cylX(p, 'steel', 0.028, fl, [0, FLAP, 0], 10);
    k.cylX(p, 'steel', 0.035, fl - 0.1, [0, 0, 0], 10);
  }
  k.box(flapB, 'paint', [0.05, FLAP, 2 * HOP_Z + 0.04], [0, FLAP / 2, 0]);
  for (const z of [-0.4, 0.4]) k.box(flapB, 'trim', [0.03, FLAP - 0.06, 0.07], [-0.04, FLAP / 2, z]);
  k.cylZ(flapB, 'steel', 0.028, 2 * HOP_Z + 0.04, [0, FLAP, 0], 10);

  // ---------------------------------------------------------------- alimentateur vibrant et grille de précriblage
  const feeder = k.part('feeder', chassis, [0, 0, 0]);
  k.box(feeder, 'steelDark', [2.42, 0.06, 1.1], [-5.44, 2.58, 0]);
  for (const s of [-1, 1]) {
    k.box(feeder, 'paint', [3.2, 0.36, 0.05], [-5.05, 2.73, s * 0.575]);
    k.box(feeder, 'trim', [3.2, 0.05, 0.06], [-5.05, 2.575, s * 0.575]);
    for (const x of [-6.3, -4.0]) k.box(feeder, 'steelDark', [0.22, 0.05, 0.16], [x, 2.565, s * 0.6]);
  }
  k.box(feeder, 'paint', [0.05, 0.36, 1.15], [-6.63, 2.73, 0]);
  // barreaux de la grille (le fin tombe vers la bande latérale)
  for (let i = 0; i < 8; i++) k.box(feeder, 'steel', [0.82, 0.06, 0.05], [-3.84, 2.585, -0.5 + (i * 1.0) / 7]);
  for (const x of [-4.22, -3.48]) k.box(feeder, 'steelDark', [0.06, 0.08, 1.1], [x, 2.53, 0]);

  // ================================================================ concasseur à mâchoires
  const jaw = softPolygon(
    [
      [JAW_X0, 1.2],
      [-1.85, 1.12],
      [JAW_X1, 1.7],
      [JAW_X1, JAW_TOP],
      [JAW_X0, JAW_TOP],
    ],
    0.08,
  );
  k.extrude(chassis, 'paint', jaw, 2 * JAW_Z, [0, 0, 0], undefined, 0.03, 6);
  k.box(chassis, 'black', [1.05, 0.02, 1.2], [-2.95, JAW_TOP + 0.011, 0]);
  for (const s of [-1, 1]) k.box(chassis, 'steelDark', [JAW_X1 - JAW_X0, 0.05, 0.1], [(JAW_X0 + JAW_X1) / 2, JAW_TOP + 0.02, s * (JAW_Z - 0.05)]);
  k.box(chassis, 'trim', [JAW_X1 - JAW_X0 + 0.02, 0.07, 2 * JAW_Z + 0.02], [(JAW_X0 + JAW_X1) / 2, 1.27, 0]);
  // paliers de l'arbre excentrique, tirant et vérins de réglage de l'ouverture
  k.cylZ(chassis, 'steelDark', 0.21, 2 * JAW_Z + 0.14, [FLY[0], FLY[1], 0], 20);
  k.cylZ(chassis, 'steel', 0.08, 2 * JAW_Z + 0.36, [FLY[0], FLY[1], 0], 12);
  for (const s of [-1, 1]) {
    k.cylX(chassis, 'trim', 0.07, 0.3, [JAW_X1 + 0.1, 1.4, s * 0.42], 12);
    k.cylX(chassis, 'chrome', 0.035, 0.16, [JAW_X1 + 0.3, 1.4, s * 0.42], 10);
  }
  k.box(chassis, 'steelDark', [1.3, 0.12, 0.96], [-2.75, 1.08, 0]);

  // volant d'inertie (côté gauche, tourne au réveil)
  const fly = k.part('flywheel', chassis, [FLY[0], FLY[1], -JAW_Z - 0.14]);
  k.joint('fly', fly, 'rz', 0);
  k.lathe(
    fly,
    'steelDark',
    [
      [FLY_R - 0.1, -0.08],
      [FLY_R, -0.08],
      [FLY_R, 0.08],
      [FLY_R - 0.1, 0.08],
      [FLY_R - 0.1, -0.08],
    ],
    [0, 0, 0],
    [Math.PI / 2, 0, 0],
    32,
  );
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    k.box(fly, 'steelDark', [FLY_R - 0.14, 0.08, 0.06], [Math.cos(a) * (FLY_R / 2 + 0.03), Math.sin(a) * (FLY_R / 2 + 0.03), 0], [0, 0, a]);
  }
  k.cylZ(fly, 'steelDark', 0.17, 0.14, [0, 0, 0], 18);
  k.cylZ(fly, 'steel', 0.09, 0.2, [0, 0, -0.02], 12);
  k.box(fly, 'paint', [0.24, 0.1, 0.16], [FLY_R - 0.18, 0, 0]);
  // carter de la transmission par courroies (côté droit)
  k.rbox(chassis, 'paint', [PU_X0 - (FLY[0] - 0.7), 1.3, 0.22], 0.08, [(PU_X0 + FLY[0] - 0.7) / 2, 1.92, JAW_Z + 0.14], undefined, 2);
  k.grille(chassis, [FLY[0], 1.92, JAW_Z + 0.252], 0.8, 0.62, 6, 'z', 1);

  // ================================================================ groupe de puissance
  const puX = (PU_X0 + PU_X1) / 2;
  k.rbox(chassis, 'paint', [PU_X1 - PU_X0, PU_TOP - CH_Y1, 2 * PU_Z], 0.06, [puX, (CH_Y1 + PU_TOP) / 2, 0], undefined, 2);
  k.box(chassis, 'trim', [PU_X1 - PU_X0 + 0.02, 0.08, 2 * PU_Z + 0.02], [puX, CH_Y1 + 0.04, 0]);
  k.rbox(chassis, 'trim', [PU_X1 - PU_X0 - 0.1, 0.06, 2 * PU_Z - 0.1], 0.02, [puX, PU_TOP + 0.03, 0], undefined, 1);
  for (const s of [-1, 1]) {
    const z = s * (PU_Z + 0.002);
    for (const x of [-0.75, 0.05]) k.box(chassis, 'black', [0.012, 1.4, 0.006], [x, 2.15, z]);
    k.grille(chassis, [-0.35, 2.2, z], 0.62, 0.7, 7, 'z', s);
    k.box(chassis, 'steel', [0.03, 0.14, 0.03], [0.15, 2.15, s * (PU_Z + 0.018)]);
    k.decal(chassis, 0.62, 0.155, [-1.15, 2.62, z], s > 0 ? 0 : Math.PI);
  }
  // radiateur face à la bande, réservoirs sous le groupe
  k.grille(chassis, [PU_X1 + 0.002, 2.2, 0], 1.6, 1.0, 9, 'x', 1);
  k.rbox(chassis, 'trim', [1.6, 0.34, 0.3], 0.04, [puX, 1.17, 0.83], undefined, 1);
  k.cyl(chassis, 'steel', 0.05, 0.05, [0.25, 1.36, 0.9], undefined, 12);
  k.rbox(chassis, 'paint', [1.2, 0.34, 0.3], 0.04, [puX, 1.17, -0.83], undefined, 1);
  // armoire de commande et arrêt d'urgence (côté gauche)
  k.rbox(chassis, 'trim', [0.62, 0.72, 0.12], 0.02, [-1.15, 1.98, -PU_Z - 0.06], undefined, 1);
  k.box(chassis, 'black', [0.012, 0.66, 0.006], [-1.15, 1.98, -PU_Z - 0.123]);
  k.box(chassis, 'paint', [0.14, 0.14, 0.04], [-0.72, 1.98, -PU_Z - 0.02]);
  k.cylZ(chassis, 'tail', 0.045, 0.05, [-0.72, 1.98, -PU_Z - 0.06], 14);
  // toit : échappement, préfiltre à air, gyrophare, phares de travail
  exhaust(k, chassis, [0.3, PU_TOP + 0.06, 0.5], 0.55, 0.08);
  k.cyl(chassis, 'trim', 0.13, 0.36, [-0.25, PU_TOP + 0.24, -0.55], undefined, 16);
  k.cyl(chassis, 'black', 0.15, 0.08, [-0.25, PU_TOP + 0.46, -0.55], undefined, 16);
  k.beacon(chassis, [-1.3, PU_TOP + 0.06, -0.72]);
  for (const s of [-1, 1]) {
    k.lamp(chassis, [PU_X0 + 0.08, PU_TOP + 0.105, s * 0.75], 0.12, Math.PI);
    k.lamp(chassis, [PU_X1 - 0.08, PU_TOP + 0.105, s * 0.75], 0.12);
  }

  // ================================================================ passerelles autour du concasseur, échelle
  const px0 = -3.4;
  const px1 = -1.6;
  const pxm = (px0 + px1) / 2;
  for (const s of [-1, 1]) {
    k.box(chassis, 'black', [px1 - px0, 0.04, 0.54], [pxm, PLAT_Y - 0.02, s * 1.03]);
    k.box(chassis, 'paint', [px1 - px0, 0.1, 0.02], [pxm, PLAT_Y + 0.03, s * 1.3]);
    for (const x of [px0 + 0.05, px1 - 0.05]) k.box(chassis, 'paint', [0.08, 0.36, 0.5], [x, PLAT_Y - 0.22, s * 1.0]);
    // garde-corps
    const zr = s * 1.28;
    for (const x of [px0, (2 * px0 + px1) / 3, (px0 + 2 * px1) / 3, px1]) k.cyl(chassis, 'paint', 0.022, 1.0, [x, PLAT_Y + 0.5, zr], undefined, 8);
    for (const y of [0.5, 1.0]) {
      k.cylX(chassis, 'paint', 0.022, px1 - px0, [pxm, PLAT_Y + y, zr], 8);
      k.cylZ(chassis, 'paint', 0.022, 0.5, [px0, PLAT_Y + y, s * 1.03], 8);
      if (s > 0) k.cylZ(chassis, 'paint', 0.022, 0.5, [px1, PLAT_Y + y, s * 1.03], 8);
    }
  }
  ladder(k, chassis, px1, px1 + 0.3, 0.4, PLAT_Y - 0.04, -1.36, 7, 'paint');
  k.cyl(chassis, 'paint', 0.022, 1.0, [px1 + 0.3, PLAT_Y + 0.5, -1.36], undefined, 8);
  k.cylZ(chassis, 'paint', 0.022, 0.1, [px1 + 0.3, PLAT_Y + 1.0, -1.31], 8);

  // ================================================================ bande principale
  const low = k.part('beltLow', chassis, [BELT_X0, BELT_Y, 0]);
  conveyor(k, low, { len: BEND_X - BELT_X0, belt: 0.8, skirtFrom: 0.2, skirtTo: BEND_X - BELT_X0 - 0.3 });
  const belt = k.part('belt', chassis, [BEND_X, BELT_Y, 0], [0, 0, INCL]);
  k.joint('conveyor', belt, 'rz', 0);
  conveyor(k, belt, { len: MID_LEN, belt: 0.8, tailDrum: false, headDrum: false, skirtFrom: 0.1, skirtTo: MID_LEN - 0.3 });
  // pattes des vérins de relevage, chapes et axe de l'articulation de repliage
  for (const s of [-1, 1]) {
    k.box(belt, 'steelDark', [0.16, 0.12, 0.06], [2.2, -0.14, s * 0.54]);
    k.box(belt, 'trim', [0.32, 0.44, 0.04], [MID_LEN - 0.1, 0.12, s * 0.535]);
  }
  k.cylZ(belt, 'steel', 0.05, 1.3, [MID_LEN, FOLD_Y, 0], 12);
  for (const s of [-1, 1]) k.piston(chassis, [chassis, [CH_X1 - 0.08, CH_Y1 - 0.14, s * 0.56]], [belt, [2.2, -0.14, s * 0.56]], 0.07, 0.042);
  // tête de bande : articulée en haut des bavettes, repliée vers le haut et l'arrière pour le transport
  const headFold = k.part('beltHead', belt, [MID_LEN, FOLD_Y, 0]);
  k.joint('fold', headFold, 'rz', FOLD_REST);
  for (const s of [-1, 1]) k.box(headFold, 'trim', [0.32, 0.44, 0.04], [0.1, -0.21, s * 0.585]);
  const head = k.part('beltHeadBody', headFold, [0, -FOLD_Y, 0]);
  conveyor(k, head, { len: HEAD_LEN, belt: 0.8, tailDrum: false, skirtFrom: 0.05, skirtTo: HEAD_LEN - 0.9, motor: 1 });
  k.box(head, 'black', [0.05, 0.12, 0.8], [HEAD_LEN - 0.12, -0.2, 0], [0, 0, 0.6]);

  // séparateur magnétique (overband) suspendu à un portique sur le tronçon incliné, bande transversale vers la
  // droite ; assez bas pour que la tête repliée passe au-dessus
  const mx = 1.2;
  for (const x of [mx - 0.7, mx + 0.7]) {
    for (const s of [-1, 1]) {
      k.box(belt, 'paint', [0.1, 0.08, 0.46], [x, -0.07, s * 0.7]);
      k.box(belt, 'paint', [0.07, 1.1, 0.07], [x, 0.44, s * 0.9]);
    }
    k.box(belt, 'paint', [0.08, 0.09, 1.88], [x, 1.02, 0]);
  }
  for (const s of [-1, 1]) {
    k.box(belt, 'paint', [1.5, 0.08, 0.08], [mx, 1.11, s * 0.45]);
    for (const dx of [-0.52, 0.52]) k.cyl(belt, 'steel', 0.018, 0.18, [mx + dx, 0.99, s * 0.45], undefined, 6);
  }
  // aimant, flasques porte-tambours, tambours et bande à taquets
  k.rbox(belt, 'trim', [1.0, 0.3, 1.0], 0.03, [mx, 0.7, 0], undefined, 1);
  for (const dx of [-0.52, 0.52]) k.box(belt, 'trim', [0.04, 0.4, 1.36], [mx + dx, 0.72, 0]);
  for (const z of [-0.62, 0.62]) {
    k.cylX(belt, 'rubber', 0.16, 0.96, [mx, 0.7, z], 18);
    k.cylX(belt, 'steelDark', 0.1, 1.1, [mx, 0.7, z], 12);
  }
  for (const y of [0.535, 0.865]) k.box(belt, 'rubber', [0.96, 0.02, 1.24], [mx, y, 0]);
  for (let i = 0; i < 5; i++) k.box(belt, 'rubber', [0.94, 0.04, 0.03], [mx, 0.51, -0.5 + i * 0.25]);
  // goulotte d'évacuation de la ferraille (côté droit)
  k.box(belt, 'steelDark', [1.32, 0.03, 0.46], [mx, 0.42, 0.92], [0.55, 0, 0]);

  // ================================================================ bande latérale de précriblage (gauche)
  const side = k.part('side', chassis, [SIDE_X, 0.75, SIDE_Z], [0, Math.PI / 2, 0]);
  k.joint('side', side, 'rz', SIDE_REST);
  conveyor(k, side, { len: 2.8, belt: 0.5, drum: 0.11, depth: 0.18, skirt: 0.12, skirtFrom: 0.05, skirtTo: 1.1, pitch: 0.8, motor: -1 });
  // goulotte de chargement en queue de bande
  k.box(side, 'paint', [0.04, 0.3, 0.74], [0.0, 0.33, 0]);
  k.box(side, 'steelDark', [0.16, 0.12, 0.06], [1.0, -0.1, 0.34]);
  // chapes de l'articulation (sous le longeron) et patte du vérin de repliage
  for (const dx of [-0.47, 0.47]) k.box(chassis, 'steelDark', [0.08, 0.16, 0.65], [SIDE_X + dx, 0.78, (SIDE_Z - CH_Z) / 2 - 0.02]);
  k.box(chassis, 'steelDark', [0.16, 0.2, 0.08], [SIDE_X + 0.34, 0.95, -0.7]);
  k.piston(chassis, [chassis, [SIDE_X + 0.34, 0.95, -0.76]], [side, [1.0, -0.1, 0.34]], 0.055, 0.032);
  for (const dy of [0, 0.05]) {
    k.hose(chassis, 'rubber', [[PU_X0 + 0.1, CH_Y1 - 0.1 + dy, -0.7], [-2.6, CH_Y1 - 0.2 + dy, -0.7], [SIDE_X + 0.5, 1.05 + dy, -0.72], [SIDE_X + 0.38, 0.98 + dy, -0.8]], 0.02, 24);
  }

  return k.build({
    refWeight: 30,
    minScale: 0.85,
    maxScale: 1.12,
    vibrate: 'feeder',
    wake: [
      { pose: { fold: 0, side: SIDE_OPEN, fly: Math.PI * 4 }, dur: 2.0 },
      { pose: { hopperL: -FLAP_OPEN, hopperR: FLAP_OPEN, hopperB: FLAP_B_OPEN, conveyor: 0.05, fly: Math.PI * 8 }, dur: 1.5 },
      { pose: { hopperL: FLAP_IN, hopperR: -FLAP_IN, hopperB: 0, conveyor: 0, fly: Math.PI * 12 }, dur: 1.8 },
      { pose: { fold: FOLD_REST, side: SIDE_REST, fly: Math.PI * 16 }, dur: 2.2 },
      // coupe nette (durée nulle) : après huit tours complets, le volant revient à 0 sans bouger à l'écran
      { pose: { fly: 0 }, dur: 0 },
    ],
    nod: [
      { pose: { conveyor: 0.025 }, dur: 0.5 },
      { pose: { conveyor: 0 }, dur: 0.55 },
    ],
    breathe: { conveyor: 0.003 },
  });
}

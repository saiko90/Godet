// Crible mobile sur chenilles (≈ 25 t, classe Powerscreen Warrior 1400 / Keestrack Frontier) : à l'arrière la
// trémie à rehausses repliables, sur le tapis d'alimentation qui monte vers le crible ; au milieu le crible
// incliné à deux étages sur ses ressorts, passerelles et garde-corps ; dessous la bande des fines ; à l'avant la
// bande de queue (refus) en deux tronçons et deux bandes latérales (stocks des produits) ; groupe moteur et
// réservoirs logés sous les flancs de la trémie.
// Au repos, la machine est en position de transport : tête de la bande de queue repliée vers le haut et
// l'arrière au-dessus du crible, bandes latérales relevées, rehausses de trémie rabattues. Le réveil met le crible
// en vibration, déploie les bandes, ouvre la trémie et règle la bande de queue, puis replie tout exactement en
// position de transport.
// Encombrement de transport ≈ 10,3 × 3,3 × 3,7 m (longueur de travail ≈ 13,7 m).
import * as THREE from 'three';
import { Kit, type MachineTemplate, type MatKey, type V3 } from './kit';
import { exhaust, ladder, track } from './parts';
import { conveyor } from './concasseur';

/** Tôle plane d'épaisseur e définie par quatre coins coplanaires (dans l'ordre du contour). */
function plate(k: Kit, part: number, mat: MatKey, pts: [V3, V3, V3, V3], e: number): void {
  const [a, b, c, d] = pts.map((p) => new THREE.Vector3(...p));
  const u = b.clone().sub(a).normalize();
  const n = new THREE.Vector3().crossVectors(u, d.clone().sub(a)).normalize();
  const v = new THREE.Vector3().crossVectors(n, u);
  const shape = new THREE.Shape([a, b, c, d].map((p) => new THREE.Vector2(p.clone().sub(a).dot(u), p.clone().sub(a).dot(v))));
  const g = new THREE.ExtrudeGeometry(shape, { depth: e, bevelEnabled: false });
  g.translate(0, 0, -e / 2);
  g.applyMatrix4(new THREE.Matrix4().makeBasis(u, v, n).setPosition(a));
  k.add(part, mat, g);
}

// train de chenilles (pièce centrée sur TX)
const TX = -1.0;
const TL = 4.0;
const TR = 0.38;
const TCY = 0.42;
const TW = 0.5;
const TZ = 1.0;
// châssis
const CH_X0 = -6.6;
const CH_X1 = 1.3;
const CH_Y0 = 0.85;
const CH_Y1 = 1.35;
const CH_Z = 0.62;
// tapis d'alimentation (axe du tambour de queue, pente) et trémie
const FX = -6.3;
const FY = 1.55;
const FA = 0.31;
const FLEN = 4.2;
const FRD = 0.16;
const HX0 = -6.25; // arrière et avant du fond de trémie
const HX1 = -3.45;
const HZ0 = 0.6; // demi-largeur de la trémie fixe
const HY0 = 2.6; // haut des parois fixes (articulations des rehausses)
const FLAP = 1.0; // hauteur des rehausses
const FLAP_IN = 0.5; // rehausses latérales rabattues vers l'intérieur (transport, rad)
const FLAP_OPEN = 0.85; // évasement des rehausses latérales en travail
const FLAP_B_OPEN = 0.75; // évasement de la rehausse arrière en travail (verticale au transport)
// crible incliné : centre, pente (avant plus bas), demi-largeur
const SX = 0.0;
const SY = 2.25;
const SA = -0.245;
const SZ = 0.875;
// bandes : queue (refus) et latérales (articulation, angles)
const TAIL_X = 1.5;
const TAIL_Y = 0.72;
const TAIL_A = 0.42;
const TAIL_MID = 2.3; // tronçon fixe (réglable en pente)
const TAIL_HEAD = 3.3; // tête repliable
const TAIL_FOLD_Y = 0.17 + 0.012 + 0.16; // articulation en haut des bavettes (rayon du tambour + bande + bavette)
const TAIL_FOLD_REST = 2.356; // tête repliée de 135° au-dessus du crible (transport)
const SIDE_X = 1.8;
const SIDE_Y = 0.6;
const SIDE_Z = 1.25;
const SIDE_LEN = 2.9;
const SIDE_REST = Math.PI / 2;
const SIDE_OPEN = 0.35;
// passerelles le long du crible
const WALK_Y = 1.55;
const WALK_X0 = -1.7;
const WALK_X1 = 0.9;

export function buildCrible(): MachineTemplate {
  const k = new Kit('crible');

  // ================================================================ châssis et chenilles
  const chassis = k.part('chassis', 0, [0, 0, 0]);
  const under = k.part('under', chassis, [TX, 0, 0]);
  for (const s of [-1, 1]) {
    track(k, under, { length: TL, radius: TR, cy: TCY, width: TW, z: s * TZ, rollers: 6 });
    for (const x of [-1.2, 1.2]) {
      k.box(under, 'steelDark', [0.5, 0.62, 0.08], [x, 0.6, s * 0.72]);
      k.box(under, 'steelDark', [0.5, 0.2, 0.2], [x, 0.42, s * 0.82]);
    }
  }
  for (const s of [-1, 1]) k.box(chassis, 'trim', [CH_X1 - CH_X0, CH_Y1 - CH_Y0, 0.12], [(CH_X0 + CH_X1) / 2, (CH_Y0 + CH_Y1) / 2, s * CH_Z]);
  for (const x of [-6.45, -4.9, -2.6]) k.box(chassis, 'trim', [0.14, 0.3, 2 * CH_Z], [x, CH_Y0 + 0.15, 0]);
  k.box(chassis, 'trim', [0.14, 0.14, 2 * CH_Z], [CH_X1 - 0.07, CH_Y1 - 0.07, 0]);
  // flasques avant : chapes des bandes latérales et des vérins de la bande de queue
  for (const s of [-1, 1]) {
    k.box(chassis, 'trim', [1.26, 0.6, 0.08], [CH_X1 + 0.52, 0.86, s * 0.73]);
    for (const dx of [-0.55, 0.55]) k.box(chassis, 'trim', [0.08, 0.12, 0.6], [SIDE_X + dx, SIDE_Y, s * 0.98]);
  }
  // feux arrière
  for (const s of [-1, 1]) {
    k.rbox(chassis, 'tail', [0.04, 0.1, 0.11], 0.015, [CH_X0 - 0.02, 1.02, s * CH_Z], undefined, 1);
    k.rbox(chassis, 'amber', [0.04, 0.07, 0.11], 0.015, [CH_X0 - 0.02, 1.2, s * CH_Z], undefined, 1);
  }

  // ================================================================ tapis d'alimentation et trémie évasée
  const feed = k.part('feed', chassis, [FX, FY, 0], [0, 0, FA]);
  conveyor(k, feed, { len: FLEN, belt: 1.05, drum: FRD, skirt: 0, pitch: 0.8 });
  // jambes du tapis (vers le châssis)
  for (const s of [-1, 1]) {
    for (const lx of [0.6, 2.6]) {
      const h = FY + lx * Math.sin(FA) - 0.1 * Math.cos(FA) - CH_Y1;
      k.box(feed, 'trim', [0.1, h, 0.1], [lx - (h / 2) * Math.sin(FA), -0.1 - (h / 2) * Math.cos(FA), s * 0.62], [0, 0, -FA]);
    }
  }
  // dessus des longerons du tapis (les parois de la trémie y reposent)
  const beltTop = (x: number) => FY + (x - FX) * Math.tan(FA) + (FRD - 0.03) / Math.cos(FA);
  // parois fixes verticales (bord inférieur sur les longerons du tapis) et paroi arrière
  for (const s of [-1, 1]) {
    plate(k, chassis, 'paint', [[HX0, beltTop(HX0), s * HZ0], [HX1, beltTop(HX1), s * HZ0], [HX1, HY0, s * HZ0], [HX0, HY0, s * HZ0]], 0.05);
    k.cylX(chassis, 'trim', 0.035, HX1 - HX0, [(HX0 + HX1) / 2, HY0, s * HZ0], 10);
  }
  plate(k, chassis, 'paint', [[HX0, beltTop(HX0), -HZ0], [HX0, beltTop(HX0), HZ0], [HX0, HY0, HZ0], [HX0, HY0, -HZ0]], 0.05);
  k.cylZ(chassis, 'trim', 0.035, 2 * HZ0, [HX0, HY0, 0], 10);
  // rehausses repliables (gauche, droite, arrière), rabattues au repos
  const fl = HX1 - HX0 - 0.08;
  const flapL = k.part('flapL', chassis, [HX1 - fl / 2, HY0, -HZ0]);
  k.joint('hopperL', flapL, 'rx', FLAP_IN);
  const flapR = k.part('flapR', chassis, [HX1 - fl / 2, HY0, HZ0]);
  k.joint('hopperR', flapR, 'rx', -FLAP_IN);
  const flapB = k.part('flapB', chassis, [HX0, HY0, 0]);
  k.joint('hopperB', flapB, 'rz', 0);
  for (const [p, s] of [
    [flapL, -1],
    [flapR, 1],
  ] as const) {
    k.box(p, 'paint', [fl, FLAP, 0.05], [0, FLAP / 2, 0]);
    for (const x of [-fl / 3, 0, fl / 3]) k.box(p, 'trim', [0.07, FLAP - 0.08, 0.03], [x, FLAP / 2, s * 0.04]);
    k.cylX(p, 'steel', 0.028, fl, [0, FLAP, 0], 10);
  }
  k.box(flapB, 'paint', [0.05, FLAP, 2 * HZ0], [0, FLAP / 2, 0]);
  for (const z of [-0.35, 0.35]) k.box(flapB, 'trim', [0.03, FLAP - 0.08, 0.07], [-0.04, FLAP / 2, z]);
  k.cylZ(flapB, 'steel', 0.028, 2 * HZ0, [0, FLAP, 0], 10);

  // ================================================================ groupe moteur (droite) et réservoirs (gauche), sous la trémie
  const ux = -5.05;
  k.rbox(chassis, 'paint', [1.9, 0.95, 0.7], 0.05, [ux, CH_Y1 + 0.475, 1.05], undefined, 2);
  k.box(chassis, 'trim', [1.92, 0.07, 0.72], [ux, CH_Y1 + 0.035, 1.05]);
  k.grille(chassis, [ux - 0.35, 1.85, 1.402], 0.7, 0.55, 6, 'z', 1);
  k.grille(chassis, [ux - 0.952, 1.85, 1.05], 0.5, 0.6, 6, 'x', -1);
  k.box(chassis, 'black', [0.012, 0.85, 0.006], [ux + 0.25, 1.825, 1.403]);
  k.box(chassis, 'steel', [0.03, 0.12, 0.03], [ux + 0.4, 1.85, 1.415]);
  exhaust(k, chassis, [ux + 0.6, CH_Y1 + 0.95, 1.25], 0.32, 0.06);
  k.rbox(chassis, 'paint', [1.9, 0.75, 0.6], 0.05, [ux, CH_Y1 + 0.375, -1.0], undefined, 2);
  k.box(chassis, 'trim', [1.92, 0.07, 0.62], [ux, CH_Y1 + 0.035, -1.0]);
  k.cyl(chassis, 'steel', 0.06, 0.06, [ux + 0.6, CH_Y1 + 0.78, -1.0], undefined, 12);
  k.box(chassis, 'black', [0.07, 0.3, 0.012], [ux - 0.6, 1.75, -1.302]);
  k.box(chassis, 'glass', [0.04, 0.26, 0.006], [ux - 0.6, 1.75, -1.31]);
  // flexibles hydrauliques du groupe vers l'avant, le long des longerons
  for (const s of [-1, 1]) {
    for (const dy of [0, 0.05]) {
      k.hose(chassis, 'rubber', [[ux + 0.95, CH_Y1 + 0.1 + dy, s * 0.8], [ux + 1.4, CH_Y1 - 0.08 + dy, s * 0.71], [0.0, CH_Y1 - 0.12 + dy, s * 0.71], [CH_X1 + 0.3, 1.05 + dy, s * 0.79]], 0.02, 32);
    }
  }
  // armoire de commande et arrêt d'urgence
  k.rbox(chassis, 'trim', [0.5, 0.5, 0.12], 0.02, [ux + 0.3, 1.78, -1.36], undefined, 1);
  k.box(chassis, 'paint', [0.14, 0.14, 0.04], [ux + 0.68, 1.78, -1.32]);
  k.cylZ(chassis, 'tail', 0.045, 0.05, [ux + 0.68, 1.78, -1.36], 14);
  // gyrophare sur le toit du groupe moteur, phare arrière sur la paroi de trémie
  k.beacon(chassis, [ux - 0.7, CH_Y1 + 0.95, 1.2]);
  k.lamp(chassis, [HX0 - 0.067, 2.35, 0], 0.12, Math.PI);

  // ================================================================ supports du crible et bande des fines
  const cosA = Math.cos(SA);
  const sinA = Math.sin(SA);
  const toWorld = (lx: number, ly: number): [number, number] => [SX + lx * cosA - ly * sinA, SY + lx * sinA + ly * cosA];
  const springLX = [-1.7, 1.3];
  for (const s of [-1, 1]) {
    for (const lx of springLX) {
      const [wx, wy] = toWorld(lx, -0.61);
      const base = wy - 0.25;
      // console sur le longeron, tour jusqu'au siège du ressort, ressort hélicoïdal
      const yo = Math.min(CH_Y1 - 0.2, base - 0.05);
      k.box(chassis, 'paint', [0.3, 0.1, 0.44], [wx, yo, s * 0.85]);
      if (base > yo + 0.06) k.box(chassis, 'paint', [0.24, base - yo, 0.2], [wx, (base + yo) / 2, s * 0.96]);
      k.cyl(chassis, 'steelDark', 0.1, 0.03, [wx, base + 0.015, s * 0.96], undefined, 12);
      k.cyl(chassis, 'steel', 0.075, 0.22, [wx, base + 0.14, s * 0.96], undefined, 12);
    }
  }
  const fines = k.part('fines', chassis, [-1.9, 1.02, 0]);
  conveyor(k, fines, { len: 2.9, belt: 0.8, drum: 0.13, depth: 0.2, skirt: 0.12, pitch: 0.8 });
  // goulottes : fines vers la bande latérale droite, produit moyen vers la gauche
  plate(k, chassis, 'paint', [[1.0, 1.34, 0.2], [1.4, 1.34, 0.2], [SIDE_X + 0.3, 1.1, 0.92], [SIDE_X - 0.3, 1.1, 0.92]], 0.04);
  plate(k, chassis, 'paint', [[1.85, 1.52, -0.3], [2.1, 1.52, -0.3], [SIDE_X + 0.3, 1.32, -0.92], [SIDE_X - 0.3, 1.32, -0.92]], 0.04);

  // ================================================================ crible incliné à deux étages (vibre au réveil)
  const screen = k.part('screen', chassis, [SX, SY, 0], [0, 0, SA]);
  for (const s of [-1, 1]) {
    k.box(screen, 'paint', [4.0, 1.0, 0.05], [0, -0.05, s * SZ]);
    k.box(screen, 'trim', [4.02, 0.06, 0.09], [0, 0.45, s * SZ]);
    k.box(screen, 'trim', [4.02, 0.06, 0.09], [0, -0.55, s * SZ]);
    for (const x of [-1.45, -0.45, 0.6, 1.55]) k.box(screen, 'trim', [0.07, 0.94, 0.03], [x, -0.05, s * (SZ + 0.035)]);
    for (const x of springLX) k.box(screen, 'steelDark', [0.3, 0.06, 0.22], [x, -0.58, s * (SZ + 0.085)]);
    // paliers de l'arbre vibrant
    k.cylZ(screen, 'steelDark', 0.17, 0.16, [0.1, 0.05, s * (SZ + 0.1)], 18);
    k.decal(screen, 0.72, 0.18, [-0.95, -0.02, s * (SZ + 0.03)], s > 0 ? 0 : Math.PI);
  }
  k.cylZ(screen, 'trim', 0.08, 2 * SZ, [0.1, 0.05, 0], 12);
  k.box(screen, 'paint', [0.05, 0.9, 2 * SZ], [-2.0, -0.05, 0]);
  for (const x of [-1.0, 0.0, 1.0]) k.cylZ(screen, 'steelDark', 0.06, 2 * SZ, [x, 0.47, 0], 10);
  // étages de toiles : fond noir, fils d'acier, tôle d'alimentation, becs de déversement
  for (const [y, lip] of [
    [0.2, 2.2],
    [-0.2, 2.06],
  ] as const) {
    k.box(screen, 'black', [lip + 2.0, 0.02, 2 * SZ - 0.04], [(lip - 2.0) / 2, y, 0]);
    for (let i = 0; i < 7; i++) k.box(screen, 'steel', [lip + 1.95, 0.012, 0.012], [(lip - 2.0) / 2, y + 0.014, -0.72 + i * 0.24]);
    for (let i = 0; i < 9; i++) k.box(screen, 'steel', [0.012, 0.012, 2 * SZ - 0.06], [-1.75 + i * 0.45, y + 0.014, 0]);
  }
  k.box(screen, 'steelDark', [0.55, 0.03, 2 * SZ - 0.04], [-1.72, 0.225, 0]);

  // ================================================================ passerelles le long du crible, échelle
  const wxm = (WALK_X0 + WALK_X1) / 2;
  for (const s of [-1, 1]) {
    k.box(chassis, 'black', [WALK_X1 - WALK_X0, 0.04, 0.43], [wxm, WALK_Y - 0.02, s * 1.335]);
    k.box(chassis, 'paint', [WALK_X1 - WALK_X0, 0.1, 0.02], [wxm, WALK_Y + 0.03, s * 1.55]);
    for (const x of [WALK_X0 + 0.15, WALK_X1 - 0.15]) k.box(chassis, 'paint', [0.08, 0.1, 0.9], [x, WALK_Y - 0.09, s * 1.12]);
    const zr = s * 1.53;
    const posts = [WALK_X0, (2 * WALK_X0 + WALK_X1) / 3, (WALK_X0 + 2 * WALK_X1) / 3, WALK_X1];
    for (const x of posts) k.cyl(chassis, 'paint', 0.022, 1.0, [x, WALK_Y + 0.5, zr], undefined, 8);
    for (const y of [0.5, 1.0]) {
      k.cylX(chassis, 'paint', 0.022, WALK_X1 - WALK_X0, [wxm, WALK_Y + y, zr], 8);
      k.cylZ(chassis, 'paint', 0.022, 0.4, [WALK_X0, WALK_Y + y, s * 1.33], 8);
      if (s > 0) k.cylZ(chassis, 'paint', 0.022, 0.4, [WALK_X1, WALK_Y + y, s * 1.33], 8);
    }
  }
  for (const s of [-1, 1]) k.lamp(chassis, [WALK_X1, WALK_Y + 1.067, s * 1.53], 0.12);
  ladder(k, chassis, WALK_X1 + 0.02, WALK_X1 + 0.32, 0.35, WALK_Y - 0.04, -1.6, 4, 'paint');
  k.cyl(chassis, 'paint', 0.022, 1.0, [WALK_X1 + 0.32, WALK_Y + 0.5, -1.6], undefined, 8);
  k.cylZ(chassis, 'paint', 0.022, 0.08, [WALK_X1 + 0.32, WALK_Y + 1.0, -1.56], 8);

  // ================================================================ bande de queue (refus) : tronçon réglable et tête repliable
  const tail = k.part('tail', chassis, [TAIL_X, TAIL_Y, 0], [0, 0, TAIL_A]);
  k.joint('tail', tail, 'rz', 0);
  conveyor(k, tail, { len: TAIL_MID, belt: 1.0, drum: 0.17, headDrum: false, skirtFrom: 0.15, skirtTo: TAIL_MID - 0.3, pitch: 0.95 });
  for (const s of [-1, 1]) {
    k.box(tail, 'steelDark', [0.16, 0.12, 0.06], [1.6, -0.15, s * 0.66]);
    k.piston(chassis, [chassis, [CH_X1 + 0.42, 1.06, s * 0.79]], [tail, [1.6, -0.15, s * 0.71]], 0.07, 0.042);
    k.cylZ(chassis, 'steel', 0.04, 0.08, [CH_X1 + 0.42, 1.06, s * 0.79], 10);
    // chapes de l'articulation de repliage
    k.box(tail, 'trim', [0.32, 0.46, 0.04], [TAIL_MID - 0.1, 0.12, s * 0.635]);
  }
  k.cylZ(tail, 'steel', 0.05, 1.5, [TAIL_MID, TAIL_FOLD_Y, 0], 12);
  // tête : articulée en haut des bavettes, repliée vers le haut et l'arrière au-dessus du crible pour le transport
  const tailFold = k.part('tailHead', tail, [TAIL_MID, TAIL_FOLD_Y, 0]);
  k.joint('tailFold', tailFold, 'rz', TAIL_FOLD_REST);
  for (const s of [-1, 1]) k.box(tailFold, 'trim', [0.32, 0.46, 0.04], [0.1, -0.22, s * 0.685]);
  const tailHead = k.part('tailHeadBody', tailFold, [0, -TAIL_FOLD_Y, 0]);
  conveyor(k, tailHead, { len: TAIL_HEAD, belt: 1.0, drum: 0.17, tailDrum: false, skirt: 0, pitch: 0.95, motor: 1 });
  k.box(tailHead, 'black', [0.05, 0.12, 1.0], [TAIL_HEAD - 0.13, -0.2, 0], [0, 0, 0.6]);

  // ================================================================ bandes latérales (repliées verticales au repos)
  // repère de chaque bande : x vers l'extérieur (rotation de ∓90° autour de y), z le long de la machine
  for (const s of [-1, 1]) {
    const p = k.part(s < 0 ? 'sideL' : 'sideR', chassis, [SIDE_X, SIDE_Y, s * SIDE_Z], [0, -s * (Math.PI / 2), 0]);
    k.joint(s < 0 ? 'sideL' : 'sideR', p, 'rz', SIDE_REST);
    conveyor(k, p, { len: SIDE_LEN, belt: 0.65, drum: 0.12, depth: 0.18, skirt: 0.12, skirtFrom: 0.05, skirtTo: 1.2, pitch: 0.8, motor: s < 0 ? -1 : 1 });
    k.box(p, 'paint', [0.04, 0.32, 0.9], [0.0, 0.3, 0]);
    k.box(p, 'steelDark', [0.16, 0.12, 0.06], [1.0, -0.1, 0.42]);
    k.piston(chassis, [chassis, [SIDE_X - s * 0.42, 0.98, s * 0.79]], [p, [1.0, -0.1, 0.42]], 0.055, 0.032);
  }

  return k.build({
    refWeight: 25,
    minScale: 0.85,
    maxScale: 1.12,
    vibrate: 'screen',
    wake: [
      { pose: { tailFold: 0, sideL: SIDE_OPEN }, dur: 2.0 },
      { pose: { sideR: SIDE_OPEN, hopperL: -FLAP_OPEN, hopperR: FLAP_OPEN, hopperB: FLAP_B_OPEN, tail: 0.05 }, dur: 1.8 },
      { pose: { hopperL: FLAP_IN, hopperR: -FLAP_IN, hopperB: 0, tail: 0 }, dur: 1.6 },
      { pose: { tailFold: TAIL_FOLD_REST, sideL: SIDE_REST, sideR: SIDE_REST }, dur: 2.2 },
    ],
    nod: [
      { pose: { tail: 0.03 }, dur: 0.5 },
      { pose: { tail: 0 }, dur: 0.55 },
    ],
    breathe: { tail: 0.003 },
  });
}

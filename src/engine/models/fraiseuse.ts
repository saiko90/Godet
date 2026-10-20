// Fraiseuse routière à froid (≈ 19 t, classe Wirtgen W 100 Fi / W 120 Fi) : quatre trains de chenilles sur
// colonnes de levage, carter du tambour de fraisage (largeur 1,0 m) avec flasques latéraux et racleur, réservoir
// d'eau à l'avant, poste de conduite central sous toit (pupitre, siège, garde-corps, échelle), moteur à
// l'arrière, convoyeur primaire sous la caisse et convoyeur de chargement avant en deux tronçons, orientable,
// relevable et pliable : au repos en position de transport (tronçon avant rabattu sur le tronçon arrière,
// ensemble relevé à 40°), déplié au réveil.
// Gabarit : caisse 5,9 × 2,3 × 3,2 m (toit) ; 8,8 m de long en transport ; convoyeur déplié 6,15 m
// (déchargement à ≈ 3,8 m).
import { Kit, softPolygon, type MachineTemplate, type V3 } from './kit';
import { exhaust, track } from './parts';

const TR = 0.27; // rayon des roues de chenille
const TL = 1.45; // longueur des trains de chenilles
const TZ = 0.86; // demi-voie
const XF = 1.6; // trains avant
const XB = -2.3; // trains arrière
const BW = 2.3; // largeur de la caisse
const UNDER = 1.2; // dessous de la caisse (profil, hors arrondi)
const DECK = 1.84; // plancher du poste (profil, hors arrondi)
/**
 * Convoyeur de chargement : couronne d'orientation (sous l'avant de la caisse), axe de relevage dans la fourche,
 * inclinaison au repos (transport), queue derrière l'axe, charnière de pliage au-dessus des joues du tronçon
 * arrière (abscisse, hauteur au-dessus de l'axe de la bande) et longueur du tronçon avant.
 */
const P: V3 = [2.6, 1.14, 0];
const PIN: V3 = [0.32, -0.35, 0];
const LIFT = 0.7;
const TAIL = -0.2;
const CH = 3.35;
const HY = 0.2;
const LB = 2.6;

/**
 * Tronçon de convoyeur (x le long de la bande, axe de la bande à la hauteur y0) : poutre, joues et raidisseurs,
 * bande à chevrons, brin de retour sous la poutre et ses rouleaux.
 */
function conveyorSection(k: Kit, part: number, x0: number, x1: number, w: number, y0: number): void {
  const L = x1 - x0;
  const xm = (x0 + x1) / 2;
  k.rbox(part, 'trim', [L, 0.18, w - 0.2], 0.03, [xm, y0 - 0.22, 0], undefined, 2);
  for (const s of [-1, 1]) {
    k.box(part, 'paint', [L, 0.32, 0.035], [xm, y0, (s * w) / 2]);
    k.box(part, 'trim', [L, 0.035, 0.08], [xm, y0 + 0.17, s * (w / 2 + 0.02)]);
    const n = Math.max(2, Math.round(L / 0.6));
    for (let i = 0; i <= n; i++) k.box(part, 'paint', [0.05, 0.3, 0.03], [x0 + 0.05 + (i * (L - 0.1)) / n, y0 - 0.01, s * (w / 2 + 0.03)]);
  }
  k.box(part, 'rubber', [L, 0.02, 0.6], [xm, y0 - 0.12, 0]);
  const nc = Math.floor((L - 0.1) / 0.3);
  for (let i = 0; i < nc; i++) {
    for (const s of [-1, 1]) k.box(part, 'black', [0.03, 0.02, 0.26], [x0 + 0.16 + i * 0.3, y0 - 0.1, s * 0.14], [0, s * 0.45, 0]);
  }
  k.box(part, 'rubber', [L, 0.014, 0.56], [xm, y0 - 0.325, 0]);
  const nr = Math.max(1, Math.round(L / 0.9));
  for (let i = 0; i < nr; i++) {
    const x = x0 + ((i + 0.5) * L) / nr;
    k.cylZ(part, 'steelDark', 0.035, w - 0.2, [x, y0 - 0.37, 0], 10);
    for (const s of [-1, 1]) k.box(part, 'trim', [0.05, 0.1, 0.03], [x, y0 - 0.33, s * (w / 2 - 0.08)]);
  }
}

export function buildFraiseuse(): MachineTemplate {
  const k = new Kit('fraiseuse');

  // ---------------------------------------------------------------- trains de chenilles (fixes au sol)
  const trains: [number, number][] = [];
  for (const x of [XF, XB]) {
    const t = k.part(x > 0 ? 'tracksF' : 'tracksB', 0, [x, 0, 0]);
    trains.push([t, x]);
    for (const s of [-1, 1]) {
      // centre des roues à TR + 0,0875 : crampons des patins posés sur le sol
      track(k, t, { length: TL, radius: TR, cy: TR + 0.0875, width: 0.3, z: s * TZ, rubber: true, rollers: 3 });
      k.rbox(t, 'steelDark', [0.42, 0.14, 0.34], 0.03, [0, 0.76, s * TZ], undefined, 1);
      k.cylZ(t, 'steel', 0.05, 0.4, [0, 0.78, s * TZ], 10);
    }
  }

  // ---------------------------------------------------------------- caisse (montée sur les colonnes de levage)
  const body = k.part('body', 0, [0, 0, 0]);
  k.joint('legs', body, 'ty', 0);
  const prof = softPolygon(
    [
      [2.76, UNDER],
      [2.76, 1.72],
      [2.56, 1.92],
      [0.6, 1.92],
      [0.54, DECK],
      [-1.02, DECK],
      [-1.08, 1.98],
      [-1.28, 2.24],
      [-2.8, 2.24],
      [-2.96, 2.08],
      [-2.96, UNDER],
    ],
    0.1,
  );
  k.extrude(body, 'paint', prof, BW, [0, 0, 0], undefined, 0.04, 10);
  k.rbox(body, 'trim', [5.86, 0.1, BW + 0.04], 0.03, [-0.1, UNDER, 0], undefined, 2);
  // flancs deux tons : bandeau graphite bas, plaque du code, ouïes du moteur
  for (const s of [-1, 1]) {
    k.rbox(body, 'trim', [5.7, 0.2, 0.02], 0.008, [-0.1, 1.38, s * (BW / 2 + 0.008)], undefined, 1);
    k.decal(body, 0.66, 0.165, [1.6, 1.62, s * (BW / 2 + 0.002)], s > 0 ? 0 : Math.PI);
    k.grille(body, [-2.0, 1.86, s * (BW / 2)], 0.9, 0.38, 5, 'z', s);
    // joints des portes de visite et poignées (réservoir d'eau à l'avant, moteur à l'arrière)
    const zs = s * (BW / 2 + 0.003);
    for (const [xa, xb, top] of [[0.72, 2.48, 1.9], [-2.62, -1.38, 2.15]] as [number, number, number][]) {
      for (const x of [xa, xb]) k.box(body, 'black', [0.012, top - 1.52, 0.006], [x, (top + 1.52) / 2, zs]);
      k.box(body, 'black', [xb - xa, 0.012, 0.006], [(xa + xb) / 2, 1.52, zs]);
      k.box(body, 'steel', [0.1, 0.025, 0.02], [xb - 0.09, 1.66, s * (BW / 2 + 0.01)]);
    }
  }
  for (let i = 0; i < 6; i++) k.box(body, 'black', [0.05, 0.02, 1.4], [-2.62 + i * 0.12, 2.325, 0]);
  k.rbox(body, 'black', [0.12, 0.1, 1.9], 0.03, [2.86, 1.24, 0], undefined, 1);
  // arrière : grille de refroidissement, feux, pare-chocs
  k.grille(body, [-3.0, 1.78, 0], 1.4, 0.5, 6, 'x', -1);
  for (const s of [-1, 1]) {
    k.rbox(body, 'tail', [0.04, 0.12, 0.18], 0.015, [-3.005, 1.4, s * 0.92], undefined, 1);
    k.rbox(body, 'amber', [0.04, 0.07, 0.1], 0.012, [-3.005, 1.4, s * 0.72], undefined, 1);
  }
  k.rbox(body, 'black', [0.1, 0.12, 2.0], 0.03, [-3.02, 1.22, 0], undefined, 1);
  // capot moteur : échappement, filtre à air ; réservoir d'eau avant : bouchon, phares
  exhaust(k, body, [-1.7, 2.28, 0.75], 0.6, 0.075);
  k.cyl(body, 'black', 0.13, 0.36, [-1.75, 2.46, -0.72], undefined, 18);
  k.cyl(body, 'trim', 0.14, 0.04, [-1.75, 2.66, -0.72], undefined, 18);
  k.cyl(body, 'trim', 0.1, 0.05, [1.7, 1.985, 0.62], undefined, 16);
  for (const s of [-1, 1]) k.lamp(body, [2.84, 1.76, s * 0.86], 0.13);

  // carter du tambour de fraisage, flasques latéraux, racleur arrière
  const housing = softPolygon(
    [
      [0.2, 0.32],
      [0.2, 0.92],
      [-0.08, UNDER],
      [-1.17, UNDER],
      [-1.45, 0.92],
      [-1.45, 0.32],
    ],
    0.08,
  );
  k.extrude(body, 'steelDark', housing, 1.24, [0, 0, 0], undefined, 0.03, 8);
  k.cylZ(body, 'steelDark', 0.45, 1.0, [-0.62, 0.5, 0], 24);
  const plate = softPolygon(
    [
      [0.36, 0.02],
      [0.36, 0.6],
      [0.16, 0.96],
      [-1.42, 0.96],
      [-1.62, 0.6],
      [-1.62, 0.02],
    ],
    0.1,
  );
  for (const s of [-1, 1]) {
    k.extrude(body, 'paint', plate, 0.04, [0, 0, s * 0.68], undefined, 0.008, 8);
    k.box(body, 'steelDark', [1.7, 0.05, 0.08], [-0.63, 0.05, s * 0.68]);
  }
  k.box(body, 'steelDark', [0.05, 0.58, 1.3], [-1.5, 0.31, 0]);
  for (const s of [-1, 1]) k.piston(body, [body, [-1.66, UNDER - 0.02, s * 0.4]], [body, [-1.53, 0.62, s * 0.4]], 0.05, 0.03);

  // convoyeur primaire sous la caisse, du carter vers l'avant
  {
    const a: [number, number] = [0.25, 0.55];
    const b: [number, number] = [2.5, 0.98];
    k.rbox(body, 'trim', [Math.hypot(b[0] - a[0], b[1] - a[1]), 0.16, 0.66], 0.03, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0], [0, 0, Math.atan2(b[1] - a[1], b[0] - a[0])], 2);
  }

  // colonnes de levage : fourreau dans la caisse, tige sur le train
  for (const [t, x] of trains) {
    for (const s of [-1, 1]) k.piston(t, [body, [x, UNDER + 0.04, s * TZ]], [t, [0, 0.8, s * TZ]], 0.16, 0.11, 'trim', 'chrome');
  }

  // ---------------------------------------------------------------- poste de conduite
  k.box(body, 'black', [1.48, 0.02, BW - 0.12], [-0.24, DECK + 0.05, 0]);
  // pupitre central, siège à gauche
  k.rbox(body, 'trim', [0.16, 0.6, 0.9], 0.03, [0.36, DECK + 0.34, 0], undefined, 2);
  k.rbox(body, 'trim', [0.42, 0.08, 1.1], 0.03, [0.3, DECK + 0.66, 0], [0, 0, 0.4], 2);
  k.box(body, 'glass', [0.2, 0.006, 0.34], [0.27, DECK + 0.72, -0.2], [0, 0, 0.4]);
  for (const z of [0.18, 0.38]) {
    k.cyl(body, 'black', 0.015, 0.12, [0.25, DECK + 0.75, z], [0, 0, 0.4], 8);
    k.sphere(body, 'black', 0.032, [0.23, DECK + 0.81, z], 10);
  }
  k.rbox(body, 'trim', [0.36, 0.38, 0.4], 0.03, [-0.36, DECK + 0.23, -0.5], undefined, 2);
  k.rbox(body, 'interior', [0.46, 0.1, 0.48], 0.04, [-0.34, DECK + 0.47, -0.5], undefined, 2);
  k.rbox(body, 'interior', [0.1, 0.56, 0.46], 0.04, [-0.58, DECK + 0.78, -0.5], [0, 0, 0.12], 2);
  // garde-corps (ouvert à gauche pour l'échelle), échelle et jambe de force
  k.rail(body, 'trim', [[0.5, DECK + 0.06, 1.1], [0.5, DECK + 1.0, 1.1], [-0.96, DECK + 1.0, 1.1], [-0.96, DECK + 0.06, 1.1]], 0.022);
  k.rail(body, 'trim', [[0.5, DECK + 0.55, 1.1], [-0.96, DECK + 0.55, 1.1]], 0.018);
  k.rail(body, 'trim', [[0.5, DECK + 0.06, -1.1], [0.5, DECK + 1.0, -1.1], [-0.3, DECK + 1.0, -1.1], [-0.3, DECK + 0.06, -1.1]], 0.022);
  for (const x of [-0.8, -0.46]) k.box(body, 'trim', [0.04, DECK + 0.04 - 0.3, 0.05], [x, (DECK + 0.34) / 2, -1.18]);
  for (let i = 0; i < 5; i++) k.box(body, 'black', [0.34, 0.03, 0.16], [-0.63, 0.45 + i * 0.32, -1.2]);
  k.rail(body, 'trim', [[-0.63, 0.42, -1.18], [-0.63, 0.92, -0.72]], 0.02);
  k.rail(body, 'trim', [[-0.82, DECK + 0.06, -1.18], [-0.82, DECK + 0.95, -1.18]], 0.02);

  // toit sur quatre montants, phares, gyrophare, rétroviseurs
  for (const [x, z] of [[0.45, -1.06], [0.45, 1.06], [-0.94, -1.06], [-0.94, 1.06]] as [number, number][]) {
    k.cyl(body, 'trim', 0.045, 3.0 - DECK - 0.04, [x, (3.0 + DECK + 0.04) / 2, z], undefined, 12);
  }
  k.rbox(body, 'trim', [1.9, 0.06, 2.36], 0.025, [-0.25, 3.03, 0], undefined, 2);
  k.rbox(body, 'paint', [1.82, 0.08, 2.28], 0.035, [-0.25, 3.09, 0], undefined, 2);
  k.rbox(body, 'paint', [1.5, 0.05, 1.9], 0.025, [-0.27, 3.15, 0], undefined, 2);
  for (const s of [-1, 1]) {
    k.lamp(body, [0.66, 2.97, s * 0.88], 0.12);
    k.lamp(body, [-1.16, 2.97, s * 0.88], 0.11, Math.PI);
    k.mirror(body, [0.47, 2.7, s * 1.08], s, 0.14, 0.2);
  }
  k.beacon(body, [-0.92, 3.175, 0.85]);

  // ---------------------------------------------------------------- convoyeur de chargement
  // couronne d'orientation sous la caisse, fourche portant l'axe de relevage et la traverse du vérin
  k.rbox(body, 'trim', [0.8, 0.05, 0.8], 0.015, [P[0], P[1] + 0.02, 0], undefined, 1);
  const swing = k.part('swing', body, P);
  k.joint('swing', swing, 'ry', 0);
  k.cyl(swing, 'steelDark', 0.32, 0.06, [0, -0.03, 0], undefined, 24);
  const fork = softPolygon(
    [
      [-0.2, -0.02],
      [0.18, -0.02],
      [0.6, -0.3],
      [0.86, -0.68],
      [0.7, -0.8],
      [0.36, -0.47],
      [-0.2, -0.14],
    ],
    0.05,
  );
  for (const s of [-1, 1]) k.extrude(swing, 'trim', fork, 0.05, [0, 0, s * 0.47], undefined, 0.01, 6);
  k.cylZ(swing, 'steel', 0.05, 1.04, PIN, 10);
  k.cylZ(swing, 'steel', 0.045, 1.0, [0.76, -0.72, 0], 10);

  // tronçon arrière : tambour de queue, jupes de chargement, chape du vérin de relevage
  const conv = k.part('conveyor', swing, PIN);
  k.joint('lift', conv, 'rz', LIFT);
  conveyorSection(k, conv, TAIL, CH - 0.03, 0.82, 0);
  k.cylZ(conv, 'trim', 0.16, 0.7, [TAIL, -0.12, 0], 16);
  for (const s of [-1, 1]) k.box(conv, 'black', [0.6, 0.24, 0.03], [TAIL + 0.32, 0.02, s * 0.33]);
  k.box(conv, 'steelDark', [0.12, 0.08, 0.1], [1.6, -0.34, 0]);
  // charnière de pliage au-dessus des joues : flasques, axe, chapes des vérins de pliage
  for (const s of [-1, 1]) {
    k.box(conv, 'steelDark', [0.18, 0.22, 0.04], [CH - 0.06, HY - 0.09, s * 0.47]);
    k.box(conv, 'steelDark', [0.1, 0.12, 0.08], [CH - 1.0, HY - 0.1, s * 0.48]);
  }
  k.cylZ(conv, 'steel', 0.035, 1.1, [CH, HY, 0], 10);

  // tronçon avant : rabattu sur le tronçon arrière au repos (bande contre bande), tambour de tête, capot,
  // rideau et phare de chargement
  const tip = k.part('conveyorTip', conv, [CH, HY, 0]);
  k.joint('fold', tip, 'rz', Math.PI);
  conveyorSection(k, tip, 0.03, LB, 0.78, -HY);
  k.cylZ(tip, 'steelDark', 0.17, 0.66, [LB, -HY - 0.12, 0], 16);
  k.box(tip, 'paint', [0.45, 0.04, 0.7], [LB - 0.17, -0.06, 0]);
  k.box(tip, 'black', [0.03, 0.3, 0.7], [LB + 0.19, -HY - 0.07, 0]);
  k.lamp(tip, [LB - 0.3, -HY + 0.06, 0.48], 0.1);
  // flasques de charnière : tête de pliage triangulaire portant l'axe des vérins de pliage
  const head = softPolygon(
    [
      [0.12, -0.22],
      [0.12, 0.04],
      [-0.24, 0.12],
      [-0.28, 0.05],
      [-0.04, -0.22],
    ],
    0.04,
  );
  for (const s of [-1, 1]) {
    k.box(tip, 'steelDark', [0.18, 0.22, 0.04], [0.06, -0.09, s * 0.42]);
    k.extrude(tip, 'steelDark', head, 0.04, [0, 0, s * 0.5], undefined, 0.006, 6);
    k.cylZ(tip, 'steel', 0.03, 0.08, [-0.2, 0.07, s * 0.52], 10);
    k.piston(conv, [conv, [CH - 1.0, HY - 0.1, s * 0.53]], [tip, [-0.2, 0.07, s * 0.53]], 0.045, 0.028);
  }
  k.piston(swing, [swing, [0.76, -0.72, 0]], [conv, [1.6, -0.34, 0]], 0.08, 0.05);

  return k.build({
    refWeight: 19,
    minScale: 0.85,
    maxScale: 1.15,
    wake: [
      { pose: { legs: 0.18, fold: 1.7 }, dur: 1.6 },
      { pose: { fold: 0, lift: 0.5 }, dur: 1.6 },
      { pose: { lift: 0.58, swing: 0.45 }, dur: 1.5 },
      { pose: { swing: -0.32 }, dur: 1.3 },
      { pose: { swing: 0, lift: LIFT, fold: Math.PI, legs: 0 }, dur: 2.0 },
    ],
    nod: [
      { pose: { lift: 0.77 }, dur: 0.5 },
      { pose: { lift: LIFT }, dur: 0.55 },
    ],
    breathe: { lift: 0.003 },
  });
}

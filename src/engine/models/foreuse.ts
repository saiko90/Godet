// Foreuse sur chenilles pour ancrages et micropieux (≈ 12 t, classe Klemm KR 806 / Comacchio MC 12) :
// chenilles acier, plateau portant à l'arrière le groupe moteur et la centrale hydraulique, poste de commande
// latéral (côté gauche), réservoir hydraulique, râtelier de tiges, et à l'avant un bras cinématique qui porte
// le mât de forage (glissière à chaînes, tête de rotation, tige de forage, double clé au pied du mât).
// Au repos (transport), le mât est couché à l'horizontale au-dessus de la machine ; le réveil le dresse à la
// verticale, pied au sol, fait monter la tête de rotation puis la fait redescendre en tournant, et recouche le mât.
// Encombrement de transport ≈ 7,0 × 2,25 × 3,1 m.
import { Kit, beam2D, roundedRect, softPolygon, type MachineTemplate, type V3 } from './kit';
import { exhaust, ladder, track } from './parts';

// ------------------------------------------------------------------ dimensions (m)
// train de chenilles
const TL = 3.3; // longueur d'une chenille
const TR = 0.32; // rayon du barbotin et de la roue folle
const TCY = 0.36; // hauteur de l'axe des roues
const TW = 0.4; // largeur des patins
const TZ = 0.92; // demi-voie (axe des chenilles)
// plateau et groupe moteur
const DECK_Y0 = 0.82;
const DECK_Y1 = 1.0;
const DECK_X0 = -2.12;
const DECK_X1 = 1.22;
const DECK_Z = 1.12;
const HOOD_X0 = -2.08;
const HOOD_X1 = -0.38;
const HOOD_TOP = 1.86;
const HOOD_Z = 1.0;
const HB = 0.035; // arrondi (biseau) du capot
// bras cinématique : articulation sur le plateau, tête (articulation du mât) dans le repère du bras
const ROOT: V3 = [0.0, 1.2, 0];
const TIP: [number, number] = [1.55, 0.65];
// mât : repère propre, axe X le long du mât (pied vers +X, tête de mât vers −X), origine sur l'articulation
const MY = 0.32; // axe de la poutre au-dessus de l'articulation
const MH = 0.28; // hauteur de la poutre
const MWD = 0.28; // largeur de la poutre
const FOOT = 1.73; // pied du mât
const CROWN = -5.1; // tête de mât
const RAIL = MY + MH / 2 + 0.015; // dessus des glissières
const DRILL = 0.3; // axe de forage au-dessus des glissières
const HEAD_X = -0.75; // tête de rotation au repos
const CHAIN_Z = 0.205; // chaînes d'avance, de part et d'autre de la poutre
// bras abaissé et mât dressé : mât vertical, pointe d'appui posée au sol (sous les crampons des patins)
const BOOM_DRILL = -0.065;
const MAST_UP = -Math.PI / 2 - BOOM_DRILL;

export function buildForeuse(): MachineTemplate {
  const k = new Kit('foreuse');

  // ================================================================ porteur
  const carrier = k.part('carrier', 0, [0, 0, 0]);
  for (const s of [-1, 1]) track(k, carrier, { length: TL, radius: TR, cy: TCY, width: TW, z: s * TZ, rollers: 5 });
  // châssis central, traverses vers les longerons, traverse avant (chapes des vérins de levage du bras)
  k.rbox(carrier, 'steelDark', [2.5, DECK_Y0 - 0.3, 1.3], 0.05, [-0.12, (DECK_Y0 + 0.3) / 2, 0], undefined, 1);
  for (const x of [-0.95, 0.95]) k.box(carrier, 'steelDark', [0.32, 0.22, 2 * TZ - 0.2], [x, TCY + 0.08, 0]);
  k.rbox(carrier, 'steelDark', [0.3, 0.26, 1.24], 0.04, [1.26, 0.66, 0], undefined, 1);
  for (const s of [-1, 1]) {
    for (const dz of [-0.07, 0.07]) k.box(carrier, 'steelDark', [0.18, 0.16, 0.03], [1.3, 0.8, s * 0.42 + dz]);
    k.cylZ(carrier, 'steel', 0.035, 0.2, [1.3, 0.78, s * 0.42], 10);
  }

  // plateau deux tons
  k.slab(carrier, 'paint', roundedRect(DECK_X0, -DECK_Z, DECK_X1, DECK_Z, 0.1, 0.1), DECK_Y1 - DECK_Y0 - 0.05, DECK_Y0 + 0.05, 0.025, 10);
  k.slab(carrier, 'trim', roundedRect(DECK_X0 - 0.015, -DECK_Z - 0.015, DECK_X1 + 0.015, DECK_Z + 0.015, 0.1, 0.1), 0.06, DECK_Y0, 0, 10);
  // feux de gabarit
  for (const s of [-1, 1]) {
    for (const x of [1.0, -1.9]) k.rbox(carrier, 'amber', [0.1, 0.04, 0.02], 0.008, [x, DECK_Y0 + 0.1, s * (DECK_Z + 0.012)], undefined, 1);
  }

  // ---------------------------------------------------------------- groupe moteur et centrale hydraulique (arrière)
  const hood = softPolygon(
    [
      [HOOD_X0 + HB, DECK_Y1 - 0.02],
      [HOOD_X1 - HB, DECK_Y1 - 0.02],
      [HOOD_X1 - HB, HOOD_TOP - HB],
      [HOOD_X0 + 0.2, HOOD_TOP - HB],
      [HOOD_X0 + HB, HOOD_TOP - 0.2],
    ],
    0.08,
  );
  k.extrude(carrier, 'paint', hood, 2 * HOOD_Z, [0, 0, 0], undefined, HB, 8);
  // bandeau graphite au pied du capot
  k.box(carrier, 'trim', [HOOD_X1 - HOOD_X0 + 0.012, 0.07, 2 * HOOD_Z + 0.012], [(HOOD_X0 + HOOD_X1) / 2, DECK_Y1 + 0.035, 0]);
  for (const s of [-1, 1]) {
    const z = s * (HOOD_Z + 0.002);
    // portes : joint, poignées, ouïes de la porte avant, plaque du code sur la porte arrière
    k.box(carrier, 'black', [0.012, 0.72, 0.006], [-1.16, 1.46, z]);
    for (const x of [-1.26, -1.06]) k.box(carrier, 'steel', [0.1, 0.025, 0.025], [x, 1.46, s * (HOOD_Z + 0.014)]);
    k.grille(carrier, [-0.76, 1.47, z], 0.62, 0.5, 6, 'z', s);
    k.decal(carrier, 0.62, 0.155, [-1.62, 1.5, z], s > 0 ? 0 : Math.PI);
  }
  // radiateur à l'arrière, feux et phares de travail
  k.grille(carrier, [HOOD_X0 - 0.002, 1.42, 0], 1.3, 0.56, 6, 'x', -1);
  for (const s of [-1, 1]) {
    k.rbox(carrier, 'tail', [0.05, 0.1, 0.18], 0.02, [HOOD_X0 - 0.01, 1.12, s * 0.8], undefined, 2);
    k.lamp(carrier, [HOOD_X0 - 0.02, 1.6, s * 0.78], 0.11, Math.PI);
  }
  // berceau du mât au repos (sur le capot)
  const restY = ROOT[1] + TIP[1] + MY - MH / 2; // dessous de la poutre du mât au repos
  k.box(carrier, 'steelDark', [0.16, restY - HOOD_TOP - 0.04, 0.4], [-1.55, (HOOD_TOP + restY - 0.04) / 2, 0]);
  k.box(carrier, 'rubber', [0.22, 0.04, 0.34], [-1.55, restY - 0.02, 0]);
  // échappement, filtre à air et gyrophare (côté gauche du capot)
  exhaust(k, carrier, [-0.82, HOOD_TOP, -0.68], 0.3, 0.06);
  k.cyl(carrier, 'trim', 0.11, 0.28, [-1.22, HOOD_TOP + 0.14, -0.7], undefined, 16);
  k.cyl(carrier, 'black', 0.125, 0.05, [-1.22, HOOD_TOP + 0.3, -0.7], undefined, 16);
  k.beacon(carrier, [-1.72, HOOD_TOP, -0.74]);
  // râtelier de tiges de forage (côté droit du capot)
  for (const x of [-1.72, -0.78]) {
    k.box(carrier, 'trim', [0.08, 0.06, 0.44], [x, HOOD_TOP + 0.03, 0.61]);
    for (const z of [0.4, 0.82]) k.box(carrier, 'trim', [0.08, 0.2, 0.03], [x, HOOD_TOP + 0.1, z]);
    k.box(carrier, 'black', [0.09, 0.025, 0.45], [x, HOOD_TOP + 0.215, 0.61]);
  }
  for (let i = 0; i < 4; i++) k.cylX(carrier, 'steel', 0.042, 1.5, [-1.24, HOOD_TOP + 0.102, 0.48 + i * 0.087], 10);
  for (let i = 0; i < 3; i++) k.cylX(carrier, 'steel', 0.042, 1.5, [-1.24, HOOD_TOP + 0.175, 0.524 + i * 0.087], 10);

  // ---------------------------------------------------------------- réservoir hydraulique (avant droit)
  k.rbox(carrier, 'paint', [1.0, 0.62, 0.5], 0.05, [0.2, DECK_Y1 + 0.31, 0.83], undefined, 3);
  k.box(carrier, 'trim', [1.012, 0.06, 0.512], [0.2, DECK_Y1 + 0.03, 0.83]);
  k.cyl(carrier, 'steel', 0.06, 0.06, [-0.05, DECK_Y1 + 0.65, 0.83], undefined, 14);
  k.cyl(carrier, 'trim', 0.08, 0.16, [0.42, DECK_Y1 + 0.7, 0.83], undefined, 14);
  // indicateur de niveau
  k.box(carrier, 'black', [0.07, 0.24, 0.012], [0.45, DECK_Y1 + 0.32, 1.084]);
  k.box(carrier, 'glass', [0.04, 0.2, 0.006], [0.45, DECK_Y1 + 0.32, 1.092]);
  // flexibles du réservoir vers le pied du bras
  for (const z of [0.5, 0.56]) {
    k.hose(carrier, 'rubber', [[-0.25, DECK_Y1 + 0.2, 0.58], [-0.2, DECK_Y1 + 0.16, z], [-0.08, DECK_Y1 + 0.14, z - 0.06], [0.0, ROOT[1] - 0.1, 0.47]], 0.022, 16);
  }
  // tôles antidérapantes et phares avant
  k.box(carrier, 'black', [0.94, 0.012, 1.0], [0.71, DECK_Y1 + 0.006, 0]);
  k.box(carrier, 'black', [0.44, 0.012, 0.56], [0.96, DECK_Y1 + 0.006, 0.8]);
  for (const s of [-1, 1]) k.lamp(carrier, [DECK_X1 - 0.06, DECK_Y1 + 0.068, s * 0.95], 0.12);

  // ---------------------------------------------------------------- poste de commande (avant gauche, côté z−)
  const pz = -0.84;
  k.box(carrier, 'black', [1.36, 0.03, 0.52], [0.43, DECK_Y1 + 0.015, pz]);
  k.rbox(carrier, 'trim', [0.22, 0.74, 0.3], 0.03, [0.9, DECK_Y1 + 0.37, pz], undefined, 1);
  const tilt = 0.3;
  k.rbox(carrier, 'paint', [0.42, 0.14, 0.64], 0.03, [0.88, DECK_Y1 + 0.8, pz], [0, 0, tilt], 2);
  // plan de commande incliné : leviers, manipulateurs, arrêt d'urgence, écran
  const desk = (u: number, h: number): [number, number] => [
    0.88 + u * Math.cos(tilt) - (0.07 + h) * Math.sin(tilt),
    DECK_Y1 + 0.8 + u * Math.sin(tilt) + (0.07 + h) * Math.cos(tilt),
  ];
  {
    const [fx, fy] = desk(0, 0.005);
    k.box(carrier, 'black', [0.36, 0.01, 0.58], [fx, fy, pz], [0, 0, tilt]);
  }
  for (let i = 0; i < 4; i++) {
    const [lx, ly] = desk(-0.08, 0.07);
    const z = pz - 0.18 + i * 0.07;
    k.cyl(carrier, 'black', 0.011, 0.14, [lx, ly, z], undefined, 6);
    k.sphere(carrier, 'black', 0.024, [lx, ly + 0.075, z], 8);
  }
  for (const dz of [-0.23, 0.2]) {
    const [jx, jy] = desk(0.08, 0.04);
    k.cyl(carrier, 'black', 0.028, 0.08, [jx, jy, pz + dz], undefined, 10);
    k.sphere(carrier, 'black', 0.036, [jx, jy + 0.05, pz + dz], 10);
  }
  {
    const [ex, ey] = desk(0.1, 0.015);
    k.cyl(carrier, 'tail', 0.032, 0.03, [ex, ey, pz + 0.02], [0, 0, tilt], 14);
    const [sx, sy] = desk(0.17, 0.08);
    k.box(carrier, 'black', [0.03, 0.16, 0.24], [sx, sy, pz - 0.05], [0, 0, tilt]);
    k.box(carrier, 'glass', [0.006, 0.12, 0.2], [sx - 0.017, sy + 0.005, pz - 0.05], [0, 0, tilt]);
  }
  // garde-corps du poste et marchepied
  const gz = -DECK_Z + 0.03;
  k.rail(carrier, 'trim', [[-0.3, DECK_Y1, gz], [-0.3, DECK_Y1 + 1.0, gz], [1.16, DECK_Y1 + 1.0, gz], [1.16, DECK_Y1 + 1.0, -0.58], [1.16, DECK_Y1, -0.58]], 0.022);
  k.cylX(carrier, 'trim', 0.018, 1.46, [0.43, DECK_Y1 + 0.5, gz], 8);
  k.cyl(carrier, 'trim', 0.022, 1.0, [1.16, DECK_Y1 + 0.5, gz], undefined, 8);
  ladder(k, carrier, -0.22, 0.14, 0.3, DECK_Y0 + 0.02, -DECK_Z - 0.06, 2);

  // ---------------------------------------------------------------- pied du bras (chapes sur le plateau)
  for (const s of [-1, 1]) k.box(carrier, 'paint', [0.42, 0.42, 0.06], [ROOT[0], ROOT[1] - 0.06, s * 0.42]);
  k.cylZ(carrier, 'steel', 0.05, 1.0, [ROOT[0], ROOT[1], 0], 12);
  for (const s of [-1, 1]) k.cylZ(carrier, 'steel', 0.07, 0.03, [ROOT[0], ROOT[1], s * 0.47], 14);

  // ================================================================ bras cinématique
  const boom = k.part('boom', carrier, ROOT);
  k.joint('boom', boom, 'rz', 0);
  const bm = beam2D([0, 0], [0.8, 0.4], TIP, 0.16, 0.13, 0.02);
  for (const s of [-1, 1]) {
    k.extrude(boom, 'paint', bm.shape, 0.08, [0, 0, s * 0.3], undefined, 0.015, 10);
    k.cylZ(boom, 'trim', 0.1, 0.1, [TIP[0], TIP[1], s * 0.3], 16);
    // flexibles le long des flancs
    const pts: V3[] = [];
    for (const t of [0.04, 0.35, 0.7, 0.96]) {
      const p = bm.edge(t, 1, -0.05);
      pts.push([p.x, p.y, s * 0.36]);
    }
    k.hose(boom, 'rubber', pts, 0.02, 24);
  }
  k.cylZ(boom, 'trim', 0.12, 0.7, [0, 0, 0], 16);
  // entretoise basse et pattes des vérins
  const low = bm.edge(0.42, -1, -0.04);
  k.box(boom, 'paint', [0.5, 0.06, 0.56], [low.x, low.y, 0], [0, 0, Math.atan2(TIP[1], TIP[0])]);
  const lc = bm.edge(0.72, -1, 0.0);
  for (const s of [-1, 1]) k.cylZ(boom, 'steel', 0.045, 0.2, [lc.x, lc.y, s * 0.4], 10);
  const mb = bm.edge(0.14, 1, -0.05);
  k.cylZ(boom, 'trim', 0.07, 0.56, [mb.x, mb.y, 0], 14);

  // ================================================================ mât de forage
  const mast = k.part('mast', boom, [TIP[0], TIP[1], 0]);
  k.joint('mast', mast, 'rz', 0);
  const midX = (FOOT + CROWN) / 2;
  k.rbox(mast, 'paint', [FOOT - CROWN, MH, MWD], 0.03, [midX, MY, 0], undefined, 2);
  k.box(mast, 'trim', [FOOT - CROWN - 0.1, 0.05, MWD + 0.012], [midX, MY - MH / 2 + 0.025, 0]);
  // glissières d'acier sur le dessus
  for (const s of [-1, 1]) k.box(mast, 'steel', [FOOT - CROWN - 0.75, 0.015, 0.05], [midX - 0.25, RAIL - 0.0075, s * 0.085]);
  // tête de mât : carter et pignons des chaînes d'avance
  k.rbox(mast, 'trim', [0.32, 0.46, 0.3], 0.04, [CROWN + 0.13, MY + 0.04, 0], undefined, 2);
  k.cylZ(mast, 'steel', 0.035, 2 * CHAIN_Z + 0.08, [CROWN + 0.15, MY, 0], 10);
  for (const s of [-1, 1]) {
    k.cylZ(mast, 'steelDark', 0.1, 0.05, [CROWN + 0.15, MY, s * CHAIN_Z], 16);
    k.cylZ(mast, 'steelDark', 0.09, 0.05, [0.95, MY, s * CHAIN_Z], 16);
  }
  k.cylZ(mast, 'steel', 0.035, 2 * CHAIN_Z + 0.08, [0.95, MY, 0], 10);
  // pied du mât : double clé (serrage et dévissage) dans un cadre peint, guide de tige, plaque et pointe d'appui
  const clampY = RAIL + DRILL;
  k.box(mast, 'steelDark', [0.76, 0.05, 0.46], [1.32, MY + MH / 2 + 0.025, 0]);
  for (const s of [-1, 1]) {
    k.rbox(mast, 'paint', [0.78, 0.5, 0.04], 0.015, [1.31, clampY - 0.04, s * 0.25], undefined, 2);
    k.box(mast, 'trim', [0.79, 0.05, 0.05], [1.31, clampY + 0.2, s * 0.25]);
  }
  for (const x of [1.12, 1.46]) {
    k.rbox(mast, 'steelDark', [0.18, 0.36, 0.46], 0.03, [x, clampY - 0.04, 0], undefined, 2);
    for (const s of [-1, 1]) {
      k.cylZ(mast, 'trim', 0.065, 0.1, [x, clampY, s * 0.32], 14);
      k.cylZ(mast, 'chrome', 0.028, 0.06, [x, clampY, s * 0.39], 10);
    }
  }
  k.box(mast, 'steelDark', [0.04, 0.2, 0.3], [1.67, RAIL + 0.08, 0]);
  k.torus(mast, 'steel', 0.08, 0.022, [1.67, clampY, 0], [0, Math.PI / 2, 0], [6, 18]);
  k.box(mast, 'steelDark', [0.05, MH + 0.04, MWD + 0.04], [FOOT - 0.025, MY, 0]);
  k.cyl(mast, 'steel', [0, 0.07], 0.08, [FOOT + 0.04, MY, 0], [0, 0, -Math.PI / 2], 12);
  for (const s of [-1, 1]) k.lamp(mast, [1.6, clampY + 0.12, s * 0.33], 0.1);
  // coulisseau sous la poutre, chapes et axe d'articulation
  k.rbox(mast, 'steelDark', [1.3, MY - MH / 2 + 0.01, 0.34], 0.03, [-0.2, (MY - MH / 2) / 2, 0], undefined, 2);
  for (const s of [-1, 1]) k.box(mast, 'steelDark', [0.42, 0.3, 0.05], [0, 0, s * 0.2]);
  k.cylZ(mast, 'trim', 0.1, 0.46, [0, 0, 0], 16);
  k.cylZ(mast, 'steel', 0.05, 0.74, [0, 0, 0], 12);
  // levier du vérin de dressage : angle choisi pour que la course reste plausible (≈ ×1,5) sur un quart de tour
  const toBase = Math.atan2(mb.y - TIP[1], mb.x - TIP[0]);
  const ma: [number, number] = [Math.cos(toBase - 0.72) * 0.42, Math.sin(toBase - 0.72) * 0.42];
  k.cylZ(mast, 'steel', 0.045, 0.2, [ma[0], ma[1], 0], 10);

  // ---------------------------------------------------------------- tête de rotation (coulisse le long du mât)
  const head = k.part('head', mast, [HEAD_X, RAIL, 0]);
  k.joint('feed', head, 'tx', 0);
  k.rbox(head, 'steelDark', [0.72, 0.1, 0.42], 0.03, [0, 0.05, 0], undefined, 2);
  for (const s of [-1, 1]) k.box(head, 'steelDark', [0.62, 0.3, 0.04], [0, -0.13, s * 0.17]);
  k.rbox(head, 'paint', [0.62, 0.5, 0.56], 0.07, [0, 0.34, 0], undefined, 3);
  k.rbox(head, 'trim', [0.46, 0.05, 0.4], 0.02, [0, 0.6, 0], undefined, 2);
  k.box(head, 'trim', [0.632, 0.06, 0.572], [0, 0.14, 0]);
  k.cylX(head, 'steelDark', 0.16, 0.06, [0.33, DRILL, 0], 18);
  // moteurs hydrauliques de rotation, de part et d'autre
  for (const s of [-1, 1]) {
    k.cylZ(head, 'trim', 0.11, 0.16, [0.02, 0.36, s * 0.36], 16);
    k.cylZ(head, 'steel', 0.065, 0.04, [0.02, 0.36, s * 0.46], 12);
    k.hose(head, 'rubber', [[0.02, 0.36, s * 0.47], [0.0, 0.6, s * 0.44], [-0.24, 0.76, s * 0.3], [-0.52, 0.68, s * 0.22], [-0.56, 0.3, s * 0.2]], 0.024, 20);
  }
  // tête d'injection (rinçage) et bloc de raccordement à l'arrière
  k.cylX(head, 'steel', 0.07, 0.16, [-0.38, DRILL, 0], 14);
  k.rbox(head, 'trim', [0.16, 0.2, 0.46], 0.03, [-0.43, 0.1, 0], undefined, 2);
  k.hose(head, 'rubber', [[-0.46, DRILL, 0], [-0.56, 0.34, 0.02], [-0.58, 0.26, 0.1], [-0.47, 0.19, 0.12]], 0.024, 12);
  // mandrin (tourne pendant le forage)
  const chuck = k.part('chuck', head, [0.36, DRILL, 0]);
  k.joint('spin', chuck, 'rx', 0);
  k.cyl(chuck, 'steel', 0.1, 0.12, [0.06, 0, 0], [0, 0, -Math.PI / 2], 6);
  k.cylX(chuck, 'steelDark', 0.07, 0.04, [0.14, 0, 0], 12);

  // ---------------------------------------------------------------- vérins, chaînes et tige de forage
  for (const s of [-1, 1]) k.piston(carrier, [carrier, [1.3, 0.78, s * 0.42]], [boom, [lc.x, lc.y, s * 0.42]], 0.07, 0.042);
  k.piston(boom, [boom, [mb.x, mb.y, 0]], [mast, [ma[0], ma[1], 0]], 0.085, 0.05);
  for (const s of [-1, 1]) {
    k.link(mast, [head, [-0.29, MY - RAIL, s * CHAIN_Z]], [mast, [CROWN + 0.15, MY, s * CHAIN_Z]], 0.03, 0.016, 'black');
    k.link(mast, [head, [0.29, MY - RAIL, s * CHAIN_Z]], [mast, [0.95, MY, s * CHAIN_Z]], 0.03, 0.016, 'black');
  }
  k.link(mast, [chuck, [0.12, 0, 0]], [mast, [1.3, RAIL + DRILL, 0]], 0.042, 0.042, 'steel', true);

  return k.build({
    refWeight: 12,
    minScale: 0.85,
    maxScale: 1.25,
    wake: [
      { pose: { boom: 0.18, mast: -0.6 }, dur: 1.6 },
      { pose: { boom: BOOM_DRILL, mast: MAST_UP }, dur: 1.5 },
      { pose: { feed: -3.7 }, dur: 1.4 },
      { pose: { feed: -1.7, spin: Math.PI * 4 }, dur: 1.2 },
      { pose: { boom: 0, mast: 0, feed: 0, spin: 0 }, dur: 2.0 },
    ],
    nod: [
      { pose: { mast: -0.07 }, dur: 0.45 },
      { pose: { mast: 0 }, dur: 0.5 },
    ],
    breathe: { feed: 0.02 },
  });
}

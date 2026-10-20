// Mini-dumper sur chenilles (≈ 2,5 t, classe Yanmar C30R / Wacker Neuson DT25 / Hinowa) : chenilles
// caoutchouc, benne avant basculante (≈ 1 m³) sur deux vérins latéraux, capot moteur arrière portant le siège,
// pupitre à leviers de translation et de benne, arceau ROPS rabattable avec gyrophare et phares de travail.
// Gabarit : 2,95 × 1,7 × 2,35 m (arceau). Petit engin : présenté agrandi dans le hall.
import { Kit, softPolygon, type MachineTemplate, type V3 } from './kit';
import { exhaust, track } from './parts';

const TR = 0.23; // rayon des roues de chenille
const TL = 2.3; // longueur de chenille
const TW = 0.35; // largeur de chenille
const TZ = 0.62; // demi-voie (axe des chenilles)
const DECK = 0.72; // dessus du plateau
/** Axe de basculement de la benne (bas de la face avant). */
const Q: V3 = [1.05, DECK + 0.04, 0];
const SW = 0.68; // demi-largeur intérieure de la benne
const SB = 1.12; // fond : de l'axe à la paroi arrière
const SH = 0.68; // hauteur de la paroi arrière
const LX = 0.34; // bec de vidage : avancée et hauteur
const LY = 0.5;
const XR = -1.4; // montants de l'arceau (x) et leur écartement (z), de part et d'autre du capot
const ZR = 0.72;

export function buildMiniDumper(): MachineTemplate {
  const k = new Kit('mini_dumper');

  // ---------------------------------------------------------------- train de chenilles et plateau
  const base = k.part('base', 0, [0, 0, 0]);
  // centre des roues à TR + 0,0875 : crampons de la bande posés sur le sol
  for (const s of [-1, 1]) track(k, base, { length: TL, radius: TR, cy: TR + 0.0875, width: TW, z: s * TZ, rubber: true, rollers: 5 });
  k.rbox(base, 'steelDark', [1.7, 0.26, 2 * TZ - TW * 0.5], 0.04, [-0.05, 0.42, 0], undefined, 2);
  k.rbox(base, 'trim', [2.62, 0.08, 1.34], 0.03, [-0.18, DECK - 0.04, 0], undefined, 2);
  // butées caoutchouc de la benne, chapes d'articulation avant
  for (const s of [-1, 1]) {
    k.box(base, 'rubber', [0.16, 0.03, 0.12], [-0.02, DECK + 0.015, s * 0.45]);
    k.box(base, 'steelDark', [0.16, 0.14, 0.06], [Q[0], Q[1] - 0.04, s * 0.5]);
    k.cylZ(base, 'steel', 0.03, 0.24, [Q[0], Q[1], s * 0.55], 10);
    // chape inférieure du vérin de benne, déportée hors du plateau
    k.box(base, 'steelDark', [0.14, 0.12, 0.18], [-0.35, DECK - 0.02, s * 0.75]);
  }
  k.rbox(base, 'trim', [0.1, 0.16, 1.2], 0.03, [1.13, DECK - 0.1, 0], undefined, 1);

  // ---------------------------------------------------------------- capot moteur arrière
  const hood = softPolygon(
    [
      [-0.66, DECK + 0.02],
      [-1.44, DECK + 0.02],
      [-1.46, 0.98],
      [-1.35, 1.13],
      [-0.72, 1.13],
      [-0.66, 1.07],
    ],
    0.08,
  );
  k.extrude(base, 'paint', hood, 1.32, [0, 0, 0], undefined, 0.04, 10);
  k.rbox(base, 'trim', [0.86, 0.06, 1.36], 0.02, [-1.06, DECK + 0.03, 0], undefined, 1);
  k.grille(base, [-1.5, 0.93, 0], 0.8, 0.22, 4, 'x', -1);
  for (const s of [-1, 1]) {
    k.grille(base, [-0.86, 0.95, s * 0.66], 0.24, 0.24, 4, 'z', s);
    k.decal(base, 0.38, 0.095, [-1.2, 0.95, s * 0.662], s > 0 ? 0 : Math.PI);
    k.rbox(base, 'tail', [0.04, 0.08, 0.12], 0.015, [-1.495, 1.05, s * 0.5], undefined, 1);
    k.rbox(base, 'amber', [0.04, 0.05, 0.08], 0.012, [-1.495, 1.05, s * 0.36], undefined, 1);
  }
  exhaust(k, base, [-1.26, 1.16, 0.45], 0.24, 0.04);
  k.cyl(base, 'black', 0.045, 0.03, [-0.82, 1.17, -0.42], undefined, 14);

  // siège sur le capot, face à la benne
  k.rbox(base, 'trim', [0.4, 0.06, 0.44], 0.02, [-1.02, 1.2, 0], undefined, 1);
  k.rbox(base, 'interior', [0.46, 0.1, 0.48], 0.04, [-1.0, 1.28, 0], undefined, 2);
  k.rbox(base, 'interior', [0.1, 0.56, 0.46], 0.04, [-1.24, 1.59, 0], [0, 0, 0.12], 2);
  // poste : tapis, réservoir hydraulique à droite, pupitre à leviers
  k.box(base, 'black', [0.34, 0.008, 0.9], [-0.48, DECK + 0.004, 0]);
  k.rbox(base, 'paint', [0.3, 0.34, 0.2], 0.04, [-0.5, DECK + 0.17, 0.53], undefined, 2);
  k.cyl(base, 'black', 0.035, 0.03, [-0.54, DECK + 0.35, 0.53], undefined, 12);
  k.rbox(base, 'trim', [0.14, 0.5, 0.5], 0.03, [-0.28, DECK + 0.25, 0], undefined, 2);
  k.rbox(base, 'trim', [0.22, 0.05, 0.54], 0.02, [-0.3, DECK + 0.52, 0], [0, 0, 0.35], 1);
  k.box(base, 'glass', [0.08, 0.005, 0.14], [-0.32, DECK + 0.55, 0.16], [0, 0, 0.35]);
  for (const z of [-0.16, -0.06, 0.04, 0.12]) {
    k.cyl(base, 'black', 0.012, 0.2, [-0.33, DECK + 0.64, z], [0, 0, 0.25], 8);
    k.sphere(base, z > 0.1 ? 'amber' : 'black', 0.026, [-0.355, DECK + 0.74, z], 10);
  }

  // arceau ROPS rabattable : montants, articulations, traverse, gyrophare et phares
  for (const s of [-1, 1]) {
    k.rbox(base, 'trim', [0.09, 2.3 - DECK, 0.09], 0.02, [XR, (2.3 + DECK) / 2, s * ZR], undefined, 2);
    k.box(base, 'steelDark', [0.14, 0.1, 0.13], [XR, 1.62, s * ZR]);
    k.cylZ(base, 'steel', 0.022, 0.16, [XR + 0.035, 1.62, s * ZR], 10);
    k.box(base, 'trim', [0.16, 0.05, 0.14], [XR, DECK + 0.025, s * ZR]);
    k.lamp(base, [XR + 0.08, 2.24, s * 0.45], 0.1);
  }
  k.rbox(base, 'trim', [0.1, 0.1, 2 * ZR + 0.09], 0.02, [XR, 2.3, 0], undefined, 2);
  k.lamp(base, [XR - 0.07, 2.24, 0.2], 0.09, Math.PI);
  k.beacon(base, [XR, 2.35, -0.25], 0.075);
  k.rail(base, 'trim', [[XR + 0.045, 1.32, -ZR], [-0.76, 1.32, -ZR], [-0.76, 1.15, -0.67]], 0.016);

  // ---------------------------------------------------------------- benne basculante
  const skip = k.part('skip', base, Q);
  k.joint('tip', skip, 'rz', 0);
  // profil des flancs : fond, face avant inclinée (bec de vidage), bord haut montant vers l'arrière
  const side = softPolygon(
    [
      [-SB, 0],
      [0, 0],
      [LX, LY - 0.03],
      [LX - 0.03, LY],
      [-SB, SH],
    ],
    0.05,
  );
  for (const s of [-1, 1]) k.extrude(skip, 'paint', side, 0.04, [0, 0, s * (SW + 0.02)], undefined, 0.008, 8);
  // fond (tôle d'usure sombre), face avant inclinée, paroi arrière
  const front = Math.atan2(LY, LX);
  k.box(skip, 'steelDark', [SB - 0.02, 0.04, 2 * SW], [-SB / 2, 0.025, 0]);
  k.box(skip, 'paint', [SB + 0.02, 0.03, 2 * SW + 0.04], [-SB / 2, -0.005, 0]);
  k.box(skip, 'paint', [Math.hypot(LX, LY), 0.04, 2 * SW], [LX / 2, LY / 2, 0], [0, 0, front]);
  k.box(skip, 'paint', [0.04, SH, 2 * SW], [-SB + 0.02, SH / 2, 0]);
  // bords roulés sur les flancs et la paroi arrière, lame d'usure du bec
  const ex = LX - 0.03 + SB;
  const ey = LY - SH;
  for (const s of [-1, 1]) {
    k.cyl(skip, 'paint', 0.028, Math.hypot(ex, ey), [(LX - 0.03 - SB) / 2, (LY + SH) / 2, s * (SW + 0.02)], [0, 0, Math.atan2(ey, ex) - Math.PI / 2], 10);
  }
  k.cylZ(skip, 'paint', 0.03, 2 * SW + 0.08, [-SB + 0.02, SH, 0], 10);
  k.box(skip, 'steel', [0.06, 0.025, 2 * SW + 0.04], [LX - 0.01, LY - 0.02, 0], [0, 0, front]);
  // nervures extérieures, chapes des vérins, paliers d'articulation sous le fond
  for (const s of [-1, 1]) {
    for (const x of [-0.86, -0.3]) k.rbox(skip, 'paint', [0.07, 0.52, 0.04], 0.015, [x, 0.31, s * (SW + 0.06)], undefined, 1);
    k.box(skip, 'steelDark', [0.12, 0.1, 0.08], [-0.45, 0.3, s * (SW + 0.08)]);
    k.box(skip, 'steelDark', [0.14, 0.08, 0.1], [0, -0.04, s * 0.58]);
  }

  // vérins de basculement, à l'extérieur des flancs
  for (const s of [-1, 1]) k.piston(base, [base, [-0.35, DECK, s * 0.8]], [skip, [-0.45, 0.3, s * 0.8]], 0.055, 0.032);

  return k.build({
    refWeight: 2.5,
    minScale: 1.5,
    maxScale: 1.8,
    wake: [
      { pose: { tip: -0.55 }, dur: 1.5 },
      { pose: { tip: -1.0 }, dur: 1.1 },
      { pose: { tip: -0.9 }, dur: 0.35 },
      { pose: { tip: -1.0 }, dur: 0.35 },
      { pose: { tip: 0 }, dur: 2.2 },
    ],
    nod: [
      { pose: { tip: -0.12 }, dur: 0.45 },
      { pose: { tip: 0 }, dur: 0.5 },
    ],
    breathe: { tip: -0.004 },
  });
}

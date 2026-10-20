// Pelle sur pneus (≈ 18 t, gabarit d'une Liebherr A 918 ou d'une CAT M318) : châssis porteur à deux essieux
// et roues jumelées 10.00-20, coffres à outils entre les roues, lame de remblai à l'avant, stabilisateurs à
// patins à l'arrière ; tourelle de pelle (cabine à gauche, capot à ouïes, contrepoids arrondi), flèche en
// deux parties (flèche de base et flèche de réglage à vérin), balancier et godet posé devant la lame.
// Repères : empattement 2,6 m, voie 1,94 m, largeur 2,5 m, toit de cabine à 3,3 m, rayon arrière 2,3 m.
import * as THREE from 'three';
import { Kit, beam2D, roundedRect, softPolygon, type MachineTemplate, type V3 } from './kit';
import { cabin, exhaust, ladder, wheel } from './parts';

type P2 = [number, number];

/** Point à la distance len de o, dans la direction deg (degrés, plan latéral x/y). */
function polar(o: P2, len: number, deg: number): P2 {
  const a = (deg * Math.PI) / 180;
  return [o[0] + len * Math.cos(a), o[1] + len * Math.sin(a)];
}

function sub(a: P2, b: P2): P2 {
  return [a[0] - b[0], a[1] - b[1]];
}

const R = 0.52; // rayon des pneus 10.00-20
const TW = 0.28; // largeur d'un pneu (roues jumelées)
const ZW = 0.97; // demi-voie (centre des roues jumelées)
const AXLES = [1.3, -1.3]; // essieu avant (directeur) et essieu arrière : empattement 2,6 m
const YU = 1.14; // dessous de la tourelle (couronne d'orientation)
const XO = -2.25; // axe des stabilisateurs arrière
const YO = 0.66; // hauteur de leur articulation
const LEG = 0.85; // jambe de stabilisateur, de l'articulation à l'axe du patin
const LEG_UP = (50 * Math.PI) / 180; // jambe relevée à 50° au-dessus de l'horizontale (posée : 40° dessous)

// Bras (repère de la tourelle, plan latéral) : pied de flèche, articulation de la flèche de réglage,
// pied du balancier et axe du godet, dessinés dans la pose de repos (godet posé au sol).
const P0: P2 = [1.0, 0.56];
const P1 = polar(P0, 2.4, 55);
const P2_ = polar(P1, 2.8, -5);
const P3 = polar(P2_, 2.34, -100);

/** Godet rétro dans son propre repère (axe du balancier vers +y, dents vers −x, côté cabine) : coque, flancs, oreilles, dents. */
function hoeBucket(k: Kit, part: number, s: number, width: number): P2 {
  const outer = new THREE.SplineCurve(
    [
      [-0.1, 0.08],
      [-0.5, -0.24],
      [-0.53, -0.78],
      [-0.14, -1.06],
      [0.48, -0.95],
    ].map(([x, y]) => new THREE.Vector2(x * s, y * s)),
  ).getPoints(36);
  const inner = outer.map((p, i) => {
    const a = outer[Math.max(0, i - 1)];
    const b = outer[Math.min(outer.length - 1, i + 1)];
    const t = b.clone().sub(a).normalize();
    return p.clone().add(new THREE.Vector2(-t.y, t.x).multiplyScalar(0.055));
  });
  const half = width / 2;
  // Godet rétro : ouverture et dents tournées vers la cabine (−x), biellette côté extérieur (+x).
  for (const p of [...outer, ...inner]) p.x = -p.x;
  k.extrude(part, 'steelDark', new THREE.Shape([...outer, ...inner.slice().reverse()]), width, [0, 0, 0], undefined, 0, 8);
  const side = new THREE.Shape([...outer, new THREE.Vector2(-0.36 * s, -0.2 * s), new THREE.Vector2(-0.12 * s, 0.12 * s)]);
  for (const z of [half + 0.02, -half - 0.02]) k.extrude(part, 'steelDark', side, 0.04, [0, 0, z], undefined, 0, 8);
  // oreilles d'attache (axe du balancier et axe de la biellette)
  const link: P2 = [0.3 * s, 0.26 * s];
  const ear = softPolygon(
    [
      [-0.16 * s, -0.1 * s],
      [0.2 * s, -0.16 * s],
      [link[0] + 0.12, link[1] + 0.02],
      [link[0] - 0.04, link[1] + 0.12],
      [-0.12 * s, 0.1 * s],
    ],
    0.05,
  );
  for (const z of [-0.2, 0.2]) k.extrude(part, 'trim', ear, 0.06, [0, 0, z], undefined, 0, 6);
  k.cylZ(part, 'steel', 0.07, 0.56, [0, 0, 0], 12);
  k.cylZ(part, 'steel', 0.06, 0.52, [link[0], link[1], 0], 12);
  // patins d'usure sous la coque, lame d'usure, couteaux latéraux et dents
  for (const z of [-0.26, 0.26]) {
    k.box(part, 'steel', [0.34 * s, 0.035, 0.07], [0.36 * s, -0.95 * s, z], [0, 0, -0.75]);
    k.box(part, 'steel', [0.34 * s, 0.035, 0.07], [-0.1 * s, -1.09 * s, z], [0, 0, -0.12]);
  }
  k.box(part, 'steel', [0.1, 0.05, width + 0.06], [-0.47 * s, -0.94 * s, 0], [0, 0, -0.2]);
  for (const z of [-half - 0.03, half + 0.03]) k.box(part, 'steel', [0.26, 0.06, 0.05], [-0.32 * s, -0.9 * s, z], [0, 0, -0.32]);
  const n = 5;
  for (let i = 0; i < n; i++) {
    const z = -half + 0.09 + (i * (width - 0.18)) / (n - 1);
    k.box(part, 'steel', [0.14, 0.09, 0.1], [-0.55 * s, -0.925 * s, z], [0, 0, -0.2]);
    k.cyl(part, 'steel', [0.0, 0.05], 0.2, [-0.66 * s, -0.9 * s, z], [0, 0, 1.37], 8);
  }
  return link;
}

export function buildPellePneus(): MachineTemplate {
  const k = new Kit('pelle_pneus');

  // ---------------------------------------------------------------- châssis porteur
  const chassis = k.part('chassis', 0, [0, 0, 0]);
  // longeron central en caisson, nez avant chanfreiné (passage des vérins de lame)
  const frame = softPolygon(
    [
      [-2.43, 0.62],
      [1.93, 0.62],
      [1.93, 0.74],
      [1.55, 1.02],
      [-2.43, 1.02],
    ],
    0.05,
  );
  k.extrude(chassis, 'trim', frame, 0.86, [0, 0, 0], undefined, 0.02, 6);
  // plateau de la couronne d'orientation
  k.rbox(chassis, 'trim', [1.9, 0.14, 1.5], 0.04, [0, 1.0, 0], undefined, 1);
  k.cyl(chassis, 'steelDark', [0.9, 0.94], 0.1, [0, 1.09, 0], undefined, 32);
  k.torus(chassis, 'steel', 0.92, 0.016, [0, 1.135, 0], [Math.PI / 2, 0, 0], [4, 48]);

  // ponts (différentiel, trompettes, réducteurs) et roues jumelées
  for (const x of AXLES) {
    k.cylZ(chassis, 'steelDark', 0.12, 2 * ZW - 0.5, [x, R, 0], 16);
    k.rbox(chassis, 'steelDark', [0.5, 0.42, 0.62], 0.14, [x, R + 0.03, 0], undefined, 2);
    for (const s of [-1, 1]) {
      k.cylZ(chassis, 'steelDark', 0.2, 0.14, [x, R, s * (ZW - 0.36)], 18);
      k.cylZ(chassis, 'trim', 0.14, 0.06, [x, R, s * (ZW - 0.45)], 14);
      wheel(k, chassis, [x, R, s * ZW], R, TW, { side: s, rim: 'steel', tread: 'lug', dual: true, rimRatio: 0.6 });
    }
  }

  // coffres à outils entre les roues (marchepied à gauche), tôles antidérapantes
  for (const s of [-1, 1]) {
    k.rbox(chassis, 'paint', [1.3, 0.46, 0.72], 0.05, [0, 0.82, s * 0.87], undefined, 2);
    k.box(chassis, 'black', [1.22, 0.012, 0.64], [0, 1.052, s * 0.87]);
    k.box(chassis, 'black', [0.012, 0.36, 0.012], [0, 0.82, s * 1.232]);
    for (const x of [-0.33, 0.33]) k.box(chassis, 'steel', [0.14, 0.025, 0.025], [x, 0.96, s * 1.242]);
    k.box(chassis, 'trim', [1.34, 0.05, 0.76], [0, 0.6, s * 0.87]);
  }
  ladder(k, chassis, 0.2, 0.56, 0.3, 0.58, -1.12, 2);

  // feux de route et clignotants (avant sur le nez, arrière sur la traverse)
  for (const s of [-1, 1]) {
    k.rbox(chassis, 'amber', [0.04, 0.06, 0.12], 0.015, [1.95, 0.68, s * 0.3], undefined, 1);
    k.rbox(chassis, 'tail', [0.04, 0.1, 0.2], 0.02, [-2.46, 0.9, s * 0.4], undefined, 1);
    k.rbox(chassis, 'amber', [0.04, 0.06, 0.1], 0.015, [-2.46, 0.9, s * 0.18], undefined, 1);
  }
  // attelage arrière
  k.rbox(chassis, 'steelDark', [0.14, 0.16, 0.24], 0.03, [-2.5, 0.72, 0], undefined, 1);
  k.cyl(chassis, 'steel', 0.03, 0.2, [-2.53, 0.72, 0], undefined, 8);

  // ---------------------------------------------------------------- lame de remblai (avant)
  const blade = k.part('blade', chassis, [1.7, 0.7, 0]);
  k.joint('blade', blade, 'rz', 0);
  for (const s of [-1, 1]) {
    // chapes sur le longeron et bras de poussée
    k.box(chassis, 'trim', [0.36, 0.3, 0.06], [1.66, 0.72, s * 0.46]);
    const arm = softPolygon(
      [
        [-0.1, -0.06],
        [0.08, 0.1],
        [0.48, -0.02],
        [0.5, -0.3],
        [0.34, -0.3],
      ],
      0.05,
    );
    k.extrude(blade, 'paint', arm, 0.08, [0, 0, s * 0.53], undefined, 0.012, 6);
    k.box(blade, 'paint', [0.14, 0.14, 0.08], [0.44, 0.0, s * 0.27]);
    // vérin de lame : du dessus du nez vers le dos de la lame
    k.box(chassis, 'trim', [0.16, 0.18, 0.08], [1.5, 1.1, s * 0.27]);
    k.piston(chassis, [chassis, [1.5, 1.14, s * 0.27]], [blade, [0.42, 0.0, s * 0.27]], 0.075, 0.042);
  }
  k.cylZ(blade, 'steel', 0.055, 1.18, [0, 0, 0], 12);
  // tablier incurvé (profil extrudé sur la largeur), poutre arrière, nervures, tranchant
  const mb = new THREE.Shape();
  mb.moveTo(0.66, -0.44);
  mb.quadraticCurveTo(0.5, -0.13, 0.63, 0.19);
  mb.lineTo(0.56, 0.21);
  mb.quadraticCurveTo(0.43, -0.12, 0.58, -0.44);
  mb.closePath();
  k.extrude(blade, 'paint', mb, 2.46, [0, 0, 0], undefined, 0.015, 12);
  k.rbox(blade, 'paint', [0.14, 0.16, 2.3], 0.03, [0.44, -0.13, 0], undefined, 1);
  for (const z of [-1.0, -0.53, 0.53, 1.0]) k.box(blade, 'paint', [0.12, 0.5, 0.05], [0.5, -0.12, z], [0, 0, -0.08]);
  k.box(blade, 'steel', [0.1, 0.05, 2.46], [0.64, -0.43, 0], [0, 0, 0.25]);
  for (const s of [-1, 1]) k.box(blade, 'trim', [0.2, 0.62, 0.04], [0.58, -0.12, s * 1.24], [0, 0, -0.08]);

  // ---------------------------------------------------------------- stabilisateurs à patins (arrière)
  k.rbox(chassis, 'trim', [0.44, 0.48, 1.16], 0.04, [XO, 0.8, 0], undefined, 1);
  const legUp = { y: Math.sin(LEG_UP), z: Math.cos(LEG_UP) };
  for (const s of [-1, 1]) {
    const name = s < 0 ? 'outL' : 'outR';
    // chapes de l'articulation (axe longitudinal)
    for (const dx of [-0.13, 0.13]) k.box(chassis, 'trim', [0.05, 0.26, 0.16], [XO + dx, YO, s * 0.62]);
    const leg = k.part(name, chassis, [XO, YO, s * 0.62]);
    k.joint(name, leg, 'rx', 0);
    // jambe en caisson effilée (dessinée relevée : vers le haut et l'extérieur)
    const ez = s * legUp.z * LEG;
    const ey = legUp.y * LEG;
    const beam = beam2D([0, 0], [ez / 2, ey / 2], [ez, ey], 0.11, 0.075, 0);
    k.extrude(leg, 'paint', beam.shape, 0.2, [0, 0, 0], [0, -Math.PI / 2, 0], 0, 8);
    k.cylX(leg, 'steel', 0.06, 0.34, [0, 0, 0], 12);
    k.cylX(leg, 'steel', 0.05, 0.3, [0, ey, ez], 12);
    // patin : plaque tournée vers l'extérieur une fois relevée, à plat au sol une fois posée
    k.rbox(leg, 'steelDark', [0.44, 0.44, 0.05], 0.02, [0, ey, ez + s * 0.08], undefined, 1);
    k.box(leg, 'trim', [0.2, 0.16, 0.06], [0, ey, ez + s * 0.035]);
    for (const dy of [-0.14, 0, 0.14]) k.box(leg, 'steelDark', [0.42, 0.025, 0.03], [0, ey + dy, ez + s * 0.115]);
    // vérin : du haut de la traverse vers la face intérieure de la jambe
    const t = 0.45 * LEG;
    const a: V3 = [0, legUp.y * t + 0.1 * legUp.z, s * (legUp.z * t - 0.1 * legUp.y)];
    k.box(chassis, 'trim', [0.12, 0.12, 0.1], [XO, 1.08, s * 0.12]);
    k.piston(chassis, [chassis, [XO, 1.1, s * 0.12]], [leg, a], 0.07, 0.04);
  }

  // ---------------------------------------------------------------- tourelle
  const upper = k.part('upper', chassis, [0, YU, 0]);
  k.joint('swing', upper, 'ry', 0);
  // caisse vue de dessus, arrondie à l'arrière (biseau compris : 3,2 m × 2,5 m)
  k.slab(upper, 'paint', roundedRect(-1.91, -1.21, 1.21, 1.21, 0.56, 0.12), 0.62, 0.06, 0.04, 12);
  k.slab(upper, 'trim', roundedRect(-1.95, -1.25, 1.25, 1.25, 0.6, 0.15), 0.07, 0.6, 0, 12);
  k.slab(upper, 'trim', roundedRect(-1.88, -1.18, 1.18, 1.18, 0.53, 0.1), 0.04, 0.68, 0, 12);
  // contrepoids arrondi (rayon arrière 2,3 m) et sa jupe sombre
  k.slab(upper, 'paint', roundedRect(-2.17, -1.25, -1.33, 1.25, 0.67, 0.02), 0.86, 0.0, 0.03, 12);
  k.slab(upper, 'trim', roundedRect(-2.19, -1.27, -1.45, 1.27, 0.69, 0.02), 0.09, -0.02, 0.0, 12);
  k.box(upper, 'black', [0.02, 0.05, 1.0], [-2.2, 0.72, 0]);
  for (const s of [-1, 1]) {
    k.rbox(upper, 'tail', [0.06, 0.1, 0.2], 0.02, [-2.09, 0.5, s * 0.95], [0, s * 0.56, 0], 1);
  }
  // caméra de recul
  k.rbox(upper, 'black', [0.1, 0.08, 0.14], 0.02, [-2.12, 0.91, 0], undefined, 1);
  // capot moteur arrondi, ouïes sur le dessus, grille sur le flanc droit
  k.rbox(upper, 'paint', [1.42, 0.5, 2.3], 0.1, [-1.17, 0.95, 0.03]);
  for (let i = 0; i < 7; i++) k.box(upper, 'black', [0.06, 0.02, 1.2], [-1.66 + i * 0.15, 1.205, 0.2]);
  k.grille(upper, [-0.8, 0.95, 1.185], 0.4, 0.32, 5, 'z', 1);
  for (const s of [-1, 1]) k.decal(upper, 0.62, 0.155, [-0.75, 0.36, s * 1.252], s > 0 ? 0 : Math.PI);
  exhaust(k, upper, [-0.82, 1.2, 0.74], 0.42, 0.07);
  // préfiltre à air
  k.cyl(upper, 'trim', 0.1, 0.24, [-1.5, 1.32, -0.62], undefined, 16);
  k.cyl(upper, 'black', 0.11, 0.06, [-1.5, 1.46, -0.62], undefined, 16);
  // coffre avant droit, grille, phare de route et mains courantes
  k.rbox(upper, 'paint', [1.28, 0.62, 0.66], 0.08, [0.55, 1.0, 0.88]);
  k.grille(upper, [1.19, 0.98, 0.88], 0.44, 0.3, 4, 'x', 1);
  k.lamp(upper, [1.2, 1.2, 1.06], 0.12);
  k.rail(upper, 'trim', [[-0.05, 1.31, 1.17], [-0.05, 1.66, 1.17], [1.08, 1.66, 1.17], [1.08, 1.31, 1.17]], 0.02);
  k.rail(upper, 'trim', [[-1.78, 1.2, 1.13], [-1.78, 1.52, 1.13], [-0.5, 1.52, 1.13], [-0.5, 1.2, 1.13]], 0.018);
  // marchepied sous la porte et socle du pied de flèche
  k.box(upper, 'trim', [0.42, 0.04, 0.22], [0.3, 0.3, -1.34]);
  k.box(upper, 'black', [0.38, 0.012, 0.18], [0.3, 0.325, -1.34]);
  k.rbox(upper, 'trim', [0.6, 0.36, 0.7], 0.05, [0.98, 0.5, 0.22], undefined, 1);

  // ---------------------------------------------------------------- cabine (côté gauche, z−)
  cabin(k, upper, {
    x0: -0.42,
    x1: 1.06,
    y0: 0.72,
    h: 1.3,
    w: 0.92,
    zc: -0.66,
    lean: 0.16,
    roof: 'trim',
    frame: 'trim',
    door: 'left',
    beacon: 'right',
    lights: 2,
    rearLights: 1,
  });
  k.mirror(upper, [1.04, 1.45, -1.12], -1, 0.3);
  k.mirror(upper, [1.16, 1.31, 1.2], 1, 0.12);

  // ---------------------------------------------------------------- flèche de base
  const boom = k.part('boom', upper, [P0[0], P0[1], 0.22]);
  k.joint('boom', boom, 'rz', 0);
  const b1 = sub(P1, P0);
  const lb = beam2D([0, 0], [b1[0] / 2, b1[1] / 2], b1, 0.3, 0.24, 0.05);
  k.extrude(boom, 'paint', lb.shape, 0.52, [0, 0, 0], undefined, 0.035, 12);
  k.cylZ(boom, 'trim', 0.2, 0.72, [0, 0, 0], 18);
  k.cylZ(boom, 'steel', 0.09, 0.8, [0, 0, 0], 12);
  k.cylZ(boom, 'trim', 0.19, 0.6, [b1[0], b1[1], 0], 18);
  k.cylZ(boom, 'steel', 0.085, 0.68, [b1[0], b1[1], 0], 12);
  // pattes des vérins de levage (dessous) et du vérin de réglage (dos)
  const bc = lb.edge(0.42, -1, -0.03);
  k.cylZ(boom, 'steel', 0.07, 0.82, [bc.x, bc.y, 0], 12);
  for (const z of [-0.3, 0.3]) k.cylZ(boom, 'trim', 0.1, 0.1, [bc.x, bc.y, z], 12);
  const ad = lb.edge(0.16, 1, 0.08);
  k.rbox(boom, 'paint', [0.3, 0.2, 0.3], 0.04, [ad.x + 0.05, ad.y - 0.06, 0], [0, 0, 0.96], 1);
  // phare de travail sur le flanc gauche
  {
    const p = lb.edge(0.55, 1, -0.12);
    k.box(boom, 'trim', [0.08, 0.08, 0.08], [p.x, p.y, -0.29]);
    k.lamp(boom, [p.x + 0.04, p.y + 0.02, -0.36], 0.12, 0.1);
  }
  // flexibles le long du dos de la flèche
  for (const z of [-0.18, 0.18]) {
    const pts: V3[] = [];
    for (const t of [0.04, 0.25, 0.5, 0.75, 0.96]) {
      const p = lb.edge(t, 1, 0.03);
      pts.push([p.x, p.y, z]);
    }
    k.hose(boom, 'rubber', pts, 0.026, 18);
  }

  // ---------------------------------------------------------------- flèche de réglage
  const boom2 = k.part('boom2', boom, [b1[0], b1[1], 0]);
  k.joint('adjust', boom2, 'rz', 0);
  const u2 = sub(P2_, P1);
  const LV: P2 = [-0.5, 0.34];
  const ub = beam2D(LV, [0.5, -0.05], u2, 0.17, 0.2, 0.1);
  k.extrude(boom2, 'paint', ub.shape, 0.44, [0, 0, 0], undefined, 0.03, 12);
  k.cylZ(boom2, 'steel', 0.07, 0.5, [LV[0], LV[1], 0], 12);
  k.cylZ(boom2, 'trim', 0.17, 0.5, [u2[0], u2[1], 0], 18);
  k.cylZ(boom2, 'steel', 0.08, 0.58, [u2[0], u2[1], 0], 12);
  const sc = ub.edge(0.3, 1, 0.07);
  k.rbox(boom2, 'paint', [0.36, 0.2, 0.28], 0.04, [sc.x, sc.y - 0.06, 0], [0, 0, -0.08], 1);
  for (const z of [-0.16, 0.16]) {
    const pts: V3[] = [];
    for (const t of [0.12, 0.35, 0.6, 0.82, 0.97]) {
      const p = ub.edge(t, 1, 0.03);
      pts.push([p.x, p.y, z]);
    }
    k.hose(boom2, 'rubber', pts, 0.024, 18);
  }

  // ---------------------------------------------------------------- balancier
  const stick = k.part('stick', boom2, [u2[0], u2[1], 0]);
  k.joint('stick', stick, 'rz', 0);
  const e3 = sub(P3, P2_);
  const T: P2 = [0.12, 0.62];
  const st = beam2D(T, [(T[0] + e3[0]) / 2, (T[1] + e3[1]) / 2], e3, 0.22, 0.14, 0);
  k.extrude(stick, 'paint', st.shape, 0.38, [0, 0, 0], undefined, 0.03, 8);
  k.cylZ(stick, 'steel', 0.07, 0.46, [T[0], T[1], 0], 12);
  k.cylZ(stick, 'trim', 0.15, 0.5, [e3[0], e3[1], 0], 16);
  k.cylZ(stick, 'steel', 0.07, 0.58, [e3[0], e3[1], 0], 12);
  for (const z of [-0.09, 0.09]) {
    const pts: V3[] = [];
    for (const t of [0.05, 0.3, 0.55, 0.8]) {
      const p = st.edge(t, 1, 0.035);
      pts.push([p.x, p.y, z]);
    }
    k.hose(stick, 'rubber', pts, 0.022, 14);
  }
  const bb = st.edge(0.2, 1, 0.06);
  const lk = st.edge(0.88, 1, 0.02);

  // ---------------------------------------------------------------- godet (posé au sol, dents en avant)
  const stickAxis = Math.atan2(T[1] - e3[1], T[0] - e3[0]) - Math.PI / 2;
  const bucket = k.part('bucket', stick, [e3[0], e3[1], 0], [0, 0, stickAxis + 0.58]);
  k.joint('bucket', bucket, 'rz', 0);
  const link = hoeBucket(k, bucket, 0.96, 0.95);

  // ---------------------------------------------------------------- vérins et biellette
  for (const z of [-0.34, 0.34]) {
    k.box(upper, 'trim', [0.2, 0.22, 0.12], [1.24, 0.16, 0.22 + z]);
    k.piston(upper, [upper, [1.24, 0.16, 0.22 + z]], [boom, [bc.x, bc.y, z]], 0.13, 0.075);
  }
  k.piston(boom, [boom, [ad.x, ad.y, 0]], [boom2, [LV[0], LV[1], 0]], 0.12, 0.07);
  k.piston(boom2, [boom2, [sc.x, sc.y, 0]], [stick, [T[0], T[1], 0]], 0.115, 0.065);
  k.piston(stick, [stick, [bb.x, bb.y, 0]], [bucket, [link[0], link[1], 0]], 0.1, 0.056);
  k.link(stick, [stick, [lk.x, lk.y, 0]], [bucket, [link[0], link[1], 0]], 0.07, 0.46);

  const down = Math.PI / 2;
  return k.build({
    refWeight: 18,
    minScale: 0.86,
    maxScale: 1.18,
    wake: [
      { pose: { blade: -0.34, outL: -down, outR: down }, dur: 1.5 },
      { pose: { boom: 0.1, adjust: 0.28, stick: 0.6, bucket: -0.4 }, dur: 1.4 },
      { pose: { swing: 0.9, boom: 0.24, adjust: 0.08, stick: -0.45, bucket: 0.8 }, dur: 1.7 },
      { pose: { stick: 0.05, bucket: -0.45 }, dur: 0.9 },
      { pose: { swing: 0, boom: 0, adjust: 0, stick: 0, bucket: 0, blade: 0, outL: 0, outR: 0 }, dur: 2.0 },
    ],
    nod: [
      { pose: { bucket: 0.4 }, dur: 0.45 },
      { pose: { bucket: 0 }, dur: 0.5 },
    ],
    breathe: { boom: 0.01, adjust: -0.008, stick: 0.01 },
  });
}

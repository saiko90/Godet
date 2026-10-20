// Chariot élévateur thermique (≈ 5 t en service, 3,5 t de capacité, classe Toyota 8FD35 / Linde H35D / Still RX70) :
// contrepoids arrière à passages de roues, protège-conducteur à toit ajouré, siège sur le capot, volant,
// mât duplex (montants extérieurs basculants, montants intérieurs coulissants, chaînes de levage), tablier à
// déplacement latéral et fourches de 1070 mm, roues motrices avant plus grandes que les roues directrices.
// Gabarit : 2,87 m jusqu'au talon des fourches (3,94 m fourches comprises) × 1,24 m × 2,2 m, empattement 1,7 m.
import * as THREE from 'three';
import { Kit, softPolygon, type MachineTemplate } from './kit';
import { exhaust, fender, wheel } from './parts';

const RF = 0.355; // pneus avant 28×9-15
const WF = 0.225;
const ZF = 0.505; // demi-voie avant
const RR = 0.29; // pneus arrière 6.50-10
const WR = 0.165;
const ZR = 0.48; // demi-voie arrière
const XF = 0.78; // essieu moteur (avant)
const XR = -0.92; // essieu directeur (arrière)
const XB = -1.425; // arrière du contrepoids
const CW_TOP = 1.13; // dessus du contrepoids
const MAST: [number, number] = [1.15, 0.28]; // axe de basculement du mât
const GUARD_Y = 2.165; // cadre du toit du protège-conducteur

const CW_BEVEL = 0.045; // arrondi des arêtes du contrepoids (le profil est réduit d'autant)

/** Flanc du contrepoids avec passage de roue arrière (profil vu de côté, réduit de l'arrondi). */
function counterweightSide(): THREE.Shape {
  const b = CW_BEVEL;
  const s = new THREE.Shape();
  const ra = RR + 0.06 + b;
  const xf = -0.6 - b;
  const end = Math.acos((xf - XR) / ra);
  const x0 = XB + b;
  const y0 = 0.2 + b;
  const top = CW_TOP - b;
  s.moveTo(x0 + 0.1, y0);
  s.lineTo(XR - ra, y0);
  s.lineTo(XR - ra, RR);
  s.absarc(XR, RR, ra, Math.PI, end, true);
  s.lineTo(xf, top);
  s.lineTo(-1.2, top);
  s.quadraticCurveTo(x0, top, x0, top - 0.18);
  s.lineTo(x0, y0 + 0.1);
  s.quadraticCurveTo(x0, y0, x0 + 0.1, y0);
  return s;
}

export function buildChariotElevateur(): MachineTemplate {
  const k = new Kit('chariot_elevateur');

  // ---------------------------------------------------------------- châssis, essieux et roues
  const body = k.part('body', 0, [0, 0, 0]);
  k.cylZ(body, 'steelDark', 0.09, 2 * ZF - 0.24, [XF, RF, 0], 14);
  k.rbox(body, 'steelDark', [0.32, 0.26, 0.4], 0.05, [XF, RF, 0], undefined, 2);
  k.rbox(body, 'steelDark', [0.16, 0.13, 2 * ZR - 0.2], 0.03, [XR, RR + 0.02, 0], undefined, 2);
  for (const s of [-1, 1]) {
    wheel(k, body, [XF, RF, s * ZF], RF, WF, { side: s, rim: 'paint', tread: 'lug' });
    wheel(k, body, [XR, RR, s * ZR], RR, WR, { side: s, rim: 'paint', tread: 'lug' });
    fender(k, body, [XF, RF, s * ZF], RF + 0.05, WF + 0.09, 0.12, Math.PI - 0.3, 'paint', 0.045);
    // flanc entre le garde-boue avant et la caisse
    k.box(body, 'paint', [0.1, 0.36, WF + 0.09], [XF - RF - 0.07, 0.58, s * ZF]);
  }

  // ---------------------------------------------------------------- contrepoids (passages de roues), caisse, capot
  // une seule pièce sur toute la largeur (passages de roues découpés), comblée entre les roues au-dessus du pont
  k.extrude(body, 'paint', counterweightSide(), 1.2, [0, 0, 0], undefined, CW_BEVEL, 16);
  k.box(body, 'paint', [0.7, 0.3, 0.72], [-0.93, 0.6, 0]);
  k.rbox(body, 'black', [0.08, 0.1, 1.1], 0.03, [XB - 0.01, 0.27, 0], undefined, 1);
  // ouïes de refroidissement sur le dessus, attelage, feux
  for (let i = 0; i < 6; i++) k.box(body, 'black', [0.045, 0.012, 0.62], [-1.12 + i * 0.085, CW_TOP + 0.002, 0]);
  k.rbox(body, 'black', [0.04, 0.16, 0.22], 0.02, [XB - 0.005, 0.55, 0], undefined, 1);
  k.cyl(body, 'steel', 0.03, 0.22, [XB - 0.05, 0.58, 0], undefined, 10);
  for (const s of [-1, 1]) {
    k.rbox(body, 'tail', [0.04, 0.12, 0.14], 0.015, [XB - 0.005, 0.88, s * 0.44], undefined, 1);
    k.rbox(body, 'amber', [0.04, 0.07, 0.14], 0.015, [XB - 0.005, 0.76, s * 0.44], undefined, 1);
    k.decal(body, 0.5, 0.125, [-1.0, 0.86, s * 0.602], s > 0 ? 0 : Math.PI);
  }
  // caisse (longerons habillés) entre les essieux, capot moteur sous le siège
  k.rbox(body, 'paint', [1.02, 0.5, 1.16], 0.05, [-0.09, 0.47, 0], undefined, 2);
  k.rbox(body, 'paint', [0.8, 0.32, 1.0], 0.08, [-0.2, 0.86, 0], undefined, 3);
  k.box(body, 'black', [0.8, 0.02, 1.02], [-0.2, 0.71, 0]);
  // plancher, marchepied gauche
  k.box(body, 'black', [0.44, 0.03, 0.9], [0.38, 0.735, 0]);
  k.rbox(body, 'black', [0.36, 0.035, 0.15], 0.01, [0.26, 0.5, -0.64], undefined, 1);
  k.box(body, 'trim', [0.04, 0.24, 0.04], [0.26, 0.38, -0.6]);
  // tableau de bord (capot avant), leviers des commandes hydrauliques
  k.rbox(body, 'paint', [0.3, 0.6, 0.76], 0.06, [0.66, 0.88, 0], undefined, 2);
  k.rbox(body, 'black', [0.16, 0.06, 0.5], 0.02, [0.62, 1.18, 0], [0, 0, 0.35], 1);
  for (let i = 0; i < 3; i++) {
    const z = 0.18 + i * 0.065;
    k.cyl(body, 'black', 0.009, 0.2, [0.6, 1.26, z], [0, 0, 0.25], 6);
    k.sphere(body, 'black', 0.022, [0.575, 1.355, z], 8);
  }

  // ---------------------------------------------------------------- poste de conduite
  k.rbox(body, 'interior', [0.34, 0.1, 0.4], 0.03, [-0.28, 1.06, 0], undefined, 1);
  k.rbox(body, 'interior', [0.48, 0.12, 0.5], 0.05, [-0.25, 1.16, 0], undefined, 2);
  k.rbox(body, 'interior', [0.12, 0.56, 0.48], 0.05, [-0.53, 1.48, 0], [0, 0, -0.14], 2);
  k.rbox(body, 'interior', [0.3, 0.06, 0.08], 0.02, [-0.25, 1.36, 0.29], undefined, 1);
  // colonne et volant (incliné vers le conducteur) avec boule
  k.rail(body, 'trim', [[0.62, 1.14, 0], [0.44, 1.34, 0]], 0.03);
  const ring = new THREE.TorusGeometry(0.16, 0.017, 6, 28);
  ring.rotateX(-Math.PI / 2);
  ring.rotateZ(0.62);
  k.add(body, 'black', ring, [0.43, 1.355, 0]);
  k.cyl(body, 'black', 0.012, 0.07, [0.48, 1.47, 0.1], [0, 0, 0.62], 6);

  // ---------------------------------------------------------------- protège-conducteur (toit ajouré)
  for (const s of [-1, 1]) {
    k.rbox(body, 'trim', [0.08, GUARD_Y - CW_TOP + 0.02, 0.08], 0.02, [-0.66, (GUARD_Y + CW_TOP) / 2, s * 0.52], undefined, 1);
    const dx = 0.2;
    const dy = GUARD_Y - 0.8;
    k.rbox(body, 'trim', [0.08, Math.hypot(dx, dy), 0.08], 0.02, [0.74, (GUARD_Y + 0.8) / 2, s * 0.52], [0, 0, -Math.atan2(dx, dy)], 1);
    k.box(body, 'trim', [0.2, 0.03, 0.14], [0.64, 0.8, s * 0.52]);
    k.box(body, 'trim', [1.64, 0.07, 0.07], [0.09, GUARD_Y, s * 0.53]);
  }
  for (const x of [-0.69, 0.88]) k.box(body, 'trim', [0.07, 0.07, 1.13], [x, GUARD_Y, 0]);
  for (let i = 0; i < 5; i++) k.box(body, 'trim', [1.5, 0.035, 0.05], [0.09, GUARD_Y + 0.005, -0.34 + i * 0.17]);
  k.box(body, 'trim', [0.05, 0.035, 1.06], [0.09, GUARD_Y + 0.005, 0]);
  // phares avant et arrière, gyrophare, rétroviseurs, poignée d'accès, échappement
  for (const s of [-1, 1]) {
    k.lamp(body, [0.92, 2.04, s * 0.53], 0.11);
    k.mirror(body, [0.82, 1.92, s * 0.56], s, 0.1, 0.18);
  }
  k.lamp(body, [-0.73, 2.04, -0.53], 0.1, Math.PI);
  k.beacon(body, [-0.6, GUARD_Y + 0.035, 0.32], 0.075);
  k.rail(body, 'trim', [[0.64, 1.05, -0.56], [0.64, 1.05, -0.62], [0.71, 1.6, -0.62], [0.71, 1.6, -0.56]], 0.017);
  exhaust(k, body, [-0.76, CW_TOP, 0.42], 1.06, 0.038);

  // ---------------------------------------------------------------- mât duplex (basculant)
  const mast = k.part('mast', body, [MAST[0], MAST[1], 0]);
  k.joint('tilt', mast, 'rz', 0);
  for (const s of [-1, 1]) {
    k.rbox(mast, 'trim', [0.12, 2.0, 0.06], 0.015, [0.06, 0.84, s * 0.36], undefined, 1);
    k.box(mast, 'steelDark', [0.04, 0.14, 0.12], [-0.02, 0.0, s * 0.36]);
    k.box(mast, 'trim', [0.06, 0.08, 0.06], [-0.03, 0.7, s * 0.27]);
  }
  k.cylZ(mast, 'steel', 0.035, 0.84, [-0.01, 0, 0], 10);
  k.box(mast, 'trim', [0.1, 0.14, 0.78], [0.0, -0.06, 0]);
  k.box(mast, 'trim', [0.06, 0.1, 0.78], [-0.02, 1.76, 0]);

  const inner = k.part('inner', mast, [0, 0, 0]);
  k.joint('lift', inner, 'ty', 0);
  for (const s of [-1, 1]) {
    k.rbox(inner, 'trim', [0.1, 1.98, 0.05], 0.012, [0.06, 0.92, s * 0.31], undefined, 1);
    // poulies de chaîne
    k.cylZ(inner, 'steel', 0.055, 0.04, [0.06, 1.95, s * 0.12], 14);
  }
  k.rbox(inner, 'trim', [0.2, 0.08, 0.76], 0.02, [-0.02, 1.95, 0], undefined, 1);
  k.box(inner, 'trim', [0.06, 0.08, 0.58], [0.04, -0.02, 0]);

  // ---------------------------------------------------------------- tablier, déplacement latéral et fourches
  const carriage = k.part('carriage', inner, [0, -MAST[1], 0]);
  k.joint('fork', carriage, 'ty', 0);
  k.box(carriage, 'trim', [0.05, 0.56, 0.62], [0.15, 0.36, 0]);
  // dosseret de charge
  for (const s of [-1, 1]) k.box(carriage, 'trim', [0.04, 0.74, 0.05], [0.16, 0.98, s * 0.5]);
  k.box(carriage, 'trim', [0.04, 0.05, 1.05], [0.16, 1.33, 0]);
  k.box(carriage, 'trim', [0.04, 0.04, 1.0], [0.16, 0.98, 0]);
  for (let i = 0; i < 4; i++) k.box(carriage, 'trim', [0.03, 0.7, 0.025], [0.16, 0.98, -0.3 + i * 0.2]);

  const shifter = k.part('shifter', carriage, [0, 0, 0]);
  k.joint('shift', shifter, 'tz', 0);
  k.rbox(shifter, 'trim', [0.07, 0.11, 1.08], 0.015, [0.215, 0.56, 0], undefined, 1);
  k.rbox(shifter, 'trim', [0.07, 0.09, 1.08], 0.015, [0.215, 0.15, 0], undefined, 1);
  for (const s of [-1, 1]) k.box(shifter, 'trim', [0.07, 0.5, 0.04], [0.215, 0.35, s * 0.52]);
  for (const s of [-1, 1]) {
    const z = s * 0.3;
    k.box(shifter, 'steelDark', [0.045, 0.6, 0.12], [0.2725, 0.35, z]);
    k.box(shifter, 'steelDark', [0.07, 0.05, 0.12], [0.255, 0.63, z]);
    const blade = softPolygon(
      [
        [0.25, 0.05],
        [1.365, 0.05],
        [1.365, 0.062],
        [1.15, 0.095],
        [0.32, 0.095],
        [0.295, 0.13],
        [0.25, 0.13],
      ],
      0.008,
    );
    k.extrude(shifter, 'steelDark', blade, 0.12, [0, 0, z], undefined, 0, 4);
  }

  // ---------------------------------------------------------------- vérins et chaînes
  // levage derrière les montants, inclinaison sous le plancher, chaînes en deux brins sur les poulies
  for (const s of [-1, 1]) {
    k.piston(mast, [mast, [-0.08, -0.04, s * 0.33]], [inner, [-0.08, 1.93, s * 0.33]], 0.048, 0.03);
    k.piston(body, [body, [0.52, 0.6, s * 0.22]], [mast, [-0.04, 0.7, s * 0.22]], 0.055, 0.032);
    k.link(inner, [inner, [0.11, 1.95, s * 0.12]], [carriage, [0.15, 0.64, s * 0.12]], 0.025, 0.05, 'black');
    k.link(inner, [inner, [0.01, 1.95, s * 0.12]], [mast, [0.02, 0.08, s * 0.12]], 0.025, 0.05, 'black');
  }

  return k.build({
    refWeight: 5,
    minScale: 0.9,
    maxScale: 1.35,
    // mouflage 2:1 : le tablier monte autant dans le mât intérieur que celui-ci dans le mât extérieur
    wake: [
      { pose: { lift: 0.4, fork: 0.4, tilt: 0.08 }, dur: 1.4 },
      { pose: { lift: 0.9, fork: 0.9 }, dur: 1.6 },
      { pose: { shift: 0.09, tilt: -0.05 }, dur: 0.9 },
      { pose: { lift: 0.12, fork: 0.12, shift: -0.05, tilt: 0.06 }, dur: 1.5 },
      { pose: { lift: 0, fork: 0, shift: 0, tilt: 0 }, dur: 0.9 },
    ],
    nod: [
      { pose: { tilt: 0.07 }, dur: 0.4 },
      { pose: { tilt: 0 }, dur: 0.45 },
    ],
    breathe: { tilt: 0.004 },
  });
}

// Camion benne trois essieux (cabine avancée, essieu avant simple, tandem arrière à roues jumelées,
// benne basculante arrière avec vérin télescopique avant).
import { Kit, extrudeGeo, roundedRect, softPolygon, type MachineTemplate } from './kit';
import { exhaust, fender, wheel } from './parts';

export function buildCamion(): MachineTemplate {
  const k = new Kit('camion');
  const R = 0.53;

  // ---------------------------------------------------------------- châssis et essieux
  const chassis = k.part('chassis', 0, [0, 0, 0]);
  for (const s of [-1, 1]) k.box(chassis, 'trim', [7.7, 0.26, 0.09], [-0.2, 1.0, s * 0.46]);
  for (const x of [-3.7, -2.2, -0.8, 0.6, 2.0, 3.3]) k.box(chassis, 'trim', [0.1, 0.18, 0.9], [x, 1.0, 0]);
  // essieu avant (roues simples) et tandem (roues jumelées)
  k.cylZ(chassis, 'steelDark', 0.09, 1.9, [2.95, R, 0], 12);
  for (const s of [-1, 1]) wheel(k, chassis, [2.95, R, s * 1.02], R, 0.36, { side: s, rim: 'steel', tread: 'road', rimRatio: 0.66 });
  for (const x of [-1.55, -2.9]) {
    k.cylZ(chassis, 'steelDark', 0.12, 1.5, [x, R, 0], 12);
    k.rbox(chassis, 'steelDark', [0.36, 0.26, 0.5], 0.04, [x, R, 0]);
    for (const s of [-1, 1]) wheel(k, chassis, [x, R, s * 0.86], R, 0.3, { side: s, rim: 'steel', tread: 'road', rimRatio: 0.66, dual: true });
  }
  // ressorts et garde-boue arrière
  for (const s of [-1, 1]) {
    k.rbox(chassis, 'steelDark', [2.2, 0.1, 0.12], 0.03, [-2.22, 0.86, s * 0.56]);
    k.rbox(chassis, 'black', [2.75, 0.04, 0.9], 0.015, [-2.22, 1.17, s * 0.86]);
    k.box(chassis, 'black', [0.04, 0.42, 0.86], [-3.58, 0.95, s * 0.86]);
  }
  // réservoir, coffre à batteries, protections latérales
  k.cylX(chassis, 'steel', 0.28, 0.95, [1.65, 0.9, 0.86], 24);
  k.cylX(chassis, 'trim', 0.29, 0.06, [1.2, 0.9, 0.86], 24);
  k.cylX(chassis, 'trim', 0.29, 0.06, [2.1, 0.9, 0.86], 24);
  k.rbox(chassis, 'trim', [0.7, 0.45, 0.4], 0.04, [1.65, 0.85, -0.8]);
  for (const s of [-1, 1]) {
    k.box(chassis, 'trim', [1.5, 0.05, 0.05], [-0.3, 0.75, s * 1.18]);
    k.box(chassis, 'trim', [1.5, 0.05, 0.05], [-0.3, 0.55, s * 1.18]);
    for (const x of [-1.0, 0.4]) k.box(chassis, 'trim', [0.05, 0.32, 0.18], [x, 0.7, s * 1.1]);
    // feux de gabarit
    for (const x of [-3.4, -1.0, 1.0]) k.rbox(chassis, 'amber', [0.08, 0.04, 0.03], 0.01, [x, 0.92, s * 1.2], undefined, 1);
  }
  // feux arrière et barre anti-encastrement
  k.box(chassis, 'trim', [0.08, 0.1, 2.1], [-4.05, 0.62, 0]);
  for (const s of [-1, 1]) k.rbox(chassis, 'tail', [0.05, 0.12, 0.34], 0.02, [-4.07, 0.86, s * 0.85], undefined, 2);
  exhaust(k, chassis, [2.22, 1.1, -1.08], 2.1, 0.07);

  // ---------------------------------------------------------------- cabine avancée
  const cab = k.part('cab', chassis, [0, 0, 0]);
  const cabProfile = softPolygon(
    [
      [2.32, 1.0],
      [4.06, 1.0],
      [4.12, 1.95],
      [4.02, 3.0],
      [3.85, 3.24],
      [2.32, 3.24],
    ],
    0.14,
  );
  k.extrude(cab, 'paint', cabProfile, 2.46, [0, 0, 0], undefined, 0.06, 10);
  // pare-brise incliné (cadre noir et verre), dans le plan de la face avant
  {
    const rake = Math.atan2(0.1, 1.05);
    const frame = softPolygon(
      [
        [-1.12, 0],
        [1.12, 0],
        [1.1, 0.92],
        [-1.1, 0.92],
      ],
      0.08,
    );
    const glass = softPolygon(
      [
        [-1.06, 0.04],
        [1.06, 0.04],
        [1.04, 0.88],
        [-1.04, 0.88],
      ],
      0.07,
    );
    const fg = extrudeGeo(frame, 0.02, 0, 6);
    fg.rotateY(Math.PI / 2);
    fg.rotateZ(rake);
    k.add(cab, 'black', fg, [4.125, 2.02, 0]);
    const gg = extrudeGeo(glass, 0.01, 0, 6);
    gg.rotateY(Math.PI / 2);
    gg.rotateZ(rake);
    k.add(cab, 'glass', gg, [4.14, 2.02, 0]);
  }
  for (const s of [-1, 1]) {
    const sw = softPolygon(
      [
        [3.0, 2.1],
        [3.95, 2.1],
        [3.88, 2.92],
        [3.0, 2.92],
      ],
      0.06,
    );
    k.extrude(cab, 'glass', sw, 0.01, [0, 0, s * 1.255], undefined, 0, 6);
    // jointures de porte et poignée
    k.box(cab, 'black', [0.012, 1.85, 0.012], [2.95, 2.02, s * 1.262]);
    k.box(cab, 'black', [0.012, 1.85, 0.012], [3.98, 1.98, s * 1.262]);
    k.box(cab, 'steel', [0.14, 0.03, 0.03], [3.1, 1.95, s * 1.27]);
    k.decal(cab, 0.62, 0.155, [3.45, 1.62, s * 1.262], s > 0 ? 0 : Math.PI);
    // marchepieds
    for (const y of [0.62, 1.0]) k.box(cab, 'black', [0.55, 0.035, 0.24], [3.45, y, s * 1.12]);
  }
  // calandre, phares, pare-chocs
  k.rbox(cab, 'black', [0.04, 0.7, 1.7], 0.02, [4.13, 1.56, 0]);
  for (let i = 0; i < 5; i++) k.box(cab, 'paint', [0.03, 0.035, 1.6], [4.155, 1.28 + i * 0.13, 0]);
  k.rbox(cab, 'trim', [0.24, 0.32, 2.5], 0.05, [4.12, 0.98, 0]);
  for (const s of [-1, 1]) {
    k.rbox(cab, 'trim', [0.06, 0.18, 0.44], 0.03, [4.22, 1.06, s * 0.92], undefined, 2);
    k.rbox(cab, 'lamp', [0.02, 0.12, 0.36], 0.02, [4.25, 1.06, s * 0.92], undefined, 1);
    k.lamp(cab, [4.18, 0.88, s * 0.62], 0.1, 0, true);
  }
  // pare-soleil, rampe de toit avec gyrophares et phares
  k.rbox(cab, 'black', [0.26, 0.06, 2.3], 0.02, [4.02, 3.08, 0], [0, 0, -0.35]);
  k.rbox(cab, 'trim', [0.22, 0.08, 1.9], 0.03, [3.62, 3.32, 0]);
  k.beacon(cab, [3.62, 3.36, 0.7], 0.08);
  k.beacon(cab, [3.62, 3.36, -0.7], 0.08);
  for (const z of [-0.25, 0.25]) k.lamp(cab, [3.72, 3.42, z], 0.11);
  // rétroviseurs
  for (const s of [-1, 1]) {
    k.rail(cab, 'trim', [[4.0, 2.35, s * 1.22], [4.18, 2.55, s * 1.42], [4.18, 2.55, s * 1.48]], 0.016);
    k.rbox(cab, 'trim', [0.08, 0.42, 0.2], 0.03, [4.2, 2.48, s * 1.5]);
    k.box(cab, 'mirror', [0.008, 0.36, 0.16], [4.155, 2.48, s * 1.5]);
  }
  // garde-boue avant
  for (const s of [-1, 1]) fender(k, cab, [2.95, R, s * 1.02], R + 0.04, 0.42, 0.25, Math.PI - 0.25, 'black', 0.035);

  // ---------------------------------------------------------------- benne
  const body = k.part('body', chassis, [-3.98, 1.3, 0]);
  k.joint('tip', body, 'rz', 0);
  // plancher et longrines
  k.rbox(body, 'steelDark', [6.0, 0.08, 2.4], 0.02, [3.0, 0.08, 0]);
  k.rbox(body, 'paint', [6.05, 0.06, 2.48], 0.02, [3.0, 0.02, 0]);
  for (const s of [-1, 1]) k.box(body, 'trim', [5.9, 0.12, 0.1], [3.0, -0.04, s * 0.46]);
  // flancs : extrudés de profil, nervures et rebord
  const side = roundedRect(-0.05, 0.05, 6.0, 1.4, 0.06, 0.06);
  for (const s of [-1, 1]) {
    k.extrude(body, 'paint', side, 0.05, [0, 0, s * 1.215], undefined, 0.01, 6);
    k.cylX(body, 'paint', 0.05, 6.0, [2.98, 1.42, s * 1.215], 10);
    for (const x of [0.6, 1.6, 2.6, 3.6, 4.6, 5.5]) k.rbox(body, 'paint', [0.09, 1.2, 0.07], 0.02, [x, 0.7, s * 1.26], undefined, 2);
  }
  // paroi avant et protection de cabine
  k.rbox(body, 'paint', [0.08, 1.5, 2.48], 0.03, [6.0, 0.78, 0]);
  k.rbox(body, 'paint', [0.6, 0.06, 2.3], 0.02, [6.25, 1.5, 0]);
  // ridelle arrière
  k.rbox(body, 'paint', [0.08, 1.36, 2.42], 0.03, [-0.06, 0.74, 0]);
  for (let i = 0; i < 3; i++) k.box(body, 'paint', [0.05, 0.08, 2.3], [-0.11, 0.3 + i * 0.45, 0]);
  k.cylZ(body, 'steel', 0.06, 1.3, [0.05, -0.08, 0], 10);

  // vérin télescopique avant
  k.piston(chassis, [chassis, [2.15, 0.95, 0]], [body, [5.4, -0.06, 0]], 0.15, 0.115);

  return k.build({
    refWeight: 26,
    minScale: 0.92,
    maxScale: 1.08,
    wake: [
      { pose: { tip: 0.5 }, dur: 2.4 },
      { pose: { tip: 0.56 }, dur: 0.6 },
      { pose: { tip: 0 }, dur: 2.2 },
    ],
    nod: [
      { pose: { tip: 0.06 }, dur: 0.5 },
      { pose: { tip: 0 }, dur: 0.5 },
    ],
  });
}

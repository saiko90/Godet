// Grue mobile compacte (deux essieux) : porteur avec cabine de conduite, stabilisateurs rentrés,
// tourelle avec contrepoids et cabine de grutier, flèche télescopique repliée, moufle accroché à l'avant.
import { Kit, softPolygon, type MachineTemplate } from './kit';
import { cabin, fender, wheel } from './parts';

export function buildGrue(): MachineTemplate {
  const k = new Kit('grue');
  const R = 0.66;

  // ---------------------------------------------------------------- porteur
  const carrier = k.part('carrier', 0, [0, 0, 0]);
  const body = softPolygon(
    [
      [-3.95, 0.62],
      [3.95, 0.62],
      [4.05, 1.0],
      [3.9, 1.42],
      [-3.85, 1.42],
      [-3.95, 1.1],
    ],
    0.1,
  );
  k.extrude(carrier, 'paint', body, 2.2, [0, 0, 0], undefined, 0.04, 8);
  k.box(carrier, 'trim', [7.6, 0.08, 2.24], [0, 0.62, 0]);
  for (const x of [2.35, -2.1]) {
    k.cylZ(carrier, 'steelDark', 0.13, 2.0, [x, R, 0], 14);
    for (const s of [-1, 1]) {
      wheel(k, carrier, [x, R, s * 1.0], R, 0.56, { side: s, rim: 'paint', tread: 'lug' });
      fender(k, carrier, [x, R, s * 1.0], R + 0.06, 0.64, 0.2, Math.PI - 0.2, 'black', 0.04);
    }
  }
  // caissons des stabilisateurs (avant et arrière), poutres et patins rentrés
  for (const x of [3.42, -3.45]) {
    k.rbox(carrier, 'trim', [0.42, 0.36, 2.46], 0.04, [x, 0.88, 0]);
    for (const s of [-1, 1]) {
      k.rbox(carrier, 'steelDark', [0.3, 0.26, 0.1], 0.03, [x, 0.88, s * 1.28]);
      k.cyl(carrier, 'steel', 0.18, 0.06, [x, 0.58, s * 1.3], undefined, 18);
      k.cyl(carrier, 'trim', 0.07, 0.36, [x, 0.78, s * 1.3], undefined, 12);
    }
  }
  // feux, pare-chocs, plaque du code
  for (const s of [-1, 1]) {
    k.lamp(carrier, [4.04, 1.12, s * 0.85], 0.12);
    k.rbox(carrier, 'tail', [0.04, 0.12, 0.22], 0.02, [-3.96, 1.12, s * 0.85], undefined, 2);
    k.decal(carrier, 0.66, 0.165, [-0.4, 1.05, s * 1.102], s > 0 ? 0 : Math.PI);
    for (const x of [-3.0, -1.0, 1.0]) k.rbox(carrier, 'amber', [0.08, 0.04, 0.03], 0.01, [x, 0.75, s * 1.105], undefined, 1);
  }
  // cabine de conduite basse, avant gauche
  cabin(k, carrier, {
    x0: 2.6,
    x1: 4.0,
    y0: 1.38,
    h: 1.22,
    w: 0.95,
    zc: -0.66,
    lean: 0.22,
    roof: 'paint',
    frame: 'trim',
    door: 'left',
    beacon: 'left',
    lights: 1,
  });
  k.mirror(carrier, [3.95, 2.3, -1.12], -1, 0.24);
  k.mirror(carrier, [3.95, 2.0, 1.1], 1, 0.2);
  // repose-flèche
  k.rbox(carrier, 'trim', [0.18, 0.66, 0.18], 0.03, [3.1, 1.75, 0.25]);
  k.rbox(carrier, 'rubber', [0.3, 0.06, 0.5], 0.02, [3.1, 2.1, 0.25]);
  // moufle accroché à l'avant (transport)
  k.rbox(carrier, 'paint', [0.24, 0.36, 0.3], 0.05, [4.18, 1.62, 0.25]);
  k.cylZ(carrier, 'steel', 0.12, 0.2, [4.18, 1.78, 0.25], 16);
  k.torus(carrier, 'steel', 0.09, 0.025, [4.18, 1.36, 0.25], [0, 0, 0], [6, 16], Math.PI * 1.4);

  // ---------------------------------------------------------------- tourelle
  const sup = k.part('super', carrier, [-1.3, 1.42, 0]);
  k.joint('slew', sup, 'ry', 0);
  k.cyl(sup, 'steelDark', [1.0, 1.05], 0.16, [0, 0.08, 0], undefined, 36);
  k.rbox(sup, 'trim', [2.6, 0.42, 1.4], 0.05, [0.0, 0.38, 0.1]);
  // contrepoids arrière
  const cw = softPolygon(
    [
      [-2.3, 0.15],
      [-1.2, 0.15],
      [-1.2, 1.15],
      [-2.05, 1.15],
      [-2.3, 0.85],
    ],
    0.12,
  );
  k.extrude(sup, 'paint', cw, 2.3, [0, 0, 0], undefined, 0.035, 8);
  k.grille(sup, [-2.31, 0.62, 0], 1.2, 0.3, 4, 'x', -1);
  for (const s of [-1, 1]) k.decal(sup, 0.5, 0.125, [-1.7, 0.72, s * 1.152], s > 0 ? 0 : Math.PI);
  // cabine du grutier (côté gauche)
  cabin(k, sup, {
    x0: -0.25,
    x1: 1.15,
    y0: 0.42,
    h: 1.3,
    w: 0.78,
    zc: -0.82,
    lean: 0.25,
    roof: 'paint',
    frame: 'trim',
    door: 'left',
    beacon: 'right',
    lights: 1,
  });
  // pied de flèche
  for (const z of [-0.12, 0.62]) k.rbox(sup, 'paint', [0.6, 0.85, 0.1], 0.03, [-0.95, 0.85, z]);

  // ---------------------------------------------------------------- flèche télescopique (repliée)
  const boom = k.part('boom', sup, [-0.95, 1.05, 0.25]);
  k.joint('luff', boom, 'rz', 0);
  k.rbox(boom, 'paint', [6.9, 0.74, 0.62], 0.1, [2.95, 0.0, 0], undefined, 3);
  k.box(boom, 'black', [6.6, 0.03, 0.03], [3.0, 0.2, 0.315]);
  k.cylZ(boom, 'steel', 0.12, 0.86, [0, 0, 0], 16);
  for (const s of [-1, 1]) k.decal(boom, 0.9, 0.225, [1.4, 0.05, s * 0.312], s > 0 ? 0 : Math.PI);
  const t1 = k.part('tele1', boom, [0.6, 0.02, 0]);
  k.joint('tele1', t1, 'tx', 0);
  k.rbox(t1, 'paint', [6.0, 0.6, 0.5], 0.08, [2.95, 0, 0], undefined, 3);
  k.box(t1, 'black', [0.06, 0.62, 0.52], [5.92, 0, 0]);
  const t2 = k.part('tele2', t1, [0.5, 0.0, 0]);
  k.joint('tele2', t2, 'tx', 0);
  k.rbox(t2, 'paint', [5.6, 0.46, 0.38], 0.07, [2.9, 0, 0], undefined, 3);
  // tête de flèche et poulies
  k.rbox(t2, 'trim', [0.42, 0.56, 0.4], 0.05, [5.85, 0.0, 0]);
  k.cylZ(t2, 'steel', 0.2, 0.12, [6.02, -0.12, 0], 22);
  k.cylZ(t2, 'steelDark', 0.08, 0.44, [6.02, -0.12, 0], 12);

  // vérin de relevage et câble du moufle
  k.piston(sup, [sup, [0.75, 0.2, 0.25]], [boom, [2.8, -0.38, 0]], 0.17, 0.11);
  k.link(carrier, [t2, [6.12, -0.28, 0]], [carrier, [4.18, 1.8, 0.25]], 0.014, 0.014, 'black', true);

  return k.build({
    refWeight: 40,
    minScale: 0.9,
    maxScale: 1.1,
    wake: [
      { pose: { luff: 0.42 }, dur: 2.0 },
      { pose: { tele1: 1.5, tele2: 1.3 }, dur: 2.0 },
      { pose: { slew: 0.45 }, dur: 1.8 },
      { pose: { slew: 0, tele1: 0, tele2: 0 }, dur: 1.8 },
      { pose: { luff: 0 }, dur: 1.6 },
    ],
    nod: [
      { pose: { luff: 0.06 }, dur: 0.55 },
      { pose: { luff: 0 }, dur: 0.55 },
    ],
    breathe: { luff: 0.003 },
  });
}

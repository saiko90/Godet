// Rouleau compacteur monocylindre (≈ 12 t) : cylindre lisse dans son cadre avant, articulation centrale,
// châssis arrière motorisé sur deux gros pneus, cabine de protection.
import { Kit, softPolygon, type MachineTemplate } from './kit';
import { cabin, exhaust, fender, ladder, wheel } from './parts';

export function buildRouleau(): MachineTemplate {
  const k = new Kit('rouleau');
  const RD = 0.76; // rayon du cylindre
  const DW = 2.12; // largeur du cylindre

  // ---------------------------------------------------------------- châssis arrière
  const rear = k.part('rear', 0, [0, 0, 0]);
  const R = 0.78;
  for (const s of [-1, 1]) wheel(k, rear, [-1.35, R, s * 0.86], R, 0.62, { side: s, rim: 'paint', tread: 'lug' });
  k.cylZ(rear, 'steelDark', 0.15, 1.4, [-1.35, R, 0], 14);
  k.rbox(rear, 'trim', [2.2, 0.45, 0.9], 0.05, [-1.1, 0.95, 0]);
  // capot moteur effilé vers l'arrière
  const hood = softPolygon(
    [
      [-2.55, 1.0],
      [-0.4, 1.0],
      [-0.4, 1.9],
      [-2.2, 1.95],
      [-2.55, 1.62],
    ],
    0.14,
  );
  k.extrude(rear, 'paint', hood, 1.3, [0, 0, 0], undefined, 0.04, 10);
  k.grille(rear, [-2.56, 1.38, 0], 0.9, 0.4, 5, 'x', -1);
  for (const s of [-1, 1]) {
    k.grille(rear, [-1.0, 1.5, s * 0.652], 0.6, 0.3, 4, 'z', s);
    k.decal(rear, 0.62, 0.155, [-1.75, 1.45, s * 0.652], s > 0 ? 0 : Math.PI);
    k.rbox(rear, 'tail', [0.05, 0.1, 0.16], 0.02, [-2.56, 1.12, s * 0.5], undefined, 2);
    fender(k, rear, [-1.35, R, s * 0.86], R + 0.06, 0.74, 0.3, Math.PI - 0.15, 'paint', 0.05);
  }
  exhaust(k, rear, [-1.75, 1.9, 0.38], 0.32, 0.06);
  ladder(k, rear, -0.5, -0.22, 0.4, 1.32, -0.7, 4);

  cabin(k, rear, {
    x0: -0.62,
    x1: 0.62,
    y0: 1.4,
    h: 1.48,
    w: 1.3,
    zc: 0,
    lean: 0.1,
    leanBack: 0.04,
    roof: 'paint',
    frame: 'trim',
    door: 'left',
    beacon: 'right',
    lights: 2,
    rearLights: 2,
  });
  k.mirror(rear, [0.6, 2.3, -0.66], -1, 0.2);
  k.mirror(rear, [0.6, 2.3, 0.66], 1, 0.2);

  // ---------------------------------------------------------------- articulation et cadre du cylindre
  const front = k.part('front', 0, [0.75, 0, 0]);
  k.joint('steer', front, 'ry', 0);
  k.cyl(front, 'steelDark', 0.15, 0.7, [0, 1.0, 0], undefined, 16);
  k.rbox(front, 'trim', [0.9, 0.36, 0.7], 0.05, [0.35, 1.0, 0]);
  // cadre en U autour du cylindre (flancs peints, traverses)
  for (const s of [-1, 1]) {
    const plate = softPolygon(
      [
        [0.55, 0.42],
        [2.35, 0.42],
        [2.5, 1.18],
        [2.25, 1.58],
        [0.75, 1.58],
        [0.55, 1.25],
      ],
      0.12,
    );
    k.extrude(front, 'paint', plate, 0.1, [0, 0, s * (DW / 2 + 0.12)], undefined, 0.02, 8);
    k.cylZ(front, 'steelDark', 0.22, 0.08, [1.55, RD, s * (DW / 2 + 0.2)], 18);
  }
  k.rbox(front, 'paint', [1.7, 0.14, DW + 0.34], 0.04, [1.5, 1.6, 0]);
  k.rbox(front, 'paint', [0.16, 0.4, DW + 0.34], 0.04, [0.6, 1.3, 0]);
  // racleurs avant et arrière
  k.box(front, 'black', [0.06, 0.12, DW], [2.38, 0.35, 0], [0, 0, 0.5]);
  k.box(front, 'black', [0.06, 0.12, DW], [0.7, 0.32, 0], [0, 0, -0.5]);
  for (const s of [-1, 1]) k.lamp(front, [2.42, 1.42, s * 0.85], 0.11);

  // ---------------------------------------------------------------- cylindre (vibre au réveil)
  const drum = k.part('drum', front, [1.55, RD, 0]);
  k.cylZ(drum, 'steel', RD, DW, [0, 0, 0], 48);
  for (const s of [-1, 1]) {
    k.cylZ(drum, 'steelDark', RD - 0.02, 0.03, [0, 0, s * (DW / 2 + 0.005)], 48);
    k.cylZ(drum, 'trim', 0.32, 0.06, [0, 0, s * (DW / 2 + 0.02)], 24);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      k.cylZ(drum, 'steel', 0.03, 0.06, [Math.cos(a) * 0.22, Math.sin(a) * 0.22, s * (DW / 2 + 0.04)], 8);
    }
  }

  return k.build({
    refWeight: 12,
    minScale: 0.85,
    maxScale: 1.2,
    vibrate: 'drum',
    wake: [
      { pose: { steer: 0.3 }, dur: 1.4 },
      { pose: { steer: -0.2 }, dur: 1.6 },
      { pose: { steer: 0 }, dur: 1.2 },
    ],
    nod: [
      { pose: { steer: 0.08 }, dur: 0.45 },
      { pose: { steer: 0 }, dur: 0.5 },
    ],
    breathe: { steer: 0.004 },
  });
}

// Engin générique : chargeuse compacte sur chenilles (≈ 4 t) — bras de levage latéraux, cabine centrale
// à porte vitrée frontale, moteur arrière, godet large.
import * as THREE from 'three';
import { Kit, beam2D, roundedRect, softPolygon, type MachineTemplate } from './kit';
import { cabin, track } from './parts';

export function buildAutre(): MachineTemplate {
  const k = new Kit('autre');

  // ---------------------------------------------------------------- train et caisse
  const base = k.part('base', 0, [0, 0, 0]);
  for (const s of [-1, 1]) track(k, base, { length: 1.8, radius: 0.27, cy: 0.29, width: 0.33, z: s * 0.72, rubber: true, rollers: 4 });
  k.rbox(base, 'steelDark', [1.4, 0.3, 1.0], 0.04, [-0.15, 0.36, 0]);
  // caisse moteur, vue de dessus
  k.slab(base, 'paint', roundedRect(-1.12, -0.62, 0.66, 0.62, 0.16, 0.08), 0.72, 0.44, 0.035, 10);
  k.slab(base, 'trim', roundedRect(-1.14, -0.64, 0.68, 0.64, 0.17, 0.09), 0.06, 0.42, 0.0, 10);
  // porte moteur arrière, grille, feux
  k.rbox(base, 'paint', [0.06, 0.62, 0.92], 0.03, [-1.15, 0.84, 0]);
  k.grille(base, [-1.19, 0.9, 0], 0.7, 0.36, 5, 'x', -1);
  for (const s of [-1, 1]) {
    k.rbox(base, 'tail', [0.04, 0.12, 0.1], 0.015, [-1.18, 1.05, s * 0.52], undefined, 2);
    k.lamp(base, [-1.15, 1.22, s * 0.5], 0.08, Math.PI);
    k.decal(base, 0.4, 0.1, [-0.75, 0.86, s * 0.626], s > 0 ? 0 : Math.PI);
  }
  // tours des bras de levage
  for (const s of [-1, 1]) {
    const tower = softPolygon(
      [
        [-1.12, 0.5],
        [-0.55, 0.5],
        [-0.75, 1.7],
        [-1.1, 1.7],
      ],
      0.06,
    );
    k.extrude(base, 'paint', tower, 0.08, [0, 0, s * 0.62], undefined, 0.012, 8);
  }

  // ---------------------------------------------------------------- cabine
  cabin(k, base, {
    x0: -0.45,
    x1: 0.6,
    y0: 0.62,
    h: 1.3,
    w: 0.96,
    zc: 0,
    lean: 0.05,
    roof: 'trim',
    frame: 'trim',
    post: 0.06,
    door: 'none',
    beacon: 'right',
    lights: 2,
  });

  // ---------------------------------------------------------------- bras de levage
  const arms = k.part('arms', base, [-0.95, 1.58, 0]);
  k.joint('lift', arms, 'rz', 0);
  const arm = beam2D([0, 0], [1.55, 0.22], [1.95, -1.18], 0.1, 0.08, 0.03);
  for (const s of [-1, 1]) {
    k.extrude(arms, 'paint', arm.shape, 0.09, [0, 0, s * 0.72], undefined, 0.015, 10);
    const p = arm.edge(0.62, 1, 0.02);
    k.lamp(arms, [p.x, p.y + 0.03, s * 0.72], 0.09, 0.3);
  }
  k.cylZ(arms, 'paint', 0.06, 1.44, [1.74, -0.62, 0], 14);
  k.cylZ(arms, 'steel', 0.05, 1.56, [0, 0, 0], 10);

  // ---------------------------------------------------------------- godet
  const bucket = k.part('bucket', arms, [1.95, -1.18, 0]);
  k.joint('tilt', bucket, 'rz', 0.08);
  const outer = new THREE.SplineCurve(
    [
      [-0.04, 0.46],
      [-0.28, 0.3],
      [-0.32, -0.05],
      [-0.12, -0.32],
      [0.25, -0.36],
      [0.62, -0.32],
    ].map(([x, y]) => new THREE.Vector2(x, y)),
  ).getPoints(32);
  const inner = outer.map((p, i) => {
    const a = outer[Math.max(0, i - 1)];
    const b = outer[Math.min(outer.length - 1, i + 1)];
    const t = b.clone().sub(a).normalize();
    return p.clone().add(new THREE.Vector2(-t.y, t.x).multiplyScalar(0.035));
  });
  const BW = 1.82;
  k.extrude(bucket, 'steelDark', new THREE.Shape([...outer, ...inner.slice().reverse()]), BW, [0, 0, 0], undefined, 0, 6);
  const side = new THREE.Shape([...outer, new THREE.Vector2(0.45, -0.1), new THREE.Vector2(0.12, 0.46)]);
  for (const z of [BW / 2 + 0.015, -BW / 2 - 0.015]) k.extrude(bucket, 'steelDark', side, 0.03, [0, 0, z], undefined, 0, 6);
  k.box(bucket, 'steel', [0.16, 0.03, BW + 0.02], [0.6, -0.32, 0], [0, 0, 0.06]);
  for (const s of [-1, 1]) k.box(bucket, 'trim', [0.18, 0.3, 0.08], [-0.24, 0.24, s * 0.5]);

  // ---------------------------------------------------------------- vérins
  for (const s of [-1, 1]) {
    k.piston(base, [base, [-0.72, 0.68, s * 0.6]], [arms, [0.62, -0.06, s * 0.62]], 0.065, 0.04);
    k.piston(arms, [arms, [1.52, -0.42, s * 0.5]], [bucket, [-0.24, 0.32, s * 0.5]], 0.055, 0.034);
  }

  return k.build({
    refWeight: 4,
    minScale: 0.85,
    maxScale: 1.4,
    wake: [
      { pose: { lift: 0.55, tilt: -0.4 }, dur: 1.5 },
      { pose: { lift: 0.75, tilt: -0.55 }, dur: 1.0 },
      { pose: { tilt: -1.2 }, dur: 0.9 },
      { pose: { lift: 0, tilt: 0.08 }, dur: 1.6 },
    ],
    nod: [
      { pose: { tilt: -0.22 }, dur: 0.4 },
      { pose: { tilt: 0.08 }, dur: 0.45 },
    ],
    breathe: { lift: 0.006 },
  });
}

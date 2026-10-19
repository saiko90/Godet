// Chargeuse articulée sur pneus (≈ 15 t) : châssis arrière (moteur, contrepoids, cabine), articulation
// centrale, châssis avant (bras de levage, godet large), vérins de levage et de cavage.
import * as THREE from 'three';
import { Kit, beam2D, roundedRect, softPolygon, type MachineTemplate } from './kit';
import { cabin, exhaust, fender, ladder, wheel } from './parts';

export function buildChargeuse(): MachineTemplate {
  const k = new Kit('chargeuse');
  const R = 0.78; // rayon des pneus
  const TW = 0.56; // largeur des pneus
  const ZW = 1.0; // demi-voie (centre des pneus)

  // ---------------------------------------------------------------- châssis arrière
  const rear = k.part('rear', 0, [0, 0, 0]);
  // longerons et pont arrière
  k.rbox(rear, 'trim', [2.6, 0.55, 1.0], 0.06, [-1.35, 0.95, 0]);
  k.cylZ(rear, 'steelDark', 0.16, 2 * ZW - 0.2, [-1.55, R, 0], 16);
  k.rbox(rear, 'steelDark', [0.5, 0.36, 0.7], 0.05, [-1.55, R, 0]);
  for (const s of [-1, 1]) wheel(k, rear, [-1.55, R, s * ZW], R, TW, { side: s, rim: 'paint', tread: 'lug' });
  for (const s of [-1, 1]) fender(k, rear, [-1.55, R, s * ZW], R + 0.06, TW + 0.12, 0.25, Math.PI - 0.05, 'paint', 0.05);

  // capot moteur : profil latéral arrondi extrudé sur la largeur
  const hood = softPolygon(
    [
      [-2.92, 1.12],
      [-0.72, 1.12],
      [-0.72, 1.98],
      [-2.55, 2.1],
      [-2.92, 1.86],
    ],
    0.16,
  );
  k.extrude(rear, 'paint', hood, 1.3, [0, 0, 0], undefined, 0.04, 10);
  // grille arrière, ouïes latérales, plaque du code
  k.grille(rear, [-2.93, 1.52, 0], 0.9, 0.56, 6, 'x', -1);
  for (const s of [-1, 1]) {
    k.grille(rear, [-1.3, 1.62, s * 0.652], 0.7, 0.34, 5, 'z', s);
    k.decal(rear, 0.66, 0.165, [-2.05, 1.55, s * 0.652], s > 0 ? 0 : Math.PI);
  }
  // contrepoids arrière (pare-chocs massif) et feux
  k.slab(rear, 'paint', roundedRect(-3.12, -1.12, -2.7, 1.12, 0.22, 0.02), 0.62, 0.62, 0.04, 12);
  k.box(rear, 'black', [0.06, 0.08, 1.6], [-3.14, 0.94, 0]);
  for (const s of [-1, 1]) {
    k.rbox(rear, 'tail', [0.05, 0.12, 0.2], 0.02, [-3.13, 1.1, s * 0.86], undefined, 2);
    k.lamp(rear, [-3.08, 1.28, s * 0.86], 0.1, Math.PI);
  }
  exhaust(k, rear, [-2.2, 2.0, 0.35], 0.36, 0.07);
  k.cyl(rear, 'trim', 0.11, 0.32, [-2.3, 2.16, -0.35], undefined, 16);
  k.cyl(rear, 'black', 0.12, 0.08, [-2.3, 2.34, -0.35], undefined, 16);
  // marchepied (côté gauche, z−)
  ladder(k, rear, -0.7, -0.4, 0.42, 1.42, -0.74, 4);
  k.rail(rear, 'trim', [[-0.7, 1.5, -0.76], [-0.7, 2.6, -0.76]], 0.018);

  // ---------------------------------------------------------------- cabine centrale
  cabin(k, rear, {
    x0: -0.66,
    x1: 0.62,
    y0: 1.45,
    h: 1.5,
    w: 1.36,
    zc: 0,
    lean: 0.14,
    leanBack: 0.06,
    roof: 'paint',
    frame: 'trim',
    door: 'left',
    beacon: 'right',
    lights: 2,
    rearLights: 2,
  });
  k.mirror(rear, [0.6, 2.3, -0.7], -1, 0.22);
  k.mirror(rear, [0.6, 2.3, 0.7], 1, 0.22);

  // ---------------------------------------------------------------- articulation et châssis avant
  const front = k.part('front', 0, [0.15, 0, 0]);
  k.joint('steer', front, 'ry', 0);
  k.cyl(front, 'steelDark', 0.16, 0.9, [0, 1.0, 0], undefined, 16);
  k.rbox(front, 'trim', [1.9, 0.5, 0.9], 0.06, [0.95, 0.95, 0]);
  k.cylZ(front, 'steelDark', 0.16, 2 * ZW - 0.2, [1.45, R, 0], 16);
  k.rbox(front, 'steelDark', [0.5, 0.36, 0.7], 0.05, [1.45, R, 0]);
  for (const s of [-1, 1]) wheel(k, front, [1.45, R, s * ZW], R, TW, { side: s, rim: 'paint', tread: 'lug' });
  for (const s of [-1, 1]) fender(k, front, [1.45, R, s * ZW], R + 0.06, TW + 0.12, 0.35, Math.PI - 0.6, 'paint', 0.05);
  // tours des bras de levage
  for (const z of [-0.5, 0.5]) {
    const tower = softPolygon(
      [
        [0.55, 0.8],
        [1.45, 0.8],
        [1.3, 1.95],
        [0.95, 2.05],
      ],
      0.08,
    );
    k.extrude(front, 'paint', tower, 0.1, [0, 0, z], undefined, 0.015, 8);
  }
  // phares avant sur les tours
  for (const s of [-1, 1]) k.lamp(front, [1.38, 1.62, s * 0.62], 0.12);

  // ---------------------------------------------------------------- bras de levage
  const arms = k.part('arms', front, [1.15, 1.95, 0]);
  k.joint('lift', arms, 'rz', 0);
  const arm = beam2D([0, 0], [1.2, 0.0], [2.0, -1.5], 0.17, 0.13, 0.04);
  for (const z of [-0.62, 0.62]) k.extrude(arms, 'paint', arm.shape, 0.13, [0, 0, z], undefined, 0.02, 10);
  k.cylZ(arms, 'paint', 0.1, 1.24, [1.1, -0.37, 0], 16);
  k.cylZ(arms, 'steel', 0.07, 1.42, [0, 0, 0], 12);
  k.cylZ(arms, 'steel', 0.07, 1.42, [2.0, -1.5, 0], 12);
  // basculeur (Z-bar)
  const crank = softPolygon(
    [
      [0.98, -0.42],
      [1.24, -0.3],
      [1.46, 0.45],
      [1.26, 0.53],
    ],
    0.06,
  );
  k.extrude(arms, 'trim', crank, 0.16, [0, 0, 0], undefined, 0.02, 8);
  k.cylZ(arms, 'steel', 0.06, 0.2, [1.36, 0.45, 0], 10);
  k.cylZ(arms, 'steel', 0.06, 0.2, [1.08, -0.36, 0], 10);

  // ---------------------------------------------------------------- godet large
  const bucket = k.part('bucket', arms, [2.0, -1.5, 0]);
  k.joint('tilt', bucket, 'rz', 0.12);
  const outer = new THREE.SplineCurve(
    [
      [-0.05, 0.62],
      [-0.42, 0.4],
      [-0.5, -0.05],
      [-0.25, -0.38],
      [0.3, -0.42],
      [0.95, -0.36],
    ].map(([x, y]) => new THREE.Vector2(x, y)),
  ).getPoints(40);
  const inner = outer.map((p, i) => {
    const a = outer[Math.max(0, i - 1)];
    const b = outer[Math.min(outer.length - 1, i + 1)];
    const t = b.clone().sub(a).normalize();
    return p.clone().add(new THREE.Vector2(-t.y, t.x).multiplyScalar(0.05));
  });
  const BW = 2.7;
  k.extrude(bucket, 'paint', new THREE.Shape([...outer, ...inner.slice().reverse()]), BW, [0, 0, 0], undefined, 0, 8);
  const sideShape = new THREE.Shape([...outer, new THREE.Vector2(0.75, -0.1), new THREE.Vector2(0.2, 0.62)]);
  for (const z of [BW / 2 + 0.02, -BW / 2 - 0.02]) k.extrude(bucket, 'paint', sideShape, 0.04, [0, 0, z], undefined, 0.008, 8);
  // lame d'attaque et protections
  k.box(bucket, 'steel', [0.26, 0.04, BW + 0.04], [0.92, -0.37, 0], [0, 0, 0.08]);
  for (let i = 0; i < 6; i++) k.box(bucket, 'steel', [0.18, 0.05, 0.08], [0.95, -0.34, -BW / 2 + 0.25 + (i * (BW - 0.5)) / 5], [0, 0, 0.08]);
  // pattes d'attache
  for (const z of [-0.62, 0.62]) k.box(bucket, 'trim', [0.24, 0.42, 0.1], [-0.36, 0.18, z]);
  k.box(bucket, 'trim', [0.2, 0.26, 0.18], [-0.3, 0.55, 0]);

  // ---------------------------------------------------------------- vérins
  for (const z of [-0.5, 0.5]) k.piston(front, [front, [0.75, 1.05, z]], [arms, [0.95, -0.38, z > 0 ? 0.56 : -0.56]], 0.11, 0.065);
  k.piston(front, [front, [1.0, 1.9, 0]], [arms, [1.36, 0.45, 0]], 0.12, 0.07);
  k.link(arms, [arms, [1.08, -0.36, 0]], [bucket, [-0.3, 0.55, 0]], 0.1, 0.14);

  return k.build({
    refWeight: 15,
    minScale: 0.82,
    maxScale: 1.2,
    wake: [
      { pose: { lift: 0.6, tilt: -0.45 }, dur: 1.6 },
      { pose: { lift: 0.9, tilt: -0.75 }, dur: 1.2 },
      { pose: { tilt: -1.45 }, dur: 1.1 },
      { pose: { tilt: -0.6, steer: 0.25 }, dur: 1.2 },
      { pose: { lift: 0, tilt: 0.12, steer: 0 }, dur: 1.8 },
    ],
    nod: [
      { pose: { tilt: -0.25 }, dur: 0.45 },
      { pose: { tilt: 0.12 }, dur: 0.5 },
    ],
    breathe: { lift: 0.006, tilt: 0.008 },
  });
}

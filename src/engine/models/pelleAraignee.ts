// Pelle araignée (≈ 10 t, gabarit d'une Menzi Muck M545 ou d'une Kaiser S12) : petit châssis central perché
// sur quatre jambes indépendantes (chacune pivote vers l'extérieur et se lève) ; deux jambes avant coudées à
// griffes, deux jambes arrière à roues motrices ; tourelle compacte (cabine à gauche, moteur et contrepoids à
// l'arrière), flèche coudée, balancier télescopique et godet sur rotateur inclinable.
// Repères : longueur 6,9 m, voie arrière 3,2 m (jambes écartées), garde au sol 0,7 m, toit de cabine à 3,4 m.
import * as THREE from 'three';
import { Kit, beam2D, roundedRect, softPolygon, type MachineTemplate, type V3 } from './kit';
import { cabin, exhaust, wheel } from './parts';

const YH = 0.95; // hauteur des articulations des jambes
const XH = 0.66; // position avant/arrière des hanches
const ZH = 0.43; // demi-écartement des hanches
const YU = 1.32; // dessous de la tourelle
const RW = 0.55; // rayon des roues arrière
const STICK_TILT = 0.277; // inclinaison du balancier au repos (vers l'avant, rad)

/** Godet monté sur rotateur (repère : axe du balancier vers +y, dents vers −x) : coque, flancs, dents, platine. */
function tiltBucket(k: Kit, part: number, s: number, width: number): void {
  const outer = new THREE.SplineCurve(
    [
      [-0.1, 0.08],
      [-0.5, -0.24],
      [-0.53, -0.78],
      [-0.14, -1.06],
      [0.48, -0.95],
    ].map(([x, y]) => new THREE.Vector2(x * s, y * s)),
  ).getPoints(28);
  const inner = outer.map((p, i) => {
    const a = outer[Math.max(0, i - 1)];
    const b = outer[Math.min(outer.length - 1, i + 1)];
    const t = b.clone().sub(a).normalize();
    return p.clone().add(new THREE.Vector2(-t.y, t.x).multiplyScalar(0.04));
  });
  const half = width / 2;
  // Godet rétro : ouverture et dents tournées vers la machine (−x), dos du godet côté extérieur (+x).
  for (const p of [...outer, ...inner]) p.x = -p.x;
  k.extrude(part, 'steelDark', new THREE.Shape([...outer, ...inner.slice().reverse()]), width, [0, 0, 0], undefined, 0, 8);
  const side = new THREE.Shape([...outer, new THREE.Vector2(-0.36 * s, -0.2 * s), new THREE.Vector2(-0.12 * s, 0.12 * s)]);
  for (const z of [half + 0.015, -half - 0.015]) k.extrude(part, 'steelDark', side, 0.03, [0, 0, z], undefined, 0, 8);
  // platine d'attache sous le rotateur
  k.box(part, 'trim', [0.42 * s, 0.06, 0.36], [0.02, 0.06 * s, 0]);
  k.box(part, 'steel', [0.07, 0.035, width + 0.04], [-0.47 * s, -0.94 * s, 0], [0, 0, -0.2]);
  const n = 4;
  for (let i = 0; i < n; i++) {
    const z = -half + 0.08 + (i * (width - 0.16)) / (n - 1);
    k.cyl(part, 'steel', [0.0, 0.035], 0.14, [-0.62 * s, -0.9 * s, z], [0, 0, 1.37], 8);
  }
}

export function buildPelleAraignee(): MachineTemplate {
  const k = new Kit('pelle_araignee');

  // ---------------------------------------------------------------- châssis central et couronne
  const chassis = k.part('chassis', 0, [0, 0, 0]);
  const plan = softPolygon(
    [
      [0.78, -0.28],
      [0.78, 0.28],
      [0.52, 0.5],
      [-0.52, 0.5],
      [-0.78, 0.28],
      [-0.78, -0.28],
      [-0.52, -0.5],
      [0.52, -0.5],
    ],
    0.06,
  );
  k.slab(chassis, 'paint', plan, 0.46, 0.76, 0.03, 6);
  k.slab(chassis, 'trim', plan, 0.06, 0.72, 0, 6);
  k.cyl(chassis, 'steelDark', [0.6, 0.64], 0.12, [0, 1.27, 0], undefined, 32);
  k.torus(chassis, 'steel', 0.62, 0.014, [0, 1.33, 0], [Math.PI / 2, 0, 0], [4, 40]);
  for (const s of [-1, 1]) k.decal(chassis, 0.5, 0.125, [0, 0.86, s * 0.532], s > 0 ? 0 : Math.PI);

  // ---------------------------------------------------------------- quatre jambes (pivot d'écartement + levée)
  const legs: { name: string; f: number; s: number }[] = [
    { name: 'FL', f: 1, s: -1 },
    { name: 'FR', f: 1, s: 1 },
    { name: 'RL', f: -1, s: -1 },
    { name: 'RR', f: -1, s: 1 },
  ];
  const front = beam2D([0, 0], [0.95, 0.62], [1.65, -0.82], 0.13, 0.09, 0.02);
  const rear = beam2D([0, 0], [0.8, 0.14], [1.58, -(YH - RW)], 0.15, 0.11, 0.02);
  for (const { name, f, s } of legs) {
    const yaw = -s * (f > 0 ? 0.45 : Math.PI - 0.5);
    const hip = k.part(`hip${name}`, chassis, [f * XH, YH, s * ZH], [0, yaw, 0]);
    k.joint(`spread${name}`, hip, 'ry', 0);
    // pivot vertical, chapes de l'articulation de levée, patte du vérin de levée
    k.cyl(hip, 'steelDark', 0.1, 0.5, [0, 0.02, 0], undefined, 14);
    for (const z of [-0.13, 0.13]) k.box(hip, 'trim', [0.36, 0.78, 0.05], [0.08, 0.22, z]);
    k.cylZ(hip, 'steel', 0.05, 0.34, [0.07, 0.56, 0], 10);
    k.box(hip, 'trim', [0.1, 0.12, 0.16], [0, 0.05, s * f * 0.17]);
    // vérin d'écartement : du flanc du châssis vers la chape
    k.piston(chassis, [chassis, [f * 0.08, 0.98, s * 0.5]], [hip, [0, 0.05, s * f * 0.22]], 0.06, 0.035);

    const leg = k.part(`leg${name}`, hip, [0.12, 0, 0]);
    k.joint(`lift${name}`, leg, 'rz', 0);
    const beam = f > 0 ? front : rear;
    k.extrude(leg, 'paint', beam.shape, 0.2, [0, 0, 0], undefined, 0.02, 10);
    k.cylZ(leg, 'steel', 0.06, 0.32, [0, 0, 0], 12);
    const top = beam.edge(0.42, 1, 0.03);
    k.box(leg, 'trim', [0.14, 0.1, 0.12], [top.x, top.y - 0.03, 0]);
    k.piston(hip, [hip, [0.07, 0.56, 0]], [leg, [top.x, top.y, 0]], 0.075, 0.045);
    // flexibles du vérin le long de la jambe
    k.hose(leg, 'rubber', [[0.1, 0.2, 0.11], [0.45, 0.32, 0.11], [top.x - 0.1, top.y, 0.11]], 0.018, 10);
    if (f > 0) {
      // pied avant : joues, semelle à crampons, griffes
      const fx = 1.65;
      const fy = -0.82;
      for (const z of [-0.12, 0.12]) k.box(leg, 'trim', [0.2, 0.22, 0.04], [fx + 0.02, fy - 0.03, z]);
      k.cylZ(leg, 'steel', 0.045, 0.3, [fx, fy, 0], 10);
      k.rbox(leg, 'steelDark', [0.56, 0.06, 0.44], 0.02, [fx + 0.06, fy - 0.1, 0], undefined, 1);
      for (const dx of [-0.16, 0, 0.16]) k.box(leg, 'steelDark', [0.04, 0.03, 0.42], [fx + 0.06 + dx, fy - 0.14, 0]);
      for (const z of [-0.14, 0, 0.14]) k.cyl(leg, 'steel', [0, 0.04], 0.18, [fx + 0.4, fy - 0.11, z], [0, 0, -1.75], 8);
    } else {
      // jambe arrière : fourreau télescopique, moteur de roue, roue motrice à l'extérieur
      const hx = 1.58;
      const hy = -(YH - RW);
      const pm = rear.P(0.74);
      const dm = rear.D(0.74);
      k.rbox(leg, 'trim', [0.5, 0.27, 0.24], 0.03, [pm.x, pm.y, 0], [0, 0, Math.atan2(dm.y, dm.x)], 1);
      k.cylZ(leg, 'steelDark', 0.17, 0.32, [hx, hy, -s * 0.15], 16);
      wheel(k, leg, [hx, hy, -s * 0.38], RW, 0.45, { side: -s, rim: 'paint', tread: 'lug', rimRatio: 0.6 });
    }
  }

  // ---------------------------------------------------------------- tourelle compacte
  const upper = k.part('upper', chassis, [0, YU, 0]);
  k.joint('swing', upper, 'ry', 0);
  k.slab(upper, 'paint', roundedRect(-1.27, -0.89, 0.76, 0.89, 0.44, 0.12), 0.5, 0.04, 0.03, 12);
  k.slab(upper, 'trim', roundedRect(-1.3, -0.92, 0.79, 0.92, 0.46, 0.13), 0.06, 0.5, 0, 12);
  k.slab(upper, 'trim', roundedRect(-1.24, -0.86, 0.74, 0.86, 0.4, 0.1), 0.04, 0.56, 0, 12);
  // contrepoids arrondi et capot moteur
  k.slab(upper, 'paint', roundedRect(-1.42, -0.92, -0.98, 0.92, 0.5, 0.02), 0.86, 0.0, 0.03, 12);
  k.slab(upper, 'trim', roundedRect(-1.44, -0.94, -1.1, 0.94, 0.5, 0.02), 0.08, -0.02, 0, 12);
  k.rbox(upper, 'paint', [1.05, 0.46, 1.8], 0.08, [-0.86, 0.79, 0], undefined, 2);
  for (let i = 0; i < 5; i++) k.box(upper, 'black', [0.05, 0.015, 0.9], [-1.2 + i * 0.13, 1.025, 0.3]);
  k.grille(upper, [-0.7, 0.8, 0.915], 0.36, 0.26, 4, 'z', 1);
  exhaust(k, upper, [-0.52, 1.02, 0.62], 0.36, 0.055);
  for (const s of [-1, 1]) {
    k.decal(upper, 0.5, 0.125, [-0.5, 0.28, s * 0.922], s > 0 ? 0 : Math.PI);
    k.rbox(upper, 'tail', [0.05, 0.08, 0.16], 0.015, [-1.36, 0.45, s * 0.7], [0, s * 0.6, 0], 1);
  }
  // réservoir avant droit, pied de flèche
  k.rbox(upper, 'paint', [0.62, 0.5, 0.3], 0.05, [0.42, 0.8, 0.76], undefined, 2);
  k.lamp(upper, [0.75, 0.94, 0.76], 0.11);
  k.rbox(upper, 'trim', [0.42, 0.42, 0.44], 0.04, [0.58, 0.4, 0.38], undefined, 1);

  // cabine (côté gauche, z−)
  cabin(k, upper, {
    x0: -0.3,
    x1: 0.78,
    y0: 0.56,
    h: 1.42,
    w: 0.96,
    zc: -0.42,
    lean: 0.14,
    roof: 'trim',
    frame: 'trim',
    door: 'left',
    beacon: 'right',
    lights: 2,
    rearLights: 1,
  });
  k.mirror(upper, [0.76, 1.35, -0.92], -1, 0.2);
  // marchepied sous la porte et poignée de montée
  k.box(upper, 'trim', [0.4, 0.04, 0.22], [0.2, 0.2, -1.02]);
  k.box(upper, 'black', [0.36, 0.012, 0.18], [0.2, 0.225, -1.02]);
  k.rail(upper, 'trim', [[0.74, 0.72, -0.9], [0.74, 0.72, -0.96], [0.74, 1.5, -0.96], [0.74, 1.5, -0.9]], 0.016);

  // ---------------------------------------------------------------- flèche coudée
  const boom = k.part('boom', upper, [0.62, 0.42, 0.38]);
  k.joint('boom', boom, 'rz', 0);
  const BT: [number, number] = [2.55, 0.62];
  const bm = beam2D([0, 0], [1.15, 1.3], BT, 0.19, 0.13, 0.05);
  k.extrude(boom, 'paint', bm.shape, 0.32, [0, 0, 0], undefined, 0.025, 12);
  k.cylZ(boom, 'trim', 0.15, 0.48, [0, 0, 0], 16);
  k.cylZ(boom, 'steel', 0.065, 0.54, [0, 0, 0], 12);
  k.cylZ(boom, 'trim', 0.13, 0.4, [BT[0], BT[1], 0], 16);
  k.cylZ(boom, 'steel', 0.06, 0.46, [BT[0], BT[1], 0], 12);
  const bc = bm.edge(0.32, -1, -0.02);
  k.box(boom, 'trim', [0.18, 0.12, 0.24], [bc.x, bc.y + 0.03, 0], [0, 0, 0.9]);
  const sc = bm.edge(0.42, 1, 0.07);
  k.box(boom, 'trim', [0.24, 0.14, 0.2], [sc.x, sc.y - 0.05, 0], [0, 0, 0.2]);
  {
    const p = bm.edge(0.2, 1, -0.05);
    k.lamp(boom, [p.x, p.y, -0.2], 0.1, 0.2);
  }
  for (const z of [-0.08, 0.08]) {
    const pts: V3[] = [];
    for (const t of [0.05, 0.3, 0.55, 0.8, 0.97]) {
      const p = bm.edge(t, 1, 0.02);
      pts.push([p.x, p.y, z]);
    }
    k.hose(boom, 'rubber', pts, 0.02, 18);
  }

  // ---------------------------------------------------------------- balancier télescopique
  const stick = k.part('stick', boom, [BT[0], BT[1], 0]);
  k.joint('stick', stick, 'rz', 0);
  const dir = new THREE.Vector2(Math.sin(STICK_TILT), -Math.cos(STICK_TILT));
  const T: [number, number] = [-0.2, 0.42];
  const E0: [number, number] = [dir.x * 1.2, dir.y * 1.2];
  const st = beam2D(T, [(T[0] + E0[0]) / 2, (T[1] + E0[1]) / 2], E0, 0.14, 0.12, 0);
  k.extrude(stick, 'paint', st.shape, 0.26, [0, 0, 0], undefined, 0.02, 8);
  k.cylZ(stick, 'steel', 0.05, 0.32, [T[0], T[1], 0], 10);
  k.box(stick, 'black', [0.27, 0.04, 0.28], [E0[0], E0[1], 0], [0, 0, STICK_TILT]);
  const tele = k.part('tele', stick, [0, 0, 0], [0, 0, STICK_TILT]);
  k.joint('tele', tele, 'ty', 0);
  const BP = -1.38; // axe du godet sur le coulisseau
  k.box(tele, 'paint', [0.17, 0.7, 0.19], [0, -1.04, 0]);
  k.box(tele, 'trim', [0.2, 0.2, 0.3], [0, BP + 0.06, 0]);
  k.cylZ(tele, 'steel', 0.05, 0.36, [0, BP, 0], 10);
  k.box(tele, 'trim', [0.1, 0.1, 0.12], [0.16, -0.75, 0]);

  // ---------------------------------------------------------------- rotateur inclinable et godet
  const bucket = k.part('bucket', tele, [0, BP, 0], [0, 0, 0.2]);
  k.joint('bucket', bucket, 'rz', 0);
  k.cyl(bucket, 'trim', 0.14, 0.2, [0, -0.12, 0], undefined, 16);
  k.box(bucket, 'trim', [0.3, 0.08, 0.32], [0.04, -0.02, 0]);
  k.box(bucket, 'trim', [0.12, 0.12, 0.1], [0.2, 0.06, 0]);
  for (const z of [-0.17, 0.17]) k.box(bucket, 'trim', [0.08, 0.08, 0.06], [0, -0.16, z]);
  const tb = k.part('tiltb', bucket, [0, -0.38, 0]);
  k.joint('tilt', tb, 'rx', 0);
  k.cyl(tb, 'steelDark', 0.16, 0.16, [0, 0.14, 0], undefined, 16);
  for (const z of [-0.28, 0.28]) k.box(tb, 'trim', [0.08, 0.08, 0.08], [0, 0.04, z]);
  tiltBucket(k, tb, 0.6, 0.65);

  // ---------------------------------------------------------------- vérins (flèche, balancier, godet, inclinaison)
  k.box(upper, 'trim', [0.18, 0.18, 0.26], [0.92, 0.14, 0.38]);
  k.piston(upper, [upper, [0.92, 0.14, 0.38]], [boom, [bc.x, bc.y, 0]], 0.1, 0.06);
  k.piston(boom, [boom, [sc.x, sc.y, 0]], [stick, [T[0], T[1], 0]], 0.085, 0.05);
  k.piston(tele, [tele, [0.2, -0.75, 0]], [bucket, [0.2, 0.06, 0]], 0.065, 0.04);
  for (const z of [-1, 1]) k.piston(bucket, [bucket, [0, -0.16, z * 0.17]], [tb, [0, 0.04, z * 0.28]], 0.035, 0.022);

  return k.build({
    refWeight: 10,
    minScale: 0.85,
    maxScale: 1.3,
    wake: [
      { pose: { liftFL: 0.38, spreadFL: 0.15 }, dur: 1.1 },
      { pose: { liftFL: 0, spreadFR: -0.15, spreadRL: -0.12, spreadRR: 0.12 }, dur: 1.3 },
      { pose: { boom: 0.32, stick: 0.45, tele: -0.45, bucket: -0.5, tilt: 0.45 }, dur: 1.5 },
      { pose: { swing: -0.55, tilt: -0.45, bucket: 0.35, liftRR: 0.12 }, dur: 1.5 },
      {
        pose: { swing: 0, boom: 0, stick: 0, tele: 0, bucket: 0, tilt: 0, liftRR: 0, spreadFL: 0, spreadFR: 0, spreadRL: 0, spreadRR: 0 },
        dur: 1.8,
      },
    ],
    nod: [
      { pose: { tilt: 0.3 }, dur: 0.45 },
      { pose: { tilt: 0 }, dur: 0.5 },
    ],
    breathe: { boom: 0.01, stick: 0.008, tilt: 0.012 },
  });
}

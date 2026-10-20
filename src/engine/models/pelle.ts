// Pelle sur chenilles (≈ 21 t) : reprise de la pelle du prototype validé, enrichie (capot à ouïes,
// flexibles le long des bras, mains courantes, rétroviseurs, marchepieds, phares de flèche).
import * as THREE from 'three';
import { Kit, beam2D, roundedRect, type MachineTemplate, type V3 } from './kit';
import { cabin, exhaust, track } from './parts';

export function buildPelle(): MachineTemplate {
  const k = new Kit('pelle');

  // ---------------------------------------------------------------- train de roulement
  const under = k.part('under', 0, [0, 0, 0]);
  const L = 4.5;
  const r = 0.4;
  const cy = 0.46;
  const W = 0.6;
  for (const side of [-1, 1]) {
    track(k, under, { length: L, radius: r, cy, width: W, z: side * 1.12, rollers: 6 });
    // carter de protection au-dessus de la chenille (bord supérieur)
    k.box(under, 'steelDark', [L - 2 * r - 0.4, 0.05, 0.22], [0, cy + r + 0.03, side * 0.98]);
  }
  k.rbox(under, 'steelDark', [2.6, 0.42, 1.7], 0.06, [0, cy + 0.1, 0]);
  k.cyl(under, 'steelDark', [0.98, 1.02], 0.18, [0, 0.99, 0], undefined, 40);
  k.torus(under, 'steel', 0.99, 0.018, [0, 1.06, 0], [Math.PI / 2, 0, 0], [6, 64]);
  // marchepied avant gauche
  k.box(under, 'trim', [0.4, 0.04, 0.24], [0.9, 0.98, -0.75]);

  // ---------------------------------------------------------------- tourelle
  const upper = k.part('upper', 0, [0, 1.08, 0]);
  k.joint('swing', upper, 'ry', 0);
  // caisse principale : vue de dessus, arrondie à l'arrière
  k.slab(upper, 'paint', roundedRect(-2.05, -1.25, 1.25, 1.25, 0.62, 0.14), 0.62, 0.06, 0.04, 18);
  // bandeau graphite (deux tons)
  k.slab(upper, 'trim', roundedRect(-2.08, -1.27, 1.27, 1.27, 0.64, 0.15), 0.07, 0.6, 0.01, 18);
  // pont supérieur
  k.slab(upper, 'trim', roundedRect(-1.98, -1.2, 1.2, 1.2, 0.56, 0.1), 0.04, 0.68, 0, 18);
  // contrepoids arrière, plus large, jupe sombre
  k.slab(upper, 'paint', roundedRect(-2.16, -1.3, -1.32, 1.3, 0.66, 0.02), 0.84, 0.0, 0.035, 18);
  k.slab(upper, 'trim', roundedRect(-2.18, -1.32, -1.44, 1.32, 0.66, 0.02), 0.09, -0.02, 0.0, 18);
  // feux arrière sur le contrepoids
  for (const z of [-0.95, 0.95]) {
    k.rbox(upper, 'tail', [0.06, 0.1, 0.2], 0.02, [-2.17, 0.5, z], [0, z > 0 ? 0.55 : -0.55, 0], 2);
  }
  // capot moteur arrondi, ouïes sur le dessus et sur le flanc
  k.rbox(upper, 'paint', [1.5, 0.5, 2.2], 0.1, [-1.18, 0.98, 0.05], undefined, 4);
  for (let i = 0; i < 7; i++) k.box(upper, 'black', [0.06, 0.02, 1.3], [-1.72 + i * 0.16, 1.235, 0.1]);
  k.grille(upper, [-0.72, 0.98, 1.157], 0.36, 0.34, 5, 'z', 1);
  // plaque du code sur les flancs du capot
  for (const s of [-1, 1]) k.decal(upper, 0.62, 0.155, [-1.42, 0.98, s * 1.158], s > 0 ? 0 : Math.PI);
  // échappement
  exhaust(k, upper, [-0.72, 1.22, 0.66], 0.5, 0.075);
  // coffre avant droit et mains courantes
  k.rbox(upper, 'paint', [1.35, 0.62, 0.7], 0.08, [0.42, 1.04, 0.86], undefined, 4);
  k.grille(upper, [0.95, 1.05, 0.86], 0.5, 0.36, 4, 'x', 1);
  k.rail(upper, 'trim', [[-0.2, 1.35, 1.17], [-0.2, 1.72, 1.17], [1.02, 1.72, 1.17], [1.02, 1.35, 1.17]], 0.02);
  k.rail(upper, 'trim', [[-1.85, 1.23, 1.12], [-1.85, 1.55, 1.12], [-0.45, 1.55, 1.12], [-0.45, 1.23, 1.12]], 0.018);
  // marchepied latéral sur la caisse
  k.box(upper, 'trim', [0.42, 0.04, 0.2], [0.85, 0.36, -1.32]);
  k.box(upper, 'black', [0.38, 0.012, 0.16], [0.85, 0.385, -1.32]);

  // ---------------------------------------------------------------- cabine (côté gauche, z−)
  cabin(k, upper, {
    x0: -0.4,
    x1: 1.08,
    y0: 0.72,
    h: 1.42,
    w: 0.9,
    zc: -0.66,
    lean: 0.16,
    roof: 'trim',
    frame: 'trim',
    door: 'left',
    beacon: 'right',
    lights: 2,
    rearLights: 1,
  });
  k.mirror(upper, [1.06, 1.5, -1.1], -1, 0.3);
  k.mirror(upper, [1.06, 1.62, 1.18], 1, 0.12);

  // ---------------------------------------------------------------- flèche
  const boom = k.part('boom', upper, [1.0, 0.56, 0.22]);
  k.joint('boom', boom, 'rz', 0.3);
  const bm = beam2D([0, 0], [2.3, 1.6], [5.1, 0.6], 0.34, 0.23, 0.08);
  k.extrude(boom, 'paint', bm.shape, 0.5, [0, 0, 0], undefined, 0.035, 12);
  k.cylZ(boom, 'trim', 0.2, 0.72, [0, 0, 0], 18);
  k.cylZ(boom, 'steel', 0.09, 0.8, [0, 0, 0], 12);
  k.cylZ(boom, 'trim', 0.17, 0.64, [5.1, 0.6, 0], 18);
  k.cylZ(boom, 'steel', 0.08, 0.72, [5.1, 0.6, 0], 12);
  // phare de flèche
  {
    const p = bm.edge(0.28, 1, 0.06);
    k.lamp(boom, [p.x, p.y, 0], 0.13, 0.35);
  }
  // flexibles le long du dessus de la flèche
  for (const z of [-0.11, 0.11]) {
    const pts: V3[] = [];
    for (const t of [0.04, 0.2, 0.42, 0.6, 0.78, 0.93]) {
      const p = bm.edge(t, 1, 0.05);
      pts.push([p.x, p.y, z]);
    }
    k.hose(boom, 'rubber', pts, 0.028, 48);
  }
  // pattes des vérins de flèche (dessous) et du vérin de balancier (dessus)
  const bc = bm.edge(0.36, -1, -0.04);
  for (const z of [-0.34, 0.34]) k.cylZ(boom, 'trim', 0.09, 0.12, [bc.x, bc.y, z], 12);
  const sc = bm.edge(0.57, 1, 0.08);
  k.box(boom, 'paint', [0.4, 0.22, 0.3], [sc.x, sc.y - 0.05, 0]);

  // ---------------------------------------------------------------- balancier
  const stick = k.part('stick', boom, [5.1, 0.6, 0]);
  k.joint('stick', stick, 'rz', -0.82);
  const T: [number, number] = [-0.42, 0.62];
  const E: [number, number] = [0.16, -2.9];
  const st = beam2D(T, [(T[0] + E[0]) / 2, (T[1] + E[1]) / 2], E, 0.22, 0.15, 0);
  k.extrude(stick, 'paint', st.shape, 0.4, [0, 0, 0], undefined, 0.03, 8);
  k.cylZ(stick, 'trim', 0.15, 0.56, [E[0], E[1], 0], 16);
  k.cylZ(stick, 'steel', 0.07, 0.62, [E[0], E[1], 0], 12);
  for (const z of [-0.09, 0.09]) {
    const pts: V3[] = [];
    for (const t of [0.05, 0.3, 0.55, 0.8]) {
      const p = st.edge(t, 1, 0.04);
      pts.push([p.x, p.y, z]);
    }
    k.hose(stick, 'rubber', pts, 0.024, 32);
  }
  const bb = st.edge(0.22, 1, 0.06);
  const lk = st.edge(0.9, 1, 0.02);

  // ---------------------------------------------------------------- godet
  const bucket = k.part('bucket', stick, [E[0], E[1], 0]);
  k.joint('bucket', bucket, 'rz', 0.75);
  const outer = new THREE.SplineCurve(
    [
      [-0.1, 0.08],
      [-0.5, -0.24],
      [-0.52, -0.78],
      [-0.12, -1.06],
      [0.48, -0.94],
    ].map(([x, y]) => new THREE.Vector2(x, y)),
  ).getPoints(36);
  const inner = outer.map((p, i) => {
    const a = outer[Math.max(0, i - 1)];
    const b = outer[Math.min(outer.length - 1, i + 1)];
    const t = b.clone().sub(a).normalize();
    return p.clone().add(new THREE.Vector2(-t.y, t.x).multiplyScalar(0.06));
  });
  // Godet rétro : ouverture et dents tournées vers la cabine (−x), dos du godet et biellette côté extérieur (+x).
  for (const p of [...outer, ...inner]) p.x = -p.x;
  k.extrude(bucket, 'steelDark', new THREE.Shape([...outer, ...inner.slice().reverse()]), 1.0, [0, 0, 0], undefined, 0, 8);
  const sideShape = new THREE.Shape([...outer, new THREE.Vector2(-0.36, -0.2), new THREE.Vector2(-0.12, 0.12)]);
  for (const z of [0.52, -0.52]) k.extrude(bucket, 'steelDark', sideShape, 0.04, [0, 0, z], undefined, 0, 8);
  k.box(bucket, 'trim', [0.3, 0.26, 0.58], [0.02, 0.02, 0]);
  // lame d'usure et dents
  k.box(bucket, 'steel', [0.08, 0.05, 1.02], [-0.47, -0.93, 0], [0, 0, -0.2]);
  for (let i = 0; i < 5; i++) {
    k.cyl(bucket, 'steel', [0.0, 0.055], 0.22, [-0.6, -0.91, -0.42 + i * 0.21], [0, 0, 1.37], 8);
  }
  for (const z of [-0.53, 0.53]) k.box(bucket, 'steel', [0.24, 0.05, 0.04], [-0.32, -0.9, z], [0, 0, -0.3]);

  // ---------------------------------------------------------------- vérins et biellette
  k.piston(upper, [upper, [1.22, 0.16, 0.56]], [boom, [bc.x, bc.y, 0.34]], 0.13, 0.075);
  k.piston(upper, [upper, [1.22, 0.16, -0.12]], [boom, [bc.x, bc.y, -0.34]], 0.13, 0.075);
  k.piston(boom, [boom, [sc.x, sc.y, 0]], [stick, [T[0] - 0.04, T[1] + 0.04, 0]], 0.12, 0.068);
  k.piston(stick, [stick, [bb.x, bb.y, 0]], [bucket, [0.3, 0.26, 0]], 0.1, 0.058);
  k.link(stick, [stick, [lk.x, lk.y, 0]], [bucket, [0.3, 0.26, 0]], 0.07, 0.5);

  return k.build({
    refWeight: 21,
    minScale: 0.86,
    maxScale: 1.18,
    wake: [
      { pose: { boom: 0.62, stick: -0.55, bucket: 1.15 }, dur: 1.5 },
      { pose: { boom: 0.48, stick: 0.1, bucket: 1.85 }, dur: 1.4 },
      { pose: { swing: 0.45 }, dur: 1.5 },
      { pose: { stick: -0.32, bucket: 0.55 }, dur: 1.1 },
      { pose: { swing: 0, boom: 0.3, stick: -0.82, bucket: 0.75 }, dur: 1.8 },
    ],
    nod: [
      { pose: { bucket: 0.25 }, dur: 0.45 },
      { pose: { bucket: 0.75 }, dur: 0.5 },
    ],
    breathe: { boom: 0.012, stick: -0.01, bucket: -0.012 },
  });
}

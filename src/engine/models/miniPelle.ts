// Mini-pelle (≈ 3 t) : chenilles caoutchouc, lame de remblai, tourelle compacte, flèche déportée,
// arceau (canopy) jusqu'à 2,5 t, cabine vitrée au-delà.
import * as THREE from 'three';
import { Kit, beam2D, roundedRect, type MachineTemplate, type V3 } from './kit';
import { cabin, exhaust, track } from './parts';

export function buildMiniPelle(canopy: boolean): MachineTemplate {
  const k = new Kit(canopy ? 'mini_pelle:canopy' : 'mini_pelle:cab');

  // ---------------------------------------------------------------- train et lame
  const under = k.part('under', 0, [0, 0, 0]);
  const L = 1.95;
  const r = 0.24;
  const cy = 0.27;
  const W = 0.3;
  for (const s of [-1, 1]) track(k, under, { length: L, radius: r, cy, width: W, z: s * 0.62, rubber: true, rollers: 4 });
  k.rbox(under, 'steelDark', [1.2, 0.26, 0.9], 0.05, [0, cy + 0.04, 0]);
  k.cyl(under, 'steelDark', [0.5, 0.52], 0.1, [0, 0.5, 0], undefined, 32);
  // support de lame
  k.box(under, 'steelDark', [0.4, 0.14, 0.7], [0.72, 0.3, 0]);

  const blade = k.part('blade', under, [0.8, 0.32, 0]);
  k.joint('blade', blade, 'rz', 0);
  for (const z of [-0.42, 0.42]) k.rbox(blade, 'paint', [0.62, 0.1, 0.1], 0.03, [0.28, -0.04, z], [0, 0, -0.12]);
  // lame incurvée (profil extrudé sur la largeur)
  const bl = new THREE.Shape();
  bl.moveTo(0.52, -0.3);
  bl.quadraticCurveTo(0.44, 0.0, 0.6, 0.12);
  bl.lineTo(0.66, 0.12);
  bl.quadraticCurveTo(0.52, 0.0, 0.6, -0.3);
  bl.closePath();
  k.extrude(blade, 'paint', bl, 1.6, [0, 0, 0], undefined, 0.01, 10);
  k.box(blade, 'steel', [0.05, 0.05, 1.6], [0.57, -0.29, 0]);
  k.piston(under, [under, [0.62, 0.42, 0]], [blade, [0.42, 0.06, 0]], 0.055, 0.032);

  // ---------------------------------------------------------------- tourelle
  const upper = k.part('upper', 0, [0, 0.55, 0]);
  k.joint('swing', upper, 'ry', 0);
  k.slab(upper, 'paint', roundedRect(-0.86, -0.74, 0.62, 0.74, 0.72, 0.18), 0.5, 0.0, 0.035, 20);
  k.slab(upper, 'trim', roundedRect(-0.88, -0.76, 0.64, 0.76, 0.74, 0.19), 0.05, 0.02, 0.0, 20);
  // capot moteur arrière (côté droit) et grille
  k.rbox(upper, 'paint', [0.62, 0.34, 1.2], 0.08, [-0.5, 0.62, 0.0], undefined, 4);
  k.grille(upper, [-0.82, 0.48, 0.0], 0.5, 0.24, 4, 'x', -1);
  for (let i = 0; i < 4; i++) k.box(upper, 'black', [0.04, 0.015, 0.7], [-0.68 + i * 0.1, 0.795, 0.1]);
  for (const s of [-1, 1]) k.decal(upper, 0.42, 0.105, [-0.35, 0.3, s * 0.75], s > 0 ? 0 : Math.PI);
  k.rbox(upper, 'tail', [0.04, 0.06, 0.12], 0.015, [-0.86, 0.3, 0.45], undefined, 2);
  k.rbox(upper, 'tail', [0.04, 0.06, 0.12], 0.015, [-0.86, 0.3, -0.45], undefined, 2);
  exhaust(k, upper, [-0.55, 0.78, 0.48], 0.22, 0.04);
  // coffre avant droit
  k.rbox(upper, 'paint', [0.6, 0.4, 0.42], 0.06, [0.25, 0.42, 0.48], undefined, 3);

  // poste de conduite (côté gauche)
  cabin(k, upper, {
    x0: -0.48,
    x1: 0.56,
    y0: 0.5,
    h: 1.25,
    w: 0.82,
    zc: -0.18,
    lean: 0.12,
    roof: 'trim',
    frame: 'trim',
    post: canopy ? 0.06 : 0.05,
    door: canopy ? 'none' : 'left',
    beacon: 'right',
    lights: 1,
    canopy,
  });
  if (canopy) {
    // garde-corps bas du poste ouvert
    k.rail(upper, 'trim', [[-0.3, 0.58, 0.24], [-0.3, 0.88, 0.24], [0.3, 0.88, 0.24]], 0.016);
  }
  k.mirror(upper, [0.55, 1.2, -0.6], -1, 0.16, 0.16);

  // ---------------------------------------------------------------- flèche déportée
  const bracket = k.part('bracket', upper, [0.72, 0.22, 0.12]);
  k.rbox(bracket, 'steelDark', [0.26, 0.42, 0.34], 0.04, [0.06, 0.06, 0]);
  k.cylZ(bracket, 'trim', 0.08, 0.38, [0.12, 0.2, 0], 12);
  const boom = k.part('boom', bracket, [0.12, 0.2, 0]);
  k.joint('boom', boom, 'rz', 0.6);
  const bm = beam2D([0, 0], [0.75, 0.5], [1.85, 0.05], 0.13, 0.09, 0.03);
  k.extrude(boom, 'paint', bm.shape, 0.2, [0, 0, 0], undefined, 0.02, 10);
  k.cylZ(boom, 'trim', 0.07, 0.26, [1.85, 0.05, 0], 12);
  {
    const p = bm.edge(0.25, 1, 0.04);
    k.lamp(boom, [p.x, p.y, 0], 0.08, 0.45);
  }
  for (const z of [-0.05, 0.05]) {
    const pts: V3[] = [];
    for (const t of [0.05, 0.3, 0.55, 0.8, 0.95]) {
      const p = bm.edge(t, 1, 0.03);
      pts.push([p.x, p.y, z]);
    }
    k.hose(boom, 'rubber', pts, 0.016, 32);
  }
  const bc = bm.edge(0.42, -1, -0.02);
  const sc = bm.edge(0.55, 1, 0.04);

  const stick = k.part('stick', boom, [1.85, 0.05, 0]);
  k.joint('stick', stick, 'rz', -0.75);
  const T: [number, number] = [-0.2, 0.25];
  const E: [number, number] = [0.06, -1.15];
  const st = beam2D(T, [(T[0] + E[0]) / 2, (T[1] + E[1]) / 2], E, 0.1, 0.07, 0);
  k.extrude(stick, 'paint', st.shape, 0.16, [0, 0, 0], undefined, 0.015, 8);
  k.cylZ(stick, 'trim', 0.06, 0.22, [E[0], E[1], 0], 12);
  const bb = st.edge(0.25, 1, 0.03);
  const lk = st.edge(0.88, 1, 0.01);

  const bucket = k.part('bucket', stick, [E[0], E[1], 0]);
  k.joint('bucket', bucket, 'rz', 1.1);
  const outer = new THREE.SplineCurve(
    [
      [-0.04, 0.03],
      [-0.2, -0.1],
      [-0.21, -0.32],
      [-0.05, -0.43],
      [0.2, -0.38],
    ].map(([x, y]) => new THREE.Vector2(x, y)),
  ).getPoints(24);
  const inner = outer.map((p, i) => {
    const a = outer[Math.max(0, i - 1)];
    const b = outer[Math.min(outer.length - 1, i + 1)];
    const t = b.clone().sub(a).normalize();
    return p.clone().add(new THREE.Vector2(-t.y, t.x).multiplyScalar(0.03));
  });
  k.extrude(bucket, 'steelDark', new THREE.Shape([...outer, ...inner.slice().reverse()]), 0.46, [0, 0, 0], undefined, 0, 6);
  const side = new THREE.Shape([...outer, new THREE.Vector2(0.15, -0.08), new THREE.Vector2(0.05, 0.05)]);
  for (const z of [0.24, -0.24]) k.extrude(bucket, 'steelDark', side, 0.02, [0, 0, z], undefined, 0, 6);
  for (let i = 0; i < 4; i++) k.cyl(bucket, 'steel', [0, 0.025], 0.09, [0.25, -0.37, -0.17 + i * 0.113], [0, 0, -1.37], 6);

  k.piston(bracket, [bracket, [0.2, -0.05, 0]], [boom, [bc.x, bc.y, 0]], 0.065, 0.038);
  k.piston(boom, [boom, [sc.x, sc.y, 0]], [stick, [T[0] - 0.02, T[1] + 0.02, 0]], 0.058, 0.034);
  k.piston(stick, [stick, [bb.x, bb.y, 0]], [bucket, [0.12, 0.1, 0]], 0.048, 0.028);
  k.link(stick, [stick, [lk.x, lk.y, 0]], [bucket, [0.12, 0.1, 0]], 0.035, 0.2);

  return k.build({
    refWeight: 3,
    minScale: 0.8,
    maxScale: 1.4,
    wake: [
      { pose: { blade: 0.22 }, dur: 0.7 },
      { pose: { boom: 0.95, stick: -1.2, bucket: 0.4 }, dur: 1.3 },
      { pose: { swing: -0.6, stick: -0.5 }, dur: 1.4 },
      { pose: { bucket: 1.5, stick: -1.0 }, dur: 1.0 },
      { pose: { swing: 0, boom: 0.6, stick: -0.75, bucket: 1.1, blade: 0 }, dur: 1.6 },
    ],
    nod: [
      { pose: { bucket: 1.55 }, dur: 0.4 },
      { pose: { bucket: 1.1 }, dur: 0.45 },
    ],
    breathe: { boom: 0.012, stick: 0.01 },
  });
}

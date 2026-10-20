// Tractopelle (≈ 8 t, gabarit d'une JCB 3CX ou d'une CAT 432) : grandes roues arrière 18.4-26 sous la cabine,
// petites roues avant 12.5-18 sous le capot plongeant ; chargeur frontal (bras coudés, vérins de levage et de
// cavage, godet de 2,3 m) ; pelle rétro arrière sur potence pivotante (flèche coudée, balancier, godet de
// 0,6 m) repliée pour la route, et deux béquilles télescopiques inclinées.
// Repères : empattement 2,17 m, longueur de route 6,1 m, largeur 2,45 m, toit de cabine à 2,9 m, pelle repliée à 3,8 m.
import * as THREE from 'three';
import { Kit, beam2D, softPolygon, type MachineTemplate, type V3 } from './kit';
import { cabin, exhaust, fender, ladder, wheel } from './parts';

const XR = -0.9; // essieu arrière
const XF = 1.27; // essieu avant (empattement 2,17 m)
const RR = 0.72; // rayon des roues arrière (18.4-26)
const RF = 0.49; // rayon des roues avant (12.5/80-18)
const ZR = 0.9; // demi-voie arrière
const ZF = 0.93; // demi-voie avant
const XK = -1.85; // axe vertical de la potence
const AP = [0.12, 1.82] as const; // articulation des bras du chargeur (tours)
const AB = [1.96, 0.4] as const; // axe du godet du chargeur
const ZA = 0.72; // plan des bras du chargeur
const STAB_TILT = 0.24; // inclinaison des béquilles vers l'extérieur (rad)
// pelle repliée pour la route : flèche relevée (81°), balancier pendant juste derrière, godet entrouvert
const BOOM_UP = 1.42;
const DIPPER_IN = 0.2; // angle absolu du balancier dans le repère de la potence
const BUCKET_IN = -0.55;

/** Godet rétro dans son repère (axe du balancier vers +y, dents vers +x) : coque, flancs, oreilles, dents. */
function hoeBucket(k: Kit, part: number, s: number, width: number): [number, number] {
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
  k.extrude(part, 'steelDark', new THREE.Shape([...outer, ...inner.slice().reverse()]), width, [0, 0, 0], undefined, 0, 8);
  const side = new THREE.Shape([...outer, new THREE.Vector2(0.36 * s, -0.2 * s), new THREE.Vector2(0.12 * s, 0.12 * s)]);
  for (const z of [half + 0.015, -half - 0.015]) k.extrude(part, 'steelDark', side, 0.03, [0, 0, z], undefined, 0, 8);
  const link: [number, number] = [0.3 * s, 0.26 * s];
  const ear = softPolygon(
    [
      [-0.16 * s, -0.1 * s],
      [0.2 * s, -0.16 * s],
      [link[0] + 0.08, link[1] + 0.02],
      [link[0] - 0.03, link[1] + 0.08],
      [-0.12 * s, 0.1 * s],
    ],
    0.035,
  );
  for (const z of [-0.12, 0.12]) k.extrude(part, 'trim', ear, 0.04, [0, 0, z], undefined, 0, 6);
  k.cylZ(part, 'steel', 0.045, 0.36, [0, 0, 0], 10);
  k.cylZ(part, 'steel', 0.04, 0.34, [link[0], link[1], 0], 10);
  k.box(part, 'steel', [0.07, 0.035, width + 0.04], [0.47 * s, -0.94 * s, 0], [0, 0, 0.2]);
  const n = 4;
  for (let i = 0; i < n; i++) {
    const z = -half + 0.07 + (i * (width - 0.14)) / (n - 1);
    k.cyl(part, 'steel', [0.0, 0.035], 0.14, [0.62 * s, -0.9 * s, z], [0, 0, -1.37], 8);
  }
  return link;
}

export function buildTractopelle(): MachineTemplate {
  const k = new Kit('tractopelle');

  // ---------------------------------------------------------------- châssis, ponts et roues
  const body = k.part('body', 0, [0, 0, 0]);
  // longeron (profil latéral : bas à l'avant sous le capot, relevé au-dessus du pont arrière)
  const frame = softPolygon(
    [
      [-1.95, 0.78],
      [-0.3, 0.78],
      [0.3, 0.58],
      [1.98, 0.58],
      [1.98, 0.98],
      [-1.95, 1.16],
    ],
    0.05,
  );
  k.extrude(body, 'trim', frame, 0.76, [0, 0, 0], undefined, 0.02, 6);
  // pont arrière (sous la cabine) et pont avant oscillant
  k.cylZ(body, 'steelDark', 0.12, 2 * ZR - 0.4, [XR, RR, 0], 16);
  k.rbox(body, 'steelDark', [0.46, 0.4, 0.5], 0.12, [XR, RR, 0], undefined, 2);
  k.cylZ(body, 'steelDark', 0.1, 2 * ZF - 0.3, [XF, RF, 0], 14);
  k.rbox(body, 'steelDark', [0.36, 0.3, 0.42], 0.1, [XF, RF + 0.02, 0], undefined, 2);
  for (const s of [-1, 1]) {
    k.cylZ(body, 'steelDark', 0.17, 0.12, [XR, RR, s * (ZR - 0.3)], 16);
    k.cylZ(body, 'steelDark', 0.13, 0.12, [XF, RF, s * (ZF - 0.22)], 14);
    wheel(k, body, [XR, RR, s * ZR], RR, 0.46, { side: s, rim: 'paint', tread: 'lug', rimRatio: 0.58 });
    wheel(k, body, [XF, RF, s * ZF], RF, 0.32, { side: s, rim: 'paint', tread: 'lug', rimRatio: 0.6 });
    fender(k, body, [XR, RR, s * ZR], RR + 0.06, 0.56, 0.22, Math.PI - 0.3, 'paint', 0.05);
    fender(k, body, [XF, RF, s * ZF], RF + 0.06, 0.4, 0.4, Math.PI - 0.5, 'black', 0.035);
    k.rbox(body, 'tail', [0.12, 0.08, 0.16], 0.02, [-1.48, 1.28, s * 1.0], [0, 0, 0.55], 1);
  }

  // capot moteur plongeant, calandre, phares, contrepoids avant
  const hood = softPolygon(
    [
      [0.22, 0.95],
      [1.98, 0.95],
      [2.0, 1.32],
      [1.84, 1.5],
      [0.22, 1.72],
    ],
    0.09,
  );
  k.extrude(body, 'paint', hood, 0.86, [0, 0, 0], undefined, 0.03, 8);
  k.box(body, 'trim', [1.76, 0.05, 0.9], [1.1, 0.96, 0]);
  k.grille(body, [2.03, 1.2, 0], 0.5, 0.3, 5, 'x', 1);
  for (const s of [-1, 1]) {
    k.lamp(body, [2.0, 1.17, s * 0.33], 0.12);
    k.rbox(body, 'amber', [0.04, 0.05, 0.1], 0.015, [2.03, 1.38, s * 0.3], undefined, 1);
    k.grille(body, [1.35, 1.3, s * 0.462], 0.42, 0.24, 4, 'z', s);
    k.decal(body, 0.62, 0.155, [0.85, 1.25, s * 0.462], s > 0 ? 0 : Math.PI);
  }
  k.rbox(body, 'paint', [0.16, 0.34, 0.96], 0.05, [1.93, 0.78, 0], undefined, 2);
  k.box(body, 'black', [0.03, 0.06, 0.8], [2.015, 0.78, 0]);
  exhaust(k, body, [1.45, 1.57, 0.24], 0.42, 0.06);

  // ---------------------------------------------------------------- cabine centrale, marchepied, rétroviseurs
  k.rbox(body, 'trim', [1.62, 0.12, 1.3], 0.03, [-0.58, 1.13, 0], undefined, 1);
  cabin(k, body, {
    x0: -1.38,
    x1: 0.22,
    y0: 1.18,
    h: 1.58,
    w: 1.32,
    zc: 0,
    lean: 0.08,
    leanBack: 0,
    roof: 'paint',
    frame: 'trim',
    door: 'both',
    beacon: 'left',
    lights: 2,
    rearLights: 2,
  });
  k.mirror(body, [0.2, 2.25, -0.66], -1, 0.2);
  k.mirror(body, [0.2, 2.25, 0.66], 1, 0.2);
  ladder(k, body, 0.0, 0.28, 0.42, 1.12, -0.7, 3);
  k.rail(body, 'trim', [[0.12, 1.35, -0.66], [0.12, 1.35, -0.72], [0.12, 2.05, -0.72], [0.12, 2.05, -0.66]], 0.018);
  // tours des bras du chargeur (de part et d'autre du capot, devant la cabine)
  for (const s of [-1, 1]) {
    const tower = softPolygon(
      [
        [-0.12, 0.62],
        [0.5, 0.62],
        [0.3, 1.95],
        [-0.02, 1.95],
      ],
      0.06,
    );
    k.extrude(body, 'paint', tower, 0.1, [0, 0, s * 0.6], undefined, 0.015, 6);
    k.rbox(body, 'trim', [0.12, 0.12, 0.3], 0.02, [0.55, 0.95, s * 0.56], undefined, 1);
  }

  // ---------------------------------------------------------------- chargeur frontal
  const arms = k.part('arms', body, [AP[0], AP[1], 0]);
  k.joint('lift', arms, 'rz', 0);
  const ab: [number, number] = [AB[0] - AP[0], AB[1] - AP[1]];
  const arm = beam2D([0, 0], [1.82, 0.0], ab, 0.13, 0.1, 0.03);
  for (const s of [-1, 1]) {
    k.extrude(arms, 'paint', arm.shape, 0.12, [0, 0, s * ZA], undefined, 0.02, 10);
    k.box(arms, 'trim', [0.14, 0.12, 0.16], [0.35, 0.05, s * 0.62]);
  }
  k.cylZ(arms, 'steel', 0.06, 1.62, [0, 0, 0], 12);
  k.cylZ(arms, 'steel', 0.055, 1.62, [ab[0], ab[1], 0], 12);
  const lc = arm.edge(0.36, -1, -0.02);
  for (const s of [-1, 1]) k.box(arms, 'trim', [0.14, 0.14, 0.12], [lc.x, lc.y, s * ZA]);

  const lb = k.part('bucket', arms, [ab[0], ab[1], 0]);
  k.joint('tilt', lb, 'rz', 0);
  // godet du chargeur (profil donné dans le repère de la machine, puis ramené à l'axe du godet)
  const L = (x: number, y: number): THREE.Vector2 => new THREE.Vector2(x - AB[0], y - AB[1]);
  const outer = new THREE.SplineCurve([L(2.1, 1.0), L(2.05, 0.55), L(2.15, 0.14), L(2.4, 0.03), L(2.94, 0.02)]).getPoints(30);
  const inner = outer.map((p, i) => {
    const a = outer[Math.max(0, i - 1)];
    const b = outer[Math.min(outer.length - 1, i + 1)];
    const t = b.clone().sub(a).normalize();
    return p.clone().add(new THREE.Vector2(-t.y, t.x).multiplyScalar(0.045));
  });
  const BW = 2.3;
  k.extrude(lb, 'paint', new THREE.Shape([...outer, ...inner.slice().reverse()]), BW, [0, 0, 0], undefined, 0, 8);
  const lside = new THREE.Shape([...outer, L(2.88, 0.16), L(2.3, 1.0)]);
  for (const z of [BW / 2 + 0.015, -BW / 2 - 0.015]) k.extrude(lb, 'paint', lside, 0.03, [0, 0, z], undefined, 0.006, 8);
  k.box(lb, 'paint', [0.32, 0.07, BW], [L(2.22, 1.0).x, L(2.22, 1.0).y, 0]);
  k.box(lb, 'steel', [0.2, 0.035, BW + 0.04], [L(2.88, 0.03).x, L(2.88, 0.03).y, 0], [0, 0, 0.02]);
  // pattes : articulation des bras (bas) et des vérins de cavage (haut)
  const tiltAt = L(2.02, 0.9);
  for (const s of [-1, 1]) {
    k.box(lb, 'trim', [0.2, 0.3, 0.08], [L(1.94, 0.46).x, L(1.94, 0.46).y, s * ZA]);
    k.box(lb, 'trim', [0.14, 0.16, 0.08], [tiltAt.x - 0.01, tiltAt.y, s * 0.56]);
  }
  // vérins de levage (sous les bras) et de cavage (côté intérieur des bras)
  for (const s of [-1, 1]) {
    k.piston(body, [body, [0.55, 0.95, s * ZA]], [arms, [lc.x, lc.y, s * ZA]], 0.085, 0.05);
    k.piston(arms, [arms, [0.35, 0.05, s * 0.56]], [lb, [tiltAt.x, tiltAt.y, s * 0.56]], 0.075, 0.045);
  }

  // ---------------------------------------------------------------- bâti arrière et béquilles télescopiques
  k.rbox(body, 'trim', [0.22, 0.86, 1.18], 0.04, [-1.61, 1.05, 0], undefined, 1);
  for (const s of [-1, 1]) {
    const mount = k.part(s < 0 ? 'stabMountL' : 'stabMountR', body, [-1.8, 1.48, s * 0.64], [-s * STAB_TILT, 0, 0]);
    k.rbox(mount, 'paint', [0.22, 1.0, 0.22], 0.03, [0, -0.5, 0], undefined, 1);
    k.cyl(mount, 'trim', 0.06, 0.12, [0, 0.05, 0], undefined, 10);
    k.box(mount, 'black', [0.235, 0.05, 0.235], [0, -0.96, 0]);
    const leg = k.part(s < 0 ? 'stabL' : 'stabR', mount, [0, 0, 0]);
    k.joint('stab', leg, 'ty', 0);
    k.box(leg, 'steelDark', [0.16, 0.8, 0.16], [0, -0.66, 0]);
    k.rbox(leg, 'steelDark', [0.46, 0.06, 0.4], 0.02, [0, -1.13, 0], [s * STAB_TILT, 0, 0], 1);
    k.box(leg, 'trim', [0.18, 0.1, 0.18], [0, -1.07, 0], [s * STAB_TILT, 0, 0]);
  }

  // ---------------------------------------------------------------- pelle rétro (potence, flèche, balancier, godet)
  // Repère de la potence tourné d'un demi-tour : x vers l'arrière de la machine (pelle « vers l'avant »).
  const swing = k.part('swing', body, [XK, 0, 0], [0, Math.PI, 0]);
  k.joint('slew', swing, 'ry', 0);
  k.cyl(swing, 'steelDark', 0.12, 0.2, [0, 0.8, 0], undefined, 14);
  k.cyl(swing, 'steelDark', 0.12, 0.2, [0, 1.42, 0], undefined, 14);
  const potence = softPolygon(
    [
      [-0.08, 0.6],
      [0.62, 0.5],
      [0.56, 0.86],
      [0.4, 1.24],
      [0.06, 1.5],
      [-0.08, 1.42],
    ],
    0.06,
  );
  for (const z of [-0.17, 0.17]) k.extrude(swing, 'paint', potence, 0.06, [0, 0, z], undefined, 0.01, 6);
  k.rbox(swing, 'paint', [0.4, 0.5, 0.3], 0.04, [0.12, 1.1, 0], undefined, 1);
  // vérins d'orientation (du bâti vers les pattes avant de la potence)
  for (const s of [-1, 1]) {
    k.box(swing, 'trim', [0.12, 0.12, 0.12], [-0.12, 1.08, s * 0.24]);
    k.box(body, 'trim', [0.12, 0.12, 0.14], [-1.38, 1.08, s * 0.45]);
    k.piston(body, [body, [-1.38, 1.08, s * 0.5]], [swing, [-0.12, 1.08, -s * 0.24]], 0.06, 0.035);
  }

  const F: [number, number] = [0.2, 1.0];
  const boom = k.part('boom', swing, [F[0], F[1], 0], [0, 0, BOOM_UP]);
  k.joint('hoe', boom, 'rz', 0);
  const BT: [number, number] = [2.4, 0.14];
  const bm = beam2D([0, 0], [1.08, 0.66], BT, 0.17, 0.12, 0.05);
  k.extrude(boom, 'paint', bm.shape, 0.3, [0, 0, 0], undefined, 0.025, 12);
  k.cylZ(boom, 'trim', 0.15, 0.4, [0, 0, 0], 16);
  k.cylZ(boom, 'steel', 0.06, 0.46, [0, 0, 0], 12);
  k.cylZ(boom, 'trim', 0.12, 0.34, [BT[0], BT[1], 0], 16);
  k.cylZ(boom, 'steel', 0.055, 0.4, [BT[0], BT[1], 0], 12);
  const bl = bm.edge(0.4, -1, -0.02);
  k.box(boom, 'trim', [0.16, 0.12, 0.2], [bl.x, bl.y + 0.03, 0], [0, 0, -0.2]);
  const dl = bm.edge(0.45, 1, 0.12);
  k.box(boom, 'trim', [0.2, 0.16, 0.18], [dl.x, dl.y - 0.07, 0], [0, 0, -0.1]);
  for (const z of [-0.08, 0.08]) {
    const pts: V3[] = [];
    for (const t of [0.05, 0.3, 0.6, 0.85, 0.97]) {
      const p = bm.edge(t, 1, 0.02);
      pts.push([p.x, p.y, z]);
    }
    k.hose(boom, 'rubber', pts, 0.018, 18);
  }

  const dipper = k.part('dipper', boom, [BT[0], BT[1], 0], [0, 0, DIPPER_IN - BOOM_UP]);
  k.joint('dipper', dipper, 'rz', 0);
  const T: [number, number] = [-0.2, 0.3];
  const E: [number, number] = [0.1, -2.1];
  const st = beam2D(T, [(T[0] + E[0]) / 2, (T[1] + E[1]) / 2], E, 0.14, 0.09, 0);
  k.extrude(dipper, 'paint', st.shape, 0.24, [0, 0, 0], undefined, 0.02, 8);
  k.cylZ(dipper, 'steel', 0.05, 0.3, [T[0], T[1], 0], 10);
  k.cylZ(dipper, 'trim', 0.09, 0.3, [E[0], E[1], 0], 12);
  const bb = st.edge(0.16, 1, 0.04);
  const lk = st.edge(0.86, 1, 0.01);

  const bucket = k.part('hbucket', dipper, [E[0], E[1], 0], [0, 0, BUCKET_IN]);
  k.joint('hbucket', bucket, 'rz', 0);
  const link = hoeBucket(k, bucket, 0.6, 0.6);

  k.piston(swing, [swing, [0.5, 0.58, 0]], [boom, [bl.x, bl.y, 0]], 0.09, 0.055);
  k.piston(boom, [boom, [dl.x, dl.y, 0]], [dipper, [T[0], T[1], 0]], 0.08, 0.048);
  k.piston(dipper, [dipper, [bb.x, bb.y, 0]], [bucket, [link[0], link[1], 0]], 0.065, 0.04);
  k.link(dipper, [dipper, [lk.x, lk.y, 0]], [bucket, [link[0], link[1], 0]], 0.05, 0.3);

  return k.build({
    refWeight: 8,
    minScale: 0.85,
    maxScale: 1.25,
    wake: [
      { pose: { stab: -0.34 }, dur: 1.2 },
      { pose: { hoe: -0.8, dipper: 0.87, hbucket: 1.25 }, dur: 1.7 },
      { pose: { slew: -0.5, hoe: -0.6, dipper: 0.45, hbucket: 0.2 }, dur: 1.5 },
      { pose: { slew: 0, hoe: 0, dipper: 0, hbucket: 0, lift: 0.55, tilt: 0.45 }, dur: 1.8 },
      { pose: { lift: 0, tilt: 0, stab: 0 }, dur: 1.5 },
    ],
    nod: [
      { pose: { tilt: 0.25 }, dur: 0.45 },
      { pose: { tilt: 0 }, dur: 0.5 },
    ],
    breathe: { lift: 0.006, hoe: 0.006 },
  });
}

// Dumper : tombereau articulé (≥ 15 t, benne arrière basculante, bogie à deux essieux) ou dumper de chantier
// (< 15 t, benne avant basculante, arceau de protection).
import { Kit, roundedRect, softPolygon, type MachineTemplate } from './kit';
import { cabin, exhaust, fender, ladder, wheel } from './parts';

/** Benne : plancher, flancs extrudés, nervures, rebords arrondis. Profil latéral donné dans le repère de la benne. */
function dumpBody(
  k: Kit,
  part: number,
  side: [number, number][],
  width: number,
  ribs: number[],
  floorY: (x: number) => number,
  x0: number,
  x1: number,
): void {
  const half = width / 2;
  // flancs (paroi peinte d'épaisseur 0.06)
  for (const s of [-1, 1]) k.extrude(part, 'paint', softPolygon(side, 0.08), 0.06, [0, 0, s * (half - 0.03)], undefined, 0.01, 8);
  // plancher (acier sombre, usé) : bandes inclinées suivant floorY
  const n = 6;
  for (let i = 0; i < n; i++) {
    const xa = x0 + ((x1 - x0) * i) / n;
    const xb = x0 + ((x1 - x0) * (i + 1)) / n;
    const ya = floorY(xa);
    const yb = floorY(xb);
    const len = Math.hypot(xb - xa, yb - ya);
    k.box(part, 'steelDark', [len + 0.02, 0.06, width - 0.08], [(xa + xb) / 2, (ya + yb) / 2, 0], [0, 0, Math.atan2(yb - ya, xb - xa)]);
    // dessous peint
    k.box(part, 'paint', [len + 0.02, 0.04, width - 0.02], [(xa + xb) / 2, (ya + yb) / 2 - 0.05, 0], [0, 0, Math.atan2(yb - ya, xb - xa)]);
  }
  // nervures verticales à l'extérieur des flancs
  for (const x of ribs) {
    const yb = floorY(x) - 0.04;
    let yt = yb;
    // sommet du flanc à cette abscisse (approximé par le point le plus haut du profil à gauche/droite)
    for (let i = 0; i < side.length; i++) {
      const [ax, ay] = side[i];
      const [bx, by] = side[(i + 1) % side.length];
      if ((ax - x) * (bx - x) <= 0 && ax !== bx) {
        const y = ay + ((x - ax) / (bx - ax)) * (by - ay);
        if (y > yt) yt = y;
      }
    }
    for (const s of [-1, 1]) k.rbox(part, 'paint', [0.1, yt - yb - 0.08, 0.08], 0.02, [x, (yb + yt) / 2 - 0.04, s * (half + 0.03)], undefined, 2);
  }
}

function buildHauler(): MachineTemplate {
  const k = new Kit('dumper:tombereau');
  const R = 0.82;
  const TW = 0.62;
  const ZW = 1.12;

  // ---------------------------------------------------------------- tracteur avant
  const tractor = k.part('tractor', 0, [0, 0, 0]);
  k.rbox(tractor, 'trim', [3.2, 0.5, 1.1], 0.06, [2.6, 1.0, 0]);
  k.cylZ(tractor, 'steelDark', 0.16, 2 * ZW - 0.2, [3.1, R, 0], 16);
  for (const s of [-1, 1]) wheel(k, tractor, [3.1, R, s * ZW], R, TW, { side: s, rim: 'paint', tread: 'lug' });
  for (const s of [-1, 1]) fender(k, tractor, [3.1, R, s * ZW], R + 0.06, TW + 0.14, 0.15, Math.PI - 0.1, 'paint', 0.05);
  // capot moteur avant (nez incliné)
  const hood = softPolygon(
    [
      [2.5, 1.2],
      [4.3, 1.2],
      [4.36, 1.62],
      [4.08, 1.94],
      [2.5, 2.06],
    ],
    0.12,
  );
  k.extrude(tractor, 'paint', hood, 1.7, [0, 0, 0], undefined, 0.04, 10);
  k.grille(tractor, [4.37, 1.42, 0], 1.2, 0.34, 5, 'x', 1);
  k.box(tractor, 'trim', [0.25, 0.3, 2.3], [4.42, 1.0, 0]);
  for (const s of [-1, 1]) {
    k.lamp(tractor, [4.3, 1.78, s * 0.68], 0.13);
    k.rbox(tractor, 'amber', [0.04, 0.06, 0.12], 0.01, [4.55, 1.12, s * 1.05], undefined, 2);
  }
  for (const s of [-1, 1]) k.decal(tractor, 0.7, 0.175, [3.35, 1.62, s * 0.852], s > 0 ? 0 : Math.PI);
  exhaust(k, tractor, [2.75, 2.04, 0.62], 0.55, 0.075);
  cabin(k, tractor, {
    x0: 1.15,
    x1: 2.55,
    y0: 1.62,
    h: 1.5,
    w: 1.55,
    zc: 0,
    lean: 0.12,
    leanBack: 0.05,
    roof: 'paint',
    frame: 'trim',
    door: 'left',
    beacon: 'right',
    lights: 2,
    rearLights: 1,
  });
  k.mirror(tractor, [2.52, 2.5, -0.78], -1, 0.32);
  k.mirror(tractor, [2.52, 2.5, 0.78], 1, 0.32);
  ladder(k, tractor, 1.8, 2.15, 0.5, 1.58, -0.86, 4);

  // ---------------------------------------------------------------- remorque (articulée)
  const trailer = k.part('trailer', 0, [0.95, 0, 0]);
  k.joint('steer', trailer, 'ry', 0);
  k.cyl(trailer, 'steelDark', 0.2, 0.8, [0, 1.0, 0], undefined, 18);
  k.rbox(trailer, 'trim', [4.2, 0.48, 1.0], 0.06, [-2.05, 0.95, 0]);
  for (const x of [-1.95, -3.6]) {
    k.cylZ(trailer, 'steelDark', 0.15, 2 * ZW - 0.2, [x, R, 0], 16);
    for (const s of [-1, 1]) wheel(k, trailer, [x, R, s * ZW], R, TW, { side: s, rim: 'paint', tread: 'lug' });
  }
  // balancier du bogie et garde-boue arrière
  for (const s of [-1, 1]) {
    k.rbox(trailer, 'steelDark', [2.0, 0.3, 0.2], 0.04, [-2.78, R + 0.05, s * 0.66]);
    k.rbox(trailer, 'black', [2.9, 0.05, TW + 0.2], 0.02, [-2.78, 1.69, s * ZW]);
  }

  // ---------------------------------------------------------------- benne (basculement arrière)
  const body = k.part('body', trailer, [-4.55, 1.85, 0]);
  k.joint('tip', body, 'rz', 0);
  // flanc : queue relevée à l'arrière, bord supérieur montant vers l'avant
  const side: [number, number][] = [
    [-0.3, 0.55],
    [0.5, -0.05],
    [4.45, -0.05],
    [4.55, 1.46],
    [1.2, 1.3],
    [-0.3, 1.0],
  ];
  const floorY = (x: number) => (x < 0.5 ? (0.5 - x) * 0.72 : 0.0);
  dumpBody(k, body, side, 2.62, [1.3, 2.2, 3.1, 3.9], floorY, -0.3, 4.45);
  // paroi avant et auvent de protection au-dessus de l'articulation
  k.rbox(body, 'paint', [0.1, 1.54, 2.62], 0.03, [4.5, 0.72, 0]);
  k.rbox(body, 'paint', [0.62, 0.08, 2.5], 0.03, [4.78, 1.5, 0]);
  k.rbox(body, 'paint', [0.06, 0.24, 2.5], 0.02, [5.07, 1.4, 0]);
  // rebords supérieurs arrondis
  for (const s of [-1, 1]) k.cylX(body, 'paint', 0.05, 3.3, [2.88, 1.38, s * 1.31], 10);
  // charnière arrière
  k.cylZ(body, 'steel', 0.08, 1.4, [0.2, -0.1, 0], 12);

  // vérins de basculement
  for (const s of [-1, 1]) k.piston(trailer, [trailer, [-0.4, 0.75, s * 0.62]], [body, [2.6, -0.06, s * 0.62]], 0.13, 0.08);

  return k.build({
    refWeight: 28,
    minScale: 0.85,
    maxScale: 1.15,
    wake: [
      { pose: { tip: 0.55 }, dur: 2.2 },
      { pose: { tip: 0.6 }, dur: 0.6 },
      { pose: { steer: 0.22 }, dur: 1.1 },
      { pose: { tip: 0, steer: 0 }, dur: 2.0 },
    ],
    nod: [
      { pose: { tip: 0.08 }, dur: 0.5 },
      { pose: { tip: 0 }, dur: 0.5 },
    ],
    breathe: { steer: 0.006 },
  });
}

function buildSiteDumper(): MachineTemplate {
  const k = new Kit('dumper:chantier');
  const R = 0.6;
  const TW = 0.46;
  const ZW = 0.8;

  // ---------------------------------------------------------------- châssis avant et benne
  const front = k.part('front', 0, [0, 0, 0]);
  k.rbox(front, 'trim', [1.5, 0.4, 0.9], 0.05, [1.05, 0.85, 0]);
  k.cylZ(front, 'steelDark', 0.13, 2 * ZW - 0.2, [1.2, R, 0], 14);
  for (const s of [-1, 1]) wheel(k, front, [1.2, R, s * ZW], R, TW, { side: s, rim: 'paint', tread: 'lug' });
  for (const s of [-1, 1]) k.lamp(front, [1.86, 1.02, s * 0.42], 0.1);

  const skip = k.part('skip', front, [1.95, 1.3, 0]);
  k.joint('tip', skip, 'rz', 0);
  const side: [number, number][] = [
    [0.08, 0.02],
    [-0.15, 1.05],
    [-1.75, 1.25],
    [-1.75, 0.55],
    [-1.25, 0.08],
  ];
  const floorY = (x: number) => (x > -1.25 ? 0.05 + (x + 1.25) * 0.0 : 0.05 + (-1.25 - x) * 0.94);
  dumpBody(k, skip, side, 1.9, [-1.45, -0.75], floorY, -1.75, 0.0);
  k.rbox(skip, 'paint', [0.08, 0.75, 1.9], 0.03, [-1.72, 0.9, 0]);
  for (const s of [-1, 1]) k.cylX(skip, 'paint', 0.04, 1.62, [-0.94, 1.16, s * 0.96], 10);
  k.cylZ(skip, 'steel', 0.06, 1.0, [0, 0, 0], 10);

  // ---------------------------------------------------------------- arrière articulé : moteur, poste de conduite
  const rear = k.part('rear', 0, [0.15, 0, 0]);
  k.joint('steer', rear, 'ry', 0);
  k.cyl(rear, 'steelDark', 0.14, 0.6, [0, 0.95, 0], undefined, 16);
  k.rbox(rear, 'trim', [2.0, 0.4, 0.9], 0.05, [-1.0, 0.85, 0]);
  k.cylZ(rear, 'steelDark', 0.13, 2 * ZW - 0.2, [-1.35, R, 0], 14);
  for (const s of [-1, 1]) wheel(k, rear, [-1.35, R, s * ZW], R, TW, { side: s, rim: 'paint', tread: 'lug' });
  for (const s of [-1, 1]) fender(k, rear, [-1.35, R, s * ZW], R + 0.05, TW + 0.12, 0.2, Math.PI - 0.2, 'paint', 0.045);
  k.slab(rear, 'paint', roundedRect(-2.15, -0.66, -0.75, 0.66, 0.2, 0.08), 0.62, 1.0, 0.035, 12);
  k.grille(rear, [-2.17, 1.3, 0], 0.8, 0.36, 4, 'x', -1);
  for (const s of [-1, 1]) {
    k.decal(rear, 0.5, 0.125, [-1.45, 1.32, s * 0.662], s > 0 ? 0 : Math.PI);
    k.rbox(rear, 'tail', [0.04, 0.08, 0.14], 0.015, [-2.17, 1.15, s * 0.5], undefined, 2);
  }
  exhaust(k, rear, [-1.0, 1.6, 0.46], 0.3, 0.05);
  // poste de conduite : plancher, siège, volant
  k.rbox(rear, 'trim', [0.9, 0.08, 1.2], 0.03, [-0.3, 1.05, 0]);
  k.rbox(rear, 'interior', [0.42, 0.12, 0.44], 0.04, [-0.45, 1.45, 0]);
  k.rbox(rear, 'interior', [0.1, 0.55, 0.44], 0.04, [-0.66, 1.72, 0], [0, 0, -0.12]);
  k.box(rear, 'trim', [0.24, 0.32, 0.32], [-0.45, 1.25, 0]);
  k.cyl(rear, 'trim', 0.03, 0.5, [0.0, 1.35, 0], [0, 0, 0.5], 8);
  k.torus(rear, 'black', 0.17, 0.018, [0.1, 1.58, 0], [0, Math.PI / 2, -0.6], [6, 24]);
  k.rbox(rear, 'trim', [0.12, 0.42, 0.7], 0.03, [0.12, 1.28, 0]);
  // arceau de protection (ROPS)
  for (const s of [-1, 1]) k.rbox(rear, 'paint', [0.1, 1.6, 0.1], 0.03, [-0.78, 1.85, s * 0.6]);
  k.rbox(rear, 'paint', [0.12, 0.1, 1.32], 0.03, [-0.78, 2.66, 0]);
  k.beacon(rear, [-0.78, 2.71, 0.4]);
  k.lamp(rear, [-0.7, 2.62, -0.4], 0.09);

  return k.build({
    refWeight: 6,
    minScale: 0.85,
    maxScale: 1.35,
    wake: [
      { pose: { tip: -0.85 }, dur: 1.8 },
      { pose: { tip: -0.95 }, dur: 0.5 },
      { pose: { tip: 0, steer: 0.25 }, dur: 1.6 },
      { pose: { steer: 0 }, dur: 1.0 },
    ],
    nod: [
      { pose: { tip: -0.12 }, dur: 0.45 },
      { pose: { tip: 0 }, dur: 0.5 },
    ],
    breathe: { steer: 0.008 },
  });
}

export function buildDumper(articulated: boolean): MachineTemplate {
  return articulated ? buildHauler() : buildSiteDumper();
}

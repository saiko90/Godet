// Groupe électrogène mobile 60 kVA sur remorque routière à un essieu (≈ 1,9 t, classe Atlas Copco QAS 60 /
// Kaeser) : capot insonorisé à portes et ouïes, anneau de levage et échappement sur le toit, tableau de commande
// et prises à l'arrière, châssis-réservoir, essieu à bras oscillants et garde-boue, timon en V à frein à
// inertie, anneau d'attelage et roue jockey. Le réveil ouvre la grande porte gauche sur le moteur qui tourne.
// Encombrement ≈ 3,9 × 1,7 × 2,1 m ; présenté agrandi dans le hall (échelle minimale > 1).
import { Kit, type MachineTemplate } from './kit';
import { exhaust, fender, tire, wheel } from './parts';

// ------------------------------------------------------------------ remorque à un essieu (partagée)

export interface TrailerOpts {
  /** Essieu : abscisse, rayon et largeur des roues, demi-voie (axe des roues). */
  axleX: number;
  r: number;
  tire: number;
  track: number;
  /** Dessous du châssis et demi-largeur des longerons. */
  frameY: number;
  frameZ: number;
  /** Avant du châssis (pied du timon) et arrière (feux). */
  frontX: number;
  rearX: number;
  /** Anneau d'attelage (abscisse) ; il est à la hauteur du dessous du châssis. */
  eyeX: number;
}

/**
 * Train d'une remorque routière à un essieu, machine stationnée : essieu à bras oscillants, roues, garde-boue,
 * timon en V galvanisé à tête de frein à inertie et anneau d'attelage, roue jockey baissée, béquilles et
 * feux arrière. Repère de la machine (avant = timon vers +x).
 */
export function trailerGear(k: Kit, part: number, o: TrailerOpts): void {
  const { axleX: ax, r, tire: tw, track: zw, frameY: fy, frameZ: fz } = o;
  // essieu à bras oscillants sous le châssis
  const beamY = fy - 0.07;
  k.box(part, 'steelDark', [0.1, 0.1, 2 * zw - tw - 0.12], [ax + 0.16, beamY, 0]);
  for (const s of [-1, 1]) {
    k.box(part, 'steelDark', [0.14, 0.08, 0.08], [ax + 0.16, fy - 0.01, s * (fz - 0.12)]);
    const zi = s * (zw - tw / 2 - 0.05);
    const dx = -0.16;
    const dy = r - beamY;
    k.box(part, 'steelDark', [Math.hypot(dx, dy) + 0.08, 0.07, 0.07], [ax + 0.08, (beamY + r) / 2, zi], [0, 0, Math.atan2(dy, dx)]);
    k.cylZ(part, 'steelDark', 0.07, 0.08, [ax, r, s * (zw - tw / 2 - 0.02)], 14);
    wheel(k, part, [ax, r, s * zw], r, tw, { side: s, rim: 'steel', tread: 'road', rimRatio: 0.6 });
    // garde-boue et ses deux pattes fixées au longeron
    const rf = r + 0.06;
    fender(k, part, [ax, r, s * zw], rf, tw + 0.08, 0.14, Math.PI - 0.14, 'trim', 0.025);
    const yb = fy + 0.05;
    const xb = Math.sqrt(Math.max(0, rf * rf - (yb - r) * (yb - r)));
    for (const sx of [-1, 1]) k.box(part, 'trim', [0.05, 0.04, zw - fz], [ax + sx * xb, yb, (s * (fz + zw)) / 2]);
  }
  // timon en V (tubes horizontaux) jusqu'à la tête d'attelage
  const headX = o.eyeX - 0.62;
  for (const s of [-1, 1]) {
    const z0 = s * (fz - 0.08);
    const z1 = s * 0.07;
    const dx = headX - o.frontX;
    const len = Math.hypot(dx, z1 - z0);
    k.box(part, 'steel', [len + 0.06, 0.08, 0.07], [(o.frontX + headX) / 2, fy, (z0 + z1) / 2], [0, -Math.atan2(z1 - z0, dx), 0]);
  }
  k.box(part, 'steel', [0.12, 0.1, 2 * fz - 0.1], [o.frontX + 0.03, fy, 0]);
  // tête de frein à inertie : carter, soufflet, tige, anneau ; levier de frein à main
  k.rbox(part, 'steel', [0.5, 0.13, 0.15], 0.02, [o.eyeX - 0.37, fy, 0], undefined, 2);
  k.cylX(part, 'rubber', 0.055, 0.1, [o.eyeX - 0.07, fy, 0], 12);
  k.cylX(part, 'steel', 0.03, 0.14, [o.eyeX + 0.03, fy, 0], 10);
  k.torus(part, 'steel', 0.05, 0.017, [o.eyeX + 0.14, fy, 0], [Math.PI / 2, 0, 0], [8, 18]);
  k.box(part, 'black', [0.34, 0.035, 0.035], [o.eyeX - 0.42, fy + 0.13, 0.09], [0, 0, 0.32]);
  k.box(part, 'black', [0.06, 0.08, 0.04], [o.eyeX - 0.56, fy + 0.06, 0.09]);
  // roue jockey baissée (machine stationnée) : collier, tube, manivelle, fourche et roue
  const jx = headX - 0.12;
  const jz = 0.2;
  const jy0 = 0.28;
  const jy1 = fy + 0.26;
  k.box(part, 'steelDark', [0.11, 0.11, 0.18], [jx, fy, jz - 0.05]);
  k.cyl(part, 'steel', 0.035, jy1 - jy0, [jx, (jy0 + jy1) / 2, jz], undefined, 12);
  k.cyl(part, 'black', 0.045, 0.06, [jx, jy1 + 0.03, jz], undefined, 12);
  k.box(part, 'black', [0.14, 0.02, 0.02], [jx + 0.06, jy1 + 0.07, jz]);
  k.cyl(part, 'black', 0.015, 0.07, [jx + 0.12, jy1 + 0.1, jz], undefined, 8);
  k.box(part, 'steelDark', [0.05, 0.12, 0.1], [jx, 0.24, jz]);
  for (const s of [-1, 1]) k.box(part, 'steelDark', [0.05, 0.1, 0.012], [jx, 0.16, jz + s * 0.045]);
  tire(k, part, [jx, 0.1, jz], 0.1, 0.07, 'smooth');
  k.cylZ(part, 'steel', 0.04, 0.1, [jx, 0.1, jz], 10);
  // câble électrique de la remorque, fiche accrochée près de la tête
  k.hose(part, 'black', [[o.frontX, fy + 0.07, -fz + 0.15], [o.frontX + 0.45, fy + 0.07, -0.3], [headX, fy + 0.08, -0.12], [o.eyeX - 0.3, fy - 0.02, -0.11]], 0.012, 20);
  k.cyl(part, 'black', 0.028, 0.08, [o.eyeX - 0.3, fy - 0.07, -0.11], undefined, 10);
  // béquilles arrière posées au sol
  for (const s of [-1, 1]) {
    k.cyl(part, 'steel', 0.03, fy - 0.02, [o.rearX + 0.14, (fy - 0.02) / 2 + 0.02, s * (fz - 0.12)], undefined, 10);
    k.box(part, 'steelDark', [0.13, 0.02, 0.13], [o.rearX + 0.14, 0.01, s * (fz - 0.12)]);
  }
  // feux arrière : rampe, feux rouges, clignotants, catadioptres
  k.box(part, 'trim', [0.06, 0.1, 2 * fz + 0.12], [o.rearX, fy + 0.02, 0]);
  for (const s of [-1, 1]) {
    k.rbox(part, 'tail', [0.04, 0.08, 0.15], 0.015, [o.rearX - 0.04, fy + 0.03, s * (fz - 0.06)], undefined, 2);
    k.rbox(part, 'amber', [0.04, 0.06, 0.07], 0.012, [o.rearX - 0.04, fy + 0.03, s * (fz - 0.2)], undefined, 2);
    k.rbox(part, 'tail', [0.015, 0.05, 0.1], 0.01, [o.rearX - 0.035, fy - 0.07, s * (fz - 0.08)], undefined, 1);
  }
}

// ------------------------------------------------------------------ groupe électrogène

const R = 0.32; // rayon des roues (185 R 14)
const AX = -0.12; // essieu, sous le centre de gravité
// châssis-réservoir
const FY0 = 0.5;
const FY1 = 0.68;
const FX0 = -1.3;
const FX1 = 1.22;
const FZ = 0.56;
// capot insonorisé
const CX0 = -1.25;
const CX1 = 1.16;
const CY1 = 1.9;
const CZ = 0.55;
// baie de la grande porte (côté gauche, z−)
const DX0 = -0.72;
const DX1 = 0.36;
const DY0 = 0.77;
const DY1 = 1.8;

export function buildGroupeElectrogene(): MachineTemplate {
  const k = new Kit('groupe_electrogene');
  const body = k.part('body', 0, [0, 0, 0]);

  // ---------------------------------------------------------------- remorque et châssis-réservoir
  trailerGear(k, body, { axleX: AX, r: R, tire: 0.19, track: 0.72, frameY: FY0, frameZ: FZ, frontX: FX1, rearX: FX0, eyeX: 2.36 });
  k.rbox(body, 'trim', [FX1 - FX0, FY1 - FY0, 2 * FZ], 0.03, [(FX0 + FX1) / 2, (FY0 + FY1) / 2, 0], undefined, 2);
  // passages de fourches et bouchon du réservoir
  for (const s of [-1, 1]) {
    for (const x of [-0.75, 0.55]) k.box(body, 'black', [0.3, 0.09, 0.012], [x, (FY0 + FY1) / 2, s * (FZ + 0.002)]);
  }
  k.cyl(body, 'steel', 0.05, 0.05, [0.95, FY1 - 0.04, FZ + 0.02], [Math.PI / 2, 0, 0], 14);

  // ---------------------------------------------------------------- capot : blocs arrière et avant, toit, flanc droit
  const H = CY1 - FY1;
  const midY = (FY1 + CY1) / 2;
  k.rbox(body, 'paint', [DX0 - CX0, H, 2 * CZ], 0.04, [(CX0 + DX0) / 2, midY, 0], undefined, 3);
  k.rbox(body, 'paint', [CX1 - DX1, H, 2 * CZ], 0.04, [(DX1 + CX1) / 2, midY, 0], undefined, 3);
  const bw = DX1 - DX0 + 0.04;
  const bx = (DX0 + DX1) / 2;
  k.rbox(body, 'paint', [bw, CY1 - DY1, 2 * CZ], 0.03, [bx, (DY1 + CY1) / 2, 0], undefined, 2);
  k.box(body, 'paint', [bw, DY0 - FY1, 0.05], [bx, (FY1 + DY0) / 2, -CZ + 0.025]);
  k.box(body, 'paint', [bw, DY1 - FY1, 0.05], [bx, (FY1 + DY1) / 2, CZ - 0.025]);
  // bandeau graphite en pied de capot
  k.box(body, 'trim', [CX1 - CX0 + 0.01, 0.05, 2 * CZ + 0.01], [(CX0 + CX1) / 2, FY1 + 0.025, 0]);
  // compartiment moteur : parois intérieures insonorisées (noires)
  const iw = DX1 - DX0;
  k.box(body, 'black', [iw, DY1 - FY1 - 0.04, 0.01], [bx, (FY1 + DY1) / 2, CZ - 0.055]);
  k.box(body, 'black', [iw, 0.01, 2 * CZ - 0.1], [bx, DY1 - 0.005, 0]);
  k.box(body, 'black', [iw, 0.01, 2 * CZ - 0.1], [bx, FY1 + 0.005, 0]);
  for (const x of [DX0 + 0.004, DX1 - 0.004]) k.box(body, 'black', [0.01, H - 0.08, 2 * CZ - 0.1], [x, midY, 0]);
  // charnières de la porte
  for (const y of [DY0 + 0.2, DY1 - 0.2]) k.cyl(body, 'steel', 0.016, 0.09, [DX0, y, -CZ - 0.01], undefined, 8);

  // flanc droit : portes fixes (joints, poignées, ouïes), plaques du code de chaque côté
  k.box(body, 'black', [0.012, DY1 - DY0, 0.006], [DX0, (DY0 + DY1) / 2, CZ + 0.002]);
  k.box(body, 'black', [0.012, DY1 - DY0, 0.006], [DX1, (DY0 + DY1) / 2, CZ + 0.002]);
  k.box(body, 'black', [DX1 - DX0, 0.012, 0.006], [bx, DY1, CZ + 0.002]);
  k.grille(body, [bx + 0.18, DY0 + 0.3, CZ + 0.002], 0.46, 0.32, 5, 'z', 1);
  k.box(body, 'steel', [0.03, 0.12, 0.03], [DX1 - 0.08, (DY0 + DY1) / 2, CZ + 0.02]);
  for (const s of [-1, 1]) k.decal(body, 0.6, 0.15, [(DX1 + CX1) / 2, 1.58, s * (CZ + 0.002)], s > 0 ? 0 : Math.PI);
  // ouïes d'entrée d'air à l'avant, sortie d'air chaud sur le toit (au-dessus du radiateur)
  k.grille(body, [CX1 + 0.002, 1.24, 0], 0.84, 0.6, 7, 'x', 1);
  for (let i = 0; i < 7; i++) k.box(body, 'black', [0.045, 0.014, 0.82], [0.5 + i * 0.085, CY1 + 0.007, 0]);
  k.rbox(body, 'trim', [0.66, 0.03, 0.9], 0.012, [0.755, CY1 + 0.003, 0], undefined, 1);

  // ---------------------------------------------------------------- toit : anneau de levage, échappement, gyrophare
  k.box(body, 'black', [0.34, 0.014, 0.24], [AX, CY1 + 0.007, 0]);
  k.box(body, 'steel', [0.07, 0.08, 0.05], [AX, CY1 + 0.04, 0]);
  k.torus(body, 'steel', 0.08, 0.022, [AX, CY1 + 0.15, 0], undefined, [8, 20]);
  exhaust(k, body, [0.12, CY1, 0.3], 0.18, 0.045);
  k.beacon(body, [-1.02, CY1, -0.32], 0.07);

  // ---------------------------------------------------------------- arrière : tableau de commande et prises
  const rx = CX0 - 0.004;
  k.rbox(body, 'steelDark', [0.03, 0.52, 0.76], 0.02, [rx, 1.5, 0], undefined, 2);
  k.box(body, 'trim', [0.012, 0.44, 0.68], [rx - 0.012, 1.5, 0]);
  k.rbox(body, 'paint', [0.16, 0.03, 0.82], 0.01, [rx - 0.07, 1.775, 0], [0, 0, 0.12], 1);
  k.rbox(body, 'black', [0.012, 0.18, 0.28], 0.01, [rx - 0.02, 1.58, -0.14], undefined, 1);
  k.box(body, 'lamp', [0.006, 0.13, 0.23], [rx - 0.027, 1.58, -0.14]);
  for (let i = 0; i < 4; i++) k.cylX(body, i === 0 ? 'amber' : 'steel', 0.022, 0.02, [rx - 0.022, 1.36, -0.24 + i * 0.07], 10);
  for (let i = 0; i < 3; i++) k.rbox(body, 'steel', [0.02, 0.07, 0.035], 0.006, [rx - 0.02, 1.58, 0.1 + i * 0.07], undefined, 1);
  k.rbox(body, 'black', [0.03, 0.1, 0.16], 0.01, [rx - 0.02, 1.36, 0.18], undefined, 1);
  // arrêt d'urgence et disjoncteur
  k.box(body, 'paint', [0.03, 0.12, 0.12], [rx - 0.01, 1.14, -0.28]);
  k.cylX(body, 'tail', 0.04, 0.04, [rx - 0.04, 1.14, -0.28], 14);
  k.rbox(body, 'black', [0.04, 0.16, 0.2], 0.01, [rx - 0.015, 1.12, 0.02], undefined, 1);
  // prises CEE 400 V (rouges) et 230 V, sous capots
  for (const [z, rr] of [
    [0.24, 0.065],
    [0.4, 0.05],
  ] as const) {
    k.cylX(body, 'trim', rr + 0.015, 0.03, [rx - 0.01, 0.95, z], 14);
    k.cylX(body, 'tail', rr, 0.07, [rx - 0.045, 0.95, z], 14);
  }
  for (const z of [-0.36, -0.22, -0.08]) {
    k.cylX(body, 'trim', 0.05, 0.03, [rx - 0.01, 0.95, z], 14);
    k.cylX(body, 'black', 0.04, 0.05, [rx - 0.03, 0.95, z], 14);
  }

  // ---------------------------------------------------------------- moteur et alternateur (vibrent au réveil)
  const engine = k.part('engine', body, [0, 0, 0]);
  k.rbox(engine, 'steel', [0.56, 0.44, 0.46], 0.04, [0.06, 1.0, 0.04], undefined, 2);
  k.rbox(engine, 'paint', [0.5, 0.08, 0.3], 0.03, [0.06, 1.26, 0.04], undefined, 2);
  k.cylX(engine, 'steelDark', 0.26, 0.06, [-0.22, 1.0, 0.04], 22);
  k.cylX(engine, 'trim', 0.23, 0.42, [-0.46, 1.0, 0.04], 22);
  k.rbox(engine, 'black', [0.22, 0.14, 0.22], 0.02, [-0.46, 1.28, 0.04], undefined, 1);
  k.cylX(engine, 'steel', 0.07, 0.4, [0.08, 1.5, 0.22], 14);
  k.cylX(engine, 'trim', 0.08, 0.26, [0.12, 1.42, -0.16], 14);
  k.cylZ(engine, 'steel', 0.045, 0.12, [0.2, 0.92, -0.24], 12);
  k.torus(engine, 'amber', 0.022, 0.006, [-0.1, 1.33, -0.17], undefined, [6, 12]);
  for (const x of [-0.5, 0.25]) {
    for (const s of [-1, 1]) k.cyl(engine, 'black', 0.04, 0.08, [x, FY1 + 0.05, 0.04 + s * 0.18], undefined, 10);
  }
  // batterie au pied de la baie
  k.rbox(engine, 'black', [0.24, 0.2, 0.17], 0.015, [-0.58, FY1 + 0.11, -0.32], undefined, 1);
  k.cyl(engine, 'tail', 0.018, 0.03, [-0.52, FY1 + 0.22, -0.32], undefined, 8);
  k.cyl(engine, 'steel', 0.018, 0.03, [-0.64, FY1 + 0.22, -0.32], undefined, 8);

  // ---------------------------------------------------------------- grande porte gauche (charnières à l'arrière)
  const door = k.part('door', body, [DX0, DY0, -CZ - 0.01]);
  k.joint('door', door, 'ry', 0);
  const dw = DX1 - DX0 - 0.012;
  const dh = DY1 - DY0 - 0.012;
  k.rbox(door, 'paint', [dw, dh, 0.03], 0.01, [dw / 2 + 0.004, dh / 2 + 0.006, 0.017], undefined, 1);
  k.box(door, 'black', [dw - 0.08, dh - 0.08, 0.01], [dw / 2, dh / 2, 0.035]);
  k.grille(door, [dw * 0.6, 0.3, 0.0], 0.46, 0.32, 5, 'z', -1);
  // serrure à poignée
  k.rbox(door, 'black', [0.05, 0.16, 0.012], 0.005, [dw - 0.08, dh * 0.5, -0.002], undefined, 1);
  k.box(door, 'steel', [0.03, 0.12, 0.03], [dw - 0.08, dh * 0.5, -0.02]);

  return k.build({
    refWeight: 1.9,
    minScale: 1.6,
    maxScale: 2.0,
    vibrate: 'engine',
    wake: [
      { pose: { door: 1.25 }, dur: 1.5 },
      { pose: { door: 1.85 }, dur: 1.0 },
      { pose: { door: 1.78 }, dur: 1.6 },
      { pose: { door: 0 }, dur: 1.6 },
    ],
    nod: [
      { pose: { door: 0.22 }, dur: 0.45 },
      { pose: { door: 0 }, dur: 0.5 },
    ],
  });
}

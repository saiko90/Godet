// Pièces communes aux modèles : cabine vitrée, roue à crampons, chenilles acier ou caoutchouc, échappement,
// marchepieds. Toutes s'ajoutent à une pièce rigide d'un Kit (coordonnées locales de la pièce).
import * as THREE from 'three';
import { stadium, type Kit, type MatKey, type V3 } from './kit';

export interface CabOpts {
  /** Arrière et avant (x) au plancher. */
  x0: number;
  x1: number;
  /** Hauteur du plancher. */
  y0: number;
  /** Hauteur vitrée (du plancher au toit). */
  h: number;
  /** Largeur (z) et centre (z). */
  w: number;
  zc?: number;
  /** Recul du haut du pare-brise (inclinaison des montants avant). */
  lean?: number;
  /** Recul du haut de la vitre arrière. */
  leanBack?: number;
  roof?: MatKey;
  frame?: MatKey;
  post?: number;
  /** Montant de porte côté gauche (z−, côté conducteur), droit (z+) ou les deux. */
  door?: 'left' | 'right' | 'both' | 'none';
  /** Gyrophare sur le toit, coin arrière gauche (z−) ou droit (z+). */
  beacon?: 'left' | 'right' | null;
  /** Phares de travail sur l'avant du toit. */
  lights?: number;
  /** Phares de travail à l'arrière du toit. */
  rearLights?: number;
  /** Arceau sans vitres (canopy). */
  canopy?: boolean;
  seat?: boolean;
}

/** Cabine vitrée (ou arceau de protection) : montants, toit débordant, vitrages, siège, consoles, phares. */
export function cabin(kit: Kit, part: number, o: CabOpts): void {
  const zc = o.zc ?? 0;
  const post = o.post ?? 0.07;
  const lean = o.lean ?? 0.18;
  const leanB = o.leanBack ?? 0;
  const frame = o.frame ?? 'trim';
  const roofMat = o.roof ?? 'trim';
  const { x0, x1, y0, h, w } = o;
  const top = y0 + h;
  const xf1 = x1 - lean;
  const xb1 = x0 + leanB;
  const zL = zc + w / 2 - post / 2;
  const zR = zc - w / 2 + post / 2;

  // plancher et socle de cabine
  kit.rbox(part, frame, [x1 - x0 + 0.04, 0.08, w + 0.02], 0.03, [(x0 + x1) / 2, y0 + 0.04, zc]);

  // montants (avant inclinés, arrière droits ou inclinés)
  const pillar = (xa: number, xb: number, z: number) => {
    const len = Math.hypot(xb - xa, h);
    const ang = Math.atan2(xa - xb, h);
    kit.rbox(part, frame, [post, len, post], 0.015, [(xa + xb) / 2, y0 + h / 2, z], [0, 0, ang], 2);
  };
  for (const z of [zL, zR]) {
    pillar(x1, xf1, z);
    pillar(x0, xb1, z);
  }
  // montants de porte
  const xm = x0 + (x1 - x0) * 0.42;
  if (o.door === 'right' || o.door === 'both') pillar(xm, xm, zL);
  if (o.door === 'left' || o.door === 'both') pillar(xm, xm, zR);

  // traverses basses et hautes
  kit.box(part, frame, [post, post, w], [x1 - 0.005, y0 + 0.36, zc]);
  kit.box(part, frame, [post, post, w], [xf1, top - post / 2, zc]);
  kit.box(part, frame, [post, post, w], [xb1, top - post / 2, zc]);
  kit.box(part, frame, [x1 - x0, post * 0.8, post * 0.8], [(x0 + x1) / 2 - lean / 2, top - post / 2, zL]);
  kit.box(part, frame, [x1 - x0, post * 0.8, post * 0.8], [(x0 + x1) / 2 - lean / 2, top - post / 2, zR]);

  // toit débordant, légèrement bombé
  const rx0 = Math.min(x0, xb1) - 0.05;
  const rx1 = xf1 + 0.12;
  kit.rbox(part, roofMat, [rx1 - rx0, 0.08, w + 0.1], 0.035, [(rx0 + rx1) / 2, top + 0.04, zc]);
  kit.rbox(part, roofMat, [rx1 - rx0 - 0.22, 0.06, w - 0.12], 0.03, [(rx0 + rx1) / 2 - 0.04, top + 0.1, zc]);

  if (!o.canopy) {
    // pare-brise incliné : du bas des montants avant (y0 + 0.4) jusque sous le toit
    const yb = y0 + 0.4;
    const xb = x1 - lean * ((yb - y0) / h);
    const yt = top - post;
    const xt = x1 - lean * ((yt - y0) / h);
    const front = new THREE.PlaneGeometry(w - post * 1.2, Math.hypot(xb - xt, yt - yb));
    front.rotateY(Math.PI / 2);
    front.rotateZ(Math.atan2(xb - xt, yt - yb));
    kit.add(part, 'glass', front, [(xb + xt) / 2 + 0.006, (yb + yt) / 2, zc]);
    // vitre basse avant
    const low = new THREE.PlaneGeometry(w - post * 1.2, 0.3);
    low.rotateY(Math.PI / 2);
    kit.add(part, 'glass', low, [x1 + 0.006, y0 + 0.22, zc]);
    // vitres latérales : trapèze suivant les montants
    const side = new THREE.Shape();
    side.moveTo(x0 + 0.02, y0 + 0.1);
    side.lineTo(x1 - 0.02, y0 + 0.1);
    side.lineTo(xf1 - 0.01, top - post);
    side.lineTo(xb1 + 0.02, top - post);
    side.closePath();
    for (const z of [zc + w / 2 - 0.004, zc - w / 2 + 0.004]) kit.add(part, 'glass', new THREE.ShapeGeometry(side), [0, 0, z]);
    // vitre arrière (suit l'inclinaison des montants arrière)
    const ryb = y0 + 0.45;
    const ryt = top - post;
    const rxb = x0 + leanB * ((ryb - y0) / h);
    const rxt = x0 + leanB * ((ryt - y0) / h);
    const rear = new THREE.PlaneGeometry(w - post * 1.2, Math.hypot(rxt - rxb, ryt - ryb));
    rear.rotateY(-Math.PI / 2);
    rear.rotateZ(-Math.atan2(rxt - rxb, ryt - ryb));
    kit.add(part, 'glass', rear, [(rxb + rxt) / 2 - 0.006, (ryb + ryt) / 2, zc]);
    // essuie-glace posé sur le pare-brise
    const wy = y0 + 0.75;
    kit.box(part, 'black', [0.012, 0.5, 0.02], [x1 - lean * ((wy - y0) / h) + 0.016, wy, zc + w * 0.1], [0, 0, Math.atan2(lean, h)]);
    // poignée de porte
    const zd = o.door === 'right' ? zc + w / 2 + 0.01 : zc - w / 2 - 0.01;
    kit.box(part, 'steel', [0.12, 0.025, 0.025], [xm + 0.12, y0 + h * 0.5, zd]);
  }

  // siège et consoles
  if (o.seat !== false) {
    const sx = x0 + (x1 - x0) * 0.42;
    kit.rbox(part, 'interior', [0.46, 0.14, 0.48], 0.05, [sx, y0 + 0.42, zc]);
    kit.rbox(part, 'interior', [0.12, 0.62, 0.46], 0.05, [sx - 0.26, y0 + 0.72, zc], [0, 0, -0.12]);
    kit.box(part, 'interior', [0.3, 0.32, 0.4], [sx, y0 + 0.2, zc]);
    for (const s of [-1, 1]) {
      kit.rbox(part, 'interior', [0.42, 0.1, 0.14], 0.03, [sx + 0.08, y0 + 0.56, zc + s * 0.33]);
      kit.cyl(part, 'black', 0.018, 0.16, [sx + 0.2, y0 + 0.66, zc + s * 0.33], undefined, 8);
      kit.sphere(part, 'black', 0.035, [sx + 0.2, y0 + 0.75, zc + s * 0.33], 10);
    }
    kit.rbox(part, 'interior', [0.12, 0.3, w * 0.5], 0.03, [x1 - 0.14, y0 + 0.5, zc]);
  }

  // phares de travail sur le toit
  const nl = o.lights ?? 2;
  for (let i = 0; i < nl; i++) {
    const z = nl === 1 ? zc : zc - w * 0.32 + (i * w * 0.64) / (nl - 1);
    kit.lamp(part, [rx1 - 0.05, top + 0.13, z], 0.12);
  }
  const nr = o.rearLights ?? 0;
  for (let i = 0; i < nr; i++) {
    const z = nr === 1 ? zc : zc - w * 0.3 + (i * w * 0.6) / (nr - 1);
    kit.lamp(part, [rx0 + 0.05, top + 0.13, z], 0.11, Math.PI);
  }
  if (o.beacon) {
    const z = o.beacon === 'left' ? zc - w * 0.3 : zc + w * 0.3;
    kit.beacon(part, [rx0 + 0.16, top + 0.13, z]);
  }
}

export interface WheelOpts {
  /** Côté extérieur (z+ = 1, z- = -1) : la jante est dessinée de ce côté. */
  side: number;
  rim?: MatKey;
  /** Nombre de crampons (par défaut selon le diamètre). */
  lugs?: number;
  /** Rapport du rayon de la jante. */
  rimRatio?: number;
  /** Pneus de chantier (crampons en chevrons) ou route (rainures). */
  tread?: 'lug' | 'road' | 'smooth';
  /** Roue jumelée (camion) : deux pneus. */
  dual?: boolean;
}

/** Roue complète d'axe z : pneu à flancs arrondis, crampons en chevrons, jante emboutie, moyeu et écrous. */
export function wheel(kit: Kit, part: number, pos: V3, r: number, width: number, o: WheelOpts): void {
  const [x, y, z] = pos;
  const tires = o.dual ? [z - o.side * width * 0.52, z + o.side * width * 0.52] : [z];
  const tw = o.dual ? width * 0.98 : width;
  const tread = o.tread ?? 'lug';
  for (const tz of tires) tire(kit, part, [x, y, tz], r, tw, tread, o.lugs);
  // jante côté extérieur
  const zr = z + o.side * (o.dual ? width : width / 2) * 0.98;
  const rr = r * (o.rimRatio ?? 0.62);
  const rim = o.rim ?? 'steel';
  // disque embouti (profil tourné, axe z)
  const prof: [number, number][] = [
    [0.001, -0.06],
    [rr * 0.35, -0.06],
    [rr * 0.45, -0.02],
    [rr * 0.8, -0.03],
    [rr * 0.94, 0.02],
    [rr, 0.03],
    [rr * 1.02, -0.1],
  ];
  kit.lathe(part, rim, prof.map(([a, b]) => [a, b * o.side] as [number, number]), [x, y, zr - o.side * 0.04], [o.side > 0 ? Math.PI / 2 : -Math.PI / 2, 0, 0], 28);
  // moyeu et écrous
  kit.cyl(part, 'steelDark', rr * 0.3, 0.12, [x, y, zr], [Math.PI / 2, 0, 0], 16);
  kit.cyl(part, 'steel', rr * 0.16, 0.16, [x, y, zr + o.side * 0.02], [Math.PI / 2, 0, 0], 12);
  const nb = 8;
  for (let i = 0; i < nb; i++) {
    const a = (i / nb) * Math.PI * 2;
    kit.cyl(part, 'steel', 0.022, 0.05, [x + Math.cos(a) * rr * 0.42, y + Math.sin(a) * rr * 0.42, zr + o.side * 0.0], [Math.PI / 2, 0, 0], 6);
  }
  // fond de jante (intérieur sombre)
  kit.cyl(part, 'steelDark', rr * 0.97, (o.dual ? width * 2 : width) * 0.9, [x, y, z], [Math.PI / 2, 0, 0], 24, true);
}

/** Pneu seul : flancs arrondis (profil tourné) et sculpture. */
export function tire(kit: Kit, part: number, pos: V3, r: number, w: number, tread: 'lug' | 'road' | 'smooth', lugs?: number): void {
  const ri = r * 0.6;
  const h = w / 2;
  const t = r - ri;
  // profil (rayon, z) d'un demi-pneu, puis symétrique
  const prof: [number, number][] = [
    [ri, -h * 0.82],
    [ri + t * 0.35, -h * 0.98],
    [ri + t * 0.75, -h],
    [r - t * 0.08, -h * 0.88],
    [r, -h * 0.62],
    [r, h * 0.62],
    [r - t * 0.08, h * 0.88],
    [ri + t * 0.75, h],
    [ri + t * 0.35, h * 0.98],
    [ri, h * 0.82],
  ];
  kit.lathe(part, 'rubber', prof, pos, [Math.PI / 2, 0, 0], 40);
  if (tread === 'smooth') return;
  const n = lugs ?? Math.max(14, Math.round((2 * Math.PI * r) / (tread === 'lug' ? 0.24 : 0.12)));
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const cx = pos[0] + Math.cos(a) * (r + 0.008);
    const cy = pos[1] + Math.sin(a) * (r + 0.008);
    if (tread === 'lug') {
      // chevrons : deux pavés inclinés, décalés d'un côté à l'autre
      for (const s of [-1, 1]) {
        const g = new THREE.BoxGeometry(0.045, 0.085, w * 0.46);
        g.rotateX(s * 0.42);
        g.rotateZ(a);
        g.translate(cx, cy, pos[2] + s * w * 0.23);
        kit.add(part, 'rubber', g);
      }
    } else {
      const g = new THREE.BoxGeometry(0.02, 0.05, w * 0.92);
      g.rotateZ(a);
      g.translate(cx, cy, pos[2]);
      kit.add(part, 'rubber', g);
    }
  }
}

export interface TrackOpts {
  length: number;
  radius: number;
  /** Hauteur de l'axe des roues (centre du stade). */
  cy: number;
  width: number;
  z: number;
  /** Chenille acier (patins à arêtes) ou caoutchouc (bande à crampons). */
  rubber?: boolean;
  /** Nombre de galets inférieurs. */
  rollers?: number;
}

/** Chenille complète : patins le long du stade, barbotin, roue folle, galets, longeron. */
export function track(kit: Kit, part: number, o: TrackOpts): void {
  const { length: L, radius: r, cy, width: W, z } = o;
  const path = stadium(L, r, cy);
  const pitch = o.rubber ? 0.12 : 0.19;
  const n = Math.round(path.per / pitch);
  const plateGeo = () => new THREE.BoxGeometry(pitch * (o.rubber ? 1.02 : 0.9), o.rubber ? 0.06 : 0.065, W);
  for (let i = 0; i < n; i++) {
    const p = path.at((i * path.per) / n);
    const nx = -Math.sin(p.a);
    const ny = Math.cos(p.a);
    const g = plateGeo();
    g.rotateZ(p.a);
    g.translate(p.x + nx * 0.03, p.y + ny * 0.03, z);
    kit.add(part, o.rubber ? 'rubber' : 'track', g);
    if (!o.rubber) {
      // arête de patin
      const gr = new THREE.BoxGeometry(0.035, 0.05, W * 0.98);
      gr.rotateZ(p.a);
      gr.translate(p.x + nx * 0.08, p.y + ny * 0.08, z);
      kit.add(part, 'track', gr);
    } else if (i % 2 === 0) {
      // crampons de la bande caoutchouc, en quinconce
      for (const s of [-1, 1]) {
        const gr = new THREE.BoxGeometry(0.06, 0.035, W * 0.36);
        gr.rotateZ(p.a);
        gr.translate(p.x + nx * 0.07, p.y + ny * 0.07, z + s * W * 0.22 + (i % 4 === 0 ? 0.03 : -0.03));
        kit.add(part, 'rubber', gr);
      }
    }
  }
  const sx = -(L / 2 - r);
  const ix = L / 2 - r;
  // barbotin (arrière, denté) et roue folle (avant)
  kit.cylZ(part, 'steelDark', r * 0.86, W * 0.5, [sx, cy, z], 24);
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2;
    kit.box(part, 'steelDark', [0.07, 0.1, W * 0.3], [sx + Math.cos(a) * r * 0.86, cy + Math.sin(a) * r * 0.86, z], [0, 0, a]);
  }
  kit.cylZ(part, 'trim', r * 0.42, W * 0.78, [sx, cy, z], 18);
  kit.cylZ(part, 'steelDark', r * 0.84, W * 0.48, [ix, cy, z], 24);
  kit.cylZ(part, 'steel', r * 0.25, W * 0.6, [ix, cy, z], 12);
  // galets inférieurs et supérieurs
  const nr = o.rollers ?? 6;
  for (let k = 0; k < nr; k++) {
    const x = sx + 0.55 * (L / 4.5) + (k * (ix - sx - 1.1 * (L / 4.5))) / Math.max(1, nr - 1);
    kit.cylZ(part, 'steelDark', Math.min(0.12, r * 0.3), W * 0.5, [x, cy - r + 0.15 * (r / 0.4), z], 14);
  }
  if (!o.rubber) for (const x of [-L * 0.16, L * 0.16]) kit.cylZ(part, 'steelDark', 0.09, W * 0.4, [x, cy + r - 0.1, z], 12);
  // longeron
  kit.rbox(part, 'steelDark', [L - 2 * r - 0.1, r * 0.95, W * 0.62], 0.04, [0, cy, z]);
}

/** Pot d'échappement vertical avec embout et chapeau. */
export function exhaust(kit: Kit, part: number, pos: V3, h = 0.6, r = 0.075): void {
  kit.cyl(part, 'trim', [r, r * 1.06], h, [pos[0], pos[1] + h / 2, pos[2]], undefined, 14);
  kit.cyl(part, 'chrome', [r * 1.22, r * 1.05], 0.1, [pos[0], pos[1] + h + 0.04, pos[2]], undefined, 14);
  kit.cyl(part, 'trim', [r * 0.4, r * 1.3], 0.03, [pos[0], pos[1] + h + 0.13, pos[2]], [0, 0, 0.25], 12);
}

/** Marchepied : deux montants et des barreaux. */
export function ladder(kit: Kit, part: number, x0: number, x1: number, y0: number, y1: number, z: number, steps: number, mat: MatKey = 'trim'): void {
  for (const x of [x0, x1]) kit.box(part, mat, [0.04, y1 - y0, 0.05], [x, (y0 + y1) / 2, z]);
  for (let i = 0; i < steps; i++) {
    const y = y0 + ((i + 0.5) * (y1 - y0)) / steps;
    kit.box(part, 'black', [Math.abs(x1 - x0), 0.03, 0.16], [(x0 + x1) / 2, y, z]);
  }
}

/** Garde-boue enveloppant une roue (arc extrudé). */
export function fender(kit: Kit, part: number, pos: V3, r: number, w: number, arc0 = 0.15, arc1 = Math.PI - 0.15, mat: MatKey = 'paint', thick = 0.05): void {
  const s = new THREE.Shape();
  const ro = r + thick;
  s.absarc(0, 0, ro, arc0, arc1, false);
  s.absarc(0, 0, r, arc1, arc0, true);
  s.closePath();
  kit.extrude(part, mat, s, w, pos, undefined, 0.012, 24);
}

// Agencement du hall selon la taille du parc : une allée centrale bordée de baies des deux côtés, une baie
// « vedette » au fond de l'allée quand le nombre de machines est impair. Le hall s'allonge avec le parc.
//   1 machine : baie vedette seule.   2 : une paire.   3 : une paire et la vedette au fond.
//   4 et plus : paires successives (gauche, droite, gauche…) et la dernière en vedette si le nombre est impair.

export const PLATFORM_R = 5.0;
/** Demi-largeur de l'allée libre (aucune machine). */
export const AISLE = 4.2;
/** Bande entre l'allée et la plateforme (code peint au sol). */
const CODE_BAND = 1.4;
/** Distance du centre d'une baie latérale à l'axe de l'allée. */
export const BAY_X = AISLE + CODE_BAND + PLATFORM_R;
/** Pas entre deux rangées de baies. */
export const ROW = 12.8;
export const HALL_H = 12.5;
/** Hauteur du dessus du plateau tournant. */
export const DECK_Y = 0.2;

export interface Slot {
  index: number;
  x: number;
  z: number;
  /** Orientation de repos de la machine (rotation autour de y) : avant tourné vers l'allée et l'entrée. */
  yaw: number;
  /** -1 : côté gauche (x < 0), 1 : droit, 0 : vedette au fond. */
  side: -1 | 0 | 1;
  row: number;
  hero: boolean;
  radius: number;
}

export interface HallDims {
  halfWidth: number;
  zFront: number;
  zBack: number;
  height: number;
  rows: number;
  /** Extrémités occupées par les baies (pour la vue d'ensemble). */
  zFirst: number;
  zLast: number;
}

/** Orientation qui tourne l'avant (+x du modèle) vers la direction (dx, dz). */
export function yawToward(dx: number, dz: number): number {
  return Math.atan2(-dz, dx);
}

export function computeLayout(n: number): { slots: Slot[]; dims: HallDims } {
  const slots: Slot[] = [];
  const side = (index: number, row: number, s: -1 | 1): Slot => ({
    index,
    x: s * BAY_X,
    z: -row * ROW,
    yaw: yawToward(-s * 0.8, 0.6),
    side: s,
    row,
    hero: false,
    radius: PLATFORM_R,
  });
  const hero = (index: number, z: number): Slot => ({
    index,
    x: 0,
    z,
    // avant tourné vers la gauche de la caméra d'entrée : trois quarts avant, côté cabine visible
    yaw: yawToward(-0.58, 0.81),
    side: 0,
    row: -1,
    hero: true,
    radius: PLATFORM_R,
  });

  const count = Math.max(0, Math.floor(n));
  if (count === 1) {
    slots.push(hero(0, 0));
  } else if (count > 1) {
    const pairs = Math.floor(count / 2);
    for (let i = 0; i < pairs * 2; i++) slots.push(side(i, Math.floor(i / 2), i % 2 === 0 ? -1 : 1));
    if (count % 2 === 1) slots.push(hero(count - 1, -(pairs - 1) * ROW - ROW * 0.95));
  }

  const zs = slots.map((s) => s.z);
  const zFirst = zs.length ? Math.max(...zs) : 0;
  const zLast = zs.length ? Math.min(...zs) : 0;
  const rows = count <= 1 ? 1 : Math.ceil(count / 2);
  return {
    slots,
    dims: {
      halfWidth: BAY_X + PLATFORM_R + 4.4,
      zFront: zFirst + PLATFORM_R + 24,
      zBack: zLast - PLATFORM_R - 7.5,
      height: HALL_H,
      rows,
      zFirst,
      zLast,
    },
  };
}

export interface Obstacle {
  x: number;
  z: number;
  r: number;
  top: number;
}

/** La caméra peut-elle se trouver en p (hors des machines, dans le hall) ? */
export function cameraFree(p: { x: number; y: number; z: number }, obstacles: Obstacle[], dims: HallDims, ignore = -1): boolean {
  if (p.y < 0.9 || p.y > dims.height - 0.8) return false;
  if (Math.abs(p.x) > dims.halfWidth - 1.2) return false;
  if (p.z > dims.zFront - 1 || p.z < dims.zBack + 1.2) return false;
  for (let i = 0; i < obstacles.length; i++) {
    if (i === ignore) continue;
    const o = obstacles[i];
    if (p.y > o.top) continue;
    const dx = p.x - o.x;
    const dz = p.z - o.z;
    if (dx * dx + dz * dz < o.r * o.r) return false;
  }
  return true;
}

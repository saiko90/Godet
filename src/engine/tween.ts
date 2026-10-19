// Interpolations et minuteries sur l'horloge du moteur (et non sur setTimeout) : la pause du rendu suspend
// tout, et un pas de temps plus grand (mode test) fait avancer les animations d'autant.

export type Ease = (k: number) => number;

export const linear: Ease = (k) => k;
export const easeIn: Ease = (k) => k * k * k;
export const easeOut: Ease = (k) => 1 - Math.pow(1 - k, 3);
export const easeInOut: Ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
/** Départ et arrivée sans à-coup (accélération nulle aux deux bouts). */
export const smoother: Ease = (k) => k * k * k * (k * (k * 6 - 15) + 10);
export const easeOutBack: Ease = (k) => {
  const c = 1.4;
  return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2);
};

export const clamp = (v: number, a: number, b: number): number => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const smoothstep = (a: number, b: number, v: number): number => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
/** Amortissement exponentiel indépendant du pas de temps (stable même avec un très grand dt). */
export const damp = (current: number, target: number, rate: number, dt: number): number =>
  target + (current - target) * Math.exp(-rate * dt);

/**
 * Progression quintique de 0 à 1 qui démarre avec la vitesse v0 (en « unités de progression par durée »)
 * et arrive à l'arrêt sans accélération résiduelle. v0 = 0 donne la courbe « smoother ».
 * Sert à enchaîner un vol de caméra interrompu sans à-coup de vitesse.
 */
export function launchEase(v0: number): Ease {
  const v = clamp(v0, 0, 2.4);
  const a3 = 10 - 6 * v;
  const a4 = 8 * v - 15;
  const a5 = 6 - 3 * v;
  return (k) => {
    const t = clamp(k, 0, 1);
    return v * t + a3 * t * t * t + a4 * t * t * t * t + a5 * t * t * t * t * t;
  };
}
/** Dérivée de launchEase (vitesse de progression), pour reprendre un vol en cours. */
export function launchEaseSpeed(v0: number, k: number): number {
  const v = clamp(v0, 0, 2.4);
  const t = clamp(k, 0, 1);
  return v + 3 * (10 - 6 * v) * t * t + 4 * (8 * v - 15) * t * t * t + 5 * (6 - 3 * v) * t * t * t * t;
}

export interface Tween {
  /** true si l'animation est allée au bout, false si elle a été annulée. */
  readonly done: Promise<boolean>;
  cancel(): void;
  readonly running: boolean;
}

interface Rec {
  t: number;
  dur: number;
  update: ((e: number, k: number) => void) | null;
  ease: Ease;
  resolve: (ok: boolean) => void;
  live: boolean;
}

export class Timeline {
  /** Temps du moteur, en secondes (avance seulement quand le rendu tourne). */
  time = 0;
  private recs = new Set<Rec>();

  tween(dur: number, update: ((e: number, k: number) => void) | null, ease: Ease = easeInOut): Tween {
    let resolve: (ok: boolean) => void = () => {};
    const done = new Promise<boolean>((r) => {
      resolve = r;
    });
    const rec: Rec = { t: 0, dur: Math.max(dur, 1e-4), update, ease, resolve, live: true };
    this.recs.add(rec);
    // Une durée nulle s'applique tout de suite (coupe nette).
    if (dur <= 0) this.finish(rec);
    return {
      done,
      cancel: () => {
        if (!rec.live) return;
        rec.live = false;
        this.recs.delete(rec);
        rec.resolve(false);
      },
      get running() {
        return rec.live;
      },
    };
  }

  /** Attente sur l'horloge du moteur. */
  delay(sec: number): Promise<boolean> {
    return this.tween(sec, null, linear).done;
  }

  get busy(): boolean {
    return this.recs.size > 0;
  }

  step(dt: number): void {
    this.time += dt;
    for (const r of [...this.recs]) {
      if (!r.live) continue;
      r.t += dt;
      if (r.t >= r.dur) this.finish(r);
      else if (r.update) {
        const k = r.t / r.dur;
        r.update(r.ease(k), k);
      }
    }
  }

  /** Annule tout (fin du moteur). */
  clear(): void {
    for (const r of this.recs) {
      r.live = false;
      r.resolve(false);
    }
    this.recs.clear();
  }

  private finish(r: Rec): void {
    if (!r.live) return;
    r.live = false;
    this.recs.delete(r);
    if (r.update) r.update(r.ease(1), 1);
    r.resolve(true);
  }
}

/** Rend la main au navigateur (une image) : l'écran de chargement reste fluide pendant la construction. */
export function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function' && typeof document !== 'undefined' && !document.hidden) {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 16);
    }
  });
}

// Niveaux de qualité et surveillance de la fluidité (baisse automatique high → medium → low).
import type { ShowroomQuality } from './types';

export interface QualityPreset {
  /** Plafond du ratio de pixels. */
  pixelRatio: number;
  /** Plafond du nombre de pixels rendus (mégapixels), pour les très grands écrans. */
  maxMegapixels: number;
  /** Post-traitement (halo lumineux) ; sinon rendu direct. */
  post: boolean;
  /** Anticrénelage multi-échantillons de la cible du post-traitement. */
  samples: number;
  /** Reflets du sol : 0 = aucun, sinon résolution relative de la cible de réflexion. */
  reflection: number;
  /** Projecteurs réels qui suivent la caméra (les autres baies ont un éclairage simulé). */
  spots: number;
  /** Projecteurs qui portent une ombre (machine visée, puis ses voisines). */
  shadows: number;
  shadowSize: number;
  /** Poussière dans les faisceaux. */
  dust: boolean;
  /** Vernis de la peinture (reflet supplémentaire). */
  clearcoat: boolean;
  /** Halo : intensité. */
  bloom: number;
}

export const QUALITY: Record<ShowroomQuality, QualityPreset> = {
  high: {
    pixelRatio: 2,
    maxMegapixels: 3.2,
    post: true,
    samples: 4,
    reflection: 0.5,
    spots: 3,
    shadows: 3,
    shadowSize: 2048,
    dust: true,
    clearcoat: true,
    bloom: 0.62,
  },
  medium: {
    pixelRatio: 1.5,
    maxMegapixels: 1.7,
    post: true,
    samples: 2,
    reflection: 0.3,
    spots: 3,
    shadows: 1,
    shadowSize: 1024,
    dust: false,
    clearcoat: true,
    bloom: 0.55,
  },
  low: {
    pixelRatio: 1,
    maxMegapixels: 1.0,
    post: false,
    samples: 0,
    reflection: 0,
    spots: 1,
    shadows: 0,
    shadowSize: 512,
    dust: false,
    clearcoat: false,
    bloom: 0,
  },
};

/** Qualité de départ en mode automatique, selon l'appareil. */
export function initialQuality(): ShowroomQuality {
  if (typeof window === 'undefined') return 'medium';
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const small = Math.min(window.screen?.width ?? 1280, window.screen?.height ?? 800) < 700;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const weak = (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) || (navigator.hardwareConcurrency || 8) <= 2;
  // Téléphones : qualité basse au départ (sans post-traitement, reflets ni ombres). La scène complète a fait
  // manquer de mémoire des téléphones récents ; la qualité reste réglable à la main (bouton « Qualité »).
  if (weak || small) return 'low';
  if (coarse) return 'medium';
  return 'high';
}

/** Ratio de pixels effectif pour une taille de canvas donnée. */
export function pixelRatioFor(q: QualityPreset, cssW: number, cssH: number): number {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const area = Math.max(1, cssW * cssH);
  const byBudget = Math.sqrt((q.maxMegapixels * 1e6) / area);
  return Math.max(0.6, Math.min(dpr, q.pixelRatio, byBudget));
}

/**
 * Mesure des images par seconde pendant un rendu continu. Le rendu à la demande s'arrête quand rien ne bouge :
 * on n'échantillonne que les images consécutives (écart < 250 ms).
 */
export class FpsWatch {
  private samples: number[] = [];
  private last = 0;
  private steps = 0;
  private armedAt = -1;

  /** Démarre (ou relance) la surveillance, après un délai de mise en route. */
  arm(now: number, delayMs = 900): void {
    this.samples = [];
    this.last = 0;
    this.armedAt = now + delayMs;
  }

  disarm(): void {
    this.armedAt = -1;
    this.samples = [];
  }

  get armed(): boolean {
    return this.armedAt >= 0;
  }

  /**
   * À appeler à chaque image rendue. Renvoie 'down' quand il faut baisser la qualité.
   * Seuils : sous 48 i/s en high, sous 27 i/s en medium (médiane sur ~2,5 s).
   */
  frame(now: number, level: ShowroomQuality): 'down' | null {
    if (this.armedAt < 0 || now < this.armedAt || level === 'low' || this.steps >= 2) {
      this.last = now;
      return null;
    }
    const gap = this.last ? now - this.last : 0;
    this.last = now;
    if (gap <= 0 || gap > 250) return null;
    this.samples.push(gap);
    let total = 0;
    for (const s of this.samples) total += s;
    if (total < 2500 || this.samples.length < 40) return null;
    const sorted = [...this.samples].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const fps = 1000 / median;
    this.samples = [];
    const threshold = level === 'high' ? 48 : 27;
    if (fps < threshold) {
      this.steps++;
      return 'down';
    }
    // Fluide : on arrête de surveiller.
    this.disarm();
    return null;
  }
}

export function lowerQuality(q: ShowroomQuality): ShowroomQuality {
  return q === 'high' ? 'medium' : 'low';
}

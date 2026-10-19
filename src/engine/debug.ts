// Réglages de test du moteur (page /labo uniquement). Ce module n'importe pas three.js : la page de test peut
// le charger seul pour préparer le moteur avant sa création. Aucun effet en production : personne ne l'appelle.

export interface EngineDebug {
  /** Pas de temps maximal par image, en secondes. Infinity : les animations aboutissent en quelques images,
   *  utile avec le rendu logiciel (SwiftShader) où une image prend une seconde ou plus. */
  maxDt: number;
  /** Coupe la baisse automatique de qualité (mesure des images par seconde faussée en rendu logiciel). */
  noAutoQuality: boolean;
  /** Affiche dans la console le temps de construction et les compteurs de rendu. */
  verbose: boolean;
  /** Pas d'animations de repos (plateaux, respiration, poussière) : la scène se fige vite. */
  noIdle: boolean;
  /** Pas de temps imposé à chaque image (0 : temps réel). Permet de filmer une animation image par image. */
  fixedDt: number;
}

export const engineDebug: EngineDebug = {
  maxDt: 0.05,
  noAutoQuality: false,
  verbose: false,
  noIdle: false,
  fixedDt: 0,
};

/** Signale aux tests automatisés que la boucle de rendu dort (scène stable) : window.__godetIdle. */
export function markIdle(idle: boolean): void {
  if (!engineDebug.verbose || typeof window === 'undefined') return;
  (window as unknown as { __godetIdle?: boolean }).__godetIdle = idle;
}

export function setEngineDebug(patch: Partial<EngineDebug>): void {
  Object.assign(engineDebug, patch);
}

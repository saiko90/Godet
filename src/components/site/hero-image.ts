import 'server-only';

import { existsSync } from 'node:fs';
import { join } from 'node:path';

/** Capture du showroom 3D affichée sur l'accueil (1600 × 900), fournie dans public/images. */
export const HERO_IMAGE = '/images/showroom-hero.webp';

/**
 * L'image du héros est-elle présente ? L'accueil est généré au déploiement : tant que le fichier manque,
 * on affiche le plateau lumineux sans demander l'image (pas de requête en erreur dans la console).
 */
export function heroImageAvailable(): boolean {
  try {
    return existsSync(join(process.cwd(), 'public', 'images', 'showroom-hero.webp'));
  } catch {
    return false;
  }
}

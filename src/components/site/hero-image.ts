import 'server-only';

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { AppLocale } from '@/i18n/routing';

/** Captures du showroom 3D affichées sur l'accueil (1600 × 900), fournies dans public/images. */
const HERO_SIZE = { width: 1600, height: 900 } as const;

function inImages(file: string): boolean {
  try {
    return existsSync(join(process.cwd(), 'public', 'images', file));
  } catch {
    return false;
  }
}

/**
 * Image du héros dans une langue : `showroom-hero-<langue>.webp` (étiquettes et enseigne traduites), sinon la capture
 * commune `showroom-hero.webp`, sinon null. L'accueil est généré au déploiement : tant qu'aucun fichier n'existe, on
 * affiche le plateau lumineux sans demander d'image (pas de requête en erreur dans la console).
 */
export function heroImage(locale: AppLocale): { src: string; width: number; height: number } | null {
  const own = `showroom-hero-${locale}.webp`;
  if (inImages(own)) return { src: `/images/${own}`, ...HERO_SIZE };
  if (inImages('showroom-hero.webp')) return { src: '/images/showroom-hero.webp', ...HERO_SIZE };
  return null;
}

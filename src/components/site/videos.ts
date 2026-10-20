import 'server-only';

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { AppLocale } from '@/i18n/routing';

/** Films de présentation : le showroom 3D, puis le suivi d'une machine en mode atelier. */
export const VIDEO_KINDS = ['garage', 'suivi'] as const;
export type VideoKind = (typeof VIDEO_KINDS)[number];

/** Durée affichée à côté du titre (celle des fichiers livrés dans public/videos). */
const LENGTH: Record<VideoKind, string> = { garage: '0:34', suivi: '0:40' };

export interface SiteVideo {
  kind: VideoKind;
  /** Durée, « 0:34 ». */
  length: string;
  /** Film H.264 1920 × 1080, sans son, sous-titres incrustés dans la langue de la page. */
  src: string;
  /** Affiche (image avant lecture), ou null. */
  poster: string | null;
}

function inVideos(file: string): boolean {
  try {
    return existsSync(join(process.cwd(), 'public', 'videos', file));
  } catch {
    return false;
  }
}

/**
 * Films présents au déploiement dans la langue de la page (public/videos/godet-<film>-<langue>.mp4 et .webp).
 * Un film absent n'est pas proposé : jamais de lecteur vide.
 */
export function siteVideos(locale: AppLocale): SiteVideo[] {
  return VIDEO_KINDS.filter((kind) => inVideos(`godet-${kind}-${locale}.mp4`)).map((kind) => ({
    kind,
    length: LENGTH[kind],
    src: `/videos/godet-${kind}-${locale}.mp4`,
    poster: inVideos(`godet-${kind}-${locale}.webp`) ? `/videos/godet-${kind}-${locale}.webp` : null,
  }));
}

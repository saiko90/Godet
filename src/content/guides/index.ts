// Registre des guides (pages de contenu du site). Ajouter un guide : un fichier <id>.ts, puis l'importer ici.
import { routing, type AppLocale } from '@/i18n/routing';
import { carnet } from './carnet';
import { couts } from './couts';
import { intervalles } from './intervalles';
import { location } from './location';
import { obligation } from './obligation';
import type { Guide, GuideContent } from './types';

export type { Guide, GuideContent, GuideSection } from './types';

/** Ordre d'affichage dans la page des guides et dans les liens « À lire aussi ». */
export const GUIDES: readonly Guide[] = [carnet, obligation, location, intervalles, couts];

export function guideBySlug(locale: AppLocale, slug: string): Guide | undefined {
  return GUIDES.find((g) => g.content[locale].slug === slug);
}

/** Chemin sans langue d'un guide dans une langue : « /guides/wartungsheft-baumaschinen ». */
export function guidePath(guide: Guide, locale: AppLocale): string {
  return `/guides/${guide.content[locale].slug}`;
}

/** Tous les couples (langue, slug) : pages générées au déploiement. */
export function guideParams(): { locale: AppLocale; slug: string }[] {
  return routing.locales.flatMap((locale) => GUIDES.map((g) => ({ locale, slug: g.content[locale].slug })));
}

export function guideContent(guide: Guide, locale: AppLocale): GuideContent {
  return guide.content[locale];
}

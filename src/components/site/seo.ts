import 'server-only';

import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { heroImage } from '@/components/site/hero-image';
import { routing, type AppLocale } from '@/i18n/routing';

/** Paramètres d'une page localisée (Next : une Promise). */
export type LocaleParams = Promise<{ locale: string }>;

/** Langue d'une page : vérifiée (sinon 404). */
export function checkLocale(value: string): AppLocale {
  if (!hasLocale(routing.locales, value)) notFound();
  return value;
}

/** Langue pour les métadonnées (sans 404 : la page s'en charge). */
export function metaLocale(value: string): AppLocale {
  return hasLocale(routing.locales, value) ? value : routing.defaultLocale;
}

/** Langue Open Graph : variantes suisses pour fr, de, it ; anglais britannique. */
export function ogLocale(locale: AppLocale): string {
  return locale === 'en' ? 'en_GB' : `${locale}_CH`;
}

/** Pages publiques sans intérêt dans Google (connexion, boîte à idées) : pas indexées, mais liens suivis. */
export const NO_INDEX_FOLLOW = { index: false, follow: true } as const;

/** Métadonnées des pages privées ou techniques : jamais indexées. */
export const NO_INDEX = { index: false, follow: false } as const;

/** Image commune des aperçus de liens (src/app/opengraph-image.jpg, servie à la racine). */
const OG_DEFAULT = { url: '/opengraph-image.jpg', width: 1200, height: 630 } as const;

/**
 * Images Open Graph d'une page publique : la capture du showroom dans la langue (comme sur l'accueil), sinon l'image
 * commune. À passer dans `openGraph.images` : une page qui définit `openGraph` ne reçoit pas l'image de la racine.
 */
export async function ogImages(locale: AppLocale): Promise<{ url: string; width: number; height: number; alt: string }[]> {
  const t = await getTranslations({ locale, namespace: 'site.meta' });
  const hero = heroImage(locale);
  const img = hero ? { url: hero.src, width: hero.width, height: hero.height } : OG_DEFAULT;
  return [{ ...img, alt: t('ogImageAlt') }];
}

import 'server-only';

import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
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

/** Métadonnées des pages privées ou techniques : jamais indexées. */
export const NO_INDEX = { index: false, follow: false } as const;

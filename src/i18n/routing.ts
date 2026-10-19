import { defineRouting } from 'next-intl/routing';

// Langues de Godet. Le français est la langue par défaut : ses pages n'ont pas de préfixe (/garage),
// les autres en ont un (/de/garage, /it/garage, /en/garage).
export const routing = defineRouting({
  locales: ['fr', 'de', 'it', 'en'],
  defaultLocale: 'fr',
  localePrefix: 'as-needed',
  localeCookie: { name: 'godet-lang', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' },
});

export type AppLocale = (typeof routing.locales)[number];

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === 'string' && (routing.locales as readonly string[]).includes(value);
}

/** Langue du document HTML (variantes suisses pour fr, de, it). */
export function htmlLang(locale: AppLocale): string {
  return locale === 'en' ? 'en' : `${locale}-CH`;
}

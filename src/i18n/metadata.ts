import { getPathname } from './navigation';
import { routing, type AppLocale } from './routing';

/**
 * Liens canoniques et variantes linguistiques d'une page publique (balises hreflang).
 * `path` est le chemin sans langue : « / », « /demo », « /confidentialite ».
 */
export function localizedAlternates(path: string, locale: AppLocale) {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = getPathname({ href: path, locale: l });
  languages['x-default'] = getPathname({ href: path, locale: routing.defaultLocale });
  return { canonical: getPathname({ href: path, locale }), languages };
}

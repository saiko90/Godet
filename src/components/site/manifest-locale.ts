// Langue d'une requête sans page (manifeste) : cookie de langue, puis en-tête Accept-Language, puis le français.
import { isAppLocale, routing, type AppLocale } from '@/i18n/routing';
import { LOCALE_COOKIE } from './nav';

export function cookieLocale(cookieHeader: string | null, acceptLanguage: string | null): AppLocale {
  const fromCookie = (cookieHeader ?? '')
    .split(';')
    .map((part) => part.trim().split('='))
    .find(([name]) => name === LOCALE_COOKIE)?.[1];
  if (isAppLocale(fromCookie)) return fromCookie;

  // « de-CH,de;q=0.9,fr;q=0.8,en;q=0.7 » → la première langue connue, par ordre de préférence.
  const ranked = (acceptLanguage ?? '')
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
      return { lang: tag.toLowerCase().split('-')[0], q: q ? Number(q.slice(2)) || 0 : 1 };
    })
    .filter((entry) => entry.lang)
    .sort((a, b) => b.q - a.q);
  const match = ranked.find((entry) => isAppLocale(entry.lang));
  return match && isAppLocale(match.lang) ? match.lang : routing.defaultLocale;
}

import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { siteUrl } from '@/lib/env';

/** Pages réservées (comptes, application, administration) : exclues dans toutes les langues. */
const PRIVATE = ['/garage', '/bienvenue', '/parametres', '/carnet/', '/invitation/', '/mot-de-passe', '/admin'];

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  const prefixes = ['', ...routing.locales.filter((l) => l !== routing.defaultLocale).map((l) => `/${l}`)];
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/auth/', ...prefixes.flatMap((prefix) => PRIVATE.map((path) => `${prefix}${path}`))],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}

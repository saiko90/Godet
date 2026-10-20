import type { MetadataRoute } from 'next';
import { localizePath } from '@/components/site/nav';
import { routing } from '@/i18n/routing';
import { siteUrl } from '@/lib/env';

/** Pages publiques (chemin sans langue), avec leur fréquence de mise à jour et leur priorité. */
const PAGES: { path: string; changeFrequency: 'monthly' | 'yearly'; priority: number }[] = [
  { path: '/', changeFrequency: 'monthly', priority: 1 },
  { path: '/demo', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/contact', changeFrequency: 'yearly', priority: 0.6 },
  { path: '/idees', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/connexion', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/confidentialite', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/securite', changeFrequency: 'yearly', priority: 0.3 },
];

/** Chaque page publique dans les 4 langues, avec ses variantes (hreflang) et la version par défaut. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const url = (path: string) => `${base}${path}`;
  return PAGES.flatMap((page) => {
    const languages: Record<string, string> = {};
    for (const locale of routing.locales) languages[locale] = url(localizePath(page.path, locale));
    languages['x-default'] = url(localizePath(page.path, routing.defaultLocale));
    return routing.locales.map((locale) => ({
      url: url(localizePath(page.path, locale)),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: { languages },
    }));
  });
}

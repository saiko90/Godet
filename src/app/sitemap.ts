import type { MetadataRoute } from 'next';
import { localizePath } from '@/components/site/nav';
import { GUIDES, guidePath } from '@/content/guides';
import { routing } from '@/i18n/routing';
import { siteUrl } from '@/lib/env';

/**
 * Pages publiques (chemin sans langue), avec leur fréquence de mise à jour et leur priorité. /connexion et /idees n'y
 * sont pas : pages sans intention de recherche, en noindex (liens toujours suivis).
 */
const PAGES: { path: string; changeFrequency: 'monthly' | 'yearly'; priority: number }[] = [
  { path: '/', changeFrequency: 'monthly', priority: 1 },
  { path: '/demo', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/demo/location', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/guides', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/contact', changeFrequency: 'yearly', priority: 0.6 },
  { path: '/confidentialite', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/securite', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/aide', changeFrequency: 'monthly', priority: 0.5 },
];

/** Chaque page publique dans les 4 langues, avec ses variantes (hreflang) et la version par défaut. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const url = (path: string) => `${base}${path}`;
  // Guides : adresse traduite dans chaque langue (/guides/carnet-…, /de/guides/wartungsheft-…).
  const guides = GUIDES.flatMap((guide) => {
    const languages: Record<string, string> = {};
    for (const locale of routing.locales) languages[locale] = url(localizePath(guidePath(guide, locale), locale));
    languages['x-default'] = languages[routing.defaultLocale];
    return routing.locales.map((locale) => ({
      url: languages[locale],
      lastModified: guide.updated,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
      alternates: { languages },
    }));
  });
  return [...pagesMap(url), ...guides];
}

function pagesMap(url: (path: string) => string): MetadataRoute.Sitemap {
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

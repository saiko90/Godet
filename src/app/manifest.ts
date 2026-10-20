import type { MetadataRoute } from 'next';
import { getTranslations } from 'next-intl/server';
import { headers } from 'next/headers';
import { cookieLocale } from '@/components/site/manifest-locale';
import { htmlLang } from '@/i18n/routing';

/**
 * Manifeste de l'application installable. Il est demandé par le navigateur sans le contexte de la page :
 * sa langue suit le cookie de langue s'il est envoyé, sinon les langues préférées du navigateur.
 * L'adresse de départ (/garage) s'ouvre ensuite dans la langue mémorisée.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const h = await headers();
  const locale = cookieLocale(h.get('cookie'), h.get('accept-language'));
  const t = await getTranslations({ locale, namespace: 'site.manifest' });
  return {
    name: t('name'),
    short_name: 'Godet',
    description: t('description'),
    lang: htmlLang(locale),
    start_url: '/garage',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#08090b',
    theme_color: '#08090b',
    categories: ['business', 'productivity', 'utilities'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}

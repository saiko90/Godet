import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Godet — le garage de votre parc d’engins',
    short_name: 'Godet',
    description: 'Carnet d’entretien des machines de chantier : services, réparations, pièces, coûts, photos et vidéos.',
    lang: 'fr-CH',
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

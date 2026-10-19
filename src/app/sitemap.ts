import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/env';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    { url: `${base}/`, changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/demo`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/connexion`, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${base}/confidentialite`, changeFrequency: 'yearly', priority: 0.2 },
  ];
}

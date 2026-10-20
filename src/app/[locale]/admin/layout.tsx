import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { requireAdmin } from './guard';

// Console privée : jamais indexée.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Le contrôle d'accès se fait ici, avant l'écran de chargement (loading.tsx) : une personne qui n'est pas
 * administratrice reçoit une vraie 404 (statut HTTP compris), la console reste invisible. Chaque page et chaque
 * action revérifie de son côté (les navigations internes ne repassent pas par ce layout), et la RLS protège
 * les tables quoi qu'il arrive.
 */
export default async function AdminLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  await requireAdmin();
  return children;
}

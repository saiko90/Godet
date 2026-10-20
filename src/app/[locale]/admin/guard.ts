import 'server-only';

import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import type { AppMessages } from '@/i18n/messages';
import { routing } from '@/i18n/routing';
import { supabaseServer } from '@/lib/supabase/server';

export type AdminSupabase = Awaited<ReturnType<typeof supabaseServer>>;

export interface AdminContext {
  supabase: AdminSupabase;
  userId: string;
  email: string;
}

/**
 * La personne connectée est-elle administratrice de la plateforme (Swiss Digital Studio) ?
 * Vérifié par la base (public.is_platform_admin : adresse confirmée inscrite dans private.platform_admin_emails).
 * null : personne n'est connecté, ou la personne n'est pas administratrice. Une panne de la base lève une erreur.
 * Mis en cache pour la durée d'une requête (la page et ses métadonnées ne vérifient qu'une fois).
 */
export const getAdmin = cache(async (): Promise<AdminContext | null> => {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return null;
  const { data, error } = await supabase.rpc('is_platform_admin');
  if (error) throw new Error(`Administration : vérification impossible (${error.code || error.message})`);
  if (data !== true) return null;
  return { supabase, userId: user.id, email: user.email ?? '' };
});

/** Pages de la console : 404 pour toute personne qui n'est pas administratrice (la console reste invisible). */
export async function requireAdmin(): Promise<AdminContext> {
  const admin = await getAdmin();
  if (!admin) notFound();
  return admin;
}

/**
 * Titre d'onglet d'une page de la console (`company` : fiche d'un prospect). Pour une personne qui n'est pas
 * administratrice, la page est une 404 : son titre aussi, sinon l'onglet trahirait la console (« Console »…).
 */
export async function adminPageTitle(
  locale: string,
  key: Exclude<keyof AppMessages['admin']['meta'], 'prospect'>,
  company?: string,
): Promise<string> {
  const l = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  const admin = await getAdmin().catch(() => null);
  if (!admin) return (await getTranslations({ locale: l, namespace: 'site.notFound' }))('metaTitle');
  const t = await getTranslations({ locale: l, namespace: 'admin.meta' });
  return company ? t('prospect', { company }) : t(key);
}

/**
 * Adresse publique du site, pour les liens envoyés aux prospects : l'adresse de production si elle est configurée
 * (NEXT_PUBLIC_SITE_URL ou domaine de production Vercel), sinon celle de la requête.
 */
export async function publicBaseUrl(): Promise<string> {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '');
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  if (!host) return 'http://localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (/^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? 'http' : 'https');
  return `${proto.split(',')[0].trim()}://${host}`;
}

/** Jour de Zurich au format ISO (AAAA-MM-JJ), décalé de `days` jours. */
export function zurichDay(days = 0, now: Date = new Date()): string {
  const shifted = new Date(now.getTime() + days * 86_400_000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich', year: 'numeric', month: '2-digit', day: '2-digit' }).format(shifted);
}

/** Horodatage ISO d'il y a `days` jours (début d'une période de statistiques). */
export function daysAgoIso(days: number, now: Date = new Date()): string {
  return new Date(now.getTime() - days * 86_400_000).toISOString();
}

/** Lit toutes les lignes d'une requête par pages de 1000 (l'API plafonne chaque réponse). */
export async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { code?: string; message: string } | null }>,
  max = 20_000,
): Promise<T[]> {
  const out: T[] = [];
  const size = 1000;
  for (let from = 0; from < max; from += size) {
    const { data, error } = await page(from, from + size - 1);
    if (error) throw new Error(`Administration : lecture impossible (${error.code || error.message})`);
    out.push(...(data ?? []));
    if (!data || data.length < size) break;
  }
  return out;
}

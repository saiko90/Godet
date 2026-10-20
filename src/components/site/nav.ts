// Aides de navigation partagées par les pages du site, les routes d'authentification et les actions serveur.
import { isAppLocale, routing, type AppLocale } from '@/i18n/routing';

const BASE = 'https://godet.invalid';

/** Cookie de la langue choisie (défini dans src/i18n/routing.ts). */
const cookieConfig = routing.localeCookie;
export const LOCALE_COOKIE = (typeof cookieConfig === 'object' && cookieConfig.name) || 'NEXT_LOCALE';

/** Code de suivi des liens envoyés par les agents (?ref=code) : cookie de 30 jours, transmis à l'inscription. */
export const REF_COOKIE = 'godet-ref';
export const REF_MAX_AGE = 60 * 60 * 24 * 30;

/** Code de suivi valable (mêmes règles que la base : minuscules, chiffres, tirets, 4 à 40 caractères). */
export function isRefCode(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9-]{4,40}$/.test(value);
}

/** Langue d'un cookie, ou la langue par défaut. */
export function localeOr(value: string | null | undefined, fallback: AppLocale = routing.defaultLocale): AppLocale {
  return isAppLocale(value) ? value : fallback;
}

/**
 * Sépare la langue d'un chemin interne : « /de/garage?m=1 » → { locale: 'de', path: '/garage?m=1' } ;
 * « /garage » → { locale: null, path: '/garage' } (français, sans préfixe).
 */
export function splitLocale(path: string): { locale: AppLocale | null; path: string } {
  const match = /^\/([a-z]{2})(?=[/?#]|$)/.exec(path);
  if (match && isAppLocale(match[1])) {
    const rest = path.slice(match[0].length);
    return { locale: match[1], path: rest.startsWith('/') ? rest : `/${rest}` };
  }
  return { locale: null, path };
}

/** Chemin dans une langue (le français n'a pas de préfixe) : ('/garage', 'de') → '/de/garage' ; ('/', 'it') → '/it'. */
export function localizePath(path: string, locale: AppLocale): string {
  if (locale === routing.defaultLocale) return path;
  if (path === '/') return `/${locale}`;
  if (path.startsWith('/?') || path.startsWith('/#')) return `/${locale}${path.slice(1)}`;
  return `/${locale}${path}`;
}

/** Partie « chemin » d'une adresse interne (sans paramètres ni ancre). */
function pathnameOf(path: string): string {
  return path.split(/[?#]/)[0] || '/';
}

/**
 * Chemin interne sûr pour une redirection (« /garage », « /de/invitation/abc?x=1 »).
 * Refuse tout ce qui pourrait sortir du site (« //exemple.ch », « /\exemple.ch », « https://… »)
 * et les pages d'authentification, dans toutes les langues (pour éviter les boucles). Sinon : `fallback`.
 */
export function safePath(input: string | null | undefined, fallback: string): string {
  if (typeof input !== 'string') return fallback;
  const value = input.trim();
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;
  let url: URL;
  try {
    url = new URL(value, BASE);
  } catch {
    return fallback;
  }
  if (url.origin !== BASE) return fallback;
  const { path } = splitLocale(url.pathname);
  if (path === '/connexion' || path === '/auth' || path.startsWith('/auth/')) return fallback;
  return `${url.pathname}${url.search}${url.hash}`;
}

/** Chemin de la page de connexion (sans paramètres) dans une langue : « /connexion », « /de/connexion »… */
export function isConnexionPath(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const { locale, path } = splitLocale(value);
  return path === '/connexion' && (locale !== null || value === '/connexion');
}

/** Premier élément d'un paramètre de recherche Next (`string | string[] | undefined`). */
export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Adresse e-mail plausible (la vérification réelle est faite par Supabase). */
export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) && value.length <= 200;
}

/** Identifiant UUID (machines, membres, invitations). */
export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/** Jeton d'invitation (hexadécimal, 36 caractères à la création ; on reste tolérant). */
export function isInvitationToken(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{16,128}$/.test(value);
}

/** Options du cookie qui mémorise l'entreprise active (préférence non sensible : la RLS protège les données). */
export const ORG_COOKIE_OPTIONS = {
  path: '/',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 365,
  secure: process.env.NODE_ENV === 'production',
};

/**
 * Où envoyer une personne dont le lien d'e-mail n'a pas fonctionné : la connexion (dans la langue de la suite
 * prévue, sinon `locale`), avec un message lisible, en gardant la suite prévue (sauf pour le mot de passe oublié,
 * la création de l'entreprise et le garage : il faut alors simplement se connecter ou demander un nouveau lien).
 */
export function linkErrorPath(suite: string, locale: AppLocale): string {
  const split = splitLocale(pathnameOf(suite));
  const params = new URLSearchParams({ erreur: 'lien' });
  if (suite && !['/garage', '/mot-de-passe', '/bienvenue'].includes(split.path)) params.set('suite', suite);
  return `${localizePath('/connexion', split.locale ?? locale)}?${params.toString()}`;
}

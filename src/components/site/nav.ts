// Aides de navigation partagées par les pages du site, les routes d'authentification et les actions serveur.

const BASE = 'https://godet.invalid';

/**
 * Chemin interne sûr pour une redirection (« /garage », « /invitation/abc?x=1 »).
 * Refuse tout ce qui pourrait sortir du site (« //exemple.ch », « /\exemple.ch », « https://… »)
 * et les pages d'authentification (pour éviter les boucles). Sinon : `fallback`.
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
  if (url.pathname === '/connexion' || url.pathname === '/auth' || url.pathname.startsWith('/auth/')) return fallback;
  return `${url.pathname}${url.search}${url.hash}`;
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
 * Où envoyer une personne dont le lien d'e-mail n'a pas fonctionné : la connexion, avec un message lisible,
 * en gardant la suite prévue (sauf pour le mot de passe oublié : il faut alors un nouveau lien).
 */
export function linkErrorPath(suite: string): string {
  const params = new URLSearchParams({ erreur: 'lien' });
  if (suite && suite !== '/garage' && suite !== '/mot-de-passe' && suite !== '/bienvenue') params.set('suite', suite);
  return `/connexion?${params.toString()}`;
}

// Valeurs publiques du projet Supabase « Godet » : elles finissent de toute façon dans le navigateur.
// Les variables d’environnement priment ; les valeurs par défaut évitent une panne si elles manquent.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cluavztpktcmsynzvojf.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_ufgXvTw-4N2CiAOLEx2hRA_US7NSuL3';

/** Adresse publique du site, sans barre finale (liens d’invitation, retours de connexion). */
export function siteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '');
  if (typeof window !== 'undefined') return window.location.origin;
  return (fromEnv || 'http://localhost:3000').replace(/\/$/, '');
}

export const MEDIA_BUCKET = 'medias';

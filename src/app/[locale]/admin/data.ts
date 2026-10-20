import 'server-only';

import type { AdminSupabase } from './guard';

export interface NavCounts {
  messages: number;
  ideas: number;
  drafts: number;
}

/** Ce qui attend Michaël (pastilles de la navigation) : messages et idées nouveaux, brouillons à relire. */
export async function navCounts(supabase: AdminSupabase): Promise<NavCounts> {
  const [messages, ideas, drafts] = await Promise.all([
    supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', 'nouveau'),
    supabase.from('ideas').select('id', { count: 'exact', head: true }).eq('status', 'nouvelle'),
    supabase.from('outreach').select('id', { count: 'exact', head: true }).eq('status', 'brouillon'),
  ]);
  for (const r of [messages, ideas, drafts]) if (r.error) console.error('[admin] compteurs :', r.error.code, r.error.message);
  return { messages: messages.count ?? 0, ideas: ideas.count ?? 0, drafts: drafts.count ?? 0 };
}

/** Premier élément d'un paramètre d'adresse (`string | string[] | undefined`). */
export function param(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? '';
}

/** Numéro de page (1 par défaut). */
export function pageParam(value: string | string[] | undefined): number {
  const n = Number(param(value));
  return Number.isInteger(n) && n > 1 && n < 10_000 ? n : 1;
}

/** Échappe un texte pour un filtre `ilike` de PostgREST (les jokers deviennent des caractères ordinaires). */
export function likePattern(text: string): string {
  return `%${text.replace(/[\\%_]/g, (c) => `\\${c}`).replace(/[,()]/g, ' ')}%`;
}

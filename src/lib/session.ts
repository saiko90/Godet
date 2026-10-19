import 'server-only';

import { cookies } from 'next/headers';
import { supabaseServer } from '@/lib/supabase/server';
import type { MemberRole, Org, SessionContext } from '@/lib/types';

/** Cookie qui mémorise l'entreprise active quand une personne en a plusieurs. */
export const ORG_COOKIE = 'godet-org';

export type SessionResult =
  | { status: 'anon' }
  | { status: 'no-org'; userId: string; email: string; fullName: string | null }
  | { status: 'ok'; ctx: SessionContext };

/**
 * Qui est connecté et dans quelle entreprise. À appeler depuis un composant serveur, une action ou une route.
 * - anon : personne n'est connecté ;
 * - no-org : connecté mais sans entreprise (→ /bienvenue) ;
 * - ok : contexte complet (entreprise active, rôle, autres entreprises).
 */
export async function getSession(): Promise<SessionResult> {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return { status: 'anon' };

  const [{ data: rows }, { data: profile }] = await Promise.all([
    supabase.from('memberships').select('role, org_id, organizations(*)').eq('user_id', user.id),
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
  ]);

  const fullName = profile?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? null;
  const email = user.email ?? '';
  const memberships = (rows ?? [])
    .map((r) => ({ role: r.role as MemberRole, org: r.organizations as unknown as Org | null }))
    .filter((r): r is { role: MemberRole; org: Org } => Boolean(r.org));

  if (!memberships.length) return { status: 'no-org', userId: user.id, email, fullName };

  const preferred = (await cookies()).get(ORG_COOKIE)?.value;
  const active = memberships.find((m) => m.org.id === preferred) ?? memberships[0];

  return {
    status: 'ok',
    ctx: {
      userId: user.id,
      email,
      fullName,
      org: active.org,
      role: active.role,
      orgs: memberships.map((m) => ({ id: m.org.id, name: m.org.name, role: m.role })),
    },
  };
}

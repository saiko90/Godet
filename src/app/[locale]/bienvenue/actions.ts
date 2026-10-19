'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSession, ORG_COOKIE } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import { isCanton } from '@/components/site/cantons';
import { ORG_COOKIE_OPTIONS } from '@/components/site/nav';
import type { BienvenueState } from '@/components/site/types';

const NB = '\u00a0';

/** Crée l'entreprise (la personne en devient propriétaire), ajoute la pelle de démonstration si demandé. */
export async function creerEntreprise(_prev: BienvenueState, formData: FormData): Promise<BienvenueState> {
  const nom = String(formData.get('nom') ?? '').replace(/\s+/g, ' ').trim();
  const canton = String(formData.get('canton') ?? '').trim().toUpperCase();
  const demo = formData.get('demo') === 'on';
  const values = { nom, canton, demo };

  const errors: BienvenueState['errors'] = {};
  if (nom.length < 2) errors.nom = `Indiquez le nom de votre entreprise (2${NB}caractères au moins).`;
  else if (nom.length > 80) errors.nom = `80${NB}caractères au maximum.`;
  if (canton && !isCanton(canton)) errors.canton = 'Choisissez un canton dans la liste.';
  if (errors.nom || errors.canton) return { values, errors, message: null };

  const session = await getSession();
  if (session.status === 'anon') redirect('/connexion?suite=/bienvenue');
  // Déjà membre d'une entreprise (double clic, autre onglet) : pas de seconde entreprise.
  if (session.status === 'ok') redirect('/garage');

  const supabase = await supabaseServer();
  const { data: orgId, error } = await supabase.rpc('create_organization', {
    p_name: nom,
    ...(canton ? { p_canton: canton } : {}),
  });
  if (error || !orgId) {
    console.error('[bienvenue] create_organization :', error?.code, error?.message);
    return { values, errors, message: 'Le garage n’a pas pu être créé. Réessayez dans un instant.' };
  }

  if (demo) {
    // Facultative : si elle échoue, le garage est quand même ouvert (on peut ajouter ses machines).
    const { error: demoError } = await supabase.rpc('create_demo_machine', { p_org: orgId });
    if (demoError) console.error('[bienvenue] create_demo_machine :', demoError.code, demoError.message);
  }

  (await cookies()).set(ORG_COOKIE, orgId, ORG_COOKIE_OPTIONS);
  revalidatePath('/', 'layout');
  redirect('/garage');
}

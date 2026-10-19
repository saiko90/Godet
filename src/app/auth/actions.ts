'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ORG_COOKIE } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import { safePath } from '@/components/site/nav';

/** Déconnexion de cet appareil, puis retour vers `suite` (chemin interne) ou l'accueil. */
export async function seDeconnecter(formData: FormData): Promise<void> {
  const raw = formData.get('suite');
  const suite = raw === '/connexion' ? '/connexion' : safePath(typeof raw === 'string' ? raw : null, '/');
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) console.warn('[deconnexion]', error.code ?? error.message);
  (await cookies()).delete(ORG_COOKIE);
  revalidatePath('/', 'layout');
  redirect(suite);
}

'use server';

import { getLocale } from 'next-intl/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { isConnexionPath, localeOr, safePath, splitLocale } from '@/components/site/nav';
import { redirect } from '@/i18n/navigation';
import { ORG_COOKIE } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';

/**
 * Déconnexion de cet appareil, puis retour vers `suite` (chemin interne localisé, ou la page de connexion)
 * ou l'accueil, dans la langue de la page.
 */
export async function seDeconnecter(formData: FormData): Promise<void> {
  const raw = formData.get('suite');
  const current = localeOr(await getLocale());
  const suite = isConnexionPath(raw) ? raw : safePath(typeof raw === 'string' ? raw : null, '/');
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) console.warn('[deconnexion]', error.code ?? error.message);
  (await cookies()).delete(ORG_COOKIE);
  revalidatePath('/', 'layout');
  const target = splitLocale(suite);
  return redirect({ href: target.path, locale: target.locale ?? current });
}

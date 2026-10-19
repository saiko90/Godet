'use server';

import { isAppLocale } from '@/i18n/routing';
import { supabaseServer } from '@/lib/supabase/server';

/** Mémorise la langue choisie dans le profil (e-mails et rappels dans la bonne langue). Sans session : rien. */
export async function saveProfileLocale(locale: string): Promise<void> {
  if (!isAppLocale(locale)) return;
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from('profiles').update({ locale }).eq('id', data.user.id);
}

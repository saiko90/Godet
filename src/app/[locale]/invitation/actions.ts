'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isInvitationToken, ORG_COOKIE_OPTIONS } from '@/components/site/nav';
import type { MessageState } from '@/components/site/types';
import { getSession, ORG_COOKIE } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';

/** Messages de la fonction accept_invitation, reformulés pour l'écran. */
function inviteError(raw: string | undefined): string {
  const m = (raw ?? '').toLowerCase();
  if (m.includes('déjà été utilisée')) return 'Cette invitation a déjà été utilisée.';
  if (m.includes('expiré')) return 'Cette invitation a expiré. Demandez-en une nouvelle à la personne qui vous a invité.';
  if (m.includes('prévue pour')) return 'Cette invitation est prévue pour une autre adresse e-mail.';
  if (m.includes('introuvable')) return 'Invitation introuvable\u00a0: elle a peut-être été révoquée.';
  if (m.includes('connexion requise')) return 'Connectez-vous pour accepter l’invitation.';
  return 'L’invitation n’a pas pu être acceptée. Réessayez dans un instant.';
}

/** Accepte l'invitation : la personne rejoint l'entreprise, qui devient son entreprise active. */
export async function accepterInvitation(_prev: MessageState, formData: FormData): Promise<MessageState> {
  const token = formData.get('token');
  if (!isInvitationToken(token)) return { message: 'Invitation introuvable.' };

  const session = await getSession();
  if (session.status === 'anon') redirect(`/connexion?suite=${encodeURIComponent(`/invitation/${token}`)}`);

  const supabase = await supabaseServer();
  const { data: orgId, error } = await supabase.rpc('accept_invitation', { p_token: token });
  if (error || !orgId) {
    if (error) console.warn('[invitation] accept_invitation :', error.code, error.message);
    return { message: inviteError(error?.message) };
  }

  (await cookies()).set(ORG_COOKIE, orgId, ORG_COOKIE_OPTIONS);
  revalidatePath('/', 'layout');
  redirect('/garage');
}

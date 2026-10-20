'use server';

import { getLocale, getTranslations } from 'next-intl/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { isInvitationToken, localeOr, localizePath, ORG_COOKIE_OPTIONS } from '@/components/site/nav';
import type { MessageState } from '@/components/site/types';
import { redirect } from '@/i18n/navigation';
import { getSession, ORG_COOKIE } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';

type InviteErrorKey = 'used' | 'expired' | 'otherEmail' | 'revoked' | 'loginRequired' | 'failed';

/** Messages (en français) de la fonction accept_invitation → clé du message traduit. */
function inviteError(raw: string | undefined): InviteErrorKey {
  const m = (raw ?? '').toLowerCase();
  if (m.includes('déjà été utilisée')) return 'used';
  if (m.includes('expiré')) return 'expired';
  if (m.includes('prévue pour')) return 'otherEmail';
  if (m.includes('introuvable')) return 'revoked';
  if (m.includes('connexion requise')) return 'loginRequired';
  return 'failed';
}

/** Accepte l'invitation : la personne rejoint l'entreprise, qui devient son entreprise active. */
export async function accepterInvitation(_prev: MessageState, formData: FormData): Promise<MessageState> {
  const locale = localeOr(await getLocale());
  const t = await getTranslations({ locale, namespace: 'auth.invitation.errors' });
  const token = formData.get('token');
  if (!isInvitationToken(token)) return { message: t('notFound') };

  const session = await getSession();
  if (session.status === 'anon') {
    return redirect({ href: { pathname: '/connexion', query: { suite: localizePath(`/invitation/${token}`, locale) } }, locale });
  }

  const supabase = await supabaseServer();
  const { data: orgId, error } = await supabase.rpc('accept_invitation', { p_token: token });
  if (error || !orgId) {
    if (error) console.warn('[invitation] accept_invitation :', error.code, error.message);
    return { message: t(inviteError(error?.message)) };
  }

  (await cookies()).set(ORG_COOKIE, orgId, ORG_COOKIE_OPTIONS);
  revalidatePath('/', 'layout');
  return redirect({ href: '/garage', locale });
}

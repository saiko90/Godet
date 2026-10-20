'use server';

import { getLocale, getTranslations } from 'next-intl/server';
import { revalidatePath } from 'next/cache';
import { localeOr, looksLikeEmail } from '@/components/site/nav';
import type { PublicFormState } from '@/components/site/types';
import { getSession } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';

const CATEGORIES = ['3d', 'carnet', 'echeances', 'couts', 'medias', 'equipe', 'notifications', 'mobile', 'autre'] as const;

function field(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

/**
 * Idée de la boîte à idées → submit_idea. Connecté : liée au compte et à l'entreprise active ; sinon, avec un e-mail.
 * Le champ « website » est un piège à robots : rempli, la base ignore l'idée sans erreur.
 */
export async function envoyerIdee(prev: PublicFormState, formData: FormData): Promise<PublicFormState> {
  const locale = localeOr(await getLocale());
  const t = await getTranslations({ locale, namespace: 'ideas.errors' });
  const session = await getSession();
  const signedIn = session.status !== 'anon';

  const title = field(formData, 'titre').replace(/\s+/g, ' ');
  const categoryRaw = field(formData, 'categorie');
  const category = (CATEGORIES as readonly string[]).includes(categoryRaw) ? categoryRaw : 'autre';
  const details = field(formData, 'details');
  const email = signedIn ? '' : field(formData, 'email').toLowerCase();
  const website = field(formData, 'website').slice(0, 200);

  const values = { titre: title, categorie: category, details, email };
  const errors: Record<string, string> = {};
  if (title.length < 3) errors.titre = t('titleShort');
  else if (title.length > 120) errors.titre = t('titleLong');
  if (details.length > 4000) errors.details = t('detailsLong');
  if (!signedIn) {
    if (!email) errors.email = t('emailRequired');
    else if (!looksLikeEmail(email)) errors.email = t('emailInvalid');
  }
  if (Object.keys(errors).length) return { ...prev, status: 'error', message: t('checkFields'), errors, values };

  const supabase = await supabaseServer();
  const { error } = await supabase.rpc('submit_idea', {
    p: {
      title,
      category,
      details,
      email,
      // Entreprise active de la personne connectée (la base vérifie qu'elle en est membre).
      org_id: session.status === 'ok' ? session.ctx.org.id : '',
      locale,
      website,
    },
  });

  if (error) {
    switch (error.message) {
      case 'idea_title_too_short':
        return { ...prev, status: 'error', message: t('checkFields'), errors: { titre: t('titleShort') }, values };
      case 'invalid_email':
        return { ...prev, status: 'error', message: t('checkFields'), errors: { email: t('emailInvalid') }, values };
      case 'rate_limited':
        return { ...prev, status: 'error', message: t('rateLimited'), errors: {}, values };
      case 'busy':
        return { ...prev, status: 'error', message: t('busy'), errors: {}, values };
      default:
        console.error('[idees] submit_idea :', error.code, error.message);
        return { ...prev, status: 'error', message: t('generic'), errors: {}, values };
    }
  }

  // La liste « Mes idées » de la page se met à jour.
  if (signedIn) revalidatePath('/[locale]/idees', 'page');
  return { status: 'sent', message: null, errors: {}, values: {}, sent: prev.sent + 1 };
}

'use server';

import { getLocale, getTranslations } from 'next-intl/server';
import { isCountryCode } from '@/components/site/countries';
import { isRefCode, localeOr, localizePath, looksLikeEmail } from '@/components/site/nav';
import type { PublicFormState } from '@/components/site/types';
import { supabaseServer } from '@/lib/supabase/server';

const KINDS = ['demo', 'contact', 'partenaire', 'support'] as const;
const FLEET_SIZES = ['1-5', '6-20', '21-50', '50+'] as const;

function field(formData: FormData, key: string, max: number): string {
  const v = formData.get(key);
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

/**
 * Message du formulaire de contact → submit_contact (sans compte ; lié au compte si la personne est connectée).
 * Le champ « website » est un piège à robots : rempli, la base ignore le message sans erreur.
 */
export async function envoyerContact(prev: PublicFormState, formData: FormData): Promise<PublicFormState> {
  const locale = localeOr(await getLocale());
  const t = await getTranslations({ locale, namespace: 'contact.errors' });

  const kindRaw = field(formData, 'sujet', 20);
  const kind = (KINDS as readonly string[]).includes(kindRaw) ? kindRaw : 'contact';
  const name = field(formData, 'nom', 120);
  const email = field(formData, 'email', 200).toLowerCase();
  const company = field(formData, 'entreprise', 120);
  const phone = field(formData, 'telephone', 40);
  const countryRaw = field(formData, 'pays', 2).toUpperCase();
  const country = isCountryCode(countryRaw) ? countryRaw : '';
  const fleetRaw = field(formData, 'parc', 10);
  const fleet = (FLEET_SIZES as readonly string[]).includes(fleetRaw) ? fleetRaw : '';
  const rawMessage = typeof formData.get('message') === 'string' ? String(formData.get('message')).trim() : '';
  const consent = formData.get('consentement') === 'on';
  const website = field(formData, 'website', 200);
  const refRaw = field(formData, 'ref', 40).toLowerCase();
  const ref = isRefCode(refRaw) ? refRaw : '';

  const values = { sujet: kind, nom: name, email, entreprise: company, telephone: phone, pays: country, parc: fleet, message: rawMessage, consentement: consent ? 'on' : '' };
  const errors: Record<string, string> = {};
  if (!email) errors.email = t('emailRequired');
  else if (!looksLikeEmail(email)) errors.email = t('emailInvalid');
  if (rawMessage.length < 2) errors.message = t('messageRequired');
  else if (rawMessage.length > 4000) errors.message = t('messageTooLong');
  if (Object.keys(errors).length) return { ...prev, status: 'error', message: t('checkFields'), errors, values };

  // Origine du message : la page (dans sa langue) et, s'il existe, le code de suivi d'un lien d'agent.
  const source = `${localizePath('/contact', locale)}${ref ? `?ref=${ref}` : ''}`;
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc('submit_contact', {
    p: {
      kind,
      name,
      email,
      company,
      phone,
      country,
      fleet_size: fleet,
      message: rawMessage,
      consent,
      locale,
      source,
      website,
    },
  });

  if (error) {
    switch (error.message) {
      case 'invalid_email':
        return { ...prev, status: 'error', message: t('checkFields'), errors: { email: t('emailInvalid') }, values };
      case 'empty_message':
        return { ...prev, status: 'error', message: t('checkFields'), errors: { message: t('messageRequired') }, values };
      case 'rate_limited':
        return { ...prev, status: 'error', message: t('rateLimited'), errors: {}, values };
      case 'busy':
        return { ...prev, status: 'error', message: t('busy'), errors: {}, values };
      default:
        console.error('[contact] submit_contact :', error.code, error.message);
        return { ...prev, status: 'error', message: t('generic'), errors: {}, values };
    }
  }

  return { status: 'sent', message: null, errors: {}, values: { email }, sent: prev.sent + 1 };
}

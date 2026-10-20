'use server';

import { getLocale, getTranslations } from 'next-intl/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { isCanton } from '@/components/site/cantons';
import { isCountryCode } from '@/components/site/countries';
import { localeOr, localizePath, ORG_COOKIE_OPTIONS } from '@/components/site/nav';
import type { BienvenueState } from '@/components/site/types';
import { redirect } from '@/i18n/navigation';
import type { Json } from '@/lib/database.types';
import { buildDemoMachinePayload } from '@/lib/demo-content/machine-payload';
import { getSession, ORG_COOKIE } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';

/**
 * Crée l'entreprise (la personne en devient propriétaire) avec son pays (la devise en découle) et la langue
 * de la personne, puis ajoute la pelle de démonstration traduite si demandé.
 */
export async function creerEntreprise(_prev: BienvenueState, formData: FormData): Promise<BienvenueState> {
  const locale = localeOr(await getLocale());
  const t = await getTranslations({ locale, namespace: 'auth.welcome.errors' });
  const nom = String(formData.get('nom') ?? '').replace(/\s+/g, ' ').trim();
  const country = String(formData.get('pays') ?? 'CH').trim().toUpperCase();
  // Le canton n'a de sens qu'en Suisse.
  const canton = country === 'CH' ? String(formData.get('canton') ?? '').trim().toUpperCase() : '';
  const demo = formData.get('demo') === 'on';
  const values = { nom, country, canton, demo };

  const errors: BienvenueState['errors'] = {};
  if (nom.length < 2) errors.nom = t('nameShort');
  else if (nom.length > 80) errors.nom = t('nameLong');
  if (!isCountryCode(country)) errors.country = t('country');
  if (canton && !isCanton(canton)) errors.canton = t('canton');
  if (errors.nom || errors.country || errors.canton) return { values, errors, message: null };

  const login = { pathname: '/connexion', query: { suite: localizePath('/bienvenue', locale) } };
  const session = await getSession();
  if (session.status === 'anon') return redirect({ href: login, locale });
  // Déjà membre d'une entreprise (double clic, autre onglet) : pas de seconde entreprise.
  if (session.status === 'ok') return redirect({ href: '/garage', locale });

  const supabase = await supabaseServer();
  const { data: orgId, error } = await supabase.rpc('create_org', {
    p_name: nom,
    p_country: country,
    p_locale: locale,
    ...(canton ? { p_canton: canton } : {}),
  });
  if (error || !orgId) {
    // Codes d'erreur de la fonction create_org.
    if (error?.message === 'org_name_too_short') return { values, errors: { nom: t('nameShort') }, message: null };
    if (error?.message === 'invalid_country') return { values, errors: { country: t('country') }, message: null };
    if (error?.message === 'auth_required') return redirect({ href: login, locale });
    console.error('[bienvenue] create_org :', error?.code, error?.message);
    return { values, errors, message: t('failed') };
  }

  if (demo) {
    // Facultative : si elle échoue, le garage est quand même ouvert (on peut ajouter ses machines).
    const payload = buildDemoMachinePayload(locale);
    const { error: demoError } = await supabase.rpc('create_demo_machine_v2', {
      p_org: orgId,
      p_payload: payload as unknown as Json,
    });
    if (demoError) console.error('[bienvenue] create_demo_machine_v2 :', demoError.code, demoError.message);
  }

  (await cookies()).set(ORG_COOKIE, orgId, ORG_COOKIE_OPTIONS);
  revalidatePath('/', 'layout');
  return redirect({ href: '/garage', locale });
}

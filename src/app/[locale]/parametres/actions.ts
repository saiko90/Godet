'use server';

import { getLocale, getTranslations } from 'next-intl/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { authErrorKey } from '@/components/site/auth-errors';
import { isCanton } from '@/components/site/cantons';
import { isCountryCode, isCurrency } from '@/components/site/countries';
import { isUuid, localeOr, localizePath, looksLikeEmail, ORG_COOKIE_OPTIONS } from '@/components/site/nav';
import type { ActionResult, FormState, InviteState, PendingInvitation } from '@/components/site/types';
import { redirect } from '@/i18n/navigation';
import { isAppLocale, type AppLocale } from '@/i18n/routing';
import { can } from '@/lib/domain';
import { isEmailConfigured, sendInvitationEmail } from '@/lib/email';
import { siteUrl } from '@/lib/env';
import { getSession, ORG_COOKIE } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import type { MemberRole, SessionContext } from '@/lib/types';

// Toutes les actions revérifient la session et les droits : la RLS protège aussi les données,
// mais un message clair vaut mieux qu'un refus silencieux. Les messages sont dans la langue de la page.

const ASSIGNABLE: MemberRole[] = ['admin', 'mechanic', 'operator'];

async function texts() {
  const locale = localeOr(await getLocale());
  return { locale, t: await getTranslations({ locale, namespace: 'settings.messages' }) };
}

async function requireContext(locale: AppLocale): Promise<SessionContext> {
  const session = await getSession();
  if (session.status === 'anon') {
    return redirect({ href: { pathname: '/connexion', query: { suite: localizePath('/parametres', locale) } }, locale });
  }
  if (session.status === 'no-org') return redirect({ href: '/bienvenue', locale });
  return session.ctx;
}

function text(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '';
}

function refresh() {
  revalidatePath('/[locale]/parametres', 'page');
  revalidatePath('/[locale]/garage', 'page');
}

function fail(prev: FormState, message: string, errors: Record<string, string> = {}, values?: Record<string, string>): FormState {
  return { ok: false, message, errors, done: prev.done, values };
}

function success(prev: FormState, message: string): FormState {
  return { ok: true, message, errors: {}, done: prev.done + 1 };
}

// ---------------------------------------------------------------- entreprise

export async function enregistrerEntreprise(prev: FormState, formData: FormData): Promise<FormState> {
  const { locale, t } = await texts();
  const nom = text(formData, 'nom');
  const country = text(formData, 'pays').toUpperCase();
  // Le canton n'a de sens qu'en Suisse.
  const canton = country === 'CH' ? text(formData, 'canton').toUpperCase() : '';
  const currency = text(formData, 'devise').toUpperCase();
  const values = { nom, pays: country, canton, devise: currency };
  const errors: Record<string, string> = {};
  if (nom.length < 2) errors.nom = t('orgNameShort');
  else if (nom.length > 80) errors.nom = t('tooLong');
  if (!isCountryCode(country)) errors.pays = t('country');
  if (canton && !isCanton(canton)) errors.canton = t('canton');
  if (!isCurrency(currency)) errors.devise = t('currency');
  if (Object.keys(errors).length) return fail(prev, t('checkFields'), errors, values);

  const ctx = await requireContext(locale);
  if (!can.manageTeam(ctx.role)) return fail(prev, t('orgManagersOnly'), {}, values);

  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('organizations')
    .update({ name: nom, country, canton: canton || null, currency })
    .eq('id', ctx.org.id)
    .select('id');
  if (error || !data?.length) {
    if (error) console.error('[parametres] entreprise :', error.code, error.message);
    return fail(prev, t('generic'), {}, values);
  }
  refresh();
  return success(prev, t('orgSaved'));
}

export async function changerEntrepriseActive(orgId: string): Promise<ActionResult> {
  const { locale, t } = await texts();
  const ctx = await requireContext(locale);
  const target = ctx.orgs.find((o) => o.id === orgId);
  if (!isUuid(orgId) || !target) return { ok: false, message: t('orgNotFound') };
  (await cookies()).set(ORG_COOKIE, orgId, ORG_COOKIE_OPTIONS);
  revalidatePath('/', 'layout');
  return { ok: true, message: t('orgActive', { name: target.name }) };
}

// ---------------------------------------------------------------- équipe

type InvitationRow = { id: string; email: string; role: MemberRole; token: string; created_at: string; expires_at: string };

/**
 * Envoie l'invitation par e-mail (si Resend est configuré), dans la langue choisie, avec un lien dans cette langue.
 * Le lien part de l'adresse publique configurée (jamais de l'en-tête Host de la requête).
 * Renvoie null si l'envoi n'est pas configuré, sinon si l'e-mail est parti.
 */
async function emailInvitation(ctx: SessionContext, row: InvitationRow, emailLocale: AppLocale): Promise<boolean | null> {
  if (!isEmailConfigured()) return null;
  const result = await sendInvitationEmail({
    to: row.email,
    locale: emailLocale,
    orgName: ctx.org.name,
    inviterName: ctx.fullName,
    role: row.role,
    link: `${siteUrl()}${localizePath(`/invitation/${row.token}`, emailLocale)}`,
    expiresAt: row.expires_at,
    country: ctx.org.country,
    replyTo: ctx.email,
  });
  if (!result.sent) console.error('[parametres] e-mail d’invitation non envoyé :', result.reason);
  return result.sent;
}

export async function inviterMembre(prev: InviteState, formData: FormData): Promise<InviteState> {
  const { locale, t } = await texts();
  const email = text(formData, 'email').toLowerCase();
  const role = text(formData, 'role') as MemberRole;
  const langue = text(formData, 'langue');
  // Langue de l'e-mail : celle choisie, sinon celle de la page.
  const emailLocale: AppLocale = isAppLocale(langue) ? langue : locale;
  // Saisie réaffichée après un refus (React vide le formulaire après l'envoi).
  const values = { email, role, langue: emailLocale };
  const errors: Record<string, string> = {};
  if (!looksLikeEmail(email)) errors.email = t('emailInvalid');
  if (!ASSIGNABLE.includes(role)) errors.role = t('roleRequired');
  const refused = (message: string, fieldErrors: Record<string, string> = {}): InviteState => ({
    ...prev,
    ok: false,
    message,
    errors: fieldErrors,
    invitation: null,
    existing: false,
    emailed: false,
    values,
  });
  if (Object.keys(errors).length) return refused(t('checkFields'), errors);

  const ctx = await requireContext(locale);
  if (!can.manageTeam(ctx.role)) return refused(t('inviteManagersOnly'));
  const supabase = await supabaseServer();

  // Déjà dans l'équipe ?
  const { data: members } = await supabase
    .from('memberships')
    .select('user_id, profiles(email)')
    .eq('org_id', ctx.org.id);
  const already = (members ?? []).some((m) => (m.profiles?.email ?? '').toLowerCase() === email);
  if (already) return refused(t('alreadyMember'), { email: t('alreadyMemberField') });

  // Une invitation valable existe déjà pour cette adresse : on la réutilise (avec le rôle demandé).
  const nowIso = new Date().toISOString();
  const { data: pending } = await supabase
    .from('invitations')
    .select('id, email, role, token, created_at, expires_at')
    .eq('org_id', ctx.org.id)
    .is('accepted_at', null)
    .gt('expires_at', nowIso)
    .eq('email', email)
    .limit(1);
  const found = pending?.[0];
  if (found) {
    let current = found;
    if (found.role !== role) {
      const { data: updated } = await supabase
        .from('invitations')
        .update({ role })
        .eq('id', found.id)
        .select('id, email, role, token, created_at, expires_at')
        .maybeSingle();
      if (updated) current = updated;
    }
    const sent = await emailInvitation(ctx, current, emailLocale);
    refresh();
    return {
      ok: true,
      message: sent ? t('inviteSentAgain', { email }) : sent === false ? t('inviteMailFailed', { email }) : t('inviteExisting', { email }),
      errors: {},
      done: prev.done + 1,
      invitation: toPending(current),
      existing: true,
      emailed: sent === true,
    };
  }

  const { data: created, error } = await supabase
    .from('invitations')
    .insert({ org_id: ctx.org.id, email, role })
    .select('id, email, role, token, created_at, expires_at')
    .single();
  if (error || !created) {
    if (error) console.error('[parametres] invitation :', error.code, error.message);
    return refused(t('inviteFailed'));
  }
  const sent = await emailInvitation(ctx, created, emailLocale);
  refresh();
  return {
    ok: true,
    message: sent ? t('inviteSent', { email }) : sent === false ? t('inviteMailFailed', { email }) : t('inviteReady', { email, role }),
    errors: {},
    done: prev.done + 1,
    invitation: toPending(created),
    existing: false,
    emailed: sent === true,
  };
}

function toPending(row: InvitationRow): PendingInvitation {
  return { id: row.id, email: row.email, role: row.role, token: row.token, createdAt: row.created_at, expiresAt: row.expires_at };
}

export async function revoquerInvitation(id: string): Promise<ActionResult> {
  const { locale, t } = await texts();
  if (!isUuid(id)) return { ok: false, message: t('inviteNotFound') };
  const ctx = await requireContext(locale);
  if (!can.manageTeam(ctx.role)) return { ok: false, message: t('managersOnly') };
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from('invitations').delete().eq('id', id).eq('org_id', ctx.org.id).select('id');
  if (error || !data?.length) {
    if (error) console.error('[parametres] révocation :', error.code, error.message);
    return { ok: false, message: t('revokeFailed') };
  }
  refresh();
  return { ok: true, message: t('revoked') };
}

export async function changerRole(userId: string, role: string): Promise<ActionResult> {
  const { locale, t } = await texts();
  if (!isUuid(userId) || !ASSIGNABLE.includes(role as MemberRole)) return { ok: false, message: t('roleInvalid') };
  const ctx = await requireContext(locale);
  if (!can.manageTeam(ctx.role)) return { ok: false, message: t('managersOnly') };
  if (userId === ctx.userId) return { ok: false, message: t('ownRole') };
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('memberships')
    .update({ role: role as MemberRole })
    .eq('org_id', ctx.org.id)
    .eq('user_id', userId)
    .neq('role', 'owner')
    .select('user_id');
  if (error || !data?.length) {
    if (error) console.error('[parametres] rôle :', error.code, error.message);
    return { ok: false, message: t('roleFailed') };
  }
  refresh();
  return { ok: true, message: t('roleSaved', { role }) };
}

export async function retirerMembre(userId: string): Promise<ActionResult> {
  const { locale, t } = await texts();
  if (!isUuid(userId)) return { ok: false, message: t('memberNotFound') };
  const ctx = await requireContext(locale);
  if (!can.manageTeam(ctx.role)) return { ok: false, message: t('managersOnly') };
  if (userId === ctx.userId) return { ok: false, message: t('removeSelf') };
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('memberships')
    .delete()
    .eq('org_id', ctx.org.id)
    .eq('user_id', userId)
    .neq('role', 'owner')
    .select('user_id');
  if (error || !data?.length) {
    if (error) console.error('[parametres] retrait :', error.code, error.message);
    return { ok: false, message: t('removeFailed') };
  }
  refresh();
  return { ok: true, message: t('removed') };
}

// ---------------------------------------------------------------- mon compte

export async function enregistrerNom(prev: FormState, formData: FormData): Promise<FormState> {
  const { locale, t } = await texts();
  const nom = text(formData, 'nom');
  const values = { nom };
  if (nom.length < 2) return fail(prev, t('checkField'), { nom: t('nameRequired') }, values);
  if (nom.length > 80) return fail(prev, t('checkField'), { nom: t('tooLong') }, values);
  const ctx = await requireContext(locale);
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from('profiles').update({ full_name: nom }).eq('id', ctx.userId).select('id');
  if (error || !data?.length) {
    if (error) console.error('[parametres] nom :', error.code, error.message);
    return fail(prev, t('generic'), {}, values);
  }
  refresh();
  return success(prev, t('nameSaved'));
}

export async function changerMotDePasse(prev: FormState, formData: FormData): Promise<FormState> {
  const { locale, t } = await texts();
  const password = formData.get('password');
  const confirmation = formData.get('confirmation');
  if (typeof password !== 'string' || password.length < 8) {
    return fail(prev, t('checkField'), { password: t('passwordShort') });
  }
  if (password.length > 72) return fail(prev, t('checkField'), { password: t('passwordLong') });
  if (confirmation !== password) return fail(prev, t('checkField'), { confirmation: t('passwordMismatch') });
  await requireContext(locale);
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    const ta = await getTranslations({ locale, namespace: 'auth.errors' });
    return fail(prev, ta(authErrorKey(error)));
  }
  return success(prev, t('passwordChanged'));
}

export async function quitterEntreprise(): Promise<ActionResult> {
  const { locale, t } = await texts();
  const ctx = await requireContext(locale);
  if (ctx.role === 'owner') return { ok: false, message: t('ownerCantLeave') };
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('memberships')
    .delete()
    .eq('org_id', ctx.org.id)
    .eq('user_id', ctx.userId)
    .select('user_id');
  if (error || !data?.length) {
    if (error) console.error('[parametres] départ :', error.code, error.message);
    return { ok: false, message: t('leaveFailed') };
  }
  (await cookies()).delete(ORG_COOKIE);
  revalidatePath('/', 'layout');
  return redirect({ href: '/garage', locale });
}

// ---------------------------------------------------------------- machines archivées

export async function restaurerMachine(machineId: string): Promise<ActionResult> {
  const { locale, t } = await texts();
  if (!isUuid(machineId)) return { ok: false, message: t('machineNotFound') };
  const ctx = await requireContext(locale);
  if (!can.manageFleet(ctx.role)) return { ok: false, message: t('fleetManagersOnly') };
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('machines')
    .update({ archived_at: null })
    .eq('id', machineId)
    .eq('org_id', ctx.org.id)
    .not('archived_at', 'is', null)
    .select('id, code');
  if (error?.code === '23505') return { ok: false, message: t('codeTaken') };
  if (error || !data?.length) {
    if (error) console.error('[parametres] restauration :', error.code, error.message);
    return { ok: false, message: t('restoreFailed') };
  }
  refresh();
  return { ok: true, message: t('restored', { code: data[0].code }) };
}

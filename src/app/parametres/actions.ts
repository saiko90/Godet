'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { authMessage } from '@/components/site/auth-errors';
import { isCanton } from '@/components/site/cantons';
import { isUuid, looksLikeEmail, ORG_COOKIE_OPTIONS } from '@/components/site/nav';
import type { ActionResult, FormState, InviteState, PendingInvitation } from '@/components/site/types';
import { can, ROLES } from '@/lib/domain';
import { getSession, ORG_COOKIE } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import type { MemberRole, SessionContext } from '@/lib/types';

// Toutes les actions revérifient la session et les droits : la RLS protège aussi les données,
// mais un message clair vaut mieux qu'un refus silencieux.

const NB = '\u00a0';
const ASSIGNABLE: MemberRole[] = ['admin', 'mechanic', 'operator'];
const GENERIC = 'L’enregistrement a échoué. Réessayez dans un instant.';

async function requireContext(): Promise<SessionContext> {
  const session = await getSession();
  if (session.status === 'anon') redirect('/connexion?suite=/parametres');
  if (session.status === 'no-org') redirect('/bienvenue');
  return session.ctx;
}

function text(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '';
}

function refresh() {
  revalidatePath('/parametres');
  revalidatePath('/garage');
}

function fail(prev: FormState, message: string, errors: Record<string, string> = {}): FormState {
  return { ok: false, message, errors, done: prev.done };
}

function success(prev: FormState, message: string): FormState {
  return { ok: true, message, errors: {}, done: prev.done + 1 };
}

// ---------------------------------------------------------------- entreprise

export async function enregistrerEntreprise(prev: FormState, formData: FormData): Promise<FormState> {
  const nom = text(formData, 'nom');
  const canton = text(formData, 'canton').toUpperCase();
  const errors: Record<string, string> = {};
  if (nom.length < 2) errors.nom = `Indiquez le nom de l’entreprise (2${NB}caractères au moins).`;
  else if (nom.length > 80) errors.nom = `80${NB}caractères au maximum.`;
  if (canton && !isCanton(canton)) errors.canton = 'Choisissez un canton dans la liste.';
  if (Object.keys(errors).length) return fail(prev, 'Vérifiez les champs signalés.', errors);

  const ctx = await requireContext();
  if (!can.manageTeam(ctx.role)) return fail(prev, 'Seuls le propriétaire et les administrateurs peuvent modifier l’entreprise.');

  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('organizations')
    .update({ name: nom, canton: canton || null })
    .eq('id', ctx.org.id)
    .select('id');
  if (error || !data?.length) {
    if (error) console.error('[parametres] entreprise :', error.code, error.message);
    return fail(prev, GENERIC);
  }
  refresh();
  return success(prev, 'Entreprise enregistrée.');
}

export async function changerEntrepriseActive(orgId: string): Promise<ActionResult> {
  const ctx = await requireContext();
  const target = ctx.orgs.find((o) => o.id === orgId);
  if (!isUuid(orgId) || !target) return { ok: false, message: 'Entreprise introuvable.' };
  (await cookies()).set(ORG_COOKIE, orgId, ORG_COOKIE_OPTIONS);
  revalidatePath('/', 'layout');
  return { ok: true, message: `Entreprise active${NB}: ${target.name}.` };
}

// ---------------------------------------------------------------- équipe

export async function inviterMembre(prev: InviteState, formData: FormData): Promise<InviteState> {
  const email = text(formData, 'email').toLowerCase();
  const role = text(formData, 'role') as MemberRole;
  const errors: Record<string, string> = {};
  if (!looksLikeEmail(email)) errors.email = `Adresse e-mail incomplète. Exemple${NB}: nom@entreprise.ch`;
  if (!ASSIGNABLE.includes(role)) errors.role = 'Choisissez un rôle.';
  if (Object.keys(errors).length) {
    return { ...prev, ok: false, message: 'Vérifiez les champs signalés.', errors, invitation: null, existing: false };
  }

  const ctx = await requireContext();
  if (!can.manageTeam(ctx.role)) {
    return { ...prev, ok: false, message: 'Seuls le propriétaire et les administrateurs peuvent inviter.', errors: {}, invitation: null, existing: false };
  }
  const supabase = await supabaseServer();

  // Déjà dans l'équipe ?
  const { data: members } = await supabase
    .from('memberships')
    .select('user_id, profiles(email)')
    .eq('org_id', ctx.org.id);
  const already = (members ?? []).some((m) => (m.profiles?.email ?? '').toLowerCase() === email);
  if (already) {
    return {
      ...prev,
      ok: false,
      message: 'Cette personne fait déjà partie de l’équipe.',
      errors: { email: 'Déjà membre de l’entreprise.' },
      invitation: null,
      existing: false,
    };
  }

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
    refresh();
    return {
      ok: true,
      message: `Une invitation était déjà en attente pour ${email}${NB}: voici son lien.`,
      errors: {},
      done: prev.done + 1,
      invitation: toPending(current),
      existing: true,
    };
  }

  const { data: created, error } = await supabase
    .from('invitations')
    .insert({ org_id: ctx.org.id, email, role })
    .select('id, email, role, token, created_at, expires_at')
    .single();
  if (error || !created) {
    if (error) console.error('[parametres] invitation :', error.code, error.message);
    return { ...prev, ok: false, message: 'L’invitation n’a pas pu être créée. Réessayez dans un instant.', errors: {}, invitation: null, existing: false };
  }
  refresh();
  return {
    ok: true,
    message: `Invitation prête pour ${email} (${ROLES[role].label.toLowerCase()}).`,
    errors: {},
    done: prev.done + 1,
    invitation: toPending(created),
    existing: false,
  };
}

function toPending(row: { id: string; email: string; role: MemberRole; token: string; created_at: string; expires_at: string }): PendingInvitation {
  return { id: row.id, email: row.email, role: row.role, token: row.token, createdAt: row.created_at, expiresAt: row.expires_at };
}

export async function revoquerInvitation(id: string): Promise<ActionResult> {
  if (!isUuid(id)) return { ok: false, message: 'Invitation introuvable.' };
  const ctx = await requireContext();
  if (!can.manageTeam(ctx.role)) return { ok: false, message: 'Action réservée au propriétaire et aux administrateurs.' };
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from('invitations').delete().eq('id', id).eq('org_id', ctx.org.id).select('id');
  if (error || !data?.length) {
    if (error) console.error('[parametres] révocation :', error.code, error.message);
    return { ok: false, message: 'L’invitation n’a pas pu être révoquée.' };
  }
  refresh();
  return { ok: true, message: 'Invitation révoquée : son lien ne fonctionne plus.' };
}

export async function changerRole(userId: string, role: string): Promise<ActionResult> {
  if (!isUuid(userId) || !ASSIGNABLE.includes(role as MemberRole)) return { ok: false, message: 'Rôle non valable.' };
  const ctx = await requireContext();
  if (!can.manageTeam(ctx.role)) return { ok: false, message: 'Action réservée au propriétaire et aux administrateurs.' };
  if (userId === ctx.userId) return { ok: false, message: 'Vous ne pouvez pas changer votre propre rôle.' };
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
    return { ok: false, message: 'Le rôle n’a pas pu être modifié.' };
  }
  refresh();
  return { ok: true, message: `Rôle enregistré${NB}: ${ROLES[role as MemberRole].label.toLowerCase()}.` };
}

export async function retirerMembre(userId: string): Promise<ActionResult> {
  if (!isUuid(userId)) return { ok: false, message: 'Membre introuvable.' };
  const ctx = await requireContext();
  if (!can.manageTeam(ctx.role)) return { ok: false, message: 'Action réservée au propriétaire et aux administrateurs.' };
  if (userId === ctx.userId) return { ok: false, message: 'Pour partir, utilisez « Quitter l’entreprise » dans Mon compte.' };
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
    return { ok: false, message: 'Ce membre n’a pas pu être retiré.' };
  }
  refresh();
  return { ok: true, message: 'Membre retiré de l’entreprise.' };
}

// ---------------------------------------------------------------- mon compte

export async function enregistrerNom(prev: FormState, formData: FormData): Promise<FormState> {
  const nom = text(formData, 'nom');
  if (nom.length < 2) return fail(prev, 'Vérifiez le champ signalé.', { nom: 'Indiquez votre nom complet.' });
  if (nom.length > 80) return fail(prev, 'Vérifiez le champ signalé.', { nom: `80${NB}caractères au maximum.` });
  const ctx = await requireContext();
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from('profiles').update({ full_name: nom }).eq('id', ctx.userId).select('id');
  if (error || !data?.length) {
    if (error) console.error('[parametres] nom :', error.code, error.message);
    return fail(prev, GENERIC);
  }
  refresh();
  return success(prev, 'Nom enregistré.');
}

export async function changerMotDePasse(prev: FormState, formData: FormData): Promise<FormState> {
  const password = formData.get('password');
  const confirmation = formData.get('confirmation');
  if (typeof password !== 'string' || password.length < 8) {
    return fail(prev, 'Vérifiez le champ signalé.', { password: `Mot de passe trop court${NB}: 8${NB}caractères au minimum.` });
  }
  if (password.length > 72) return fail(prev, 'Vérifiez le champ signalé.', { password: `72${NB}caractères au maximum.` });
  if (confirmation !== password) {
    return fail(prev, 'Vérifiez le champ signalé.', { confirmation: 'Les deux mots de passe ne sont pas identiques.' });
  }
  await requireContext();
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return fail(prev, authMessage(error));
  return success(prev, 'Mot de passe changé.');
}

export async function quitterEntreprise(): Promise<ActionResult> {
  const ctx = await requireContext();
  if (ctx.role === 'owner') return { ok: false, message: 'Le propriétaire ne peut pas quitter son entreprise.' };
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('memberships')
    .delete()
    .eq('org_id', ctx.org.id)
    .eq('user_id', ctx.userId)
    .select('user_id');
  if (error || !data?.length) {
    if (error) console.error('[parametres] départ :', error.code, error.message);
    return { ok: false, message: 'Le départ n’a pas pu être enregistré.' };
  }
  (await cookies()).delete(ORG_COOKIE);
  revalidatePath('/', 'layout');
  redirect('/garage');
}

// ---------------------------------------------------------------- machines archivées

export async function restaurerMachine(machineId: string): Promise<ActionResult> {
  if (!isUuid(machineId)) return { ok: false, message: 'Machine introuvable.' };
  const ctx = await requireContext();
  if (!can.manageFleet(ctx.role)) return { ok: false, message: 'Action réservée aux responsables du parc.' };
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('machines')
    .update({ archived_at: null })
    .eq('id', machineId)
    .eq('org_id', ctx.org.id)
    .not('archived_at', 'is', null)
    .select('id, code');
  if (error?.code === '23505') {
    return { ok: false, message: 'Une machine du garage porte déjà ce code. Renommez-la, puis restaurez celle-ci.' };
  }
  if (error || !data?.length) {
    if (error) console.error('[parametres] restauration :', error.code, error.message);
    return { ok: false, message: 'La machine n’a pas pu être restaurée.' };
  }
  refresh();
  return { ok: true, message: `${data[0].code} est de retour au garage.` };
}

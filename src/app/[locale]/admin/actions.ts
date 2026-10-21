'use server';

// Actions de la console d'administration. Chacune revérifie que la personne est administratrice de la plateforme
// et valide ses entrées : la RLS (private.is_platform_admin) protège aussi les tables, mais un code d'erreur clair
// vaut mieux qu'un refus silencieux. Rien n'est jamais envoyé d'ici : la console enregistre des décisions
// (valider, marquer comme envoyé…). Seule exception : « Envoyer par e-mail », sur clic de Michaël, pour un message
// validé, à l'adresse générique d'une entreprise d'un pays où l'e-mail de prospection est permis (CH, FR).

import { revalidatePath } from 'next/cache';
import { LETTER_SENDER } from '@/components/admin/letter-config';
import { localePrefix, prospectLocale, readableSource, refPrefix, shortUrl } from '@/components/admin/links';
import {
  CHANNELS,
  channelRule,
  CLOSED_STATUSES,
  CONTACT_STATUSES,
  FLEET_SIZES,
  hasPlaceholder,
  IDEA_STATUSES,
  isIsoDate,
  isOneOf,
  isUuid,
  LIMITS,
  LOCALES,
  MARKETS,
  nextActionDays,
  PROSPECT_STATUSES,
  SEGMENTS,
  type AdminResult,
  type AdminResultCode,
  type NewProspectInput,
  type ProspectDetailsInput,
  type ProspectStatus,
} from '@/components/admin/types';
import { redirect } from '@/i18n/navigation';
import { isAppLocale } from '@/i18n/routing';
import type { TablesUpdate } from '@/lib/database.types';
import { isEmailAddress, isEmailConfigured, sendEmail } from '@/lib/email';
import { renderProspectEmail } from '@/lib/email/prospect';
import { getTranslations } from 'next-intl/server';
import { getAdmin, zurichDay, type AdminContext } from './guard';

const done = (code: AdminResultCode): AdminResult => ({ ok: true, code });
const fail = (code: AdminResultCode, field?: string): AdminResult => ({ ok: false, code, ...(field ? { field } : {}) });

/** Exécute une action réservée à l'administration ; toute panne devient un code « failed » (détail dans les journaux). */
async function asAdmin(name: string, run: (admin: AdminContext) => Promise<AdminResult>): Promise<AdminResult> {
  let admin: AdminContext | null;
  try {
    admin = await getAdmin();
  } catch (error) {
    console.error(`[admin] ${name} : vérification impossible`, error);
    return fail('failed');
  }
  if (!admin) return fail('forbidden');
  try {
    return await run(admin);
  } catch (error) {
    console.error(`[admin] ${name} :`, error);
    return fail('failed');
  }
}

/** Toutes les pages de la console sont relues après une modification. */
function refresh() {
  revalidatePath('/[locale]/admin', 'layout');
}

/** Texte d'une ligne (espaces normalisés) ; null si vide. */
function line(value: unknown, max: number): string | null | undefined {
  if (value == null) return null;
  if (typeof value !== 'string') return undefined;
  const v = value.replace(/\s+/g, ' ').trim();
  if (!v) return null;
  return v.length > max ? undefined : v;
}

/** Texte de plusieurs lignes (retours à la ligne gardés) ; null si vide. */
function block(value: unknown, max: number): string | null | undefined {
  if (value == null) return null;
  if (typeof value !== 'string') return undefined;
  const v = value
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.replace(/[ \t]+$/g, ''))
    .join('\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
  if (!v) return null;
  return v.length > max ? undefined : v;
}

// ---------------------------------------------------------------- messages de contact

export async function saveContactMessage(id: string, status: string, note: string): Promise<AdminResult> {
  if (!isUuid(id)) return fail('notFound');
  if (!isOneOf(CONTACT_STATUSES, status)) return fail('invalid', 'status');
  const adminNote = block(note, LIMITS.contactNote);
  if (adminNote === undefined) return fail('invalid', 'note');
  return asAdmin('message', async ({ supabase }) => {
    const { data, error } = await supabase
      .from('contact_messages')
      .update({ status, admin_note: adminNote })
      .eq('id', id)
      .select('id');
    if (error) throw error;
    if (!data?.length) return fail('notFound');
    refresh();
    return done('saved');
  });
}

// ---------------------------------------------------------------- boîte à idées

export async function saveIdea(id: string, status: string, note: string): Promise<AdminResult> {
  if (!isUuid(id)) return fail('notFound');
  if (!isOneOf(IDEA_STATUSES, status)) return fail('invalid', 'status');
  const adminNote = block(note, LIMITS.ideaNote);
  if (adminNote === undefined) return fail('invalid', 'note');
  return asAdmin('idée', async ({ supabase }) => {
    const { data, error } = await supabase.from('ideas').update({ status, admin_note: adminNote }).eq('id', id).select('id');
    if (error) throw error;
    if (!data?.length) return fail('notFound');
    refresh();
    return done('saved');
  });
}

// ---------------------------------------------------------------- prospects

type Supabase = AdminContext['supabase'];

/** Annule les messages encore ouverts (brouillons et messages validés non envoyés) d'un prospect. */
async function cancelOpenDrafts(supabase: Supabase, prospectId: string) {
  const { error } = await supabase
    .from('outreach')
    .update({ status: 'annule' })
    .eq('prospect_id', prospectId)
    .in('status', ['brouillon', 'valide']);
  if (error) throw error;
}

export async function setProspectStatus(id: string, status: string): Promise<AdminResult> {
  if (!isUuid(id)) return fail('notFound');
  if (!isOneOf(PROSPECT_STATUSES, status)) return fail('invalid', 'status');
  return asAdmin('statut', async ({ supabase }) => {
    const patch: TablesUpdate<'prospects'> = { status };
    // « Ne pas contacter » : plus aucune action prévue.
    if (status === 'ne_pas_contacter') patch.next_action_at = null;
    const { data, error } = await supabase.from('prospects').update(patch).eq('id', id).select('id');
    if (error) throw error;
    if (!data?.length) return fail('notFound');
    // Fin du cycle (client, refus, opposition) : les relances préparées n'ont plus lieu d'être.
    if ((CLOSED_STATUSES as readonly string[]).includes(status)) await cancelOpenDrafts(supabase, id);
    refresh();
    return done('statusSaved');
  });
}

export async function saveProspectPlan(id: string, nextActionAt: string, notes: string): Promise<AdminResult> {
  if (!isUuid(id)) return fail('notFound');
  const date = typeof nextActionAt === 'string' ? nextActionAt.trim() : '';
  if (date && !isIsoDate(date)) return fail('invalid', 'nextActionAt');
  const text = block(notes, LIMITS.prospectNotes);
  if (text === undefined) return fail('invalid', 'notes');
  return asAdmin('suivi', async ({ supabase }) => {
    const { data: current, error: readError } = await supabase.from('prospects').select('status').eq('id', id).maybeSingle();
    if (readError) throw readError;
    if (!current) return fail('notFound');
    const { data, error } = await supabase
      .from('prospects')
      .update({ next_action_at: current.status === 'ne_pas_contacter' ? null : date || null, notes: text })
      .eq('id', id)
      .select('id');
    if (error) throw error;
    if (!data?.length) return fail('notFound');
    refresh();
    return done('saved');
  });
}

export async function saveProspectDetails(id: string, input: ProspectDetailsInput): Promise<AdminResult> {
  if (!isUuid(id)) return fail('notFound');
  if (!input || typeof input !== 'object') return fail('invalid');
  const company = line(input.company, LIMITS.company);
  if (!company || company.length < 2) return fail('invalid', 'company');
  const country = typeof input.country === 'string' ? input.country.trim().toUpperCase() : '';
  if (!/^[A-Z]{2}$/.test(country)) return fail('invalid', 'country');
  const locale = input.locale ? input.locale : null;
  if (locale !== null && !isOneOf(LOCALES, locale)) return fail('invalid', 'locale');
  if (!isOneOf(SEGMENTS, input.segment)) return fail('invalid', 'segment');
  const fleet = input.fleet ? input.fleet : null;
  if (fleet !== null && !isOneOf(FLEET_SIZES, fleet)) return fail('invalid', 'fleet');
  const channel = input.channel ? input.channel : null;
  if (channel !== null && !isOneOf(CHANNELS, channel)) return fail('invalid', 'channel');

  const fields = {
    region: line(input.region, LIMITS.region),
    legal_id: line(input.legalId, LIMITS.legalId),
    website: line(input.website, LIMITS.website),
    email: line(input.email, LIMITS.email)?.toLowerCase() ?? null,
    phone: line(input.phone, LIMITS.phone),
    address: line(input.address, LIMITS.address),
    postal_code: line(input.postalCode, LIMITS.postalCode),
    city: line(input.city, LIMITS.city),
    signals: block(input.signals, LIMITS.signals),
    source: line(input.source, LIMITS.source),
  };
  const map: Record<keyof typeof fields, string> = {
    region: 'region',
    legal_id: 'legalId',
    website: 'website',
    email: 'email',
    phone: 'phone',
    address: 'address',
    postal_code: 'postalCode',
    city: 'city',
    signals: 'signals',
    source: 'source',
  };
  for (const key of Object.keys(fields) as (keyof typeof fields)[]) {
    if (fields[key] === undefined) return fail('invalid', map[key]);
  }
  if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fields.email)) return fail('invalid', 'email');
  if (!fields.source) return fail('invalid', 'source');

  return asAdmin('fiche', async ({ supabase }) => {
    const { data, error } = await supabase
      .from('prospects')
      .update({
        company,
        country,
        locale,
        segment: input.segment,
        fleet_estimate: fleet,
        channel,
        region: fields.region ?? null,
        legal_id: fields.legal_id ?? null,
        website: fields.website ?? null,
        email: fields.email,
        phone: fields.phone ?? null,
        address: fields.address ?? null,
        postal_code: fields.postal_code ?? null,
        city: fields.city ?? null,
        signals: fields.signals ?? null,
        source: fields.source as string,
      })
      .eq('id', id)
      .select('id');
    // Même entreprise, même pays et même code postal qu'une autre fiche (index unique).
    if (error?.code === '23505') return fail('conflict', 'company');
    if (error) throw error;
    if (!data?.length) return fail('notFound');
    refresh();
    return done('saved');
  });
}

/** Code de suivi « ch-2610-0042 » (pays, année et mois, numéro du mois) pour un prospect qui n'en a pas encore. */
async function assignRefCode(supabase: Supabase, id: string, country: string): Promise<boolean> {
  const prefix = refPrefix(country);
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing, error: listError } = await supabase.from('prospects').select('ref_code').like('ref_code', `${prefix}%`);
    if (listError) throw listError;
    const max = (existing ?? []).reduce((m, r) => {
      const n = Number((r.ref_code ?? '').slice(prefix.length));
      return Number.isInteger(n) && n > m ? n : m;
    }, 0);
    const code = `${prefix}${String(max + 1 + attempt).padStart(4, '0')}`;
    const { data, error: updateError } = await supabase.from('prospects').update({ ref_code: code }).eq('id', id).is('ref_code', null).select('id');
    if (updateError?.code === '23505') continue; // code pris entre-temps : on essaie le suivant
    if (updateError) throw updateError;
    return Boolean(data?.length);
  }
  return false;
}

/** Attribue un code de suivi à un prospect qui n'en a pas. */
export async function createRefCode(id: string): Promise<AdminResult> {
  if (!isUuid(id)) return fail('notFound');
  return asAdmin('code', async ({ supabase }) => {
    const { data: prospect, error } = await supabase.from('prospects').select('country, ref_code').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!prospect) return fail('notFound');
    if (prospect.ref_code) return fail('conflict');
    if (!(await assignRefCode(supabase, id, prospect.country))) return fail('conflict');
    refresh();
    return done('refCreated');
  });
}

/** Nouveau prospect ajouté à la main : fiche au statut « Nouveau », code de suivi attribué aussitôt. */
export async function createProspect(input: NewProspectInput): Promise<AdminResult> {
  if (!input || typeof input !== 'object') return fail('invalid');
  const company = line(input.company, LIMITS.company);
  if (!company || company.length < 2) return fail('invalid', 'company');
  const country = typeof input.country === 'string' ? input.country.trim().toUpperCase() : '';
  if (!isOneOf(MARKETS, country)) return fail('invalid', 'country');
  if (!isOneOf(SEGMENTS, input.segment)) return fail('invalid', 'segment');
  const email = line(input.email, LIMITS.email)?.toLowerCase();
  if (email === undefined || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))) return fail('invalid', 'email');
  const website = line(input.website, LIMITS.website);
  if (website === undefined) return fail('invalid', 'website');
  const postalCode = line(input.postalCode, LIMITS.postalCode);
  if (postalCode === undefined) return fail('invalid', 'postalCode');
  const city = line(input.city, LIMITS.city);
  if (city === undefined) return fail('invalid', 'city');
  const source = line(input.source, LIMITS.source);
  if (source === undefined) return fail('invalid', 'source');

  return asAdmin('nouveau prospect', async ({ supabase }) => {
    const { data, error } = await supabase
      .from('prospects')
      .insert({
        company,
        country,
        segment: input.segment,
        email: email || null,
        website: website ?? null,
        postal_code: postalCode ?? null,
        city: city ?? null,
        source: source || 'Ajout manuel',
        status: 'nouveau',
        created_by: 'manuel',
      })
      .select('id')
      .single();
    // Même entreprise, même pays et même code postal qu'une fiche existante (index unique).
    if (error?.code === '23505') return fail('conflict', 'company');
    if (error) throw error;
    await assignRefCode(supabase, data.id, country);
    refresh();
    return { ok: true, code: 'prospectCreated', id: data.id };
  });
}

/**
 * Effacement sur demande (nLPD / RGPD) : on efface les coordonnées, les signaux, les notes et tous les messages,
 * mais on garde le nom, le pays et le code postal avec le statut « ne pas contacter » : c'est ce qui empêche un agent
 * de reprendre l'entreprise plus tard (l'opposition doit être respectée durablement).
 */
export async function eraseProspect(id: string): Promise<AdminResult> {
  if (!isUuid(id)) return fail('notFound');
  return asAdmin('effacement', async ({ supabase }) => {
    const { error: outreachError } = await supabase.from('outreach').delete().eq('prospect_id', id);
    if (outreachError) throw outreachError;
    const { data, error } = await supabase
      .from('prospects')
      .update({
        status: 'ne_pas_contacter',
        legal_id: null,
        website: null,
        email: null,
        phone: null,
        address: null,
        region: null,
        signals: null,
        channel: null,
        fleet_estimate: null,
        next_action_at: null,
        notes: `Données effacées le ${zurichDay()} à la demande de la personne. Ne plus contacter.`,
      })
      .eq('id', id)
      .select('id');
    if (error) throw error;
    if (!data?.length) return fail('notFound');
    refresh();
    return done('erased');
  });
}

/**
 * Suppression complète de la fiche et de ses messages (à éviter si la personne s'est opposée : voir eraseProspect,
 * sinon un agent pourrait la retrouver et la proposer à nouveau). Retour à la liste des prospects.
 */
export async function deleteProspect(id: string, locale: string): Promise<AdminResult> {
  if (!isUuid(id)) return fail('notFound');
  const result = await asAdmin('suppression', async ({ supabase }) => {
    const { data, error } = await supabase.from('prospects').delete().eq('id', id).select('id');
    if (error) throw error;
    if (!data?.length) return fail('notFound');
    refresh();
    return done('deleted');
  });
  if (result.ok && isAppLocale(locale)) redirect({ href: '/admin/prospects', locale });
  return result;
}

// ---------------------------------------------------------------- messages préparés (outreach)

type OutreachWithProspect = {
  id: string;
  prospect_id: string;
  status: string;
  step: number;
  channel: string;
  subject: string | null;
  body: string;
  locale: string;
  prospects: { status: string; next_action_at: string | null; country: string; email: string | null; source: string } | null;
};

async function loadOutreach(supabase: Supabase, id: string): Promise<OutreachWithProspect | null> {
  const { data, error } = await supabase
    .from('outreach')
    .select('id, prospect_id, status, step, channel, subject, body, locale, prospects(status, next_action_at, country, email, source)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as OutreachWithProspect | null) ?? null;
}

function blocked(o: OutreachWithProspect): boolean {
  return o.prospects?.status === 'ne_pas_contacter';
}

export async function saveDraft(id: string, subject: string, body: string): Promise<AdminResult> {
  if (!isUuid(id)) return fail('notFound');
  const s = line(subject, LIMITS.subject);
  if (s === undefined) return fail('invalid', 'subject');
  const b = block(body, LIMITS.body);
  if (!b) return fail('invalid', 'body');
  return asAdmin('brouillon', async ({ supabase }) => {
    const o = await loadOutreach(supabase, id);
    if (!o) return fail('notFound');
    if (blocked(o)) return fail('locked');
    if (o.status !== 'brouillon') return fail('conflict');
    const { data, error } = await supabase
      .from('outreach')
      .update({ subject: s, body: b })
      .eq('id', id)
      .eq('status', 'brouillon')
      .select('id');
    if (error) throw error;
    if (!data?.length) return fail('conflict');
    refresh();
    return done('saved');
  });
}

export async function validateDraft(id: string): Promise<AdminResult> {
  if (!isUuid(id)) return fail('notFound');
  return asAdmin('validation', async ({ supabase, userId }) => {
    const o = await loadOutreach(supabase, id);
    if (!o) return fail('notFound');
    if (blocked(o)) return fail('locked');
    if (o.status !== 'brouillon') return fail('conflict');
    if (hasPlaceholder(o.subject) || hasPlaceholder(o.body)) return fail('placeholder');
    const { data, error } = await supabase
      .from('outreach')
      .update({ status: 'valide', approved_by: userId, approved_at: new Date().toISOString() })
      .eq('id', id)
      .eq('status', 'brouillon')
      .select('id');
    if (error) throw error;
    if (!data?.length) return fail('conflict');
    // Premier message validé : le prospect est prêt à être contacté.
    if (o.prospects && ['nouveau', 'a_valider'].includes(o.prospects.status)) {
      const { error: pError } = await supabase
        .from('prospects')
        .update({ status: 'pret' })
        .eq('id', o.prospect_id)
        .in('status', ['nouveau', 'a_valider']);
      if (pError) throw pError;
    }
    refresh();
    return done('validated');
  });
}

export async function reopenDraft(id: string): Promise<AdminResult> {
  if (!isUuid(id)) return fail('notFound');
  return asAdmin('réouverture', async ({ supabase }) => {
    const { data, error } = await supabase
      .from('outreach')
      .update({ status: 'brouillon', approved_by: null, approved_at: null })
      .eq('id', id)
      .eq('status', 'valide')
      .select('id');
    if (error) throw error;
    if (!data?.length) return fail('conflict');
    refresh();
    return done('reopened');
  });
}

export async function cancelDraft(id: string): Promise<AdminResult> {
  if (!isUuid(id)) return fail('notFound');
  return asAdmin('annulation', async ({ supabase }) => {
    const { data, error } = await supabase
      .from('outreach')
      .update({ status: 'annule' })
      .eq('id', id)
      .in('status', ['brouillon', 'valide'])
      .select('id');
    if (error) throw error;
    if (!data?.length) return fail('conflict');
    refresh();
    return done('cancelled');
  });
}

/** Enregistre l'envoi d'un message validé : statut, canal réellement utilisé, prospect et prochaine action. */
async function recordSent(supabase: Supabase, o: OutreachWithProspect, channel?: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('outreach')
    .update({ status: 'envoye', sent_at: new Date().toISOString(), ...(channel ? { channel } : {}) })
    .eq('id', o.id)
    .eq('status', 'valide')
    .select('id');
  if (error) throw error;
  if (!data?.length) return false;

  const current = (o.prospects?.status ?? 'nouveau') as ProspectStatus;
  const patch: TablesUpdate<'prospects'> = {};
  const used = channel ?? o.channel;
  if (isOneOf(CHANNELS, used)) patch.channel = used;
  if (['nouveau', 'a_valider', 'pret'].includes(current)) patch.status = 'contacte';
  else if (['contacte', 'relance'].includes(current) && o.step > 1) patch.status = 'relance';
  // Prochaine action : l'étape suivante de la séquence du pays, sauf si une date plus lointaine est déjà fixée.
  if (!(CLOSED_STATUSES as readonly string[]).includes(current)) {
    const planned = zurichDay(nextActionDays(o.prospects?.country ?? '', o.step, used));
    const existing = o.prospects?.next_action_at ?? null;
    if (!existing || existing < planned) patch.next_action_at = planned;
  }
  if (Object.keys(patch).length) {
    const { error: pError } = await supabase.from('prospects').update(patch).eq('id', o.prospect_id);
    if (pError) throw pError;
  }
  return true;
}

/** Michaël a envoyé le message lui-même (poste, téléphone, LinkedIn, e-mail…) : on l'enregistre. */
export async function markSent(id: string): Promise<AdminResult> {
  if (!isUuid(id)) return fail('notFound');
  return asAdmin('envoi', async ({ supabase }) => {
    const o = await loadOutreach(supabase, id);
    if (!o) return fail('notFound');
    if (blocked(o)) return fail('locked');
    if (o.status !== 'valide') return fail('conflict');
    if (!(await recordSent(supabase, o))) return fail('conflict');
    refresh();
    return done('sent');
  });
}

/**
 * Envoie le message validé par e-mail (Resend), sur clic de Michaël : à l'adresse de l'entreprise, avec son nom comme
 * expéditeur, réponse à son adresse, et en pied l'expéditeur, l'origine des coordonnées et le moyen de refuser.
 * Refusé pour les pays où l'e-mail de prospection exige un consentement (DE, AT, IT).
 */
export async function sendByEmail(id: string): Promise<AdminResult> {
  if (!isUuid(id)) return fail('notFound');
  if (!isEmailConfigured()) return fail('emailOff');
  return asAdmin('e-mail', async ({ supabase, email: adminEmail }) => {
    const o = await loadOutreach(supabase, id);
    if (!o || !o.prospects) return fail('notFound');
    if (blocked(o)) return fail('locked');
    if (o.status !== 'valide') return fail('conflict');
    const p = o.prospects;
    if (channelRule(p.country, 'email')?.level === 'no') return fail('emailBanned');
    const to = p.email?.trim() ?? '';
    if (!isEmailAddress(to)) return fail('noEmail');
    if (!o.subject?.trim()) return fail('invalid', 'subject');
    const replyTo = [LETTER_SENDER.email, adminEmail].find((a) => isEmailAddress(a));
    if (!replyTo) return fail('noReplyTo');

    const lang = prospectLocale(o.locale, p.country);
    const tl = await getTranslations({ locale: lang, namespace: 'admin.mail' });
    const site = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://godet.app').replace(/\/$/, '');
    const address = [LETTER_SENDER.street, [LETTER_SENDER.postalCode, LETTER_SENDER.city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
    const footer = [
      [LETTER_SENDER.name, LETTER_SENDER.company, address, LETTER_SENDER.phone].filter(Boolean).join(' · '),
      tl('optOut'),
      tl('source', { source: readableSource(p.source) }),
      tl('privacy', { url: shortUrl(site, `${localePrefix(lang)}/confidentialite`) }),
    ];
    const mail = renderProspectEmail({ subject: o.subject, body: o.body, footer });
    const sent = await sendEmail({
      to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      fromName: LETTER_SENDER.name,
      fromLocalPart: process.env.PROSPECT_FROM_LOCAL?.trim() || 'michael',
      replyTo,
      headers: { 'List-Unsubscribe': `<mailto:${replyTo}?subject=stop>` },
      tags: [{ name: 'type', value: 'prospection' }],
      idempotencyKey: `outreach-${o.id}`,
    });
    if (!sent.sent) return fail(sent.reason === 'not_configured' ? 'emailOff' : sent.reason === 'invalid_recipient' ? 'noEmail' : 'emailFailed');
    if (!(await recordSent(supabase, o, 'email'))) return fail('conflict');
    refresh();
    return done('mailSent');
  });
}

/** Le prospect a répondu : la séquence s'arrête (les autres messages ouverts sont annulés), à traiter aujourd'hui. */
export async function markReply(id: string): Promise<AdminResult> {
  if (!isUuid(id)) return fail('notFound');
  return asAdmin('réponse', async ({ supabase }) => {
    const o = await loadOutreach(supabase, id);
    if (!o) return fail('notFound');
    if (o.status !== 'envoye') return fail('conflict');
    const { data, error } = await supabase
      .from('outreach')
      .update({ status: 'reponse' })
      .eq('id', id)
      .eq('status', 'envoye')
      .select('id');
    if (error) throw error;
    if (!data?.length) return fail('conflict');
    await cancelOpenDrafts(supabase, o.prospect_id);
    if (o.prospects?.status !== 'ne_pas_contacter') {
      const { error: pError } = await supabase.from('prospects').update({ next_action_at: zurichDay() }).eq('id', o.prospect_id);
      if (pError) throw pError;
    }
    refresh();
    return done('reply');
  });
}

/** Nouveau message rédigé à la main (relance, réponse…), enregistré comme brouillon à l'étape suivante. */
export async function createDraft(prospectId: string, channel: string, subject: string, body: string): Promise<AdminResult> {
  if (!isUuid(prospectId)) return fail('notFound');
  if (!isOneOf(CHANNELS, channel)) return fail('invalid', 'channel');
  const s = line(subject, LIMITS.subject);
  if (s === undefined) return fail('invalid', 'subject');
  const b = block(body, LIMITS.body);
  if (!b) return fail('invalid', 'body');
  return asAdmin('nouveau message', async ({ supabase }) => {
    const { data: prospect, error } = await supabase
      .from('prospects')
      .select('status, locale, country')
      .eq('id', prospectId)
      .maybeSingle();
    if (error) throw error;
    if (!prospect) return fail('notFound');
    if (prospect.status === 'ne_pas_contacter') return fail('locked');
    const { data: steps, error: stepError } = await supabase
      .from('outreach')
      .select('step')
      .eq('prospect_id', prospectId)
      .order('step', { ascending: false })
      .limit(1);
    if (stepError) throw stepError;
    const step = Math.min(10, (steps?.[0]?.step ?? 0) + 1);
    const locale = prospectLocale(prospect.locale, prospect.country);
    const { error: insertError } = await supabase
      .from('outreach')
      .insert({ prospect_id: prospectId, step, channel, locale, subject: s, body: b, status: 'brouillon' });
    if (insertError) throw insertError;
    refresh();
    return done('created');
  });
}

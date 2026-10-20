// Une exécution des rappels : qui est concerné aujourd'hui, ce qu'il y a à signaler, envoi (ou simulation), journal.

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  loadFleets,
  loadLastSends,
  loadMemberships,
  loadOrgs,
  loadPrefs,
  loadProfiles,
  markDigestSent,
  writeLog,
  type LogRow,
} from './data.ts';
import {
  buildOrgFleet,
  buildSections,
  isDueToday,
  lastDigestDay,
  selectRecipients,
  totalsOf,
  type DigestSection,
  type OrgFleet,
  type PrefsRow,
  type Recipient,
} from './digest.ts';
import { addDays, isLocale, zurichDay, type Locale } from './format.ts';
import { renderDigest } from './render.ts';
import { sendWithResend, type ResendConfig } from './resend.ts';

export interface RunConfig {
  /** Envoi réel par Resend, ou simulation (rien ne part, une ligne « simulation » au journal). */
  mode: 'resend' | 'simulation';
  resend: ResendConfig | null;
  /** Adresse publique du site, sans barre finale (liens des e-mails). */
  siteUrl: string;
  /** Au-delà, plus aucun envoi n'est commencé (limite d'exécution des fonctions : 150 s). */
  timeBudgetMs: number;
  /** Pause entre deux envois (limite de Resend : 10 requêtes par seconde). */
  pauseMs: number;
}

/** Compteurs renvoyés par la fonction (jamais de donnée personnelle). */
export interface RunCounts {
  /** Adhésions examinées. */
  memberships: number;
  /** Personnes dont les rappels sont actifs. */
  people: number;
  /** Personnes dont le rappel tombe aujourd'hui (jour ou lundi). */
  due: number;
  /** … sans rien à signaler (aucun e-mail). */
  nothing: number;
  sent: number;
  simulated: number;
  errors: number;
  /** Profil sans adresse e-mail utilisable. */
  noAddress: number;
  /** Non traitées faute de temps (reprises au prochain passage pour les rappels quotidiens). */
  deferred: number;
}

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Relevés pris en compte pour le rythme d'utilisation : 120 derniers jours, comme le garage (`readingsSince`). */
export function readingsSince(today: string): string {
  return `${addDays(today, -120)}T00:00:00Z`;
}

/** Liens de l'e-mail : garage et réglages des rappels, avec le préfixe de langue (le français n'en a pas). */
export function linksFor(siteUrl: string, locale: Locale): { garage: string; settings: string } {
  const prefix = locale === 'fr' ? '' : `/${locale}`;
  return { garage: `${siteUrl}${prefix}/garage`, settings: `${siteUrl}${prefix}/parametres#rappels` };
}

export async function runReminders(db: SupabaseClient, cfg: RunConfig, now: Date): Promise<RunCounts> {
  const started = Date.now();
  const today = zurichDay(now);
  const counts: RunCounts = {
    memberships: 0,
    people: 0,
    due: 0,
    nothing: 0,
    sent: 0,
    simulated: 0,
    errors: 0,
    noAddress: 0,
    deferred: 0,
  };

  // 1. Qui veut des rappels, et dont le rappel tombe aujourd'hui.
  const [prefsRows, memberships] = await Promise.all([loadPrefs(db), loadMemberships(db)]);
  counts.memberships = memberships.length;
  const prefs = new Map<string, PrefsRow>(prefsRows.map((p) => [p.user_id, p]));
  const recipients = selectRecipients(memberships, prefs);
  counts.people = recipients.length;
  if (!recipients.length) return counts;

  const lastSends = await loadLastSends(
    db,
    recipients.map((r) => r.userId),
    new Date(now.getTime() - 9 * 86_400_000).toISOString(),
  );
  const due: Recipient[] = recipients.filter((r) =>
    isDueToday(r.settings.frequency, lastDigestDay(prefs.get(r.userId)?.last_digest_at, lastSends.get(r.userId)), today),
  );
  counts.due = due.length;
  if (!due.length) return counts;

  // 2. Leurs entreprises (sauf comptes suspendus) et l'état de chaque parc.
  const orgIds = [...new Set(due.flatMap((r) => r.orgs.map((o) => o.orgId)))];
  const [profiles, orgs] = await Promise.all([loadProfiles(db, due.map((r) => r.userId)), loadOrgs(db, orgIds)]);
  const activeOrgIds = orgIds.filter((id) => orgs.has(id) && orgs.get(id)!.plan !== 'suspendu');
  const rows = await loadFleets(db, activeOrgIds, readingsSince(today));
  const fleets = new Map<string, OrgFleet>();
  for (const id of activeOrgIds) {
    fleets.set(
      id,
      buildOrgFleet(
        orgs.get(id)!,
        rows.machines.filter((m) => m.org_id === id),
        rows.schedules.filter((s) => s.org_id === id),
        rows.repairs.filter((r) => r.org_id === id),
        rows.readings.filter((r) => r.org_id === id),
        today,
      ),
    );
  }

  // 3. Un e-mail par personne (toutes ses entreprises), seulement s'il y a quelque chose à signaler.
  let firstSend = true;
  for (const r of due) {
    const sections = buildSections(r, fleets);
    if (!sections.length) {
      counts.nothing++;
      continue;
    }
    const profile = profiles.get(r.userId);
    const wanted = profile?.locale;
    const locale: Locale = isLocale(wanted) ? wanted : 'fr';
    const kind = `rappel_${r.settings.frequency}`;
    const detail = detailOf(sections, locale);
    const log = (status: LogRow['status'], extra = '') =>
      writeLog(db, {
        user_id: r.userId,
        org_id: sections.length === 1 ? sections[0].org.id : null,
        kind,
        status,
        detail: extra ? `${detail};${extra}` : detail,
      });

    const email = profile?.email?.trim() ?? '';
    if (!EMAIL_RE.test(email) || email.length > 254) {
      counts.noAddress++;
      await log('ignore', 'motif=sans_adresse');
      continue;
    }

    let rendered: ReturnType<typeof renderDigest>;
    try {
      rendered = renderDigest({
        locale,
        name: profile?.full_name ?? null,
        frequency: r.settings.frequency,
        leadDays: r.settings.leadDays,
        leadHours: r.settings.leadHours,
        sections,
        links: linksFor(cfg.siteUrl, locale),
        replyAllowed: Boolean(cfg.resend?.replyTo),
      });
    } catch (error) {
      counts.errors++;
      console.error('[rappels] rendu impossible :', error instanceof Error ? error.message.slice(0, 200) : 'erreur');
      await log('erreur', 'code=rendu');
      continue;
    }

    if (cfg.mode === 'simulation' || !cfg.resend) {
      counts.simulated++;
      await log('simulation');
      continue;
    }

    if (Date.now() - started > cfg.timeBudgetMs) {
      counts.deferred++;
      continue;
    }
    if (!firstSend) await sleep(cfg.pauseMs);
    firstSend = false;

    const message = {
      to: email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      headers: { 'List-Unsubscribe': `<${linksFor(cfg.siteUrl, locale).settings}>` },
      tags: [
        { name: 'type', value: 'rappels' },
        { name: 'frequence', value: r.settings.frequency },
      ],
      idempotencyKey: `rappels-${today}-${r.userId}`,
    };
    let outcome = await sendWithResend(cfg.resend, message);
    // Un second essai si Resend limite le débit ou est momentanément indisponible (la clé d'idempotence évite
    // un double envoi si le premier essai était en fait passé).
    if (!outcome.ok && (outcome.status === 429 || outcome.status === 0 || outcome.status >= 500)) {
      await sleep(outcome.retryAfterMs ?? 1500);
      outcome = await sendWithResend(cfg.resend, message);
    }
    if (outcome.ok) {
      counts.sent++;
      if (prefs.has(r.userId)) await markDigestSent(db, r.userId, new Date().toISOString());
      await log('envoye', outcome.id ? `id=${outcome.id}` : '');
    } else {
      counts.errors++;
      console.warn('[rappels] envoi refusé :', outcome.status, outcome.code);
      await log('erreur', `http=${outcome.status};code=${outcome.code}`);
    }
  }
  return counts;
}

/** Détail du journal : compteurs et langue, sans contenu personnel. */
function detailOf(sections: DigestSection[], locale: Locale): string {
  const t = totalsOf(sections);
  return `echeances=${t.dues};depassees=${t.overdue};reparations=${t.repairs};entreprises=${t.orgs};langue=${locale}`;
}

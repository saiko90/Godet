// Fonction Supabase « rappels » : résumé par e-mail des échéances proches ou dépassées et des réparations ouvertes.
// Appelée chaque matin par la tâche planifiée (pg_cron + pg_net, migration 20261020120000_rappels_cron.sql).
//
// - Appel : POST sans corps (un corps éventuel est ignoré). Vérification JWT désactivée : c'est le garde-fou
//   (table job_runs) qui limite à une exécution réelle toutes les 20 heures ; un appel répété ne fait rien.
// - Envoi réel par Resend si les secrets RESEND_API_KEY et EMAIL_FROM existent ; sinon « simulation » : rien ne part,
//   une ligne « simulation » est écrite au journal (notification_log) pour chaque e-mail qui serait parti.
// - En envoi réel, rien ne part la nuit : hors de 5 h–20 h (heure de Zurich), l'appel est sans effet.
// - Réponse : compteurs uniquement, jamais de donnée personnelle.
// Mode d'emploi : docs/notifications.md.

import { createClient } from '@supabase/supabase-js';
import { claimRun } from './data.ts';
import { zurichDay, zurichHour } from './format.ts';
import type { ResendConfig } from './resend.ts';
import { runReminders } from './run.ts';

const JOB = 'rappels';
/** Au plus une exécution réelle par fenêtre de 20 heures. */
const MIN_INTERVAL_HOURS = 20;
/** Heures d'envoi permises en envoi réel (heure de Zurich) : de 5 h à 20 h. */
const SEND_FROM_HOUR = 5;
const SEND_UNTIL_HOUR = 20;
/** Adresse publique du site tant que le secret SITE_URL n'est pas défini (déploiement Vercel de production). */
const DEFAULT_SITE_URL = 'https://godet-kappa.vercel.app';

function env(name: string): string | null {
  const value = Deno.env.get(name)?.trim();
  return value ? value : null;
}

/** Clé de service : nouvelle clé secrète (SUPABASE_SECRET_KEYS, « default ») ou, à défaut, l'ancienne clé service_role. */
function serviceKey(): string | null {
  const keys = env('SUPABASE_SECRET_KEYS');
  if (keys) {
    try {
      const parsed = JSON.parse(keys) as Record<string, unknown>;
      const key = parsed.default ?? Object.values(parsed)[0];
      if (typeof key === 'string' && key) return key;
    } catch {
      // Format inattendu : on se rabat sur la clé historique.
    }
  }
  return env('SUPABASE_SERVICE_ROLE_KEY');
}

function siteUrl(): string {
  const raw = env('SITE_URL') ?? DEFAULT_SITE_URL;
  try {
    const url = new URL(raw);
    if (url.protocol === 'https:' || url.protocol === 'http:') return url.origin;
  } catch {
    // Adresse invalide : valeur par défaut.
  }
  return DEFAULT_SITE_URL;
}

function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 300) : 'erreur inconnue';
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json(405, { ok: false, error: 'method_not_allowed' }, { Allow: 'POST' });

  const started = Date.now();
  const now = new Date();
  const url = env('SUPABASE_URL');
  const key = serviceKey();
  if (!url || !key) {
    console.error('[rappels] SUPABASE_URL ou clé de service absente');
    return json(500, { ok: false, error: 'not_configured' });
  }

  const apiKey = env('RESEND_API_KEY');
  const from = env('EMAIL_FROM');
  const resend: ResendConfig | null = apiKey && from ? { apiKey, from, replyTo: env('EMAIL_REPLY_TO') } : null;
  const mode = resend ? 'resend' : 'simulation';

  if (resend) {
    const hour = zurichHour(now);
    if (hour < SEND_FROM_HOUR || hour >= SEND_UNTIL_HOUR) {
      return json(200, { ok: true, status: 'skipped', reason: 'outside_window', mode });
    }
  }

  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  try {
    const claim = await claimRun(db, JOB, now, MIN_INTERVAL_HOURS);
    if (!claim.claimed) {
      const next = claim.lastRunAt
        ? new Date(Date.parse(claim.lastRunAt) + MIN_INTERVAL_HOURS * 3_600_000).toISOString()
        : null;
      console.log('[rappels] déjà exécuté récemment : rien à faire');
      return json(200, { ok: true, status: 'skipped', reason: 'recent_run', mode, lastRunAt: claim.lastRunAt, nextRunAfter: next });
    }

    const counts = await runReminders(
      db,
      { mode, resend, siteUrl: siteUrl(), timeBudgetMs: 110_000, pauseMs: 250 },
      now,
    );
    const ms = Date.now() - started;
    console.log('[rappels] terminé', JSON.stringify({ mode, ...counts, ms }));
    return json(200, { ok: true, status: 'done', mode, day: zurichDay(now), counts, ms });
  } catch (error) {
    console.error('[rappels] échec :', describe(error));
    return json(500, { ok: false, error: 'internal' });
  }
});

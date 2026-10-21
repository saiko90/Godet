// Fonction « assistant » : l'assistant IA de Godet (questions sur l'utilisation et sur le parc, en lecture seule) et
// la lecture du compteur d'heures sur photo. Appelée depuis le garage avec la session de la personne.
//
// POST { action: 'chat', orgId, locale, messages: [{ role: 'user'|'assistant', content }], machineId? }
//   → { reply, used, limit }
// POST { action: 'meter', orgId, image: <base64>, mediaType: 'image/jpeg'|…, machineId? }
//   → { hours: number|null, confidence: 'high'|'medium'|'low', note, used, limit }
// Erreurs : { error } parmi unauthorized, forbidden, bad_request, not_configured, subscription_inactive,
// limit_reached, ai_error.
//
// Secrets : ANTHROPIC_API_KEY (obligatoire), ANTHROPIC_MODEL (facultatif, défaut claude-haiku-5-5),
// ANTHROPIC_WORKSPACE_ID (si la clé n'est pas rattachée à un espace de travail).
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.118.0';
import { AIDE } from './aide.ts';

const LOCALES = ['fr', 'de', 'it', 'en'] as const;
type Locale = (typeof LOCALES)[number];
const LANGUAGE: Record<Locale, string> = { fr: 'français', de: 'allemand (Suisse : pas de ß, écrire ss)', it: 'italien', en: 'anglais' };
const DEFAULT_SITE_URL = 'https://godet.app';
const DEFAULT_MODEL = 'claude-haiku-5-5';

/** Limites mensuelles (mêmes valeurs que le mode d'emploi, aide.ts, et la page des tarifs). */
const LIMITS = {
  essai: { chat: 30, photo: 50 },
  essentiel: { chat: 100, photo: 500 },
  pro: { chat: 300, photo: 500 },
  parc: { chat: 800, photo: 500 },
} as const;

const MAX_TURNS = 20;
const MAX_CHARS = 4000;
const MAX_IMAGE_BASE64 = 6_000_000;
const MAX_ENTRIES = 2500;

function env(name: string): string | null {
  const value = Deno.env.get(name)?.trim();
  return value ? value : null;
}

function serviceKey(): string | null {
  const keys = env('SUPABASE_SECRET_KEYS');
  if (keys) {
    try {
      const parsed = JSON.parse(keys) as Record<string, unknown>;
      const key = parsed.default ?? Object.values(parsed)[0];
      if (typeof key === 'string' && key) return key;
    } catch {
      // Format inattendu : clé historique.
    }
  }
  return env('SUPABASE_SERVICE_ROLE_KEY');
}

const SITE = (env('SITE_URL') ?? DEFAULT_SITE_URL).replace(/\/$/, '');
const ALLOWED_ORIGINS = new Set([SITE, SITE.replace('://', '://www.'), 'https://www.godet.app', 'https://godet.app', 'https://godet-kappa.vercel.app', 'http://localhost:3000']);

function cors(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : SITE,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
    Vary: 'Origin',
  };
}

function json(req: Request, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors(req) } });
}

// ------------------------------------------------------------------ Claude

interface ContentBlock {
  type: string;
  text?: string;
}

class AiError extends Error {}

async function claude(body: Record<string, unknown>): Promise<string> {
  const key = env('ANTHROPIC_API_KEY');
  if (!key) throw new AiError('not_configured');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      ...(env('ANTHROPIC_WORKSPACE_ID') ? { 'anthropic-workspace-id': env('ANTHROPIC_WORKSPACE_ID') as string } : {}),
    },
    body: JSON.stringify({ model: env('ANTHROPIC_MODEL') ?? DEFAULT_MODEL, ...body }),
  });
  const data = (await res.json().catch(() => ({}))) as { content?: ContentBlock[]; error?: { type?: string; message?: string } };
  if (!res.ok) {
    console.error('[assistant] Claude :', res.status, data.error?.type, data.error?.message);
    throw new AiError('ai_error');
  }
  return (data.content ?? [])
    .filter((b) => b.type === 'text' && b.text)
    .map((b) => b.text)
    .join('\n')
    .trim();
}

// ------------------------------------------------------------------ données du parc

const clean = (v: unknown) => (v == null || v === '' ? '' : String(v).replace(/[\t\r\n]+/g, ' ').trim());
const day = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : '');

/** Le parc de l'entreprise en tableaux compacts (codes de machine plutôt qu'identifiants). */
async function fleetContext(db: SupabaseClient, org: Record<string, unknown>, focusId: string | null): Promise<string> {
  const orgId = org.id as string;
  const since = new Date(Date.now() - 730 * 86400000).toISOString().slice(0, 10);
  const readingsSince = new Date(Date.now() - 120 * 86400000).toISOString();
  const [machines, schedules, entries, openRepairs, readings] = await Promise.all([
    db.from('machines').select('id, code, kind, brand, model, year, serial, plate, weight_t, hours, hours_at, notes, archived_at, last_lat, last_lng, last_located_at').eq('org_id', orgId).order('code'),
    db.from('schedules').select('machine_id, label, basis, interval_hours, interval_days, due_hours, due_date, last_hours, last_date').eq('org_id', orgId).eq('active', true),
    db
      .from('entries')
      .select('machine_id, date, kind, title, details, hours, performed_by, cost_parts, cost_labour, downtime_hours, repair_status, part_ref, part_qty, supplier, warranty_until')
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .gte('date', since)
      .order('date', { ascending: false })
      .limit(MAX_ENTRIES),
    db.from('entries').select('machine_id, date, title, repair_status').eq('org_id', orgId).is('deleted_at', null).eq('kind', 'reparation').in('repair_status', ['en_cours', 'attente_piece']),
    db.from('hour_readings').select('machine_id, hours, read_at').eq('org_id', orgId).gte('read_at', readingsSince).order('read_at').limit(3000),
  ]);
  for (const r of [machines, schedules, entries, openRepairs, readings]) if (r.error) console.error('[assistant] lecture :', r.error.code, r.error.message);

  const code = new Map<string, string>();
  for (const m of machines.data ?? []) code.set(m.id, m.code);
  const c = (id: string) => code.get(id) ?? '?';

  const active = (machines.data ?? []).filter((m) => !m.archived_at);
  const archived = (machines.data ?? []).filter((m) => m.archived_at);
  const focus = focusId ? code.get(focusId) : null;

  // Rythme d'utilisation (h par semaine) d'après les relevés des 120 derniers jours.
  const rate = new Map<string, number>();
  const byMachine = new Map<string, { hours: number; t: number }[]>();
  for (const r of readings.data ?? []) {
    const list = byMachine.get(r.machine_id) ?? [];
    list.push({ hours: Number(r.hours), t: Date.parse(r.read_at) });
    byMachine.set(r.machine_id, list);
  }
  for (const [id, list] of byMachine) {
    if (list.length < 2) continue;
    const a = list[0];
    const b = list[list.length - 1];
    const days = (b.t - a.t) / 86400000;
    if (days >= 7 && b.hours > a.hours) rate.set(id, Math.round(((b.hours - a.hours) / days) * 7 * 10) / 10);
  }

  const lines: string[] = [];
  lines.push(`Entreprise : ${clean(org.name)} · devise ${clean(org.currency) || 'CHF'} · pays ${clean(org.country) || 'CH'}`);
  if (focus) lines.push(`Machine ouverte à l'écran : ${focus}`);
  lines.push('');
  lines.push(`## Machines actives (${active.length})`);
  lines.push('code\ttype\tmarque\tmodèle\tannée\tn° série\tplaque\tpoids t\tcompteur h\trelevé le\trythme h/sem\tdernière position (lat, lng, le)\tnotes');
  for (const m of active) {
    lines.push(
      [m.code, m.kind, m.brand, m.model, m.year, m.serial, m.plate, m.weight_t, Number(m.hours), day(m.hours_at), rate.get(m.id) ?? '', m.last_lat != null ? `${m.last_lat}, ${m.last_lng}, ${day(m.last_located_at)}` : '', m.notes]
        .map(clean)
        .join('\t'),
    );
  }
  if (archived.length) lines.push(`Machines archivées : ${archived.map((m) => `${m.code} (le ${day(m.archived_at)})`).join(', ')}`);
  lines.push('');
  lines.push('## Échéances actives');
  lines.push('machine\tlibellé\tbase\tintervalle\tprochaine à (h)\tprochaine le\tdernière fois (h)\tdernière fois le');
  for (const s of schedules.data ?? []) {
    const interval = s.basis === 'heures' ? `${s.interval_hours ?? ''} h` : `${s.interval_days ?? ''} j`;
    lines.push([c(s.machine_id), s.label, s.basis, interval, s.due_hours, s.due_date, s.last_hours, s.last_date].map(clean).join('\t'));
  }
  lines.push('');
  lines.push('## Réparations ouvertes');
  for (const e of openRepairs.data ?? []) lines.push([c(e.machine_id), e.date, e.title, e.repair_status].map(clean).join('\t'));
  if (!(openRepairs.data ?? []).length) lines.push('(aucune)');
  lines.push('');
  const list = entries.data ?? [];
  lines.push(`## Carnet : saisies depuis le ${since}${list.length >= MAX_ENTRIES ? ` (les ${MAX_ENTRIES} plus récentes seulement)` : ''}`);
  lines.push('date\tmachine\ttype\ttitre\tdétails\tcompteur h\tfait par\tpièces\tmain-d\'œuvre\timmobilisation h\tstatut réparation\tréf. pièce\tqté\tfournisseur\tgarantie');
  for (const e of list) {
    lines.push(
      [
        e.date,
        c(e.machine_id),
        e.kind,
        e.title,
        clean(e.details).slice(0, 300),
        e.hours,
        e.performed_by,
        Number(e.cost_parts) || '',
        Number(e.cost_labour) || '',
        e.downtime_hours,
        e.repair_status,
        e.part_ref,
        e.part_qty,
        e.supplier,
        e.warranty_until,
      ]
        .map(clean)
        .join('\t'),
    );
  }

  // Option Location : réservations et locations en cours ou à venir, dernières locations terminées.
  const rentalOn = (org.plan === 'essai' && Date.parse(String(org.trial_ends_at)) > Date.now()) || (org.plan === 'actif' && org.rental_addon === true);
  lines.push('');
  if (!rentalOn) lines.push('## Option Location : non activée pour cette entreprise (Paramètres → Abonnement).');
  else {
    const since90 = new Date(Date.now() - 90 * 86400000).toISOString();
    const { data: rentals, error } = await db
      .from('rentals')
      .select('machine_id, status, client_company, client_name, site, delivery, transport, start_at, end_at, out_at, back_at')
      .eq('org_id', orgId)
      .neq('status', 'annulee')
      .or(`status.in.(reservee,en_cours),end_at.gte.${since90}`)
      .order('start_at')
      .limit(500);
    if (error) console.error('[assistant] locations :', error.code, error.message);
    lines.push(`## Locations (option Location active ; maintenant : ${new Date().toISOString().slice(0, 16)} UTC)`);
    lines.push('machine\tstatut\tclient\tchantier\tdépart prévu\tretour prévu\tparti le\trendu le\ttransport (livraison)');
    for (const r of rentals ?? []) {
      const late = r.status === 'en_cours' && Date.parse(r.end_at) < Date.now() ? ' (retour en retard)' : '';
      lines.push([c(r.machine_id), `${r.status}${late}`, [r.client_company, r.client_name].filter(Boolean).join(' · '), r.site, r.start_at.slice(0, 16), r.end_at.slice(0, 16), r.out_at?.slice(0, 16), r.back_at?.slice(0, 16), transportText(r)].map(clean).join('\t'));
    }
    if (!(rentals ?? []).length) lines.push('(aucune)');
  }
  return lines.join('\n');
}

/** Transport d'une location livrée : aller et retour, confirmé (transporteur) ou à organiser. */
function transportText(r: { delivery?: string | null; transport?: unknown }): string {
  if (r.delivery !== 'livraison') return 'enlèvement par le client';
  const t = (r.transport && typeof r.transport === 'object' ? r.transport : {}) as Record<string, { carrier?: string; done?: boolean } | undefined>;
  const leg = (k: string, label: string) => `${label} ${t[k]?.done ? `confirmé (${clean(t[k]?.carrier)})` : 'à organiser'}`;
  return `${leg('out', 'aller')}, ${leg('back', 'retour')}`;
}

// ------------------------------------------------------------------ requêtes

function chatSystem(locale: Locale, today: string, fleet: string) {
  const rules = `Tu es l'assistant de Godet, le carnet d'entretien numérique des machines de chantier. Tu aides les
personnes d'une entreprise cliente à utiliser Godet et à comprendre leur parc.

Règles :
- Réponds en ${LANGUAGE[locale]}, sauf si la personne écrit clairement dans une autre langue : alors dans la sienne.
- Sois bref et concret : quelques phrases ou une courte liste. Pas de titres. Markdown simple seulement (gras, listes).
- Appuie-toi uniquement sur le mode d'emploi et sur les données du parc ci-dessous. N'invente ni chiffre, ni machine,
  ni fonction. Si l'information manque, dis-le et indique où la saisir ou la trouver dans Godet.
- Tu es en lecture seule : tu ne peux rien enregistrer ni modifier. Explique en une phrase comment le faire dans Godet.
- Désigne les machines par leur code (ex. PE-01). Dates au format jj.mm.aaaa. Montants dans la devise de l'entreprise,
  avec l'apostrophe suisse pour les milliers (ex. 12'450 CHF). Heures de compteur : « 4'520 h ».
- Une échéance en heures est dépassée si le compteur actuel ≥ « prochaine à (h) » ; en date, si la date du jour ≥
  « prochaine le ». Estime la date d'une échéance en heures avec le rythme h/sem (sinon ≈ 30 h/sem, en le disant).
- Pour un coût, additionne pièces + main-d'œuvre des saisies concernées et précise la période.
- Questions sans rapport avec Godet, l'entretien ou les machines de chantier : réponds poliment que tu es là pour Godet.
- Conseils techniques d'entretien : généraux et prudents ; renvoie au manuel du constructeur et à un mécanicien.
- Position d'une machine : donne la date et le lien https://www.openstreetmap.org/?mlat=LAT&mlon=LNG (sans inventer de lieu).
- Problème de compte, de paiement ou bug : propose la page Contact (https://godet.app/contact).

Date du jour : ${today}.`;
  return [
    { type: 'text', text: rules },
    { type: 'text', text: AIDE },
    { type: 'text', text: `# Données du parc de l'entreprise\n\n${fleet}`, cache_control: { type: 'ephemeral' } },
  ];
}

const METER_PROMPT = `Lis le compteur d'heures de fonctionnement d'une machine de chantier sur cette photo.

- Compteur à rouleaux : le dernier chiffre est souvent les dixièmes (couleur ou fond différent, parfois après une
  virgule) ; un rouleau entre deux chiffres compte pour le plus petit.
- Écran numérique : prends la valeur des heures moteur (symbole sablier, horloge, « h », « Std », « ore », « HRS »),
  pas l'heure du jour, le régime, le kilométrage ou le carburant.
{{HINT}}
Réponds UNIQUEMENT avec un objet JSON, sans texte autour :
{"hours": nombre ou null, "confidence": "high" | "medium" | "low", "note": "phrase courte en {{LANG}} (ce qui a été lu, ou pourquoi c'est illisible)"}
"hours" utilise un point décimal (ex. 4520.3). null si aucun compteur d'heures n'est lisible.`;

function parseMeter(text: string): { hours: number | null; confidence: 'high' | 'medium' | 'low'; note: string } {
  const match = text.match(/\{[\s\S]*\}/);
  try {
    const o = JSON.parse(match ? match[0] : text) as { hours?: unknown; confidence?: unknown; note?: unknown };
    const n = typeof o.hours === 'number' ? o.hours : typeof o.hours === 'string' ? Number(o.hours.replace(/[’'\s]/g, '').replace(',', '.')) : NaN;
    const confidence = o.confidence === 'high' || o.confidence === 'medium' ? o.confidence : 'low';
    return {
      hours: Number.isFinite(n) && n >= 0 && n < 10_000_000 ? Math.round(n * 10) / 10 : null,
      confidence,
      note: typeof o.note === 'string' ? o.note.slice(0, 300) : '',
    };
  } catch {
    return { hours: null, confidence: 'low', note: '' };
  }
}

// ------------------------------------------------------------------ point d'entrée

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) });
  if (req.method !== 'POST') return json(req, 405, { error: 'method' });

  const url = env('SUPABASE_URL');
  const key = serviceKey();
  if (!url || !key) return json(req, 500, { error: 'not_configured' });
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return json(req, 401, { error: 'unauthorized' });
  const { data: auth, error: authError } = await db.auth.getUser(token);
  const user = auth?.user;
  if (authError || !user) return json(req, 401, { error: 'unauthorized' });

  let body: {
    action?: string;
    orgId?: string;
    locale?: string;
    machineId?: string;
    messages?: { role?: string; content?: unknown }[];
    image?: string;
    mediaType?: string;
  };
  try {
    body = await req.json();
  } catch {
    return json(req, 400, { error: 'bad_request' });
  }
  const locale: Locale = (LOCALES as readonly string[]).includes(body.locale ?? '') ? (body.locale as Locale) : 'fr';
  const orgId = body.orgId ?? '';
  const uuid = /^[0-9a-f-]{36}$/i;
  if (!uuid.test(orgId)) return json(req, 400, { error: 'bad_request' });
  const machineId = body.machineId && uuid.test(body.machineId) ? body.machineId : null;

  const { data: member } = await db.from('memberships').select('role').eq('org_id', orgId).eq('user_id', user.id).maybeSingle();
  if (!member) return json(req, 403, { error: 'forbidden' });
  const { data: org } = await db.from('organizations').select('*').eq('id', orgId).single();
  if (!org) return json(req, 403, { error: 'forbidden' });

  // Même règle que l'écriture : essai en cours ou abonnement actif.
  const trial = org.plan === 'essai' && Date.parse(org.trial_ends_at) > Date.now();
  if (org.plan !== 'actif' && !trial) return json(req, 403, { error: 'subscription_inactive' });
  const tier = org.plan === 'actif' && (org.billing_tier === 'pro' || org.billing_tier === 'parc') ? org.billing_tier : org.plan === 'actif' ? 'essentiel' : 'essai';

  const kind = body.action === 'meter' ? 'photo' : body.action === 'chat' ? 'chat' : null;
  if (!kind) return json(req, 400, { error: 'bad_request' });
  const limit = LIMITS[tier as keyof typeof LIMITS][kind];

  // Contrôle des entrées avant de compter l'appel.
  let messages: { role: 'user' | 'assistant'; content: string }[] = [];
  if (kind === 'chat') {
    messages = (body.messages ?? [])
      .slice(-MAX_TURNS)
      .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: (m.content as string).slice(0, MAX_CHARS) }));
    while (messages.length && messages[0].role !== 'user') messages.shift();
    if (!messages.length || messages[messages.length - 1].role !== 'user') return json(req, 400, { error: 'bad_request' });
  } else {
    const ok = typeof body.image === 'string' && body.image.length > 100 && body.image.length < MAX_IMAGE_BASE64;
    if (!ok || !['image/jpeg', 'image/png', 'image/webp'].includes(body.mediaType ?? '')) return json(req, 400, { error: 'bad_request' });
  }
  if (!env('ANTHROPIC_API_KEY')) return json(req, 500, { error: 'not_configured' });

  const { data: used, error: usageError } = await db.rpc('ai_consume', { p_org: orgId, p_kind: kind, p_limit: limit });
  if (usageError) {
    console.error('[assistant] compteur :', usageError.code, usageError.message);
    return json(req, 500, { error: 'ai_error' });
  }
  if (used == null) return json(req, 429, { error: 'limit_reached', used: limit, limit });

  const today = new Intl.DateTimeFormat('fr-CH', { timeZone: 'Europe/Zurich', dateStyle: 'short' }).format(new Date());

  try {
    if (kind === 'chat') {
      const fleet = await fleetContext(db, org, machineId);
      const reply = await claude({
        max_tokens: 3000,
        output_config: { effort: 'low' },
        system: chatSystem(locale, today, fleet),
        messages,
      });
      return json(req, 200, { reply: reply || '…', used, limit });
    }

    let hint = '';
    if (machineId) {
      const { data: m } = await db.from('machines').select('code, kind, brand, model, hours').eq('id', machineId).eq('org_id', orgId).maybeSingle();
      if (m) hint = `- Machine : ${[m.code, m.kind, m.brand, m.model].filter(Boolean).join(' · ')}. Dernier relevé enregistré : ${Number(m.hours)} h (à titre indicatif seulement : lis ce que montre la photo, ne recopie jamais cette valeur).`;
    }
    const text = await claude({
      max_tokens: 1500,
      output_config: { effort: 'medium' },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: body.mediaType, data: body.image } },
            { type: 'text', text: METER_PROMPT.replace('{{HINT}}', hint).replace('{{LANG}}', LANGUAGE[locale]) },
          ],
        },
      ],
    });
    return json(req, 200, { ...parseMeter(text), used, limit });
  } catch (e) {
    // L'IA n'a pas répondu : l'appel ne compte pas.
    const { error: refundError } = await db.rpc('ai_refund', { p_org: orgId, p_kind: kind });
    if (refundError) console.error('[assistant] remboursement :', refundError.code, refundError.message);
    if (e instanceof AiError) return json(req, e.message === 'not_configured' ? 500 : 502, { error: e.message });
    console.error('[assistant]', e);
    return json(req, 500, { error: 'ai_error' });
  }
});

import 'server-only';

import { oneLine } from './layout';

// Envoi d'e-mails par l'API REST de Resend (https://resend.com/docs/api-reference/emails/send-email).
// Configuration (variables d'environnement du serveur, jamais exposées au navigateur) :
//   RESEND_API_KEY  clé d'API Resend (« re_… »)
//   EMAIL_FROM      expéditeur, adresse d'un domaine vérifié chez Resend (« Godet <rappels@exemple.ch> »)
//   EMAIL_REPLY_TO  facultatif : adresse de réponse par défaut
// Sans RESEND_API_KEY ou EMAIL_FROM, rien n'est envoyé : { sent: false, reason: 'not_configured' }.

const RESEND_URL = 'https://api.resend.com/emails';
const TIMEOUT_MS = 10_000;

export interface EmailInput {
  /** Destinataire(s) : 50 adresses au plus. */
  to: string | string[];
  subject: string;
  html: string;
  /** Version texte (lecteurs d'e-mails sans HTML, filtres anti-spam). */
  text: string;
  /** Adresse de réponse (sinon EMAIL_REPLY_TO, sinon aucune). */
  replyTo?: string;
  /** Nom affiché de l'expéditeur (l'adresse reste celle d'EMAIL_FROM, domaine vérifié). */
  fromName?: string;
  /** En-têtes supplémentaires (ex. List-Unsubscribe). */
  headers?: Record<string, string>;
  /** Étiquettes Resend (lettres ASCII, chiffres, « _ » et « - » uniquement). */
  tags?: { name: string; value: string }[];
  /** Clé d'idempotence (24 h chez Resend) : un même envoi répété ne part qu'une fois. */
  idempotencyKey?: string;
}

export type EmailFailure =
  | 'not_configured'
  | 'invalid_recipient'
  | 'invalid_content'
  | 'rejected'
  | 'rate_limited'
  | 'provider_error'
  | 'network_error';

export type SendEmailResult =
  | { sent: true; id: string }
  | { sent: false; reason: EmailFailure; status?: number; code?: string };

interface EmailConfig {
  apiKey: string;
  from: string;
  replyTo: string | null;
}

function config(): EmailConfig | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) return null;
  return { apiKey, from, replyTo: process.env.EMAIL_REPLY_TO?.trim() || null };
}

/** L'envoi réel est-il configuré (clé Resend et expéditeur) ? */
export function isEmailConfigured(): boolean {
  return config() !== null;
}

/** Adresse de réponse par défaut (EMAIL_REPLY_TO), ou null : sans elle, les e-mails invitent à ne pas répondre. */
export function defaultReplyTo(): string | null {
  return config()?.replyTo ?? null;
}

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

/** Adresse e-mail plausible (la vérification réelle est faite par Resend). */
export function isEmailAddress(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 254 && EMAIL_RE.test(value);
}

const TAG_RE = /^[A-Za-z0-9_-]{1,256}$/;

/** Code d'erreur Resend (« validation_error »…), réduit à un identifiant sûr pour les journaux. */
function errorCode(body: unknown): string {
  const name = body && typeof body === 'object' ? (body as { name?: unknown }).name : null;
  return typeof name === 'string' && /^[a-z_]{1,40}$/.test(name) ? name : 'unknown';
}

/** « Godet <rappels@godet.app> » + « Michaël Kaeser » → « Michaël Kaeser <rappels@godet.app> ». */
function withName(from: string, name: string | undefined): string {
  const clean = name ? oneLine(name).replace(/[<>"\\]/g, '') : '';
  if (!clean) return from;
  const address = /<([^>]+)>/.exec(from)?.[1] ?? from;
  return `"${clean}" <${address.trim()}>`;
}

/**
 * Envoie un e-mail. Ne lève jamais d'exception : le résultat dit s'il est parti.
 * Les journaux ne contiennent ni adresse ni contenu, seulement le statut HTTP et le code d'erreur.
 */
export async function sendEmail(input: EmailInput): Promise<SendEmailResult> {
  const cfg = config();
  if (!cfg) return { sent: false, reason: 'not_configured' };

  const to = (Array.isArray(input.to) ? input.to : [input.to]).map((a) => a.trim());
  if (!to.length || to.length > 50 || !to.every(isEmailAddress)) return { sent: false, reason: 'invalid_recipient' };

  const subject = oneLine(input.subject);
  if (!subject || !input.html || !input.text) return { sent: false, reason: 'invalid_content' };

  const replyTo = input.replyTo?.trim() || cfg.replyTo;
  const payload: Record<string, unknown> = {
    from: withName(cfg.from, input.fromName),
    to,
    subject,
    html: input.html,
    text: input.text,
  };
  if (replyTo && isEmailAddress(replyTo)) payload.reply_to = replyTo;
  if (input.headers && Object.keys(input.headers).length) payload.headers = input.headers;
  const tags = (input.tags ?? []).filter((t) => TAG_RE.test(t.name) && TAG_RE.test(t.value));
  if (tags.length) payload.tags = tags;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${cfg.apiKey}`,
    'Content-Type': 'application/json',
    'User-Agent': 'godet-app/1.0',
  };
  if (input.idempotencyKey) headers['Idempotency-Key'] = input.idempotencyKey.slice(0, 256);

  let res: Response;
  try {
    res = await fetch(RESEND_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    });
  } catch {
    console.warn('[email] Resend injoignable');
    return { sent: false, reason: 'network_error' };
  }

  const body: unknown = await res.json().catch(() => null);
  if (res.ok) {
    const id = body && typeof body === 'object' ? (body as { id?: unknown }).id : null;
    return { sent: true, id: typeof id === 'string' ? id : '' };
  }

  const code = errorCode(body);
  console.warn('[email] envoi refusé par Resend', res.status, code);
  const reason: EmailFailure = res.status === 429 ? 'rate_limited' : res.status >= 500 ? 'provider_error' : 'rejected';
  return { sent: false, reason, status: res.status, code };
}

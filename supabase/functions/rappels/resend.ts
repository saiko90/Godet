// Envoi par l'API REST de Resend (https://resend.com/docs/api-reference/emails/send-email).
// Aucun journal ici : l'appelant consigne le résultat (statut HTTP et code d'erreur, jamais l'adresse ni le contenu).

const RESEND_URL = 'https://api.resend.com/emails';
const TIMEOUT_MS = 15_000;

export interface ResendConfig {
  apiKey: string;
  /** Expéditeur d'un domaine vérifié chez Resend : « Godet <rappels@exemple.ch> ». */
  from: string;
  /** Adresse de réponse facultative. */
  replyTo: string | null;
}

export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
  tags?: { name: string; value: string }[];
  /** Clé d'idempotence (24 h chez Resend) : un même rappel relancé ne part qu'une fois. */
  idempotencyKey?: string;
}

export type SendOutcome =
  | { ok: true; id: string }
  | { ok: false; status: number; code: string; retryAfterMs: number | null };

function errorCode(body: unknown): string {
  const name = body && typeof body === 'object' ? (body as { name?: unknown }).name : null;
  return typeof name === 'string' && /^[a-z_]{1,40}$/.test(name) ? name : 'unknown';
}

function retryAfter(res: Response): number | null {
  const raw = res.headers.get('retry-after') ?? res.headers.get('ratelimit-reset');
  const seconds = raw == null ? NaN : Number(raw);
  return Number.isFinite(seconds) && seconds >= 0 ? Math.min(seconds, 10) * 1000 : null;
}

export async function sendWithResend(
  cfg: ResendConfig,
  email: OutgoingEmail,
  fetchImpl: typeof fetch = fetch,
): Promise<SendOutcome> {
  const payload: Record<string, unknown> = {
    from: cfg.from,
    to: [email.to],
    subject: email.subject,
    html: email.html,
    text: email.text,
  };
  if (cfg.replyTo) payload.reply_to = cfg.replyTo;
  if (email.headers) payload.headers = email.headers;
  if (email.tags?.length) payload.tags = email.tags;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${cfg.apiKey}`,
    'Content-Type': 'application/json',
    'User-Agent': 'godet-rappels/1.0',
  };
  if (email.idempotencyKey) headers['Idempotency-Key'] = email.idempotencyKey.slice(0, 256);

  let res: Response;
  try {
    res = await fetchImpl(RESEND_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return { ok: false, status: 0, code: 'network', retryAfterMs: null };
  }
  const body: unknown = await res.json().catch(() => null);
  if (res.ok) {
    const id = body && typeof body === 'object' ? (body as { id?: unknown }).id : null;
    return { ok: true, id: typeof id === 'string' ? id.slice(0, 80) : '' };
  }
  return { ok: false, status: res.status, code: errorCode(body), retryAfterMs: res.status === 429 ? retryAfter(res) : null };
}

// Outils Stripe partagés par les fonctions « facturation » et « stripe-webhook » (fichier identique dans les deux :
// modifier supabase/functions/facturation/stripe.ts puis le recopier). Appels REST directs, sans dépendance.
// Le catalogue (produits, prix, coupon fondateur, portail client) se crée tout seul au premier besoin, en mode test
// comme en mode réel : rien à préparer à la main dans Stripe.

export type Tier = 'essentiel' | 'pro' | 'parc';
export type Interval = 'mois' | 'annee';
export type Currency = 'chf' | 'eur';

/** Prix mensuels (centimes) et machines autorisées. L'année vaut 10 mois (2 mois offerts). */
export const TIERS: Record<Tier, { name: string; limit: number; monthly: number }> = {
  essentiel: { name: 'Godet Essentiel', limit: 5, monthly: 2900 },
  pro: { name: 'Godet Pro', limit: 20, monthly: 5900 },
  parc: { name: 'Godet Parc', limit: 50, monthly: 9900 },
};
export const TIER_IDS = Object.keys(TIERS) as Tier[];
export const FOUNDER_COUPON = 'godet-fondateur-30';
export const FOUNDER_SLOTS = 10;

export class StripeError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | null,
    message: string,
  ) {
    super(message);
  }
}

function secretKey(): string {
  const key = Deno.env.get('STRIPE_SECRET_KEY')?.trim();
  if (!key) throw new StripeError(500, 'not_configured', 'STRIPE_SECRET_KEY manquante');
  return key;
}

/** Encodage « formulaire » de Stripe : a[b][0][c]=v. */
export function encode(params: Record<string, unknown>, prefix = ''): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (item !== null && typeof item === 'object') out.push(...encode(item as Record<string, unknown>, `${key}[${i}]`));
        else out.push(`${encodeURIComponent(`${key}[${i}]`)}=${encodeURIComponent(String(item))}`);
      });
    } else if (typeof v === 'object') out.push(...encode(v as Record<string, unknown>, key));
    else out.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
  }
  return out;
}

export async function stripe<T = Record<string, unknown>>(
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  params: Record<string, unknown> = {},
  idempotencyKey?: string,
): Promise<T> {
  const query = encode(params).join('&');
  const url = `https://api.stripe.com/v1/${path}${method === 'GET' && query ? `?${query}` : ''}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body: method === 'GET' ? undefined : query,
  });
  const json = (await res.json().catch(() => ({}))) as { error?: { code?: string; message?: string } } & T;
  if (!res.ok) throw new StripeError(res.status, json.error?.code ?? null, json.error?.message ?? `Stripe ${res.status}`);
  return json;
}

export const lookupKey = (tier: Tier, interval: Interval, cur: Currency) =>
  `godet_${tier}_${interval === 'annee' ? 'year' : 'month'}_${cur}`;

/** « godet_pro_year_chf » → { tier, interval, currency } ; null si ce n'est pas un prix Godet. */
export function parseLookupKey(key: string | null | undefined): { tier: Tier; interval: Interval; currency: Currency } | null {
  const m = /^godet_(essentiel|pro|parc)_(month|year)_(chf|eur)$/.exec(key ?? '');
  if (!m) return null;
  return { tier: m[1] as Tier, interval: m[2] === 'year' ? 'annee' : 'mois', currency: m[3] as Currency };
}

async function ensureProduct(tier: Tier): Promise<string> {
  const id = `godet_${tier}`;
  try {
    await stripe('GET', `products/${id}`);
  } catch (e) {
    if (!(e instanceof StripeError) || e.status !== 404) throw e;
    await stripe(
      'POST',
      'products',
      {
        id,
        name: TIERS[tier].name,
        description: `Carnet d'entretien Godet, jusqu'à ${TIERS[tier].limit} machines, utilisateurs illimités.`,
        metadata: { app: 'godet', tier, machines: TIERS[tier].limit },
      },
      `godet-product-${tier}`,
    );
  }
  return id;
}

/** Identifiant du prix (créé s'il n'existe pas encore). */
export async function ensurePrice(tier: Tier, interval: Interval, cur: Currency): Promise<string> {
  const key = lookupKey(tier, interval, cur);
  const found = await stripe<{ data: { id: string }[] }>('GET', 'prices', { 'lookup_keys[]': key, active: true, limit: 1 });
  if (found.data[0]) return found.data[0].id;
  const product = await ensureProduct(tier);
  const price = await stripe<{ id: string }>(
    'POST',
    'prices',
    {
      product,
      currency: cur,
      unit_amount: TIERS[tier].monthly * (interval === 'annee' ? 10 : 1),
      recurring: { interval: interval === 'annee' ? 'year' : 'month' },
      lookup_key: key,
      metadata: { app: 'godet', tier, interval },
    },
    `godet-price-${key}`,
  );
  return price.id;
}

export async function ensureFounderCoupon(): Promise<string> {
  try {
    await stripe('GET', `coupons/${FOUNDER_COUPON}`);
  } catch (e) {
    if (!(e instanceof StripeError) || e.status !== 404) throw e;
    await stripe(
      'POST',
      'coupons',
      { id: FOUNDER_COUPON, percent_off: 30, duration: 'forever', name: 'Pack fondateur −30 % à vie', metadata: { app: 'godet' } },
      `godet-coupon-${FOUNDER_COUPON}`,
    );
  }
  return FOUNDER_COUPON;
}

/** Configuration du portail client Godet (changer de formule, carte, factures, résiliation en fin de période). */
export async function ensurePortalConfiguration(): Promise<string> {
  const list = await stripe<{ data: { id: string; metadata?: Record<string, string> }[] }>('GET', 'billing_portal/configurations', {
    active: true,
    limit: 100,
  });
  const mine = list.data.find((c) => c.metadata?.app === 'godet');
  if (mine) return mine.id;
  const products = [];
  for (const tier of TIER_IDS) {
    const prices: string[] = [];
    for (const interval of ['mois', 'annee'] as Interval[]) for (const cur of ['chf', 'eur'] as Currency[]) prices.push(await ensurePrice(tier, interval, cur));
    products.push({ product: `godet_${tier}`, prices });
  }
  const created = await stripe<{ id: string }>(
    'POST',
    'billing_portal/configurations',
    {
      business_profile: { headline: 'Godet — abonnement', privacy_policy_url: 'https://godet.app/confidentialite' },
      features: {
        customer_update: { enabled: true, allowed_updates: ['email', 'address', 'name', 'tax_id'] },
        invoice_history: { enabled: true },
        payment_method_update: { enabled: true },
        subscription_cancel: { enabled: true, mode: 'at_period_end' },
        subscription_update: {
          enabled: true,
          default_allowed_updates: ['price'],
          proration_behavior: 'create_prorations',
          products,
        },
      },
      metadata: { app: 'godet' },
    },
    'godet-portal-v1',
  );
  return created.id;
}

/** Vérification de la signature d'un webhook Stripe (en-tête Stripe-Signature, tolérance 5 minutes). */
export async function verifySignature(payload: string, header: string | null, secret: string): Promise<boolean> {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(',').map((p) => {
      const i = p.indexOf('=');
      return [p.slice(0, i).trim(), p.slice(i + 1).trim()];
    }),
  ) as Record<string, string>;
  const t = Number(parts.t);
  if (!Number.isFinite(t) || Math.abs(Date.now() / 1000 - t) > 300) return false;
  const signatures = header
    .split(',')
    .filter((p) => p.trim().startsWith('v1='))
    .map((p) => p.trim().slice(3));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${payload}`)));
  const expected = [...mac].map((b) => b.toString(16).padStart(2, '0')).join('');
  return signatures.some((s) => timingSafeEqual(s, expected));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ------------------------------------------------------------------ abonnement → entreprise

export interface Subscription {
  id: string;
  customer: string;
  status: string;
  created?: number;
  cancel_at_period_end: boolean;
  current_period_end?: number;
  metadata?: Record<string, string>;
  items: { data: { current_period_end?: number; price: { lookup_key: string | null } }[] };
  discount?: { coupon?: { id: string } } | null;
  discounts?: ({ coupon?: { id: string } } | string)[];
}

/** État Stripe → plan Godet (actif : écriture permise ; suspendu : lecture seule). null : ne rien changer. */
export function planFor(status: string): 'actif' | 'suspendu' | null {
  if (['active', 'trialing', 'past_due'].includes(status)) return 'actif';
  if (['canceled', 'unpaid', 'incomplete_expired', 'paused'].includes(status)) return 'suspendu';
  return null; // incomplete : paiement en cours
}

/** Client Supabase minimal (clé de service) : évite d'importer le type complet ici. */
// deno-lint-ignore no-explicit-any
type Db = any;

/**
 * Recopie un abonnement Stripe dans l'entreprise (formule, état, fin de période, pack fondateur).
 * Utilisé par le webhook et par la resynchronisation au retour du paiement. Renvoie l'entreprise touchée ou null.
 */
export async function applySubscription(db: Db, sub: Subscription, knownOrgId?: string): Promise<{ orgId: string | null; error?: string }> {
  let orgId = sub.metadata?.org_id ?? knownOrgId ?? null;
  if (!orgId) {
    const { data } = await db.from('organizations').select('id').eq('stripe_customer_id', sub.customer).maybeSingle();
    orgId = data?.id ?? null;
  }
  if (!orgId) return { orgId: null, error: 'no_org' };

  const item = sub.items.data[0];
  const parsed = parseLookupKey(item?.price.lookup_key);
  const periodEnd = item?.current_period_end ?? sub.current_period_end ?? null;
  const coupons = [
    ...(sub.discounts ?? []).map((d) => (typeof d === 'string' ? null : d.coupon?.id ?? null)),
    sub.discount?.coupon?.id ?? null,
  ];
  const plan = planFor(sub.status);

  const { data: current } = await db.from('organizations').select('founder, stripe_subscription_id').eq('id', orgId).single();
  // Un ancien abonnement résilié ne doit pas écraser le nouveau.
  if (current?.stripe_subscription_id && current.stripe_subscription_id !== sub.id && plan === 'suspendu') return { orgId };

  const patch: Record<string, unknown> = {
    stripe_customer_id: sub.customer,
    stripe_subscription_id: sub.id,
    subscription_status: sub.status,
    cancel_at_period_end: sub.cancel_at_period_end,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    founder: Boolean(current?.founder) || coupons.includes(FOUNDER_COUPON),
  };
  if (parsed) {
    patch.billing_tier = parsed.tier;
    patch.billing_interval = parsed.interval;
  }
  if (plan) patch.plan = plan;
  const { error } = await db.from('organizations').update(patch).eq('id', orgId);
  return error ? { orgId, error: `${error.code} ${error.message}` } : { orgId };
}

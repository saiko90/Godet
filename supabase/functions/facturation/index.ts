// Fonction « facturation » : ouvre le paiement Stripe (Checkout) ou le portail client pour l'entreprise active.
// Appelée depuis les paramètres avec la session de la personne (en-tête Authorization : Bearer <jeton>).
// Seuls le propriétaire et les administrateurs de l'entreprise peuvent payer ou gérer l'abonnement.
//
// POST { action: 'checkout', orgId, tier: 'essentiel'|'pro'|'parc', interval: 'mois'|'annee', locale }
//   → { url }  (page de paiement Stripe ; ou portail si un abonnement existe déjà)
// POST { action: 'portal', orgId, locale } → { url }
// POST { action: 'sync', orgId } → { synced, status }  (relit l'abonnement chez Stripe)
// Erreurs : { error: code } avec code parmi unauthorized, forbidden, bad_request, tier_too_small, not_configured,
// no_customer, stripe.
import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
import {
  applySubscription,
  ensureFounderCoupon,
  ensurePortalConfiguration,
  ensurePrice,
  FOUNDER_COUPON,
  stripe,
  StripeError,
  TIERS,
  type Currency,
  type Interval,
  type Subscription,
  type Tier,
} from './stripe.ts';

const LOCALES = ['fr', 'de', 'it', 'en'] as const;
type Locale = (typeof LOCALES)[number];
const DEFAULT_SITE_URL = 'https://godet.app';
/** Abonnement encore vivant : on passe par le portail plutôt que d'en créer un second. */
const LIVE = new Set(['active', 'trialing', 'past_due', 'unpaid', 'incomplete']);

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

const localePath = (locale: Locale, path: string) => (locale === 'fr' ? path : `/${locale}${path}`);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) });
  if (req.method !== 'POST') return json(req, 405, { error: 'method' });

  const url = env('SUPABASE_URL');
  const key = serviceKey();
  if (!url || !key) return json(req, 500, { error: 'not_configured' });
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  // Qui appelle ? (jeton de session vérifié par Supabase Auth)
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return json(req, 401, { error: 'unauthorized' });
  const { data: auth, error: authError } = await db.auth.getUser(token);
  const user = auth?.user;
  if (authError || !user) return json(req, 401, { error: 'unauthorized' });

  let body: { action?: string; orgId?: string; tier?: string; interval?: string; locale?: string };
  try {
    body = await req.json();
  } catch {
    return json(req, 400, { error: 'bad_request' });
  }
  const locale: Locale = (LOCALES as readonly string[]).includes(body.locale ?? '') ? (body.locale as Locale) : 'fr';
  const orgId = body.orgId ?? '';
  if (!/^[0-9a-f-]{36}$/i.test(orgId)) return json(req, 400, { error: 'bad_request' });

  const { data: member } = await db.from('memberships').select('role').eq('org_id', orgId).eq('user_id', user.id).maybeSingle();
  if (!member || !['owner', 'admin'].includes(member.role)) return json(req, 403, { error: 'forbidden' });
  const { data: org, error: orgError } = await db.from('organizations').select('*').eq('id', orgId).single();
  if (orgError || !org) return json(req, 404, { error: 'bad_request' });

  // Retour sur le même site que la page d'origine (godet.app ou www.godet.app) : la session y est enregistrée.
  const origin = req.headers.get('Origin') ?? '';
  const base = ALLOWED_ORIGINS.has(origin) ? origin : SITE;
  const settings = `${base}${localePath(locale, '/parametres')}`;

  try {
    const portal = async () => {
      if (!org.stripe_customer_id) return json(req, 400, { error: 'no_customer' });
      const configuration = await ensurePortalConfiguration();
      const session = await stripe<{ url: string }>('POST', 'billing_portal/sessions', {
        customer: org.stripe_customer_id,
        return_url: `${settings}#abonnement`,
        configuration,
        locale,
      });
      return json(req, 200, { url: session.url });
    };

    if (body.action === 'portal') return await portal();

    // Resynchronisation (retour du paiement, ou webhook en retard) : l'abonnement le plus récent du client Stripe.
    if (body.action === 'sync') {
      let customer = org.stripe_customer_id as string | null;
      if (!customer) {
        const found = await stripe<{ data: { id: string }[] }>('GET', 'customers/search', { query: `metadata['org_id']:'${orgId}'`, limit: 1 });
        customer = found.data[0]?.id ?? null;
      }
      if (!customer) return json(req, 200, { synced: false });
      const subs = await stripe<{ data: Subscription[] }>('GET', 'subscriptions', { customer, status: 'all', limit: 10, 'expand[]': 'data.discounts' });
      const latest = [...subs.data].sort((a, b) => (b.created ?? 0) - (a.created ?? 0))[0];
      if (!latest) {
        await db.from('organizations').update({ stripe_customer_id: customer }).eq('id', orgId);
        return json(req, 200, { synced: false });
      }
      const result = await applySubscription(db, latest, orgId);
      if (result.error) console.error('[facturation] sync :', result.error);
      return json(req, 200, { synced: !result.error, status: latest.status });
    }
    if (body.action !== 'checkout') return json(req, 400, { error: 'bad_request' });

    const tier = body.tier as Tier;
    const interval = body.interval as Interval;
    if (!(tier in TIERS) || !['mois', 'annee'].includes(interval)) return json(req, 400, { error: 'bad_request' });

    // Déjà abonnée : changer de formule passe par le portail (prorata géré par Stripe).
    if (org.stripe_subscription_id && LIVE.has(org.subscription_status ?? '')) return await portal();

    const { count } = await db.from('machines').select('id', { count: 'exact', head: true }).eq('org_id', orgId).is('archived_at', null);
    if ((count ?? 0) > TIERS[tier].limit) return json(req, 400, { error: 'tier_too_small' });

    let customer = org.stripe_customer_id as string | null;
    if (!customer) {
      const created = await stripe<{ id: string }>(
        'POST',
        'customers',
        { email: user.email, name: org.name, preferred_locales: [locale], metadata: { org_id: orgId, app: 'godet' } },
        `godet-customer-${orgId}`,
      );
      customer = created.id;
      const { error: saveError } = await db.from('organizations').update({ stripe_customer_id: customer }).eq('id', orgId);
      if (saveError) console.error('[facturation] client non enregistré :', saveError.code, saveError.message);
    }

    const currency: Currency = org.currency === 'EUR' ? 'eur' : 'chf';
    const price = await ensurePrice(tier, interval, currency);
    // Pack fondateur : -30 % à vie pour les 10 premières entreprises (une entreprise fondatrice le garde si elle revient).
    const { data: slots } = await db.rpc('founder_slots_left');
    const founder = org.founder || (typeof slots === 'number' && slots > 0);
    if (founder) await ensureFounderCoupon();

    const session = await stripe<{ url: string }>('POST', 'checkout/sessions', {
      mode: 'subscription',
      customer,
      client_reference_id: orgId,
      line_items: [{ price, quantity: 1 }],
      ...(founder ? { discounts: [{ coupon: FOUNDER_COUPON }] } : { allow_promotion_codes: true }),
      subscription_data: { metadata: { org_id: orgId, app: 'godet' } },
      metadata: { org_id: orgId, app: 'godet' },
      success_url: `${settings}?abonnement=merci#abonnement`,
      cancel_url: `${settings}?abonnement=annule#abonnement`,
      locale,
      billing_address_collection: 'auto',
      customer_update: { address: 'auto', name: 'auto' },
    });
    return json(req, 200, { url: session.url });
  } catch (e) {
    if (e instanceof StripeError) {
      console.error('[facturation] Stripe :', e.status, e.code, e.message);
      return json(req, e.code === 'not_configured' ? 500 : 502, { error: e.code === 'not_configured' ? 'not_configured' : 'stripe' });
    }
    console.error('[facturation]', e);
    return json(req, 500, { error: 'stripe' });
  }
});

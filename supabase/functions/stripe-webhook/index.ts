// Fonction « stripe-webhook » : Stripe prévient ici à chaque changement d'abonnement ; l'entreprise est mise à jour
// (formule, état, fin de période, pack fondateur). Seule écriture des champs d'abonnement (clé de service).
// Signature vérifiée avec STRIPE_WEBHOOK_SECRET. Événements à cocher dans Stripe :
//   checkout.session.completed, customer.subscription.created, customer.subscription.updated,
//   customer.subscription.deleted, invoice.paid, invoice.payment_failed
import { createClient } from '@supabase/supabase-js';
import { FOUNDER_COUPON, parseLookupKey, stripe, verifySignature } from './stripe.ts';

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

interface Subscription {
  id: string;
  customer: string;
  status: string;
  cancel_at_period_end: boolean;
  current_period_end?: number;
  metadata?: Record<string, string>;
  items: { data: { current_period_end?: number; price: { lookup_key: string | null } }[] };
  discount?: { coupon?: { id: string } } | null;
  discounts?: ({ coupon?: { id: string } } | string)[];
}

/** État Stripe → plan Godet (actif : écriture permise ; suspendu : lecture seule). null : ne rien changer. */
function planFor(status: string): 'actif' | 'suspendu' | null {
  if (['active', 'trialing', 'past_due'].includes(status)) return 'actif';
  if (['canceled', 'unpaid', 'incomplete_expired', 'paused'].includes(status)) return 'suspendu';
  return null; // incomplete : paiement en cours
}

const ok = (body: unknown = { received: true }) => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method', { status: 405 });
  const secret = env('STRIPE_WEBHOOK_SECRET');
  const url = env('SUPABASE_URL');
  const key = serviceKey();
  if (!secret || !url || !key) return new Response('not_configured', { status: 500 });

  const payload = await req.text();
  if (!(await verifySignature(payload, req.headers.get('Stripe-Signature'), secret))) {
    return new Response('bad_signature', { status: 400 });
  }
  const event = JSON.parse(payload) as { id: string; type: string; data: { object: Record<string, unknown> } };
  const obj = event.data.object;

  let subscriptionId: string | null = null;
  if (event.type === 'checkout.session.completed') subscriptionId = (obj.subscription as string) ?? null;
  else if (event.type.startsWith('customer.subscription.')) subscriptionId = obj.id as string;
  else if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
    const parent = obj.parent as { subscription_details?: { subscription?: string } } | undefined;
    subscriptionId = (obj.subscription as string) ?? parent?.subscription_details?.subscription ?? null;
  }
  if (!subscriptionId) return ok({ ignored: event.type });

  // Toujours l'état actuel chez Stripe (les événements peuvent arriver dans le désordre).
  const sub = await stripe<Subscription>('GET', `subscriptions/${subscriptionId}`, { 'expand[]': 'discounts' });
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  let orgId = sub.metadata?.org_id ?? null;
  if (!orgId) {
    const { data } = await db.from('organizations').select('id').eq('stripe_customer_id', sub.customer).maybeSingle();
    orgId = data?.id ?? null;
  }
  if (!orgId) {
    console.warn('[stripe-webhook] entreprise introuvable pour', sub.id);
    return ok({ ignored: 'no_org' });
  }

  const item = sub.items.data[0];
  const parsed = parseLookupKey(item?.price.lookup_key);
  const periodEnd = item?.current_period_end ?? sub.current_period_end ?? null;
  const coupons = [
    ...(sub.discounts ?? []).map((d) => (typeof d === 'string' ? null : d.coupon?.id ?? null)),
    sub.discount?.coupon?.id ?? null,
  ];
  const isFounder = coupons.includes(FOUNDER_COUPON);
  const plan = planFor(sub.status);

  const { data: current } = await db.from('organizations').select('founder, stripe_subscription_id, subscription_status').eq('id', orgId).single();
  // Un ancien abonnement résilié ne doit pas écraser le nouveau.
  if (current?.stripe_subscription_id && current.stripe_subscription_id !== sub.id && plan === 'suspendu') {
    return ok({ ignored: 'old_subscription' });
  }

  const patch: Record<string, unknown> = {
    stripe_customer_id: sub.customer,
    stripe_subscription_id: sub.id,
    subscription_status: sub.status,
    cancel_at_period_end: sub.cancel_at_period_end,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    founder: Boolean(current?.founder) || isFounder,
  };
  if (parsed) {
    patch.billing_tier = parsed.tier;
    patch.billing_interval = parsed.interval;
  }
  if (plan) patch.plan = plan;

  const { error } = await db.from('organizations').update(patch).eq('id', orgId);
  if (error) {
    console.error('[stripe-webhook] mise à jour refusée :', error.code, error.message);
    return new Response('db_error', { status: 500 });
  }
  console.log('[stripe-webhook]', event.type, sub.status, orgId);
  return ok();
});

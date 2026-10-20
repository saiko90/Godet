// Fonction « stripe-webhook » : Stripe prévient ici à chaque changement d'abonnement ; l'entreprise est mise à jour
// (formule, état, fin de période, pack fondateur). Seule écriture des champs d'abonnement (clé de service).
// Signature vérifiée avec STRIPE_WEBHOOK_SECRET. Événements à cocher dans Stripe :
//   checkout.session.completed, customer.subscription.created, customer.subscription.updated,
//   customer.subscription.deleted, invoice.paid, invoice.payment_failed
import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
import { applySubscription, stripe, verifySignature, type Subscription } from './stripe.ts';

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

  const result = await applySubscription(db, sub);
  if (result.error === 'no_org') {
    console.warn('[stripe-webhook] entreprise introuvable pour', sub.id);
    return ok({ ignored: 'no_org' });
  }
  if (result.error) {
    console.error('[stripe-webhook] mise à jour refusée :', result.error);
    return new Response('db_error', { status: 500 });
  }
  const orgId = result.orgId;
  console.log('[stripe-webhook]', event.type, sub.status, orgId);
  return ok();
});

// Formules d'abonnement (affichage). Même grille que la fonction Supabase « facturation »
// (supabase/functions/facturation/stripe.ts, constante TIERS) : les deux doivent rester identiques.
import type { Org } from '@/lib/types';

export type Tier = 'essentiel' | 'pro' | 'parc';
export type BillingInterval = 'mois' | 'annee';

export const TIERS: readonly { id: Tier; limit: number; monthly: number }[] = [
  { id: 'essentiel', limit: 5, monthly: 29 },
  { id: 'pro', limit: 20, monthly: 59 },
  { id: 'parc', limit: 50, monthly: 99 },
];

/** Option Location : prix mensuel (même montant en CHF et en EUR), comme RENTAL_ADDON dans la fonction « facturation ». */
export const RENTAL_ADDON_MONTHLY = 29;

/** Module Location disponible : pendant l'essai, ou avec l'option sur un abonnement actif (= private.rental_enabled). */
export function rentalEnabled(org: Pick<Org, 'plan' | 'trial_ends_at' | 'rental_addon'>, now: number): boolean {
  return (org.plan === 'essai' && Date.parse(org.trial_ends_at) > now) || (org.plan === 'actif' && org.rental_addon);
}

/** Remise du pack fondateur (10 premières entreprises, à vie). */
export const FOUNDER_DISCOUNT = 0.3;
/** L'année vaut 10 mois. */
export const YEAR_MONTHS = 10;

export function tierPrice(monthly: number, interval: BillingInterval, founder: boolean): number {
  const base = interval === 'annee' ? monthly * YEAR_MONTHS : monthly;
  return founder ? Math.round(base * (1 - FOUNDER_DISCOUNT) * 100) / 100 : base;
}

/** Plus petite formule qui suffit pour ce nombre de machines (null au-delà de 50). */
export function tierFor(machines: number): Tier | null {
  return TIERS.find((t) => machines <= t.limit)?.id ?? null;
}

export type BillingState = 'trial' | 'trialEnded' | 'active' | 'pastDue' | 'canceling' | 'suspended';

/** État d'abonnement d'une entreprise à un instant donné. */
export function billingState(org: Pick<Org, 'plan' | 'trial_ends_at' | 'subscription_status' | 'cancel_at_period_end'>, now: number): BillingState {
  if (org.plan === 'actif') {
    if (org.subscription_status === 'past_due') return 'pastDue';
    if (org.cancel_at_period_end) return 'canceling';
    return 'active';
  }
  if (org.plan === 'suspendu') return 'suspended';
  return Date.parse(org.trial_ends_at) > now ? 'trial' : 'trialEnded';
}

/** L'entreprise peut-elle écrire (même règle que private.org_writable dans la base) ? */
export function canWrite(org: Pick<Org, 'plan' | 'trial_ends_at'>, now: number): boolean {
  return org.plan === 'actif' || (org.plan === 'essai' && Date.parse(org.trial_ends_at) > now);
}

/** Jours d'essai restants (arrondi au-dessus, 0 si terminé). */
export function trialDaysLeft(trialEndsAt: string, now: number): number {
  return Math.max(0, Math.ceil((Date.parse(trialEndsAt) - now) / 86_400_000));
}

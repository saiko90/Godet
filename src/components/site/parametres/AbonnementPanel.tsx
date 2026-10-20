'use client';

// Abonnement : état (essai, actif, résilié, lecture seule), formules avec prix mensuel ou annuel, pack fondateur,
// paiement et portail client Stripe (fonction Supabase « facturation »).
import { FunctionsHttpError } from '@supabase/supabase-js';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useFormat } from '@/components/FormatProvider';
import { Icon } from '@/components/Icons';
import { Link } from '@/i18n/navigation';
import { billingState, tierFor, tierPrice, TIERS, trialDaysLeft, type BillingInterval, type Tier } from '@/lib/billing';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { Org } from '@/lib/types';

type Notice = 'thanks' | 'canceled' | null;
type ErrorKey = 'generic' | 'notConfigured' | 'tooSmall' | 'forbidden';

const ERROR_FOR: Record<string, ErrorKey> = {
  not_configured: 'notConfigured',
  tier_too_small: 'tooSmall',
  forbidden: 'forbidden',
};

interface Props {
  org: Pick<
    Org,
    | 'id'
    | 'plan'
    | 'trial_ends_at'
    | 'billing_tier'
    | 'billing_interval'
    | 'subscription_status'
    | 'current_period_end'
    | 'cancel_at_period_end'
    | 'founder'
    | 'stripe_customer_id'
  >;
  machines: number;
  founderSlots: number;
  canManage: boolean;
  nowIso: string;
}

export function AbonnementPanel({ org, machines, founderSlots, canManage, nowIso }: Props) {
  const t = useTranslations('settings.billing');
  const f = useFormat();
  const locale = useLocale();
  const now = Date.parse(nowIso);
  const state = billingState(org, now);
  const [interval, setInterval] = useState<BillingInterval>((org.billing_interval as BillingInterval) ?? 'mois');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<ErrorKey | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  // Retour de Stripe (?abonnement=merci | annule) : message, puis adresse nettoyée.
  useEffect(() => {
    const url = new URL(window.location.href);
    const back = url.searchParams.get('abonnement');
    if (!back) return;
    queueMicrotask(() => setNotice(back === 'merci' ? 'thanks' : 'canceled'));
    url.searchParams.delete('abonnement');
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }, []);

  const subscribed = state === 'active' || state === 'pastDue' || state === 'canceling';
  const founderPrice = org.founder || (!subscribed && founderSlots > 0);
  const recommended = tierFor(machines);
  const money = (n: number) => (Number.isInteger(n) ? f.money(n) : f.money2(n));
  const tierName = (id: string | null) => (id === 'essentiel' || id === 'pro' || id === 'parc' ? t(`tiers.${id}.name`) : '—');

  async function call(action: 'checkout' | 'portal', tier?: Tier) {
    setBusy(tier ?? action);
    setError(null);
    try {
      const { data, error: fnError } = await supabaseBrowser().functions.invoke<{ url?: string; error?: string }>('facturation', {
        body: { action, orgId: org.id, tier, interval, locale },
      });
      if (fnError) {
        let code = '';
        if (fnError instanceof FunctionsHttpError) {
          const body = (await fnError.context.json().catch(() => ({}))) as { error?: string };
          code = body.error ?? '';
        }
        throw new Error(code);
      }
      if (!data?.url) throw new Error('');
      window.location.assign(data.url);
    } catch (e) {
      setError(ERROR_FOR[(e as Error).message] ?? 'generic');
      setBusy(null);
    }
  }

  const statusText = (() => {
    switch (state) {
      case 'trial':
        return t('status.trial', { days: trialDaysLeft(org.trial_ends_at, now), date: f.date(org.trial_ends_at) });
      case 'trialEnded':
        return t('status.trialEnded');
      case 'active':
        return t('status.active', {
          tier: tierName(org.billing_tier),
          interval: t(`interval.${org.billing_interval === 'annee' ? 'annee' : 'mois'}`),
          date: f.date(org.current_period_end),
        });
      case 'canceling':
        return t('status.canceling', { tier: tierName(org.billing_tier), date: f.date(org.current_period_end) });
      case 'pastDue':
        return t('status.pastDue');
      case 'suspended':
        return t('status.suspended');
    }
  })();
  const tone = state === 'trialEnded' || state === 'suspended' || state === 'pastDue' ? 'is-warn' : '';

  return (
    <section id="abonnement" className="s-panel s-billing" aria-labelledby="titre-abonnement">
      <div className="s-panel-head">
        <h2 id="titre-abonnement">
          <Icon name="chf" />
          {t('title')}
          {org.founder ? <span className="s-billing-badge">{t('founderBadge')}</span> : null}
        </h2>
        <p>{t('text')}</p>
      </div>

      <p className={`s-billing-status ${tone}`} role="status">
        {statusText}
      </p>
      {notice ? <p className="s-billing-notice">{t(notice)}</p> : null}

      {!canManage ? (
        <p className="muted">{t('onlyOwners')}</p>
      ) : subscribed ? (
        <div className="s-billing-manage">
          {org.founder ? <p className="s-billing-founder">{t('founderYou')}</p> : null}
          <button type="button" className="btn btn-primary s-btn-sm" disabled={Boolean(busy)} onClick={() => void call('portal')}>
            <Icon name="cog" />
            {busy ? t('opening') : t('manage')}
          </button>
          <p className="muted">{t('manageHint')}</p>
        </div>
      ) : (
        <>
          {founderSlots > 0 || org.founder ? (
            <p className="s-billing-founder">{org.founder ? t('founderYou') : t('founderOffer', { n: founderSlots })}</p>
          ) : null}
          <div className="s-billing-toggle" role="radiogroup" aria-label={t('billingPeriod')}>
            {(['mois', 'annee'] as const).map((i) => (
              <button key={i} type="button" role="radio" aria-checked={interval === i} className={interval === i ? 'is-on' : ''} onClick={() => setInterval(i)}>
                {i === 'mois' ? t('monthly') : t('yearly')}
              </button>
            ))}
          </div>
          <ul className="s-billing-tiers">
            {TIERS.map((tier) => {
              const tooSmall = machines > tier.limit;
              const price = tierPrice(tier.monthly, interval, founderPrice);
              const full = tierPrice(tier.monthly, interval, false);
              const label = interval === 'annee' ? t('perYear', { price: money(price) }) : t('perMonth', { price: money(price) });
              return (
                <li key={tier.id} className={`s-billing-tier${recommended === tier.id ? ' is-recommended' : ''}`}>
                  {recommended === tier.id ? <p className="s-billing-reco">{t('recommended')}</p> : null}
                  <h3>{t(`tiers.${tier.id}.name`)}</h3>
                  <p className="s-billing-machines">{t(`tiers.${tier.id}.machines`)}</p>
                  <p className="s-billing-price">
                    <b>{label}</b>
                    {founderPrice ? <s>{t('insteadOf', { price: money(full) })}</s> : null}
                  </p>
                  {tooSmall ? (
                    <p className="muted">{t('tooSmall', { count: machines })}</p>
                  ) : (
                    <button
                      type="button"
                      className={`btn ${recommended === tier.id ? 'btn-primary' : 'btn-soft'} s-btn-sm`}
                      disabled={Boolean(busy)}
                      onClick={() => void call('checkout', tier.id)}
                    >
                      {busy === tier.id ? t('opening') : t('choose', { name: t(`tiers.${tier.id}.name`) })}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="muted">
            {t('moreThan')}{' '}
            <Link href="/contact">{t('contact')}</Link>
          </p>
          <p className="muted s-billing-secure">{t('secure')}</p>
        </>
      )}
      {error ? (
        <p className="err" role="alert">
          {t(`errors.${error}`)}
        </p>
      ) : null}
    </section>
  );
}

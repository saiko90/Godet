'use client';

// Abonnement : état (essai, actif, résilié, lecture seule), formules avec prix mensuel ou annuel, pack fondateur,
// paiement et portail client Stripe (fonction Supabase « facturation »).
import { FunctionsHttpError } from '@supabase/supabase-js';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useFormat } from '@/components/FormatProvider';
import { Icon } from '@/components/Icons';
import { Link, useRouter } from '@/i18n/navigation';
import { billingState, RENTAL_ADDON_MONTHLY, tierFor, tierPrice, TIERS, trialDaysLeft, type BillingInterval, type Tier } from '@/lib/billing';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { Org } from '@/lib/types';

type Notice = 'thanks' | 'activated' | 'canceled' | 'updated' | null;
type ErrorKey = 'generic' | 'notConfigured' | 'tooSmall' | 'forbidden';

const ERROR_FOR: Record<string, ErrorKey> = {
  not_configured: 'notConfigured',
  tier_too_small: 'tooSmall',
  no_subscription: 'generic',
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
    | 'rental_addon'
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
  /** Option Location ajoutée au paiement (cochée d'office : le loueur l'a déjà essayée pendant l'essai). */
  const [addon, setAddon] = useState(true);

  const router = useRouter();
  const [syncing, setSyncing] = useState(false);

  /** Relit l'abonnement chez Stripe (retour du paiement, ou si le webhook tarde), puis recharge la page. */
  async function sync(): Promise<boolean> {
    setSyncing(true);
    try {
      const { data } = await supabaseBrowser().functions.invoke<{ synced?: boolean; status?: string }>('facturation', {
        body: { action: 'sync', orgId: org.id, locale },
      });
      router.refresh();
      return Boolean(data?.synced && (data.status === 'active' || data.status === 'trialing'));
    } catch {
      return false;
    } finally {
      setSyncing(false);
    }
  }

  // Retour de Stripe (?abonnement=merci | annule) : message, synchronisation, puis adresse nettoyée.
  useEffect(() => {
    const url = new URL(window.location.href);
    const back = url.searchParams.get('abonnement');
    if (!back) return;
    url.searchParams.delete('abonnement');
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    document.getElementById('abonnement')?.scrollIntoView({ block: 'start' });
    if (back !== 'merci') {
      queueMicrotask(() => setNotice('canceled'));
      return;
    }
    queueMicrotask(() => setNotice('thanks'));
    let alive = true;
    (async () => {
      // Le paiement peut mettre quelques secondes à se confirmer : trois essais espacés.
      for (const wait of [0, 3000, 6000]) {
        await new Promise((r) => setTimeout(r, wait));
        if (!alive) return;
        if (await sync()) {
          if (alive) setNotice('activated');
          return;
        }
      }
    })();
    return () => {
      alive = false;
    };
    // Une seule fois, au retour du paiement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subscribed = state === 'active' || state === 'pastDue' || state === 'canceling';
  const founderPrice = org.founder || (!subscribed && founderSlots > 0);
  const recommended = tierFor(machines);
  const money = (n: number) => (Number.isInteger(n) ? f.money(n) : f.money2(n));
  const tierName = (id: string | null) => (id === 'essentiel' || id === 'pro' || id === 'parc' ? t(`tiers.${id}.name`) : '—');

  async function call(action: 'checkout' | 'portal' | 'update', tier?: Tier, addonChange?: boolean) {
    setBusy(tier ?? (addonChange === undefined ? action : 'addon'));
    setError(null);
    try {
      const { data, error: fnError } = await supabaseBrowser().functions.invoke<{ url?: string; updated?: boolean; error?: string }>('facturation', {
        body: { action, orgId: org.id, tier, interval, locale, addon: action === 'checkout' ? addon : addonChange },
      });
      if (fnError) {
        let code = '';
        if (fnError instanceof FunctionsHttpError) {
          const body = (await fnError.context.json().catch(() => ({}))) as { error?: string };
          code = body.error ?? '';
        }
        throw new Error(code);
      }
      if (action === 'update') {
        if (!data?.updated) throw new Error('');
        router.refresh();
        setNotice('updated');
        setBusy(null);
        return;
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
          <div className="s-billing-addon">
            <div>
              <b>{t('addon.title')}</b>
              <p className="muted">{org.rental_addon ? t('addon.on') : t('addon.text', { price: money(tierPrice(RENTAL_ADDON_MONTHLY, 'mois', org.founder)) })}</p>
            </div>
            <button
              type="button"
              className={`btn ${org.rental_addon ? 'btn-ghost' : 'btn-soft'} s-btn-sm`}
              disabled={Boolean(busy)}
              onClick={() => {
                if (org.rental_addon && !window.confirm(t('addon.confirmRemove'))) return;
                void call('update', undefined, !org.rental_addon);
              }}
            >
              {busy === 'addon' ? t('opening') : org.rental_addon ? t('addon.remove') : t('addon.add')}
            </button>
          </div>
          <div className="s-billing-switch">
            <b>{t('switchTitle')}</b>
            <div className="s-billing-switch-row">
              {TIERS.filter((tier) => tier.id !== org.billing_tier).map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  className="btn btn-soft s-btn-sm"
                  disabled={Boolean(busy) || machines > tier.limit}
                  title={machines > tier.limit ? t('tooSmall', { count: machines }) : undefined}
                  onClick={() => void call('update', tier.id)}
                >
                  {busy === tier.id ? t('opening') : t('switchTo', { name: t(`tiers.${tier.id}.name`), machines: tier.limit })}
                </button>
              ))}
            </div>
          </div>
          <button type="button" className="btn btn-primary s-btn-sm" disabled={Boolean(busy)} onClick={() => void call('portal')}>
            <Icon name="cog" />
            {busy === 'portal' ? t('opening') : t('manage')}
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
          <label className="s-check s-billing-addon-pick">
            <input type="checkbox" checked={addon} onChange={(e) => setAddon(e.target.checked)} />
            <span>
              <b>{t('addon.pick', { price: money(tierPrice(RENTAL_ADDON_MONTHLY, interval, founderPrice)), period: interval === 'annee' ? t('perYearShort') : t('perMonthShort') })}</b>
              <span className="s-field-hint">{t('addon.pickHint')}</span>
            </span>
          </label>
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
          <p className="muted s-billing-secure">
            {t('secure')}{' '}
            <button type="button" className="s-linkbtn" disabled={syncing} onClick={() => void sync()}>
              {syncing ? t('refreshing') : t('refresh')}
            </button>
          </p>
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

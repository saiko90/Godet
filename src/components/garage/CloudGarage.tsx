'use client';

// Garage de l'entreprise (mode « cloud ») : dépôt Supabase dans le navigateur, parc déjà chargé par le serveur.
// Hors ligne : le dépôt est enveloppé (src/lib/offline/repo.ts) et un service worker garde la page du garage.
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Icon } from '@/components/Icons';
import { getPathname, Link, useRouter } from '@/i18n/navigation';
import { billingState, trialDaysLeft } from '@/lib/billing';
import { can } from '@/lib/domain';
import { createOfflineRepo, forgetDevice, type OfflineRepo, type OfflineState } from '@/lib/offline/repo';
import { createSupabaseRepo } from '@/lib/repo/supabase';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { FleetSnapshot, SessionContext } from '@/lib/types';
import { GarageApp } from './GarageApp';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SERVER_STATE: OfflineState = { online: true, pending: 0, syncing: false };

function OfflineStatus({ state, onSend }: { state: OfflineState; onSend: () => void }) {
  const t = useTranslations('garage.offline');
  if (state.online && !state.pending && !state.syncing) return null;
  return (
    <div className={`g-offline${state.online ? '' : ' is-off'}`} role="status" title={t('title')}>
      <Icon name={state.online ? 'upload' : 'offline'} />
      <span>
        {!state.online ? <b>{t('offline')}</b> : null}
        {state.syncing ? t('syncing') : state.pending ? t('pending', { count: state.pending }) : null}
      </span>
      {state.online && state.pending && !state.syncing ? (
        <button type="button" className="btn btn-soft" onClick={onSend}>
          {t('sendNow')}
        </button>
      ) : null}
      <span className="g-sr">{t('title')}</span>
    </div>
  );
}

/** Bandeau d'abonnement : fin d'essai proche (3 jours ou moins), lecture seule, paiement échoué. */
function BillingBanner({ session }: { session: SessionContext }) {
  const t = useTranslations('garage.billing');
  const [now] = useState(() => Date.now());
  const org = session.org;
  const state = billingState(org, now);
  const days = trialDaysLeft(org.trial_ends_at, now);
  if (state === 'active' || state === 'canceling' || (state === 'trial' && days > 3)) return null;
  const text =
    state === 'trial' ? t('trialEnds', { days }) : state === 'pastDue' ? t('pastDue') : state === 'suspended' ? t('suspended') : t('readOnly');
  const manager = can.manageTeam(session.role);
  return (
    <div className={`g-billing${state === 'trial' ? '' : ' is-warn'}`} role="status">
      <span>{text}</span>
      {manager ? (
        <Link href="/parametres#abonnement" className="btn btn-primary">
          {state === 'pastDue' ? t('manage') : t('cta')}
        </Link>
      ) : (
        <span className="g-billing-ask">{t('askOwner')}</span>
      )}
    </div>
  );
}

export function CloudGarage({ session, fleet, machineId }: { session: SessionContext; fleet: FleetSnapshot; machineId: string | null }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('garage.schedules.defaults');
  const to = useTranslations('garage.offline');
  const ctx = { org: session.org, role: session.role, userId: session.userId };
  // Échéances créées avec chaque nouvelle machine : dans la langue de la personne.
  const defaultSchedules = { service: t('service'), safety: t('safety') };
  const leaving = useRef(false);
  const repoRef = useRef<OfflineRepo | null>(null);
  const getRepo = () =>
    (repoRef.current ??= createOfflineRepo(createSupabaseRepo(supabaseBrowser(), ctx, { defaultSchedules }), {
      orgId: session.org.id,
      userId: session.userId,
    }));
  const [tick, setTick] = useState(0);
  const [notice, setNotice] = useState<{ id: number; text: string; tone?: 'ok' | 'error' } | null>(null);
  const [deepLink, setDeepLink] = useState(machineId);
  const say = (text: string, tone?: 'ok' | 'error') => setNotice({ id: Date.now(), text, tone });

  const state = useSyncExternalStore(
    (cb) => getRepo().subscribe(cb),
    () => getRepo().state(),
    () => SERVER_STATE,
  );

  // Session fermée ailleurs (autre onglet, jeton de rafraîchissement refusé) : retour à la connexion, plutôt qu'un
  // garage qui continuerait en anonyme (parc vide, enregistrements refusés).
  useEffect(() => {
    const { data } = supabaseBrowser().auth.onAuthStateChange((event) => {
      if (event !== 'SIGNED_OUT' || leaving.current) return;
      leaving.current = true;
      // Suite dans la langue courante (même forme que la redirection du proxy : chemin avec sa langue).
      const suite = getPathname({ href: '/garage', locale });
      router.replace(`/connexion?suite=${encodeURIComponent(suite)}`);
    });
    return () => data.subscription.unsubscribe();
  }, [router, locale]);

  // Hors ligne : envoi de la file au retour du réseau, page du garage gardée par le service worker.
  useEffect(() => {
    const repo = getRepo();
    let alive = true;
    async function flush(announce: boolean) {
      const r = await repo.sync();
      if (!alive) return;
      if (r.sent || r.refused) setTick((n) => n + 1);
      if (r.refused) say(to('refused', { count: r.refused }), 'error');
      else if (r.sent) say(to('synced', { count: r.sent }));
      else if (announce) say(to('backOnline'));
    }
    // Page servie par le service worker (copie) : la machine du lien vient de l'adresse, pas de la copie.
    const m = new URLSearchParams(window.location.search).get('m');
    const offline = !navigator.onLine;
    // Après le premier rendu (l'état vient du navigateur, pas d'une prop).
    queueMicrotask(() => {
      if (!alive) return;
      if (m && UUID.test(m) && m !== machineId) setDeepLink(m);
      // Sans réseau : relecture de la copie mémorisée (plus récente que la page gardée).
      if (offline) setTick((n) => n + 1);
    });
    // Parc tout juste rendu par le serveur : c'est la copie hors ligne la plus récente.
    if (!offline) void repo.remember(fleet).then(() => flush(false));
    const onOnline = () => void flush(true);
    const onOffline = () => say(to('wentOffline'));
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((e: unknown) => console.warn('[hors ligne] service worker :', e));
    }
    return () => {
      alive = false;
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
    // Une fois par garage monté : le parc initial et la session ne changent pas sans recharger la page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() {
    const pending = getRepo().state().pending;
    if (pending && !window.confirm(to('signOutPending', { count: pending }))) return;
    leaving.current = true;
    try {
      // Cet appareil seulement (comme la déconnexion des paramètres) : la portée par défaut, « global »,
      // fermerait aussi la session du téléphone ou de la tablette de l'atelier.
      await supabaseBrowser().auth.signOut({ scope: 'local' });
      // Rien ne reste sur un appareil partagé : copies du parc, file d'attente, pages gardées.
      await forgetDevice();
    } finally {
      // Retour à l'accueil ; le rafraîchissement relit les cookies de session (désormais vides).
      router.replace('/');
      router.refresh();
    }
  }

  async function sendNow() {
    const r = await getRepo().sync();
    if (r.sent || r.refused) setTick((n) => n + 1);
    if (r.refused) say(to('refused', { count: r.refused }), 'error');
    else if (r.sent) say(to('synced', { count: r.sent }));
  }

  return (
    <GarageApp
      mode="cloud"
      makeRepo={getRepo}
      orgName={session.org.name}
      initialFleet={fleet}
      initialMachineId={deepLink}
      person={{ name: session.fullName, email: session.email }}
      onSignOut={() => void signOut()}
      syncTick={tick}
      notice={notice}
      status={
        <div className="g-notices">
          <BillingBanner session={session} />
          <OfflineStatus state={state} onSend={() => void sendNow()} />
        </div>
      }
    />
  );
}

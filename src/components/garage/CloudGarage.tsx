'use client';

// Garage de l'entreprise (mode « cloud ») : dépôt Supabase dans le navigateur, parc déjà chargé par le serveur.
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { getPathname, useRouter } from '@/i18n/navigation';
import { createSupabaseRepo } from '@/lib/repo/supabase';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { FleetSnapshot, SessionContext } from '@/lib/types';
import { GarageApp } from './GarageApp';

export function CloudGarage({ session, fleet, machineId }: { session: SessionContext; fleet: FleetSnapshot; machineId: string | null }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('garage.schedules.defaults');
  const ctx = { org: session.org, role: session.role, userId: session.userId };
  // Échéances créées avec chaque nouvelle machine : dans la langue de la personne.
  const defaultSchedules = { service: t('service'), safety: t('safety') };
  const leaving = useRef(false);

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

  async function signOut() {
    leaving.current = true;
    try {
      // Cet appareil seulement (comme la déconnexion des paramètres) : la portée par défaut, « global »,
      // fermerait aussi la session du téléphone ou de la tablette de l'atelier.
      await supabaseBrowser().auth.signOut({ scope: 'local' });
    } finally {
      // Retour à l'accueil ; le rafraîchissement relit les cookies de session (désormais vides).
      router.replace('/');
      router.refresh();
    }
  }

  return (
    <GarageApp
      mode="cloud"
      makeRepo={() => createSupabaseRepo(supabaseBrowser(), ctx, { defaultSchedules })}
      orgName={session.org.name}
      initialFleet={fleet}
      initialMachineId={machineId}
      person={{ name: session.fullName, email: session.email }}
      onSignOut={() => void signOut()}
    />
  );
}

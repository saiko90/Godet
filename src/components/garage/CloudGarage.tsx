'use client';

// Garage de l'entreprise (mode « cloud ») : dépôt Supabase dans le navigateur, parc déjà chargé par le serveur.
import { useRouter } from 'next/navigation';
import { createSupabaseRepo } from '@/lib/repo/supabase';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { FleetSnapshot, SessionContext } from '@/lib/types';
import { GarageApp } from './GarageApp';

export function CloudGarage({ session, fleet, machineId }: { session: SessionContext; fleet: FleetSnapshot; machineId: string | null }) {
  const router = useRouter();
  const ctx = { org: session.org, role: session.role, userId: session.userId };

  async function signOut() {
    try {
      await supabaseBrowser().auth.signOut();
    } finally {
      // Retour à l'accueil ; le rafraîchissement relit les cookies de session (désormais vides).
      router.replace('/');
      router.refresh();
    }
  }

  return (
    <GarageApp
      mode="cloud"
      makeRepo={() => createSupabaseRepo(supabaseBrowser(), ctx)}
      orgName={session.org.name}
      initialFleet={fleet}
      initialMachineId={machineId}
      person={{ name: session.fullName, email: session.email }}
      onSignOut={() => void signOut()}
    />
  );
}

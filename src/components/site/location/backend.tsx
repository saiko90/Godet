'use client';

// Où vont les écritures du module Location : la base (Supabase) ou, en démonstration, la mémoire du navigateur.
// Les composants (agenda, réservation, état des lieux) passent par ce contexte ; sans fournisseur, c'est la base.
import { createContext, useContext, useMemo } from 'react';
import { useRouter } from '@/i18n/navigation';
import type { Json } from '@/lib/database.types';
import { rentalErrorCode, rentalRow, type RentalErrorCode, type RentalInput, type Transport } from '@/lib/rental';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { DemoCheckInput } from '@/lib/rental-demo';

export interface RentalBackend {
  /** Chemin de l'agenda : /location (compte) ou /demo/location (démonstration). */
  base: string;
  /** Garage correspondant : /garage ou /demo. */
  garage: string;
  demo: boolean;
  saveRental: (input: RentalInput, opts: { id?: string; orgId: string }) => Promise<RentalErrorCode | null>;
  cancelRental: (id: string) => Promise<RentalErrorCode | null>;
  saveTransport: (id: string, transport: Transport) => Promise<RentalErrorCode | null>;
  /** Démonstration : l'état des lieux est gardé dans le navigateur (aucun envoi). */
  saveDemoCheck?: (input: DemoCheckInput) => RentalErrorCode | null;
  refresh: () => void;
}

export const RentalBackendContext = createContext<RentalBackend | null>(null);

/** Écritures dans la base, avec la session de la personne (règles RLS et déclencheurs côté serveur). */
export function useRentalBackend(): RentalBackend {
  const custom = useContext(RentalBackendContext);
  const router = useRouter();
  const cloud = useMemo<RentalBackend>(
    () => ({
      base: '/location',
      garage: '/garage',
      demo: false,
      async saveRental(input, { id, orgId }) {
        const db = supabaseBrowser();
        const row = rentalRow(input);
        const { error } = id
          ? await db.from('rentals').update(row).eq('id', id).select('id').single()
          : await db
              .from('rentals')
              .insert({ ...row, org_id: orgId })
              .select('id')
              .single();
        if (error) {
          console.error('[location] réservation :', error.code, error.message);
          return rentalErrorCode(error);
        }
        return null;
      },
      async saveTransport(id, transport) {
        const { error } = await supabaseBrowser()
          .from('rentals')
          .update({ transport: transport as Json })
          .eq('id', id)
          .select('id')
          .single();
        if (error) console.error('[location] transport :', error.code, error.message);
        return error ? rentalErrorCode(error) : null;
      },
      async cancelRental(id) {
        const { error } = await supabaseBrowser().from('rentals').update({ status: 'annulee' }).eq('id', id).select('id').single();
        return error ? rentalErrorCode(error) : null;
      },
      refresh: () => router.refresh(),
    }),
    [router],
  );
  return custom ?? cloud;
}

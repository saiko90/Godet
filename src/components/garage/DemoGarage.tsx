'use client';

// Garage de démonstration : le parc d'exemple vit en mémoire dans le navigateur, rien n'est envoyé.
// Il est construit dans la langue de la page (textes de messages/<langue>/demo.json, fournis par la page /demo).
import { useMessages, useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { machineRentalState } from '@/lib/rental';
import { useDemoLocation } from '@/lib/rental-demo-hook';
import { createDemoRepo } from '@/lib/repo/demo';
import { GarageApp } from './GarageApp';
import { useDemoRef } from './demo-ref';
import { RentalStatusContext, type RentalBadge, type RentalStatus } from './rental';

export function DemoGarage({ machineId }: { machineId: string | null }) {
  const texts = useMessages().demo;
  const t = useTranslations('garage.schedules.defaults');
  const service = t('service');
  const safety = t('safety');
  // Identité stable : le garage ne crée le dépôt qu'une fois (un nouveau dépôt rechargerait le parc d'exemple).
  const makeDemoRepo = useCallback(
    () => createDemoRepo({ texts, defaultSchedules: { service, safety } }),
    [texts, service, safety],
  );
  useDemoRef();
  // Option Location de la démonstration : statut des machines d'exemple (louée, réservée, disponible).
  const { machines, state, repairs } = useDemoLocation();
  const [now] = useState(() => Date.now());
  const rentals = useMemo<RentalStatus | null>(() => {
    if (!state) return null;
    const byMachine: Record<string, RentalBadge> = {};
    for (const m of machines) {
      const st = machineRentalState(state.rentals, m.id, now);
      const r = st.state === 'disponible' ? st.next : st.rental;
      byMachine[m.id] = {
        state: st.state,
        late: st.state === 'louee' ? st.late : undefined,
        rentalId: r?.id,
        client: r ? r.client_company || r.client_name : undefined,
        at: r ? (st.state === 'louee' ? r.end_at : r.start_at) : undefined,
        risk: st.state === 'reservee' || (st.state === 'disponible' && st.next) ? Boolean(repairs[m.id]) : undefined,
      };
    }
    return { byMachine, base: '/demo/location' };
  }, [machines, state, repairs, now]);
  return (
    <RentalStatusContext.Provider value={rentals}>
      <GarageApp mode="demo" makeRepo={makeDemoRepo} orgName={texts.org} initialFleet={null} initialMachineId={machineId} />
    </RentalStatusContext.Provider>
  );
}

'use client';

// Garage de démonstration : le parc d'exemple vit en mémoire dans le navigateur, rien n'est envoyé.
// Il est construit dans la langue de la page (textes de messages/<langue>/demo.json, fournis par la page /demo).
import { useMessages, useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { createDemoRepo } from '@/lib/repo/demo';
import { GarageApp } from './GarageApp';
import { useDemoRef } from './demo-ref';

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
  return <GarageApp mode="demo" makeRepo={makeDemoRepo} orgName={texts.org} initialFleet={null} initialMachineId={machineId} />;
}

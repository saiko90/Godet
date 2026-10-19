'use client';

// Garage de démonstration : le parc d'exemple vit en mémoire dans le navigateur, rien n'est envoyé.
import { createDemoRepo } from '@/lib/repo/demo';
import { GarageApp } from './GarageApp';

const makeDemoRepo = () => createDemoRepo();

export function DemoGarage({ machineId }: { machineId: string | null }) {
  return <GarageApp mode="demo" makeRepo={makeDemoRepo} orgName="Entreprise Démo SA" initialFleet={null} initialMachineId={machineId} />;
}

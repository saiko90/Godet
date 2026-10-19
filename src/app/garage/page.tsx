import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { CloudGarage } from '@/components/garage/CloudGarage';
import { loadFleet } from '@/lib/repo/supabase';
import { getSession } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Mon garage',
  description: 'Le parc d’engins de votre entreprise : carnet d’entretien, réparations, pièces, coûts, photos et échéances.',
  robots: { index: false, follow: false },
};

/** Identifiant de machine reçu dans l'adresse (/garage?m=<id>) : gardé seulement s'il a une forme valable. */
function machineParam(value: string | string[] | undefined): string | null {
  return typeof value === 'string' && /^[\w-]{1,64}$/.test(value) ? value : null;
}

export default async function GaragePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [session, params] = await Promise.all([getSession(), searchParams]);
  const machineId = machineParam(params.m);

  if (session.status === 'anon') {
    redirect(machineId ? `/connexion?suite=${encodeURIComponent(`/garage?m=${machineId}`)}` : '/connexion?suite=/garage');
  }
  if (session.status === 'no-org') redirect('/bienvenue');

  const fleet = await loadFleet(await supabaseServer(), session.ctx);
  return <CloudGarage session={session.ctx} fleet={fleet} machineId={machineId} />;
}

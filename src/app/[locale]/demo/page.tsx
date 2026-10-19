import type { Metadata } from 'next';
import { DemoGarage } from '@/components/garage/DemoGarage';

const TITLE = 'Démo du garage 3D';
const SHARE_TITLE = 'Godet — démo du garage 3D de votre parc d’engins';
const DESCRIPTION =
  'Visitez un garage d’exemple sans inscription : six machines de chantier, douze mois de carnet d’entretien, réparations, pièces, coûts et échéances. Essayez tout, rien n’est enregistré.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/demo' },
  keywords: ['carnet d’entretien', 'machines de chantier', 'parc d’engins', 'gestion de flotte', 'entretien pelle', 'Suisse', 'démo'],
  openGraph: {
    title: SHARE_TITLE,
    description: DESCRIPTION,
    url: '/demo',
    type: 'website',
    locale: 'fr_CH',
    siteName: 'Godet',
  },
  twitter: { card: 'summary', title: SHARE_TITLE, description: DESCRIPTION },
};

function machineParam(value: string | string[] | undefined): string | null {
  return typeof value === 'string' && /^[\w-]{1,64}$/.test(value) ? value : null;
}

export default async function DemoPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return <DemoGarage machineId={machineParam(params.m)} />;
}

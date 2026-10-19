import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { ConnexionForm } from '@/components/site/ConnexionForm';
import { AuthShell } from '@/components/site/SiteChrome';
import { firstParam, looksLikeEmail, safePath } from '@/components/site/nav';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const signup = firstParam((await searchParams).mode) === 'inscription';
  return {
    title: signup ? 'Créer mon garage' : 'Connexion',
    description: signup
      ? 'Créez le garage de votre entreprise sur Godet : essai gratuit de 30 jours, sans carte de crédit.'
      : 'Connectez-vous à Godet pour retrouver le carnet d’entretien de votre parc d’engins.',
    alternates: { canonical: '/connexion' },
  };
}

export default async function ConnexionPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const suite = safePath(firstParam(params.suite), '');

  // Déjà connecté : direction la suite prévue, le garage, ou la création de l'entreprise.
  const session = await getSession();
  if (session.status === 'ok') redirect(suite || '/garage');
  if (session.status === 'no-org') redirect(suite || '/bienvenue');

  const mode = firstParam(params.mode) === 'inscription' ? 'inscription' : 'connexion';
  const email = (firstParam(params.email) ?? '').trim();

  return (
    <AuthShell>
      <ConnexionForm
        initialMode={mode}
        suite={suite}
        linkError={firstParam(params.erreur) === 'lien'}
        initialEmail={looksLikeEmail(email) ? email : ''}
      />
    </AuthShell>
  );
}

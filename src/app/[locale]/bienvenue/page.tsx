import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { seDeconnecter } from '@/app/auth/actions';
import { BienvenueForm } from '@/components/site/BienvenueForm';
import { Alert } from '@/components/site/Form';
import { AuthShell } from '@/components/site/SiteChrome';
import { getSession } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Bienvenue',
  robots: { index: false, follow: false },
};

export default async function BienvenuePage() {
  const session = await getSession();
  if (session.status === 'anon') redirect('/connexion?suite=/bienvenue');
  if (session.status === 'ok') redirect('/garage');

  const firstName = session.fullName?.trim().split(/\s+/)[0] ?? '';

  return (
    <AuthShell wide>
      <div className="s-auth-head">
        <p className="eyebrow">{firstName ? `Bienvenue, ${firstName}` : 'Bienvenue'}</p>
        <h1>Ouvrez le garage de votre entreprise</h1>
        <p>Dernière étape avant votre parc&nbsp;: le nom de votre entreprise. Votre essai gratuit de 30&nbsp;jours commence aujourd’hui.</p>
      </div>
      <BienvenueForm />
      <Alert tone="info" icon="users">
        <p>
          <b>Vous avez reçu une invitation&nbsp;?</b> Ouvrez le lien qu’on vous a transmis&nbsp;: vous rejoindrez
          directement le garage de votre entreprise.
        </p>
      </Alert>
      <form action={seDeconnecter} className="s-auth-alt">
        <input type="hidden" name="suite" value="/connexion" />
        Connecté avec <b>{session.email}</b>.{' '}
        <button type="submit" className="s-linkbtn">
          Changer de compte
        </button>
      </form>
    </AuthShell>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/components/Icons';
import { NouveauMotDePasseForm } from '@/components/site/NouveauMotDePasseForm';
import { AuthShell } from '@/components/site/SiteChrome';
import { supabaseServer } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Nouveau mot de passe',
  robots: { index: false, follow: false },
};

export default async function MotDePassePage() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    return (
      <AuthShell>
        <span className="s-big-icon" aria-hidden="true">
          <Icon name="clock" />
        </span>
        <div className="s-auth-head">
          <h1>Ce lien a expiré</h1>
          <p>
            Pour choisir un nouveau mot de passe, ouvrez le lien reçu par e-mail sur cet appareil. S’il ne
            fonctionne plus, demandez-en un nouveau depuis la page de connexion, avec «&nbsp;Mot de passe
            oublié&nbsp;?&nbsp;».
          </p>
        </div>
        <Link href="/connexion" className="btn btn-primary btn-block">
          Aller à la connexion
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <NouveauMotDePasseForm email={user.email ?? ''} />
    </AuthShell>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { seDeconnecter } from '@/app/auth/actions';
import { Icon, type IconName } from '@/components/Icons';
import { AcceptInvitationForm } from '@/components/site/AcceptInvitationForm';
import { Alert } from '@/components/site/Form';
import { AuthShell } from '@/components/site/SiteChrome';
import { isInvitationToken } from '@/components/site/nav';
import { ROLES } from '@/lib/domain';
import { getSession } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import type { MemberRole } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Invitation',
  description: 'Rejoignez le garage de votre entreprise sur Godet.',
  robots: { index: false, follow: false },
};

type Info =
  | { kind: 'missing' }
  | { kind: 'error' }
  | { kind: 'found'; orgName: string; email: string; role: MemberRole; expired: boolean; accepted: boolean };

async function loadInvitation(token: string): Promise<Info> {
  if (!isInvitationToken(token)) return { kind: 'missing' };
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc('invitation_info', { p_token: token });
  if (error) {
    console.error('[invitation] invitation_info :', error.code, error.message);
    return { kind: 'error' };
  }
  const row = data?.[0];
  if (!row) return { kind: 'missing' };
  return { kind: 'found', orgName: row.org_name, email: row.email, role: row.role, expired: row.expired, accepted: row.accepted };
}

function Message({ icon, tone, title, children }: { icon: IconName; tone?: 'bad' | 'ok'; title: string; children: React.ReactNode }) {
  return (
    <>
      <span className={`s-big-icon${tone ? ` s-${tone}` : ''}`} aria-hidden="true">
        <Icon name={icon} />
      </span>
      <div className="s-auth-head">
        <h1>{title}</h1>
        {children}
      </div>
    </>
  );
}

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [info, session] = await Promise.all([loadInvitation(token), getSession()]);
  const signedIn = session.status !== 'anon';
  const currentEmail = session.status === 'ok' ? session.ctx.email : session.status === 'no-org' ? session.email : '';
  const here = `/invitation/${token}`;

  if (info.kind === 'missing') {
    return (
      <AuthShell>
        <Message icon="alert" tone="bad" title="Invitation introuvable">
          <p>
            Le lien est peut-être incomplet, ou l’invitation a été révoquée. Demandez à la personne qui vous a invité
            de vous le renvoyer.
          </p>
        </Message>
        <Link href={signedIn ? '/garage' : '/'} className="btn btn-ghost btn-block">
          {signedIn ? 'Ouvrir mon garage' : 'Retour à l’accueil'}
        </Link>
      </AuthShell>
    );
  }

  if (info.kind === 'error') {
    return (
      <AuthShell>
        <Message icon="alert" tone="bad" title="Vérification impossible">
          <p>L’invitation n’a pas pu être vérifiée pour le moment. Réessayez dans un instant.</p>
        </Message>
        <Link href={here} className="btn btn-primary btn-block">
          Réessayer
        </Link>
      </AuthShell>
    );
  }

  const role = ROLES[info.role];

  if (info.accepted) {
    return (
      <AuthShell>
        <Message icon="check" tone="ok" title="Invitation déjà utilisée">
          <p>
            L’invitation à rejoindre <b>{info.orgName}</b> a déjà servi. Si c’était la vôtre, connectez-vous pour
            retrouver le garage.
          </p>
        </Message>
        <Link href={signedIn ? '/garage' : '/connexion'} className="btn btn-primary btn-block">
          {signedIn ? 'Ouvrir mon garage' : 'Se connecter'}
        </Link>
      </AuthShell>
    );
  }

  if (info.expired) {
    return (
      <AuthShell>
        <Message icon="clock" tone="bad" title="Invitation expirée">
          <p>
            L’invitation à rejoindre <b>{info.orgName}</b> n’est plus valable. Demandez-en une nouvelle à la personne
            qui vous a invité&nbsp;: elle la crée en quelques secondes dans les paramètres de Godet.
          </p>
        </Message>
        <Link href={signedIn ? '/garage' : '/'} className="btn btn-ghost btn-block">
          {signedIn ? 'Ouvrir mon garage' : 'Retour à l’accueil'}
        </Link>
      </AuthShell>
    );
  }

  const sameEmail = signedIn && currentEmail.trim().toLowerCase() === info.email.trim().toLowerCase();
  const withEmail = (mode?: 'inscription') => {
    const p = new URLSearchParams();
    if (mode) p.set('mode', mode);
    p.set('suite', here);
    p.set('email', info.email);
    return `/connexion?${p.toString()}`;
  };

  return (
    <AuthShell>
      <div className="s-auth-head">
        <p className="eyebrow">Invitation</p>
        <h1>Rejoignez le garage de votre entreprise</h1>
        <p>Vous êtes invité à rejoindre ce parc d’engins sur Godet.</p>
      </div>
      <div className="s-invite-org">
        <strong>{info.orgName}</strong>
        <dl>
          <dt>Rôle</dt>
          <dd>
            <b>{role.label}</b> — {role.hint}
          </dd>
          <dt>Pour</dt>
          <dd>{info.email}</dd>
        </dl>
      </div>

      {!signedIn ? (
        <>
          <Alert tone="info" icon="users">
            <p>
              Créez votre compte, ou connectez-vous, avec l’adresse <b>{info.email}</b>. Vous reviendrez ici pour
              confirmer.
            </p>
          </Alert>
          <div className="s-form-actions">
            <Link href={withEmail('inscription')} className="btn btn-primary btn-block">
              Créer mon compte
            </Link>
            <Link href={withEmail()} className="btn btn-ghost btn-block">
              Se connecter
            </Link>
          </div>
        </>
      ) : sameEmail ? (
        <AcceptInvitationForm token={token} orgName={info.orgName} />
      ) : (
        <>
          <Alert tone="warn">
            <p>
              Cette invitation est prévue pour <b>{info.email}</b>, mais vous êtes connecté avec <b>{currentEmail}</b>.
            </p>
            <p>Déconnectez-vous, puis reconnectez-vous ou créez un compte avec la bonne adresse.</p>
          </Alert>
          <form action={seDeconnecter} className="s-form-actions">
            <input type="hidden" name="suite" value={here} />
            <button type="submit" className="btn btn-primary btn-block">
              <Icon name="logout" />
              Se déconnecter et changer de compte
            </button>
            <Link href="/garage" className="btn btn-ghost btn-block">
              Garder ce compte
            </Link>
          </form>
        </>
      )}
    </AuthShell>
  );
}

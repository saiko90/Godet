import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { seDeconnecter } from '@/app/auth/actions';
import { Icon, type IconName } from '@/components/Icons';
import { AcceptInvitationForm } from '@/components/site/AcceptInvitationForm';
import { Alert } from '@/components/site/Form';
import { isInvitationToken, localizePath } from '@/components/site/nav';
import { checkLocale, metaLocale, NO_INDEX } from '@/components/site/seo';
import { AuthShell } from '@/components/site/SiteChrome';
import { Link } from '@/i18n/navigation';
import { getSession } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import type { MemberRole } from '@/lib/types';

type Params = Promise<{ locale: string; token: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const locale = metaLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'auth.meta' });
  return { title: t('invitationTitle'), description: t('invitationDescription'), robots: NO_INDEX };
}

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

export default async function InvitationPage({ params }: { params: Params }) {
  const { locale: rawLocale, token } = await params;
  const locale = checkLocale(rawLocale);
  setRequestLocale(locale);
  const [info, session, t, td] = await Promise.all([
    loadInvitation(token),
    getSession(),
    getTranslations({ locale, namespace: 'auth.invitation' }),
    getTranslations({ locale, namespace: 'domain' }),
  ]);
  const signedIn = session.status !== 'anon';
  const currentEmail = session.status === 'ok' ? session.ctx.email : session.status === 'no-org' ? session.email : '';
  const here = `/invitation/${token}`;
  const bold = (chunks: React.ReactNode) => <b>{chunks}</b>;

  if (info.kind === 'missing') {
    return (
      <AuthShell>
        <Message icon="alert" tone="bad" title={t('missingTitle')}>
          <p>{t('missingText')}</p>
        </Message>
        <Link href={signedIn ? '/garage' : '/'} className="btn btn-ghost btn-block">
          {signedIn ? t('openGarage') : t('home')}
        </Link>
      </AuthShell>
    );
  }

  if (info.kind === 'error') {
    return (
      <AuthShell>
        <Message icon="alert" tone="bad" title={t('errorTitle')}>
          <p>{t('errorText')}</p>
        </Message>
        <Link href={here} className="btn btn-primary btn-block">
          {t('retry')}
        </Link>
      </AuthShell>
    );
  }

  if (info.accepted) {
    return (
      <AuthShell>
        <Message icon="check" tone="ok" title={t('usedTitle')}>
          <p>{t.rich('usedText', { org: info.orgName, b: bold })}</p>
        </Message>
        <Link href={signedIn ? '/garage' : '/connexion'} className="btn btn-primary btn-block">
          {signedIn ? t('openGarage') : t('login')}
        </Link>
      </AuthShell>
    );
  }

  if (info.expired) {
    return (
      <AuthShell>
        <Message icon="clock" tone="bad" title={t('expiredTitle')}>
          <p>{t.rich('expiredText', { org: info.orgName, b: bold })}</p>
        </Message>
        <Link href={signedIn ? '/garage' : '/'} className="btn btn-ghost btn-block">
          {signedIn ? t('openGarage') : t('home')}
        </Link>
      </AuthShell>
    );
  }

  const sameEmail = signedIn && currentEmail.trim().toLowerCase() === info.email.trim().toLowerCase();
  // Retour sur cette invitation après la connexion ou l'inscription, dans la langue de la page.
  const withEmail = (mode?: 'inscription') => ({
    pathname: '/connexion',
    query: { ...(mode ? { mode } : {}), suite: localizePath(here, locale), email: info.email },
  });

  return (
    <AuthShell>
      <div className="s-auth-head">
        <p className="eyebrow">{t('eyebrow')}</p>
        <h1>{t('title')}</h1>
        <p>{t('lead')}</p>
      </div>
      <div className="s-invite-org">
        <strong>{info.orgName}</strong>
        <dl>
          <dt>{t('role')}</dt>
          <dd>
            <b>{td(`roles.${info.role}.label`)}</b> — {td(`roles.${info.role}.hint`)}
          </dd>
          <dt>{t('for')}</dt>
          <dd>{info.email}</dd>
        </dl>
      </div>

      {!signedIn ? (
        <>
          <Alert tone="info" icon="users">
            <p>{t.rich('anonymous', { email: info.email, b: bold })}</p>
          </Alert>
          <div className="s-form-actions">
            <Link href={withEmail('inscription')} className="btn btn-primary btn-block">
              {t('createAccount')}
            </Link>
            <Link href={withEmail()} className="btn btn-ghost btn-block">
              {t('login')}
            </Link>
          </div>
        </>
      ) : sameEmail ? (
        <AcceptInvitationForm token={token} label={t('join', { org: info.orgName })} pendingLabel={t('joining')} />
      ) : (
        <>
          <Alert tone="warn">
            <p>{t.rich('wrongAccount', { invited: info.email, current: currentEmail, b: bold })}</p>
            <p>{t('wrongAccountHint')}</p>
          </Alert>
          <form action={seDeconnecter} className="s-form-actions">
            <input type="hidden" name="suite" value={localizePath(here, locale)} />
            <button type="submit" className="btn btn-primary btn-block">
              <Icon name="logout" />
              {t('switchAccount')}
            </button>
            <Link href="/garage" className="btn btn-ghost btn-block">
              {t('keepAccount')}
            </Link>
          </form>
        </>
      )}
    </AuthShell>
  );
}

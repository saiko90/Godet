'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState } from 'react';
import { Icon } from '@/components/Icons';
import { Link, useRouter } from '@/i18n/navigation';
import type { AppLocale } from '@/i18n/routing';
import { supabaseBrowser } from '@/lib/supabase/client';
import { authErrorKey, type AuthErrorKey } from './auth-errors';
import { Alert, FieldError } from './Form';
import { localizePath, looksLikeEmail, splitLocale } from './nav';
import { PasswordInput } from './PasswordInput';

type Mode = 'connexion' | 'inscription';
type View = Mode | 'oubli' | 'oubli-envoye' | 'verifier';
type Field = 'name' | 'email' | 'password';
type Errors = Partial<Record<Field, string>>;

interface Props {
  initialMode: Mode;
  /** Chemin interne (localisé, déjà vérifié côté serveur) où aller après la connexion, ou '' pour le chemin par défaut. */
  suite: string;
  /** Arrivée depuis un lien d'e-mail invalide (/connexion?erreur=lien). */
  linkError: boolean;
  initialEmail: string;
  /** Code de suivi d'un lien d'agent (cookie « godet-ref »), transmis à l'inscription. */
  refCode: string | null;
}

const RESEND_DELAY = 60;

/** Adresse de retour des e-mails de Supabase (confirmation, mot de passe oublié), vers un chemin localisé. */
function callbackUrl(next: string): string {
  return `${window.location.origin}/auth/callback?suite=${encodeURIComponent(next)}`;
}

export function ConnexionForm({ initialMode, suite, linkError, initialEmail, refCode }: Props) {
  const t = useTranslations('auth');
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const uid = useId();
  const ids = {
    tabLogin: `${uid}-tab-connexion`,
    tabSignup: `${uid}-tab-inscription`,
    panel: `${uid}-panel`,
    name: `${uid}-nom`,
    email: `${uid}-email`,
    password: `${uid}-mdp`,
    nameErr: `${uid}-nom-err`,
    emailErr: `${uid}-email-err`,
    passwordErr: `${uid}-mdp-err`,
    passwordHint: `${uid}-mdp-aide`,
  };

  const [view, setView] = useState<View>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showLinkError, setShowLinkError] = useState(linkError);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const shownView = useRef<View>(initialMode);
  const focusHeading = useRef(true);

  // La suite prévue garde sa langue ; un chemin sans préfixe suit la langue de la page.
  const planned = suite ? splitLocale(suite) : null;
  const forInvitation = Boolean(planned?.path.startsWith('/invitation/'));
  const afterLogin = planned ? { locale: planned.locale ?? locale, path: planned.path } : { locale, path: '/garage' };
  const afterSignup = planned ? afterLogin : { locale, path: '/bienvenue' };
  const signupReturn = localizePath(afterSignup.path, afterSignup.locale);

  const authError = (key: AuthErrorKey) => t(`errors.${key}`);

  // À chaque changement d'écran (pas au premier affichage, ni entre les onglets), le titre reçoit le focus.
  useEffect(() => {
    if (shownView.current === view) return;
    shownView.current = view;
    if (focusHeading.current) headingRef.current?.focus();
  }, [view]);

  // Délai avant de pouvoir renvoyer un e-mail (limite d'envoi de Supabase).
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  function resetMessages() {
    setErrors({});
    setFormError(null);
    setNotice(null);
    setUnconfirmed(false);
  }

  function go(next: View, moveFocus = true) {
    focusHeading.current = moveFocus;
    resetMessages();
    setView(next);
    if (next === 'connexion' || next === 'inscription') {
      const url = new URL(window.location.href);
      if (next === 'inscription') url.searchParams.set('mode', 'inscription');
      else url.searchParams.delete('mode');
      window.history.replaceState(window.history.state, '', url);
    }
  }

  function onTabKey(ev: React.KeyboardEvent<HTMLDivElement>) {
    if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight' && ev.key !== 'Home' && ev.key !== 'End') return;
    ev.preventDefault();
    const next: Mode =
      ev.key === 'Home' ? 'connexion' : ev.key === 'End' ? 'inscription' : view === 'connexion' ? 'inscription' : 'connexion';
    go(next, false);
    document.getElementById(next === 'connexion' ? ids.tabLogin : ids.tabSignup)?.focus();
  }

  function validate(fields: Field[], strictPassword: boolean): Errors {
    const e: Errors = {};
    if (fields.includes('name')) {
      const n = name.trim();
      if (n.length < 2) e.name = t('validation.nameRequired');
      else if (n.length > 80) e.name = t('validation.nameTooLong');
    }
    if (fields.includes('email')) {
      const m = email.trim();
      if (!m) e.email = t('validation.emailRequired');
      else if (!looksLikeEmail(m)) e.email = t('validation.emailInvalid');
    }
    if (fields.includes('password')) {
      if (!password) e.password = strictPassword ? t('validation.passwordChoose') : t('validation.passwordRequired');
      else if (strictPassword && password.length < 8) e.password = t('validation.passwordTooShort');
    }
    return e;
  }

  function check(fields: Field[], strictPassword: boolean): boolean {
    const e = validate(fields, strictPassword);
    setErrors(e);
    const first = fields.find((f) => e[f]);
    if (first) {
      document.getElementById(first === 'name' ? ids.name : first === 'email' ? ids.email : ids.password)?.focus();
      return false;
    }
    return true;
  }

  async function onSignIn(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (pending) return;
    resetMessages();
    if (!check(['email', 'password'], false)) return;
    setPending(true);
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setPending(false);
      setFormError(authError(authErrorKey(error)));
      setUnconfirmed(error.code === 'email_not_confirmed');
      return;
    }
    setShowLinkError(false);
    router.replace(afterLogin.path, { locale: afterLogin.locale });
  }

  async function onSignUp(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (pending) return;
    resetMessages();
    if (!check(['name', 'email', 'password'], true)) return;
    setPending(true);
    const { data, error } = await supabaseBrowser().auth.signUp({
      email: email.trim(),
      password,
      options: {
        // Langue des e-mails et code de suivi d'un lien d'agent (repris dans le profil par la base).
        data: { full_name: name.trim(), locale, ...(refCode ? { ref: refCode } : {}) },
        emailRedirectTo: callbackUrl(signupReturn),
      },
    });
    if (error) {
      setPending(false);
      setFormError(authError(authErrorKey(error)));
      return;
    }
    // Adresse déjà inscrite et confirmée : Supabase renvoie un utilisateur sans identité.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      setPending(false);
      setFormError(authError('userExists'));
      return;
    }
    if (data.session) {
      router.replace(afterSignup.path, { locale: afterSignup.locale });
      return;
    }
    setPending(false);
    setPassword('');
    setCooldown(RESEND_DELAY);
    focusHeading.current = true;
    setView('verifier');
  }

  async function sendResetLink(): Promise<boolean> {
    const { error } = await supabaseBrowser().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: callbackUrl(localizePath('/mot-de-passe', locale)),
    });
    if (error) {
      setFormError(authError(authErrorKey(error)));
      return false;
    }
    return true;
  }

  async function onReset(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (pending) return;
    resetMessages();
    if (!check(['email'], false)) return;
    setPending(true);
    const ok = await sendResetLink();
    setPending(false);
    if (!ok) return;
    setShowLinkError(false);
    setCooldown(RESEND_DELAY);
    focusHeading.current = true;
    setView('oubli-envoye');
  }

  async function resendConfirmation() {
    if (pending || cooldown > 0) return;
    setFormError(null);
    setNotice(null);
    setPending(true);
    const { error } = await supabaseBrowser().auth.resend({
      type: 'signup',
      email: email.trim(),
      options: { emailRedirectTo: callbackUrl(signupReturn) },
    });
    setPending(false);
    if (error) {
      setFormError(authError(authErrorKey(error)));
      return;
    }
    setNotice(t('check.confirmationResent'));
    setCooldown(RESEND_DELAY);
  }

  async function resendReset() {
    if (pending || cooldown > 0) return;
    setFormError(null);
    setNotice(null);
    setPending(true);
    const ok = await sendResetLink();
    setPending(false);
    if (!ok) return;
    setNotice(t('check.linkResent'));
    setCooldown(RESEND_DELAY);
  }

  const messages = (
    <>
      {formError ? (
        <Alert tone="bad" live>
          <p>{formError}</p>
        </Alert>
      ) : null}
      {notice ? (
        <Alert tone="ok" live>
          <p>{notice}</p>
        </Alert>
      ) : null}
    </>
  );

  const emailField = (autoComplete: 'username' | 'email') => (
    <div className="field">
      <label htmlFor={ids.email}>{t('fields.email')}</label>
      <input
        id={ids.email}
        name="email"
        type="email"
        inputMode="email"
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        required
        maxLength={200}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-invalid={errors.email ? true : undefined}
        aria-describedby={errors.email ? ids.emailErr : undefined}
        disabled={pending}
      />
      <FieldError id={ids.emailErr} message={errors.email} />
    </div>
  );

  const cooldownLabel = cooldown > 0 ? ` ${t('login.cooldown', { seconds: cooldown })}` : '';
  const bold = (chunks: React.ReactNode) => <b>{chunks}</b>;

  // ---------- écrans « vérifiez votre boîte e-mail » ----------
  if (view === 'verifier' || view === 'oubli-envoye') {
    const signup = view === 'verifier';
    return (
      <>
        <span className="s-big-icon" aria-hidden="true">
          <Icon name="mail" />
        </span>
        <div className="s-auth-head">
          <h1 ref={headingRef} tabIndex={-1}>
            {t('check.title')}
          </h1>
          <p>{t.rich(signup ? 'check.signupSent' : 'check.resetSent', { email: email.trim(), b: bold })}</p>
          <p>{t('check.spam')}</p>
        </div>
        {messages}
        <div className="s-form-actions">
          <button
            type="button"
            className="btn btn-soft btn-block"
            onClick={signup ? resendConfirmation : resendReset}
            disabled={pending || cooldown > 0}
          >
            <Icon name="mail" />
            {signup ? t('check.resendEmail') : t('check.resendLink')}
            {cooldownLabel}
          </button>
          <button type="button" className="btn btn-ghost btn-block" onClick={() => go(signup ? 'inscription' : 'connexion')}>
            {signup ? t('check.changeEmail') : t('check.backToLogin')}
          </button>
        </div>
      </>
    );
  }

  // ---------- mot de passe oublié ----------
  if (view === 'oubli') {
    return (
      <>
        <div className="s-auth-head">
          <h1 ref={headingRef} tabIndex={-1}>
            {t('forgot.title')}
          </h1>
          <p>{t('forgot.lead')}</p>
        </div>
        {messages}
        <form className="s-form" onSubmit={onReset} noValidate>
          {emailField('email')}
          <div className="s-form-actions">
            <button type="submit" className="btn btn-primary btn-block" disabled={pending} aria-busy={pending}>
              {pending ? t('forgot.pending') : t('forgot.submit')}
            </button>
            <button type="button" className="btn btn-ghost btn-block" onClick={() => go('connexion')}>
              <Icon name="chevron-left" />
              {t('forgot.back')}
            </button>
          </div>
        </form>
      </>
    );
  }

  // ---------- connexion / inscription ----------
  const signup = view === 'inscription';
  return (
    <>
      <div className="s-tabs" role="tablist" aria-label={t('login.tabs')} onKeyDown={onTabKey}>
        <button
          type="button"
          role="tab"
          id={ids.tabLogin}
          className="s-tab"
          aria-selected={!signup}
          aria-controls={ids.panel}
          tabIndex={signup ? -1 : 0}
          onClick={() => go('connexion', false)}
        >
          {t('login.tabLogin')}
        </button>
        <button
          type="button"
          role="tab"
          id={ids.tabSignup}
          className="s-tab"
          aria-selected={signup}
          aria-controls={ids.panel}
          tabIndex={signup ? 0 : -1}
          onClick={() => go('inscription', false)}
        >
          {t('login.tabSignup')}
        </button>
      </div>

      <div id={ids.panel} role="tabpanel" aria-labelledby={signup ? ids.tabSignup : ids.tabLogin} className="s-form">
        <div className="s-auth-head">
          <h1 ref={headingRef} tabIndex={-1}>
            {signup ? t('login.signupTitle') : t('login.loginTitle')}
          </h1>
          <p>{signup ? t('login.signupLead') : t('login.loginLead')}</p>
        </div>

        {forInvitation ? (
          <Alert tone="info" icon="users">
            <p>{signup ? t('login.invitationSignup') : t('login.invitationLogin')}</p>
          </Alert>
        ) : null}

        {showLinkError ? (
          <Alert tone="warn">
            <p>{t.rich('login.linkError', { b: bold })}</p>
          </Alert>
        ) : null}

        {messages}

        {unconfirmed ? (
          <button
            type="button"
            className="btn btn-soft btn-block"
            onClick={resendConfirmation}
            disabled={pending || cooldown > 0}
          >
            <Icon name="mail" />
            {t('login.resendConfirmation')}
            {cooldownLabel}
          </button>
        ) : null}

        <form className="s-form" onSubmit={signup ? onSignUp : onSignIn} noValidate>
          {signup ? (
            <div className="field">
              <label htmlFor={ids.name}>{t('fields.name')}</label>
              <input
                id={ids.name}
                name="name"
                type="text"
                autoComplete="name"
                autoCapitalize="words"
                required
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={errors.name ? ids.nameErr : undefined}
                disabled={pending}
              />
              <FieldError id={ids.nameErr} message={errors.name} />
            </div>
          ) : null}

          {emailField('username')}

          <div className="field">
            <div className="s-label-row">
              <label htmlFor={ids.password}>{t('fields.password')}</label>
              {!signup ? (
                <button type="button" className="s-linkbtn" onClick={() => go('oubli')}>
                  {t('login.forgot')}
                </button>
              ) : null}
            </div>
            <PasswordInput
              id={ids.password}
              showLabel={t('fields.showPassword')}
              name="password"
              autoComplete={signup ? 'new-password' : 'current-password'}
              value={password}
              onChange={setPassword}
              minLength={signup ? 8 : undefined}
              invalid={Boolean(errors.password)}
              describedBy={
                [errors.password ? ids.passwordErr : '', signup ? ids.passwordHint : ''].filter(Boolean).join(' ') ||
                undefined
              }
              disabled={pending}
            />
            {signup ? (
              <p id={ids.passwordHint} className="s-field-hint">
                {t('fields.passwordHint')}
              </p>
            ) : null}
            <FieldError id={ids.passwordErr} message={errors.password} />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={pending} aria-busy={pending}>
            {pending
              ? signup
                ? t('login.pendingSignup')
                : t('login.pendingLogin')
              : signup
                ? t('login.submitSignup')
                : t('login.submitLogin')}
          </button>

          {signup ? (
            <p className="s-field-hint">
              {t.rich('login.privacy', {
                link: (chunks) => (
                  <Link className="s-link" href="/confidentialite" target="_blank" rel="noopener">
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          ) : null}
        </form>

        <p className="s-auth-alt">
          {signup ? t('login.hasAccount') : t('login.noAccount')}{' '}
          <button type="button" className="s-linkbtn" onClick={() => go(signup ? 'connexion' : 'inscription')}>
            {signup ? t('login.switchLogin') : t('login.switchSignup')}
          </button>
        </p>
      </div>
    </>
  );
}

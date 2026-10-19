'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { Icon } from '@/components/Icons';
import { supabaseBrowser } from '@/lib/supabase/client';
import { authMessage } from './auth-errors';
import { Alert, FieldError } from './Form';
import { looksLikeEmail } from './nav';
import { PasswordInput } from './PasswordInput';

type Mode = 'connexion' | 'inscription';
type View = Mode | 'oubli' | 'oubli-envoye' | 'verifier';
type Field = 'name' | 'email' | 'password';
type Errors = Partial<Record<Field, string>>;

interface Props {
  initialMode: Mode;
  /** Chemin interne où aller après la connexion (déjà vérifié côté serveur), ou '' pour le chemin par défaut. */
  suite: string;
  /** Arrivée depuis un lien d'e-mail invalide (/connexion?erreur=lien). */
  linkError: boolean;
  initialEmail: string;
}

const NB = '\u00a0';
const RESEND_DELAY = 60;

/** Adresse de retour des e-mails de Supabase (confirmation, mot de passe oublié). */
function callbackUrl(next: string): string {
  return `${window.location.origin}/auth/callback?suite=${encodeURIComponent(next)}`;
}

export function ConnexionForm({ initialMode, suite, linkError, initialEmail }: Props) {
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

  const forInvitation = suite.startsWith('/invitation/');
  const afterSignup = suite || '/bienvenue';

  // À chaque changement d'écran (pas au premier affichage, ni entre les onglets), le titre reçoit le focus.
  useEffect(() => {
    if (shownView.current === view) return;
    shownView.current = view;
    if (focusHeading.current) headingRef.current?.focus();
  }, [view]);

  // Délai avant de pouvoir renvoyer un e-mail (limite d'envoi de Supabase).
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
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
      window.history.replaceState(null, '', url);
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
      if (n.length < 2) e.name = 'Indiquez votre nom complet.';
      else if (n.length > 80) e.name = `80${NB}caractères au maximum.`;
    }
    if (fields.includes('email')) {
      const m = email.trim();
      if (!m) e.email = 'Indiquez votre adresse e-mail.';
      else if (!looksLikeEmail(m)) e.email = `Adresse incomplète. Exemple${NB}: nom@entreprise.ch`;
    }
    if (fields.includes('password')) {
      if (!password) e.password = strictPassword ? 'Choisissez un mot de passe.' : 'Indiquez votre mot de passe.';
      else if (strictPassword && password.length < 8) e.password = `Mot de passe trop court${NB}: 8${NB}caractères au minimum.`;
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
      setFormError(authMessage(error));
      setUnconfirmed(error.code === 'email_not_confirmed');
      return;
    }
    setShowLinkError(false);
    router.replace(suite || '/garage');
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
      options: { data: { full_name: name.trim() }, emailRedirectTo: callbackUrl(afterSignup) },
    });
    if (error) {
      setPending(false);
      setFormError(authMessage(error));
      return;
    }
    // Adresse déjà inscrite et confirmée : Supabase renvoie un utilisateur sans identité.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      setPending(false);
      setFormError(authMessage({ code: 'user_already_exists' }));
      return;
    }
    if (data.session) {
      router.replace(afterSignup);
      return;
    }
    setPending(false);
    setPassword('');
    setCooldown(RESEND_DELAY);
    focusHeading.current = true;
    setView('verifier');
  }

  async function onReset(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (pending) return;
    resetMessages();
    if (!check(['email'], false)) return;
    setPending(true);
    const { error } = await supabaseBrowser().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: callbackUrl('/mot-de-passe'),
    });
    setPending(false);
    if (error) {
      setFormError(authMessage(error));
      return;
    }
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
      options: { emailRedirectTo: callbackUrl(afterSignup) },
    });
    setPending(false);
    if (error) {
      setFormError(authMessage(error));
      return;
    }
    setNotice('Un nouvel e-mail de confirmation vient de partir.');
    setCooldown(RESEND_DELAY);
  }

  async function resendReset() {
    if (pending || cooldown > 0) return;
    setFormError(null);
    setNotice(null);
    setPending(true);
    const { error } = await supabaseBrowser().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: callbackUrl('/mot-de-passe'),
    });
    setPending(false);
    if (error) {
      setFormError(authMessage(error));
      return;
    }
    setNotice('Un nouveau lien vient de partir.');
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
      <label htmlFor={ids.email}>Adresse e-mail</label>
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

  const cooldownLabel = cooldown > 0 ? ` (${cooldown}${NB}s)` : '';

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
            Vérifiez votre boîte e-mail
          </h1>
          {signup ? (
            <p>
              Nous avons envoyé un lien de confirmation à <b>{email.trim()}</b>. Ouvrez-le sur cet appareil pour
              activer votre garage.
            </p>
          ) : (
            <p>
              Si un compte existe pour <b>{email.trim()}</b>, un lien vient de partir. Ouvrez-le sur cet appareil
              pour choisir un nouveau mot de passe.
            </p>
          )}
          <p>Rien reçu après quelques minutes&nbsp;? Regardez dans les courriers indésirables.</p>
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
            {signup ? 'Renvoyer l’e-mail' : 'Renvoyer le lien'}
            {cooldownLabel}
          </button>
          <button type="button" className="btn btn-ghost btn-block" onClick={() => go(signup ? 'inscription' : 'connexion')}>
            {signup ? 'Modifier l’adresse' : 'Retour à la connexion'}
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
            Mot de passe oublié
          </h1>
          <p>Indiquez votre adresse e-mail. Nous vous envoyons un lien pour choisir un nouveau mot de passe.</p>
        </div>
        {messages}
        <form className="s-form" onSubmit={onReset} noValidate>
          {emailField('email')}
          <div className="s-form-actions">
            <button type="submit" className="btn btn-primary btn-block" disabled={pending} aria-busy={pending}>
              {pending ? 'Envoi…' : 'Envoyer le lien'}
            </button>
            <button type="button" className="btn btn-ghost btn-block" onClick={() => go('connexion')}>
              <Icon name="chevron-left" />
              Retour à la connexion
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
      <div className="s-tabs" role="tablist" aria-label="Accès au compte" onKeyDown={onTabKey}>
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
          Connexion
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
          Inscription
        </button>
      </div>

      <div id={ids.panel} role="tabpanel" aria-labelledby={signup ? ids.tabSignup : ids.tabLogin} className="s-form">
        <div className="s-auth-head">
          <h1 ref={headingRef} tabIndex={-1}>
            {signup ? 'Créer votre garage' : 'Bon retour au garage'}
          </h1>
          <p>
            {signup
              ? 'Essai gratuit de 30 jours, sans carte de crédit.'
              : 'Connectez-vous pour retrouver votre parc d’engins.'}
          </p>
        </div>

        {forInvitation ? (
          <Alert tone="info" icon="users">
            <p>
              {signup ? 'Créez votre compte' : 'Connectez-vous'} avec l’adresse qui a reçu l’invitation. Vous
              reviendrez ensuite sur l’invitation pour la confirmer.
            </p>
          </Alert>
        ) : null}

        {showLinkError ? (
          <Alert tone="warn">
            <p>
              <b>Ce lien n’est plus valable.</b> Il a peut-être déjà servi, expiré, ou été ouvert dans un autre
              navigateur. Connectez-vous, ou demandez un nouveau lien.
            </p>
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
            Renvoyer l’e-mail de confirmation{cooldownLabel}
          </button>
        ) : null}

        <form className="s-form" onSubmit={signup ? onSignUp : onSignIn} noValidate>
          {signup ? (
            <div className="field">
              <label htmlFor={ids.name}>Nom complet</label>
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
              <label htmlFor={ids.password}>Mot de passe</label>
              {!signup ? (
                <button type="button" className="s-linkbtn" onClick={() => go('oubli')}>
                  Mot de passe oublié&nbsp;?
                </button>
              ) : null}
            </div>
            <PasswordInput
              id={ids.password}
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
                8&nbsp;caractères au minimum.
              </p>
            ) : null}
            <FieldError id={ids.passwordErr} message={errors.password} />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={pending} aria-busy={pending}>
            {pending ? (signup ? 'Création du compte…' : 'Connexion…') : signup ? 'Créer mon garage' : 'Se connecter'}
          </button>

          {signup ? (
            <p className="s-field-hint">
              Vos données sont hébergées dans l’UE et traitées selon notre{' '}
              <Link className="s-link" href="/confidentialite" target="_blank" rel="noopener">
                politique de confidentialité
              </Link>
              .
            </p>
          ) : null}
        </form>

        <p className="s-auth-alt">
          {signup ? 'Déjà un compte\u00a0? ' : 'Pas encore de compte\u00a0? '}
          <button type="button" className="s-linkbtn" onClick={() => go(signup ? 'connexion' : 'inscription')}>
            {signup ? 'Se connecter' : 'Créer mon garage'}
          </button>
        </p>
      </div>
    </>
  );
}

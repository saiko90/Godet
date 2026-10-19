'use client';

import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { authMessage } from './auth-errors';
import { Alert, FieldError } from './Form';
import { PasswordInput } from './PasswordInput';

const NB = '\u00a0';

/** Choix d'un nouveau mot de passe, avec la session ouverte par le lien « mot de passe oublié ». */
export function NouveauMotDePasseForm({ email }: { email: string }) {
  const router = useRouter();
  const uid = useId();
  const ids = {
    pw: `${uid}-mdp`,
    pwErr: `${uid}-mdp-err`,
    pwHint: `${uid}-mdp-aide`,
    confirm: `${uid}-confirmation`,
    confirmErr: `${uid}-confirmation-err`,
  };
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (pending) return;
    setFormError(null);
    const e: { password?: string; confirm?: string } = {};
    if (password.length < 8) e.password = `Mot de passe trop court${NB}: 8${NB}caractères au minimum.`;
    else if (confirm !== password) e.confirm = 'Les deux mots de passe ne sont pas identiques.';
    setErrors(e);
    if (e.password || e.confirm) {
      document.getElementById(e.password ? ids.pw : ids.confirm)?.focus();
      return;
    }
    setPending(true);
    const { error } = await supabaseBrowser().auth.updateUser({ password });
    if (error) {
      setPending(false);
      setFormError(authMessage(error));
      return;
    }
    setDone(true);
    router.replace('/garage');
  }

  return (
    <>
      <div className="s-auth-head">
        <h1>Nouveau mot de passe</h1>
        <p>
          Choisissez un nouveau mot de passe pour <b>{email}</b>.
        </p>
      </div>
      {formError ? (
        <Alert tone="bad" live>
          <p>{formError}</p>
        </Alert>
      ) : null}
      {done ? (
        <Alert tone="ok" live>
          <p>Mot de passe enregistré. Ouverture du garage…</p>
        </Alert>
      ) : null}
      <form className="s-form" onSubmit={onSubmit} noValidate>
        {/* Identifiant pour les gestionnaires de mots de passe. */}
        <input className="s-hidden-user" type="email" name="username" autoComplete="username" value={email} readOnly tabIndex={-1} aria-hidden="true" />
        <div className="field">
          <label htmlFor={ids.pw}>Nouveau mot de passe</label>
          <PasswordInput
            id={ids.pw}
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            minLength={8}
            invalid={Boolean(errors.password)}
            describedBy={[errors.password ? ids.pwErr : '', ids.pwHint].filter(Boolean).join(' ')}
            disabled={pending}
          />
          <p id={ids.pwHint} className="s-field-hint">
            8&nbsp;caractères au minimum.
          </p>
          <FieldError id={ids.pwErr} message={errors.password} />
        </div>
        <div className="field">
          <label htmlFor={ids.confirm}>Confirmez le mot de passe</label>
          <PasswordInput
            id={ids.confirm}
            name="confirmation"
            autoComplete="new-password"
            value={confirm}
            onChange={setConfirm}
            invalid={Boolean(errors.confirm)}
            describedBy={errors.confirm ? ids.confirmErr : undefined}
            disabled={pending}
          />
          <FieldError id={ids.confirmErr} message={errors.confirm} />
        </div>
        <button type="submit" className="btn btn-primary btn-block" disabled={pending} aria-busy={pending}>
          {pending ? 'Enregistrement…' : 'Enregistrer et ouvrir le garage'}
        </button>
      </form>
    </>
  );
}

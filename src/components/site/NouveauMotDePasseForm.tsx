'use client';

import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import { authErrorKey } from './auth-errors';
import { Alert, FieldError } from './Form';
import { PasswordInput } from './PasswordInput';

/** Choix d'un nouveau mot de passe, avec la session ouverte par le lien « mot de passe oublié ». */
export function NouveauMotDePasseForm({ email }: { email: string }) {
  const t = useTranslations('auth');
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
    if (password.length < 8) e.password = t('validation.passwordTooShort');
    else if (confirm !== password) e.confirm = t('validation.passwordMismatch');
    setErrors(e);
    if (e.password || e.confirm) {
      document.getElementById(e.password ? ids.pw : ids.confirm)?.focus();
      return;
    }
    setPending(true);
    const { error } = await supabaseBrowser().auth.updateUser({ password });
    if (error) {
      setPending(false);
      setFormError(t(`errors.${authErrorKey(error)}`));
      return;
    }
    setDone(true);
    router.replace('/garage');
  }

  return (
    <>
      <div className="s-auth-head">
        <h1>{t('password.title')}</h1>
        <p>{t.rich('password.lead', { email, b: (chunks) => <b>{chunks}</b> })}</p>
      </div>
      {formError ? (
        <Alert tone="bad" live>
          <p>{formError}</p>
        </Alert>
      ) : null}
      {done ? (
        <Alert tone="ok" live>
          <p>{t('password.done')}</p>
        </Alert>
      ) : null}
      <form className="s-form" onSubmit={onSubmit} noValidate>
        {/* Identifiant pour les gestionnaires de mots de passe. */}
        <input className="s-hidden-user" type="email" name="username" autoComplete="username" value={email} readOnly tabIndex={-1} aria-hidden="true" />
        <div className="field">
          <label htmlFor={ids.pw}>{t('password.newPassword')}</label>
          <PasswordInput
            id={ids.pw}
            showLabel={t('fields.showPassword')}
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
            {t('fields.passwordHint')}
          </p>
          <FieldError id={ids.pwErr} message={errors.password} />
        </div>
        <div className="field">
          <label htmlFor={ids.confirm}>{t('password.confirm')}</label>
          <PasswordInput
            id={ids.confirm}
            showLabel={t('fields.showPassword')}
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
          {pending ? t('password.pending') : t('password.submit')}
        </button>
      </form>
    </>
  );
}

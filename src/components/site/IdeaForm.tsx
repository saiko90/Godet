'use client';

import { useTranslations } from 'next-intl';
import { useActionState, useEffect, useId, useRef, useState } from 'react';
import { Icon } from '@/components/Icons';
import { envoyerIdee } from '@/app/[locale]/idees/actions';
import { Link } from '@/i18n/navigation';
import { Alert, FieldError } from './Form';
import { EMPTY_PUBLIC_FORM } from './types';

const CATEGORIES = ['3d', 'carnet', 'echeances', 'couts', 'medias', 'equipe', 'notifications', 'mobile', 'autre'] as const;
const FIELD_ORDER = ['titre', 'details', 'email'] as const;

interface Props {
  /** Adresse du compte connecté (sinon : champ e-mail obligatoire). */
  accountEmail: string | null;
  /** Lien vers la connexion, avec retour sur cette page (localisé côté serveur). */
  loginHref: { pathname: string; query: Record<string, string> };
}

/** Formulaire de la boîte à idées : titre, domaine, détails, e-mail si non connecté, piège à robots. */
export function IdeaForm({ accountEmail, loginHref }: Props) {
  const t = useTranslations('ideas');
  const [state, action, pending] = useActionState(envoyerIdee, EMPTY_PUBLIC_FORM);
  const [seen, setSeen] = useState(0);
  // Chaque réponse du serveur recrée le formulaire avec la saisie renvoyée (les listes ne relisent pas defaultValue).
  const [shownState, setShownState] = useState(state);
  const [round, setRound] = useState(0);
  if (shownState !== state) {
    setShownState(state);
    setRound((r) => r + 1);
  }
  const uid = useId();
  const sentRef = useRef<HTMLHeadingElement>(null);
  const id = (name: string) => `${uid}-${name}`;
  const showSent = state.sent > seen;

  // Après l'envoi : le titre de confirmation reçoit le focus ; après un refus : le premier champ à corriger.
  useEffect(() => {
    if (showSent) {
      sentRef.current?.focus();
      return;
    }
    if (state.status !== 'error') return;
    const first = FIELD_ORDER.find((f) => state.errors[f]);
    if (first) document.getElementById(`${uid}-${first}`)?.focus();
  }, [state, showSent, uid]);

  if (showSent) {
    return (
      <div className="s-sent" role="status">
        <span className="s-big-icon s-ok" aria-hidden="true">
          <Icon name="check" />
        </span>
        <h2 ref={sentRef} tabIndex={-1}>
          {t('sent.title')}
        </h2>
        <p>{accountEmail ? t('sent.textSignedIn') : t('sent.text')}</p>
        <div className="s-form-foot">
          <button type="button" className="btn btn-soft" onClick={() => setSeen(state.sent)}>
            {t('sent.again')}
          </button>
        </div>
      </div>
    );
  }

  const v: Record<string, string> = state.status === 'error' ? state.values : {};
  const value = (key: string) => v[key] ?? '';
  const err = (key: string) => state.errors[key];
  const described = (key: string, hint?: string) => [hint, err(key) ? id(`${key}-err`) : ''].filter(Boolean).join(' ') || undefined;
  const required = <span className="s-req">{t('form.required')}</span>;

  return (
    <form key={round} action={action} className="s-form s-public-form" noValidate aria-busy={pending}>
      {state.status === 'error' && state.message ? (
        <Alert tone="bad" live>
          <p>{state.message}</p>
        </Alert>
      ) : null}

      <div className="field">
        <label htmlFor={id('titre')}>
          {t('form.ideaTitle')} {required}
        </label>
        <input
          id={id('titre')}
          name="titre"
          type="text"
          required
          minLength={3}
          maxLength={120}
          autoComplete="off"
          defaultValue={value('titre')}
          aria-invalid={err('titre') ? true : undefined}
          aria-describedby={described('titre', id('titre-hint'))}
          disabled={pending}
        />
        <p id={id('titre-hint')} className="s-field-hint">
          {t('form.ideaTitleHint')}
        </p>
        <FieldError id={id('titre-err')} message={err('titre')} />
      </div>

      <div className="field">
        <label htmlFor={id('categorie')}>{t('form.category')}</label>
        <select id={id('categorie')} name="categorie" defaultValue={value('categorie') || 'autre'} disabled={pending}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {t(`form.categories.${c}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor={id('details')}>{t('form.details')}</label>
        <textarea
          id={id('details')}
          name="details"
          rows={6}
          maxLength={4000}
          defaultValue={value('details')}
          aria-invalid={err('details') ? true : undefined}
          aria-describedby={described('details', id('details-hint'))}
          disabled={pending}
        />
        <p id={id('details-hint')} className="s-field-hint">
          {t('form.detailsHint')}
        </p>
        <FieldError id={id('details-err')} message={err('details')} />
      </div>

      {accountEmail ? (
        <p className="s-field-hint">{t.rich('form.signedInAs', { email: accountEmail, b: (chunks) => <b>{chunks}</b> })}</p>
      ) : (
        <div className="field">
          <label htmlFor={id('email')}>
            {t('form.email')} {required}
          </label>
          <input
            id={id('email')}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            maxLength={200}
            defaultValue={value('email')}
            aria-invalid={err('email') ? true : undefined}
            aria-describedby={described('email', id('email-hint'))}
            disabled={pending}
          />
          <p id={id('email-hint')} className="s-field-hint">
            {t.rich('form.emailHint', {
              link: (chunks) => (
                <Link className="s-link" href={loginHref}>
                  {chunks}
                </Link>
              ),
            })}
          </p>
          <FieldError id={id('email-err')} message={err('email')} />
        </div>
      )}

      {/* Piège à robots : invisible pour les personnes (et les lecteurs d'écran), rempli par les robots. */}
      <div className="s-hp" aria-hidden="true">
        <label htmlFor={id('website')}>{t('form.trap')}</label>
        <input id={id('website')} name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <button type="submit" className="btn btn-primary btn-block" disabled={pending} aria-busy={pending}>
        <Icon name="note" />
        {pending ? t('form.pending') : t('form.submit')}
      </button>
      <p className="s-field-hint">
        {t.rich('form.privacy', {
          link: (chunks) => (
            <Link className="s-link" href="/confidentialite">
              {chunks}
            </Link>
          ),
        })}
      </p>
    </form>
  );
}

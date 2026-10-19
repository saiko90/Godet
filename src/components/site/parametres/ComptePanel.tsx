'use client';

import { useActionState, useId } from 'react';
import { Icon } from '@/components/Icons';
import { seDeconnecter } from '@/app/auth/actions';
import { changerMotDePasse, enregistrerNom, quitterEntreprise } from '@/app/parametres/actions';
import { FieldError } from '../Form';
import { PasswordInput } from '../PasswordInput';
import { EMPTY_FORM } from '../types';
import { ConfirmButton } from './ConfirmButton';
import { useServerAction } from './useServerAction';

interface Props {
  fullName: string | null;
  email: string;
  orgName: string;
  canLeave: boolean;
}

export function ComptePanel({ fullName, email, orgName, canLeave }: Props) {
  const [nameState, nameAction, namePending] = useActionState(enregistrerNom, EMPTY_FORM);
  const [pwState, pwAction, pwPending] = useActionState(changerMotDePasse, EMPTY_FORM);
  const leave = useServerAction(quitterEntreprise);
  const uid = useId();
  const ids = {
    title: `${uid}-titre`,
    nom: `${uid}-nom`,
    nomErr: `${uid}-nom-err`,
    pw: `${uid}-mdp`,
    pwErr: `${uid}-mdp-err`,
    pwHint: `${uid}-mdp-aide`,
    confirm: `${uid}-confirmation`,
    confirmErr: `${uid}-confirmation-err`,
  };

  return (
    <section id="compte" className="s-panel" aria-labelledby={ids.title}>
      <div className="s-panel-head">
        <h2 id={ids.title}>
          <Icon name="edit" />
          Mon compte
        </h2>
        <p>Votre nom figure dans le carnet, à côté des interventions que vous saisissez.</p>
      </div>

      <form action={nameAction} className="s-inline-form" noValidate>
        <div className="s-row">
          <div className="field">
            <label htmlFor={ids.nom}>Nom complet</label>
            <input
              id={ids.nom}
              name="nom"
              type="text"
              autoComplete="name"
              required
              minLength={2}
              maxLength={80}
              defaultValue={fullName ?? ''}
              aria-invalid={nameState.errors.nom ? true : undefined}
              aria-describedby={nameState.errors.nom ? ids.nomErr : undefined}
            />
            <FieldError id={ids.nomErr} message={nameState.errors.nom} />
          </div>
          <div className="s-readonly">
            <span>Adresse e-mail</span>
            <b>{email}</b>
          </div>
        </div>
        <div className="s-form-foot">
          <button type="submit" className="btn btn-primary s-btn-sm" disabled={namePending}>
            {namePending ? 'Enregistrement…' : 'Enregistrer le nom'}
          </button>
          <p className={`s-status${nameState.ok === false ? ' s-is-bad' : ''}`} role="status">
            {nameState.message ?? ''}
          </p>
        </div>
      </form>

      <div className="s-sub">
        <h3>Changer le mot de passe</h3>
        <form action={pwAction} className="s-inline-form" noValidate>
          <input className="s-hidden-user" type="email" name="username" autoComplete="username" value={email} readOnly tabIndex={-1} aria-hidden="true" />
          <div className="s-row">
            <div className="field">
              <label htmlFor={ids.pw}>Nouveau mot de passe</label>
              <PasswordInput
                key={`pw-${pwState.done}`}
                id={ids.pw}
                name="password"
                autoComplete="new-password"
                minLength={8}
                defaultValue=""
                invalid={Boolean(pwState.errors.password)}
                describedBy={[pwState.errors.password ? ids.pwErr : '', ids.pwHint].filter(Boolean).join(' ')}
              />
              <p id={ids.pwHint} className="s-field-hint">
                8&nbsp;caractères au minimum.
              </p>
              <FieldError id={ids.pwErr} message={pwState.errors.password} />
            </div>
            <div className="field">
              <label htmlFor={ids.confirm}>Confirmation</label>
              <PasswordInput
                key={`confirm-${pwState.done}`}
                id={ids.confirm}
                name="confirmation"
                autoComplete="new-password"
                defaultValue=""
                invalid={Boolean(pwState.errors.confirmation)}
                describedBy={pwState.errors.confirmation ? ids.confirmErr : undefined}
              />
              <FieldError id={ids.confirmErr} message={pwState.errors.confirmation} />
            </div>
          </div>
          <div className="s-form-foot">
            <button type="submit" className="btn btn-soft s-btn-sm" disabled={pwPending}>
              {pwPending ? 'Enregistrement…' : 'Changer le mot de passe'}
            </button>
            <p className={`s-status${pwState.ok === false ? ' s-is-bad' : ''}`} role="status">
              {pwState.message ?? ''}
            </p>
          </div>
        </form>
      </div>

      <div className="s-sub">
        <h3>Session</h3>
        <div className="s-form-foot">
          <form action={seDeconnecter}>
            <input type="hidden" name="suite" value="/" />
            <button type="submit" className="btn btn-ghost s-btn-sm">
              <Icon name="logout" />
              Se déconnecter
            </button>
          </form>
          {canLeave ? (
            <ConfirmButton
              label={`Quitter ${orgName}`}
              question={'Quitter l’entreprise\u00a0? Vous perdrez l’accès à son garage.'}
              confirmLabel="Oui, quitter"
              onConfirm={() => leave.run()}
              pending={leave.pending}
              icon="logout"
            />
          ) : null}
        </div>
        {leave.result && !leave.result.ok ? (
          <p className="s-status s-is-bad" role="status">
            {leave.result.message}
          </p>
        ) : null}
      </div>
    </section>
  );
}

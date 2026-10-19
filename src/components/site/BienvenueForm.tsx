'use client';

import { useActionState, useId } from 'react';
import { creerEntreprise } from '@/app/[locale]/bienvenue/actions';
import { CANTONS } from './cantons';
import { Alert, FieldError } from './Form';
import type { BienvenueState } from './types';

const INITIAL: BienvenueState = { values: { nom: '', canton: '', demo: true }, errors: {}, message: null };

/** Création de l'entreprise : nom, canton, pelle de démonstration (cochée par défaut). */
export function BienvenueForm() {
  const [state, action, pending] = useActionState(creerEntreprise, INITIAL);
  const uid = useId();
  const ids = { nom: `${uid}-nom`, nomErr: `${uid}-nom-err`, canton: `${uid}-canton`, cantonErr: `${uid}-canton-err` };

  return (
    <form action={action} className="s-form" noValidate aria-busy={pending}>
      {state.message ? (
        <Alert tone="bad" live>
          <p>{state.message}</p>
        </Alert>
      ) : null}
      <div className="field">
        <label htmlFor={ids.nom}>Nom de l’entreprise</label>
        <input
          id={ids.nom}
          name="nom"
          type="text"
          autoComplete="organization"
          required
          minLength={2}
          maxLength={80}
          defaultValue={state.values.nom}
          aria-invalid={state.errors.nom ? true : undefined}
          aria-describedby={state.errors.nom ? ids.nomErr : undefined}
          disabled={pending}
        />
        <FieldError id={ids.nomErr} message={state.errors.nom} />
      </div>
      <div className="field">
        <label htmlFor={ids.canton}>Canton</label>
        {/* Une liste déroulante ne relit pas `defaultValue` quand React vide le formulaire après l'envoi : la clé la
            recrée avec le canton renvoyé par le serveur. */}
        <select
          key={state.values.canton}
          id={ids.canton}
          name="canton"
          defaultValue={state.values.canton}
          aria-invalid={state.errors.canton ? true : undefined}
          aria-describedby={state.errors.canton ? ids.cantonErr : undefined}
          disabled={pending}
        >
          <option value="">Choisir un canton (facultatif)</option>
          {CANTONS.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name} ({c.code})
            </option>
          ))}
        </select>
        <FieldError id={ids.cantonErr} message={state.errors.canton} />
      </div>
      <label className="s-check">
        <input type="checkbox" name="demo" defaultChecked={state.values.demo} disabled={pending} />
        <span>
          <b>Ajouter une pelle de démonstration avec un an de carnet</b>
          <span>Pour découvrir Godet sans rien saisir. Vous pourrez l’archiver.</span>
        </span>
      </label>
      <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
        {pending ? 'Ouverture du garage…' : 'Ouvrir mon garage'}
      </button>
    </form>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import { useActionState, useId, useState } from 'react';
import { creerEntreprise } from '@/app/[locale]/bienvenue/actions';
import { currencyFor, type Option } from './countries';
import { Alert, FieldError } from './Form';
import type { BienvenueState } from './types';

const INITIAL: BienvenueState = { values: { nom: '', country: 'CH', canton: '', demo: true }, errors: {}, message: null };

interface Props {
  /** Pays proposés (noms dans la langue de la page) : marchés principaux, puis tous les autres. */
  countries: { main: Option[]; others: Option[] };
  /** Cantons triés par nom dans la langue de la page. */
  cantons: Option[];
}

/** Création de l'entreprise : nom, pays (Suisse par défaut), canton en Suisse, pelle de démonstration (cochée). */
export function BienvenueForm({ countries, cantons }: Props) {
  const t = useTranslations('auth.welcome');
  const tc = useTranslations('common');
  const [state, action, pending] = useActionState(creerEntreprise, INITIAL);
  const [country, setCountry] = useState(INITIAL.values.country);
  const uid = useId();
  const ids = {
    nom: `${uid}-nom`,
    nomErr: `${uid}-nom-err`,
    country: `${uid}-pays`,
    countryErr: `${uid}-pays-err`,
    canton: `${uid}-canton`,
    cantonErr: `${uid}-canton-err`,
    currency: `${uid}-devise`,
  };
  const currency = currencyFor(country);

  return (
    <form action={action} className="s-form" noValidate aria-busy={pending}>
      {state.message ? (
        <Alert tone="bad" live>
          <p>{state.message}</p>
        </Alert>
      ) : null}
      <div className="field">
        <label htmlFor={ids.nom}>{t('orgName')}</label>
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
      <div className="s-form-row">
        <div className="field">
          <label htmlFor={ids.country}>{t('country')}</label>
          <select
            id={ids.country}
            name="pays"
            autoComplete="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            aria-invalid={state.errors.country ? true : undefined}
            aria-describedby={[ids.currency, state.errors.country ? ids.countryErr : ''].filter(Boolean).join(' ')}
            disabled={pending}
          >
            <optgroup label={t('countriesMain')}>
              {countries.main.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </optgroup>
            <optgroup label={t('countriesOther')}>
              {countries.others.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          </select>
          <FieldError id={ids.countryErr} message={state.errors.country} />
        </div>
        {country === 'CH' ? (
          <div className="field">
            <label htmlFor={ids.canton}>{t('canton')}</label>
            {/* Une liste déroulante ne relit pas `defaultValue` quand React vide le formulaire après l'envoi : la clé
                la recrée avec le canton renvoyé par le serveur. */}
            <select
              key={state.values.canton}
              id={ids.canton}
              name="canton"
              defaultValue={state.values.canton}
              aria-invalid={state.errors.canton ? true : undefined}
              aria-describedby={state.errors.canton ? ids.cantonErr : undefined}
              disabled={pending}
            >
              <option value="">{t('cantonPlaceholder')}</option>
              {cantons.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
            <FieldError id={ids.cantonErr} message={state.errors.canton} />
          </div>
        ) : null}
      </div>
      <div className="s-readonly s-currency" id={ids.currency} aria-live="polite">
        <span>{t('currency')}</span>
        <b>{tc(`currency.${currency}`)}</b>
        <small>{t('currencyHint', { currency })}</small>
      </div>
      <label className="s-check">
        <input type="checkbox" name="demo" defaultChecked={state.values.demo} disabled={pending} />
        <span>
          <b>{t('demoTitle')}</b>
          <span>{t('demoText')}</span>
        </span>
      </label>
      <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
        {pending ? t('pending') : t('submit')}
      </button>
    </form>
  );
}

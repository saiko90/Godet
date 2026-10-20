'use client';

import { useTranslations } from 'next-intl';
import { useActionState, useId, useState } from 'react';
import { Icon } from '@/components/Icons';
import { changerEntrepriseActive, enregistrerEntreprise } from '@/app/[locale]/parametres/actions';
import { useDomainText } from '@/lib/use-domain-text';
import type { MemberRole } from '@/lib/types';
import { CURRENCIES, currencyFor, type Option } from '../countries';
import { FieldError } from '../Form';
import { EMPTY_FORM } from '../types';
import { useServerAction } from './useServerAction';

interface Props {
  org: { id: string; name: string; country: string; canton: string | null; currency: string; trackLocation: boolean };
  /** « Essai gratuit jusqu’au 18.11.2026 », « Abonnement actif »… (calculé côté serveur). */
  planLabel: string;
  createdLabel: string;
  /** Nom du pays et du canton enregistrés, dans la langue de la page. */
  countryLabel: string | null;
  cantonLabel: string | null;
  canEdit: boolean;
  orgs: { id: string; name: string; role: MemberRole }[];
  countries: { main: Option[]; others: Option[] };
  cantons: Option[];
}

export function EntreprisePanel({ org, planLabel, createdLabel, countryLabel, cantonLabel, canEdit, orgs, countries, cantons }: Props) {
  const t = useTranslations('settings.company');
  const tc = useTranslations('common');
  const dt = useDomainText();
  const [state, action, pending] = useActionState(enregistrerEntreprise, EMPTY_FORM);
  const switcher = useServerAction(changerEntrepriseActive);
  const uid = useId();
  const ids = {
    title: `${uid}-titre`,
    nom: `${uid}-nom`,
    nomErr: `${uid}-nom-err`,
    country: `${uid}-pays`,
    countryErr: `${uid}-pays-err`,
    canton: `${uid}-canton`,
    cantonErr: `${uid}-canton-err`,
    currency: `${uid}-devise`,
    currencyErr: `${uid}-devise-err`,
    currencyHint: `${uid}-devise-aide`,
    position: `${uid}-position`,
    positionHint: `${uid}-position-aide`,
  };
  // React remet le formulaire à ses valeurs par défaut après chaque envoi : après un refus, on réaffiche la saisie ;
  // sinon, les valeurs enregistrées. Une liste déroulante ne relit pas `defaultValue` : la clé la recrée.
  const failed = state.ok === false && state.values ? state.values : null;
  const nomShown = failed ? (failed.nom ?? '') : org.name;
  const cantonShown = failed ? (failed.canton ?? '') : (org.canton ?? '');
  // Pays et devise suivis en direct : le canton n'apparaît que pour la Suisse, la devise suit le pays choisi.
  const [country, setCountry] = useState(org.country || 'CH');
  const [currency, setCurrency] = useState(org.currency || currencyFor(org.country));

  return (
    <section id="entreprise" className="s-panel" aria-labelledby={ids.title}>
      <div className="s-panel-head">
        <h2 id={ids.title}>
          <Icon name="garage" />
          {t('title')}
        </h2>
        <p>{canEdit ? t('editText') : t('readText')}</p>
      </div>

      <dl className="s-facts">
        <div>
          <dt>{t('plan')}</dt>
          <dd>{planLabel}</dd>
        </div>
        <div>
          <dt>{t('openedOn')}</dt>
          <dd>{createdLabel}</dd>
        </div>
        {!canEdit ? (
          <>
            <div>
              <dt>{t('name')}</dt>
              <dd>{org.name}</dd>
            </div>
            <div>
              <dt>{t('country')}</dt>
              <dd>{countryLabel ?? t('notSpecified')}</dd>
            </div>
            {org.country === 'CH' ? (
              <div>
                <dt>{t('canton')}</dt>
                <dd>{cantonLabel ?? t('notSpecified')}</dd>
              </div>
            ) : null}
            <div>
              <dt>{t('currency')}</dt>
              <dd>{org.currency}</dd>
            </div>
            <div>
              <dt>{t('position')}</dt>
              <dd>{org.trackLocation ? t('positionOn') : t('positionOff')}</dd>
            </div>
          </>
        ) : null}
      </dl>

      {canEdit ? (
        <form action={action} className="s-inline-form" noValidate>
          <div className="s-row">
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
                defaultValue={nomShown}
                aria-invalid={state.errors.nom ? true : undefined}
                aria-describedby={state.errors.nom ? ids.nomErr : undefined}
              />
              <FieldError id={ids.nomErr} message={state.errors.nom} />
            </div>
            <div className="field">
              <label htmlFor={ids.country}>{t('country')}</label>
              <select
                id={ids.country}
                name="pays"
                autoComplete="country"
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setCurrency(currencyFor(e.target.value));
                }}
                aria-invalid={state.errors.pays ? true : undefined}
                aria-describedby={state.errors.pays ? ids.countryErr : undefined}
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
              <FieldError id={ids.countryErr} message={state.errors.pays} />
            </div>
          </div>
          <div className="s-row">
            {country === 'CH' ? (
              <div className="field">
                <label htmlFor={ids.canton}>{t('canton')}</label>
                <select
                  key={cantonShown}
                  id={ids.canton}
                  name="canton"
                  defaultValue={cantonShown}
                  aria-invalid={state.errors.canton ? true : undefined}
                  aria-describedby={state.errors.canton ? ids.cantonErr : undefined}
                >
                  <option value="">{t('notSpecified')}</option>
                  {cantons.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <FieldError id={ids.cantonErr} message={state.errors.canton} />
              </div>
            ) : null}
            <div className="field">
              <label htmlFor={ids.currency}>{t('currency')}</label>
              <select
                id={ids.currency}
                name="devise"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                aria-invalid={state.errors.devise ? true : undefined}
                aria-describedby={[ids.currencyHint, state.errors.devise ? ids.currencyErr : ''].filter(Boolean).join(' ')}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {tc(`currency.${c}`)}
                  </option>
                ))}
              </select>
              <p id={ids.currencyHint} className="s-field-hint">
                {t('currencyHint')}
              </p>
              <FieldError id={ids.currencyErr} message={state.errors.devise} />
            </div>
          </div>
          <div className="s-check">
            <input id={ids.position} name="position" type="checkbox" value="1" defaultChecked={org.trackLocation} aria-describedby={ids.positionHint} />
            <label htmlFor={ids.position}>{t('positionLabel')}</label>
            <p id={ids.positionHint} className="s-field-hint">
              {t('positionHint')}
            </p>
          </div>
          <div className="s-form-foot">
            <button type="submit" className="btn btn-primary s-btn-sm" disabled={pending}>
              {pending ? t('saving') : t('save')}
            </button>
            <p className={`s-status${state.ok === false ? ' s-is-bad' : ''}`} role="status">
              {state.message ?? ''}
            </p>
          </div>
        </form>
      ) : null}

      {orgs.length > 1 ? (
        <div className="s-sub">
          <h3>{t('yourCompanies')}</h3>
          <ul className="s-orgs">
            {orgs.map((o) => {
              const active = o.id === org.id;
              return (
                <li key={o.id} className="s-org" aria-current={active ? 'true' : undefined}>
                  <div className="s-org-main">
                    <b>{o.name}</b>
                    <span>{dt.role(o.role)}</span>
                  </div>
                  {active ? (
                    <span className="pill">{t('active')}</span>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-soft s-btn-sm"
                      onClick={() => switcher.run(o.id)}
                      disabled={switcher.pending}
                    >
                      {t('switch')}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          <p className={`s-status${switcher.result && !switcher.result.ok ? ' s-is-bad' : ''}`} role="status">
            {switcher.pending ? t('switching') : (switcher.result?.message ?? '')}
          </p>
        </div>
      ) : null}
    </section>
  );
}

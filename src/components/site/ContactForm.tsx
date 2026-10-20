'use client';

import { useTranslations } from 'next-intl';
import { useActionState, useEffect, useId, useRef, useState } from 'react';
import { Icon } from '@/components/Icons';
import { envoyerContact } from '@/app/[locale]/contact/actions';
import { Link } from '@/i18n/navigation';
import type { Option } from './countries';
import { Alert, FieldError } from './Form';
import { EMPTY_PUBLIC_FORM } from './types';

const SUBJECTS = ['demo', 'contact', 'partenaire', 'support'] as const;
const FLEET_SIZES = ['1-5', '6-20', '21-50', '50+'] as const;
const FIELD_ORDER = ['email', 'message'] as const;

export interface ContactInitial {
  sujet: (typeof SUBJECTS)[number];
  nom: string;
  email: string;
  entreprise: string;
  pays: string;
}

interface Props {
  initial: ContactInitial;
  /** Code de suivi d'un lien d'agent (adresse ou cookie), joint à l'origine du message. */
  refCode: string | null;
  countries: { main: Option[]; others: Option[] };
}

/** Formulaire de contact : sujet, coordonnées, pays, taille du parc, message, consentement, piège à robots. */
export function ContactForm({ initial, refCode, countries }: Props) {
  const t = useTranslations('contact');
  const [state, action, pending] = useActionState(envoyerContact, EMPTY_PUBLIC_FORM);
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
        <p>{t.rich('sent.text', { email: state.values.email ?? '', b: (chunks) => <b>{chunks}</b> })}</p>
        <div className="s-form-foot">
          <button type="button" className="btn btn-soft" onClick={() => setSeen(state.sent)}>
            {t('sent.again')}
          </button>
          <Link href="/" className="btn btn-ghost">
            {t('sent.home')}
          </Link>
        </div>
      </div>
    );
  }

  // Après un refus, la saisie est réaffichée (React vide le formulaire après l'envoi).
  const v: Record<string, string> = state.status === 'error' ? state.values : { ...initial };
  const value = (key: string) => v[key] ?? '';
  const err = (key: string) => state.errors[key];
  const described = (key: string, hint?: string) => [hint, err(key) ? id(`${key}-err`) : ''].filter(Boolean).join(' ') || undefined;
  const required = <span className="s-req">{t('form.required')}</span>;

  return (
    <form key={round} action={action} className="s-form s-public-form" noValidate aria-busy={pending}>
      <p className="s-field-hint">{t('form.requiredNote')}</p>
      {state.status === 'error' && state.message ? (
        <Alert tone="bad" live>
          <p>{state.message}</p>
        </Alert>
      ) : null}

      <div className="field">
        <label htmlFor={id('sujet')}>{t('form.subject')}</label>
        <select id={id('sujet')} name="sujet" defaultValue={value('sujet')} disabled={pending}>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {t(`form.subjects.${s}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="s-form-row">
        <div className="field">
          <label htmlFor={id('nom')}>{t('form.name')}</label>
          <input id={id('nom')} name="nom" type="text" autoComplete="name" maxLength={120} defaultValue={value('nom')} disabled={pending} />
        </div>
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
            aria-describedby={described('email')}
            disabled={pending}
          />
          <FieldError id={id('email-err')} message={err('email')} />
        </div>
      </div>

      <div className="s-form-row">
        <div className="field">
          <label htmlFor={id('entreprise')}>{t('form.company')}</label>
          <input
            id={id('entreprise')}
            name="entreprise"
            type="text"
            autoComplete="organization"
            maxLength={120}
            defaultValue={value('entreprise')}
            disabled={pending}
          />
        </div>
        <div className="field">
          <label htmlFor={id('telephone')}>{t('form.phone')}</label>
          <input
            id={id('telephone')}
            name="telephone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={40}
            defaultValue={value('telephone')}
            disabled={pending}
          />
        </div>
      </div>

      <div className="s-form-row">
        <div className="field">
          <label htmlFor={id('pays')}>{t('form.country')}</label>
          <select id={id('pays')} name="pays" autoComplete="country" defaultValue={value('pays')} disabled={pending}>
            <option value="">{t('form.notSpecified')}</option>
            <optgroup label={t('form.countriesMain')}>
              {countries.main.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </optgroup>
            <optgroup label={t('form.countriesOther')}>
              {countries.others.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
        <div className="field">
          <label htmlFor={id('parc')}>{t('form.fleet')}</label>
          <select id={id('parc')} name="parc" defaultValue={value('parc')} disabled={pending}>
            <option value="">{t('form.notSpecified')}</option>
            {FLEET_SIZES.map((s) => (
              <option key={s} value={s}>
                {t(`form.fleetSizes.${s}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor={id('message')}>
          {t('form.message')} {required}
        </label>
        <textarea
          id={id('message')}
          name="message"
          required
          rows={6}
          maxLength={4000}
          defaultValue={value('message')}
          aria-invalid={err('message') ? true : undefined}
          aria-describedby={described('message', id('message-hint'))}
          disabled={pending}
        />
        <p id={id('message-hint')} className="s-field-hint">
          {t('form.messageHint')}
        </p>
        <FieldError id={id('message-err')} message={err('message')} />
      </div>

      <label className="s-check">
        <input type="checkbox" name="consentement" defaultChecked={v.consentement === 'on'} disabled={pending} />
        <span>
          <span>{t('form.consent')}</span>
        </span>
      </label>

      {/* Piège à robots : invisible pour les personnes (et les lecteurs d'écran), rempli par les robots. */}
      <div className="s-hp" aria-hidden="true">
        <label htmlFor={id('website')}>{t('form.trap')}</label>
        <input id={id('website')} name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      {refCode ? <input type="hidden" name="ref" value={refCode} /> : null}

      <button type="submit" className="btn btn-primary btn-block" disabled={pending} aria-busy={pending}>
        <Icon name="mail" />
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

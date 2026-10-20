'use client';

import { useTranslations } from 'next-intl';
import { useId, useRef, type FormEvent } from 'react';
import { useFormat } from '@/components/FormatProvider';
import { Icon } from '@/components/Icons';
import { Loader } from '@/components/Loader';
import { FREQUENCIES, type FieldErrors, type PrefsValues } from './prefs';
import type { PrefsLoad, SaveStatus } from './useNotificationPrefs';

export interface NotificationsFormProps {
  load: PrefsLoad;
  values: PrefsValues;
  errors: FieldErrors;
  status: SaveStatus;
  dirty: boolean;
  onChange: (patch: Partial<PrefsValues>) => void;
  /** Enregistre ; renvoie les champs en erreur (le focus va au premier). */
  onSave: () => Promise<FieldErrors>;
  onRetry: () => void;
}

/** Formulaire des rappels par e-mail (présentation seule : les données viennent de useNotificationPrefs). */
export function NotificationsForm({ load, values, errors, status, dirty, onChange, onSave, onRetry }: NotificationsFormProps) {
  const t = useTranslations('notifications');
  const f = useFormat();
  const uid = useId();
  const daysRef = useRef<HTMLInputElement>(null);
  const hoursRef = useRef<HTMLInputElement>(null);
  const ids = {
    enabled: `${uid}-actif`,
    enabledHint: `${uid}-actif-aide`,
    frequency: `${uid}-frequence`,
    leadHint: `${uid}-anticipation`,
    days: `${uid}-jours`,
    daysUnit: `${uid}-jours-unite`,
    daysHint: `${uid}-jours-aide`,
    daysError: `${uid}-jours-erreur`,
    hours: `${uid}-heures`,
    hoursUnit: `${uid}-heures-unite`,
    hoursHint: `${uid}-heures-aide`,
    hoursError: `${uid}-heures-erreur`,
  };

  if (load.status === 'loading') {
    return (
      <div className="n-root" aria-busy="true">
        <Loader overlay={false} label={t('loading')} />
      </div>
    );
  }
  if (load.status === 'error') {
    return (
      <div className="n-root">
        <div className="n-alert" role="alert">
          <Icon name="alert" />
          <div>
            <p>{t('loadError')}</p>
            <button type="button" className="btn btn-soft n-btn" onClick={onRetry}>
              {t('retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (load.status === 'signedOut') {
    return (
      <div className="n-root">
        <p className="n-signed-out">{t('signedOut')}</p>
      </div>
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status.kind === 'saving') return;
    const invalid = await onSave();
    if (invalid.leadDays) daysRef.current?.focus();
    else if (invalid.leadHours) hoursRef.current?.focus();
  }

  const leadDisabled = !values.enabled || values.frequency === 'jamais';
  const statusText =
    status.kind === 'saving'
      ? t('saving')
      : status.kind === 'saved'
        ? t('saved')
        : status.kind === 'error'
          ? t(`errors.${status.reason}`)
          : dirty
            ? t('unsaved')
            : '';
  const statusClass = status.kind === 'saved' ? ' is-ok' : status.kind === 'error' ? ' is-bad' : '';
  const describe = (...list: (string | false)[]) => list.filter(Boolean).join(' ') || undefined;

  return (
    <form className="n-root" onSubmit={submit} noValidate>
      <label className="n-switch" htmlFor={ids.enabled}>
        <span className="n-switch-text">
          <b>{t('enabled.label')}</b>
          <span id={ids.enabledHint}>{t('enabled.hint')}</span>
        </span>
        <input
          id={ids.enabled}
          type="checkbox"
          role="switch"
          checked={values.enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
          aria-describedby={ids.enabledHint}
        />
      </label>

      {load.operatorSomewhere && !load.hasRow ? (
        <p className="n-note">
          <Icon name="users" />
          <span>{t('operator', { operatorOnly: load.operatorOnly ? 'true' : 'false' })}</span>
        </p>
      ) : null}

      <fieldset className="n-fieldset" disabled={!values.enabled}>
        <legend>{t('frequency.legend')}</legend>
        <div className="n-options">
          {FREQUENCIES.map((fq) => (
            <label key={fq} className="n-option">
              <input
                type="radio"
                name={ids.frequency}
                value={fq}
                checked={values.frequency === fq}
                onChange={() => onChange({ frequency: fq })}
                aria-describedby={`${ids.frequency}-${fq}`}
              />
              <span className="n-option-text">
                <b>{t(`frequency.${fq}.label`)}</b>
                <span id={`${ids.frequency}-${fq}`}>{t(`frequency.${fq}.hint`)}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="n-fieldset" disabled={leadDisabled} aria-describedby={ids.leadHint}>
        <legend>{t('lead.legend')}</legend>
        <p className="n-lead-intro" id={ids.leadHint}>
          {t('lead.hint')}
        </p>
        <div className="n-leads">
          <div className="field n-lead">
            <label htmlFor={ids.days}>{t('lead.days.label')}</label>
            <div className="n-amount">
              <input
                ref={daysRef}
                id={ids.days}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={4}
                value={values.leadDays}
                onChange={(e) => onChange({ leadDays: e.target.value })}
                aria-invalid={errors.leadDays ? true : undefined}
                aria-describedby={describe(ids.daysUnit, ids.daysHint, Boolean(errors.leadDays) && ids.daysError)}
              />
              <span id={ids.daysUnit}>{t('lead.days.unit')}</span>
            </div>
            <p className="n-hint" id={ids.daysHint}>
              {t('lead.days.hint')}
            </p>
            {errors.leadDays ? (
              <p className="n-error" id={ids.daysError}>
                <Icon name="alert" />
                <span>{t('lead.days.error')}</span>
              </p>
            ) : null}
          </div>
          <div className="field n-lead">
            <label htmlFor={ids.hours}>{t('lead.hours.label')}</label>
            <div className="n-amount">
              <input
                ref={hoursRef}
                id={ids.hours}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={5}
                value={values.leadHours}
                onChange={(e) => onChange({ leadHours: e.target.value })}
                aria-invalid={errors.leadHours ? true : undefined}
                aria-describedby={describe(ids.hoursUnit, ids.hoursHint, Boolean(errors.leadHours) && ids.hoursError)}
              />
              <span id={ids.hoursUnit}>{t('lead.hours.unit')}</span>
            </div>
            <p className="n-hint" id={ids.hoursHint}>
              {t('lead.hours.hint')}
            </p>
            {errors.leadHours ? (
              <p className="n-error" id={ids.hoursError}>
                <Icon name="alert" />
                <span>{t('lead.hours.error')}</span>
              </p>
            ) : null}
          </div>
        </div>
      </fieldset>

      <div className="n-foot">
        <button type="submit" className="btn btn-primary n-btn" disabled={status.kind === 'saving'}>
          <Icon name="check" />
          {status.kind === 'saving' ? t('saving') : t('save')}
        </button>
        <p className={`n-status${statusClass}`} role="status" aria-live="polite">
          {statusText}
        </p>
      </div>

      <p className="n-last">
        <Icon name="mail" />
        <span>{load.lastSentAt ? t('lastSent', { date: f.date(load.lastSentAt) }) : t('neverSent')}</span>
      </p>
    </form>
  );
}

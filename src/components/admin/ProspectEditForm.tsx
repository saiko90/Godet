'use client';

import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { saveProspectDetails } from '@/app/[locale]/admin/actions';
import { Icon } from '@/components/Icons';
import { CHANNELS, COUNTRY_KEYS, FLEET_SIZES, isOneOf, LIMITS, LOCALES, MARKETS, SEGMENTS, type ProspectDetailsInput } from './types';
import { ResultNote } from './ui';
import { useAdminAction } from './useAdminAction';

type Key = keyof ProspectDetailsInput;

/** Correction des coordonnées d'un prospect (avant d'imprimer une lettre, par exemple). */
export function ProspectEditForm({ id, initial }: { id: string; initial: ProspectDetailsInput }) {
  const t = useTranslations('admin');
  const tc = useTranslations('common');
  const uid = useId();
  const [v, setV] = useState<ProspectDetailsInput>(initial);
  const action = useAdminAction();
  const set = (k: Key) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setV((prev) => ({ ...prev, [k]: e.target.value }));
  const err = action.result && !action.result.ok ? action.result.field : undefined;
  const countries: string[] = [...MARKETS];
  if (v.country && !countries.includes(v.country)) countries.push(v.country);

  const text = (k: Key, max: number, opts: { type?: string; autoComplete?: string; span?: boolean } = {}) => (
    <div className={`field${opts.span ? ' adm-span2' : ''}`} data-error={err === k ? 'true' : undefined}>
      <label htmlFor={`${uid}-${k}`}>{t(`fields.${k}`)}</label>
      <input
        id={`${uid}-${k}`}
        type={opts.type ?? 'text'}
        value={v[k]}
        maxLength={max}
        autoComplete={opts.autoComplete ?? 'off'}
        onChange={set(k)}
        aria-invalid={err === k ? true : undefined}
      />
    </div>
  );

  return (
    <form
      className="adm-form"
      onSubmit={(e) => {
        e.preventDefault();
        action.run(() => saveProspectDetails(id, v));
      }}
    >
      <div className="adm-grid3">
        {text('company', LIMITS.company, { span: true })}
        {text('legalId', LIMITS.legalId)}
        <div className="field" data-error={err === 'country' ? 'true' : undefined}>
          <label htmlFor={`${uid}-country`}>{t('fields.country')}</label>
          <select id={`${uid}-country`} value={v.country} onChange={set('country')}>
            {countries.map((c) => (
              <option key={c} value={c}>
                {isOneOf(COUNTRY_KEYS, c) ? tc(`countries.${c}`) : c}
              </option>
            ))}
          </select>
        </div>
        {text('region', LIMITS.region)}
        <div className="field" data-error={err === 'locale' ? 'true' : undefined}>
          <label htmlFor={`${uid}-locale`}>{t('fields.locale')}</label>
          <select id={`${uid}-locale`} value={v.locale} onChange={set('locale')}>
            <option value="">{t('fields.localeAuto')}</option>
            {LOCALES.map((l) => (
              <option key={l} value={l}>
                {t(`locale.${l}`)}
              </option>
            ))}
          </select>
        </div>
        {text('address', LIMITS.address, { span: true, autoComplete: 'off' })}
        {text('postalCode', LIMITS.postalCode)}
        {text('city', LIMITS.city)}
        {text('phone', LIMITS.phone, { type: 'tel' })}
        {text('email', LIMITS.email, { type: 'email' })}
        {text('website', LIMITS.website, { span: true })}
        <div className="field" data-error={err === 'segment' ? 'true' : undefined}>
          <label htmlFor={`${uid}-segment`}>{t('fields.segment')}</label>
          <select id={`${uid}-segment`} value={v.segment} onChange={set('segment')}>
            {SEGMENTS.map((s) => (
              <option key={s} value={s}>
                {t(`segment.${s}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="field" data-error={err === 'fleet' ? 'true' : undefined}>
          <label htmlFor={`${uid}-fleet`}>{t('fields.fleet')}</label>
          <select id={`${uid}-fleet`} value={v.fleet} onChange={set('fleet')}>
            <option value="">{t('fields.unknown')}</option>
            {FLEET_SIZES.map((f) => (
              <option key={f} value={f}>
                {t(`fleet.${f}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="field" data-error={err === 'channel' ? 'true' : undefined}>
          <label htmlFor={`${uid}-channel`}>{t('fields.channel')}</label>
          <select id={`${uid}-channel`} value={v.channel} onChange={set('channel')}>
            <option value="">{t('fields.unknown')}</option>
            {CHANNELS.map((c) => (
              <option key={c} value={c}>
                {t(`channel.${c}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="field adm-span2" data-error={err === 'signals' ? 'true' : undefined}>
          <label htmlFor={`${uid}-signals`}>{t('fields.signals')}</label>
          <textarea id={`${uid}-signals`} rows={3} value={v.signals} maxLength={LIMITS.signals} onChange={set('signals')} />
        </div>
        {text('source', LIMITS.source)}
      </div>
      <div className="adm-row is-end">
        <ResultNote result={action.result} message={action.message} />
        <button type="submit" className="btn btn-primary adm-btn-sm" disabled={action.pending}>
          <Icon name="check" />
          {action.pending ? t('common.saving') : t('common.save')}
        </button>
      </div>
    </form>
  );
}

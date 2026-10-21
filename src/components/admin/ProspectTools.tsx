'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { createDraft, createProspect, createRefCode, deleteProspect, eraseProspect } from '@/app/[locale]/admin/actions';
import { Icon } from '@/components/Icons';
import { useRouter } from '@/i18n/navigation';
import { channelRule, CHANNELS, COUNTRY_KEYS, isOneOf, LIMITS, MARKETS, SEGMENTS, type Channel } from './types';
import { ConfirmButton, ResultNote } from './ui';
import { useAdminAction } from './useAdminAction';

/** Nouveau message écrit à la main (relance, réponse…), enregistré comme brouillon à l'étape suivante. */
export function NewDraftForm({
  prospectId,
  country,
  defaultChannel,
  disabled,
}: {
  prospectId: string;
  country: string;
  defaultChannel: Channel;
  disabled: boolean;
}) {
  const t = useTranslations('admin');
  const uid = useId();
  const action = useAdminAction();
  const [channel, setChannel] = useState<Channel>(defaultChannel);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const rule = channelRule(country, channel);

  return (
    <form
      className="adm-form"
      onSubmit={(e) => {
        e.preventDefault();
        action.run(
          () => createDraft(prospectId, channel, subject, body),
          (r) => {
            if (r.ok) {
              setSubject('');
              setBody('');
            }
          },
        );
      }}
    >
      <div className="adm-grid3">
        <div className="field">
          <label htmlFor={`${uid}-c`}>{t('fields.channel')}</label>
          <select id={`${uid}-c`} value={channel} onChange={(e) => setChannel(e.target.value as Channel)} disabled={disabled}>
            {CHANNELS.map((c) => (
              <option key={c} value={c}>
                {t(`channel.${c}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="field adm-span2">
          <label htmlFor={`${uid}-s`}>{t('outreach.subject')}</label>
          <input id={`${uid}-s`} value={subject} maxLength={LIMITS.subject} onChange={(e) => setSubject(e.target.value)} disabled={disabled} />
        </div>
      </div>
      {rule ? (
        <p className={`adm-alert ${rule.level === 'no' ? 'is-bad' : 'is-warn'}`}>
          <Icon name="alert" />
          <span>{t(rule.key)}</span>
        </p>
      ) : null}
      <div className="field">
        <label htmlFor={`${uid}-b`}>{t('outreach.body')}</label>
        <textarea
          id={`${uid}-b`}
          className="adm-tall"
          value={body}
          maxLength={LIMITS.body}
          onChange={(e) => setBody(e.target.value)}
          disabled={disabled}
          aria-describedby={`${uid}-h`}
        />
        <small id={`${uid}-h`}>{t('outreach.newHint')}</small>
      </div>
      <div className="adm-row is-end">
        <ResultNote result={action.result} message={action.message} />
        <button type="submit" className="btn btn-primary adm-btn-sm" disabled={disabled || action.pending || !body.trim()}>
          <Icon name="plus" />
          {action.pending ? t('common.saving') : t('outreach.addDraft')}
        </button>
      </div>
    </form>
  );
}

/** Attribue un code de suivi au prospect (liens de démo personnalisés). */
export function RefCodeButton({ prospectId }: { prospectId: string }) {
  const t = useTranslations('admin');
  const action = useAdminAction();
  return (
    <div className="adm-row">
      <button type="button" className="btn btn-soft adm-btn-sm" disabled={action.pending} onClick={() => action.run(() => createRefCode(prospectId))}>
        <Icon name="link" />
        {action.pending ? t('common.working') : t('prospect.createRef')}
      </button>
      <ResultNote result={action.result} message={action.message} />
    </div>
  );
}

/** Données personnelles : effacement sur demande (en gardant l'opposition) ou suppression complète. */
export function DataControls({ prospectId, erased }: { prospectId: string; erased: boolean }) {
  const t = useTranslations('admin');
  const locale = useLocale();
  const router = useRouter();
  const action = useAdminAction();
  return (
    <div className="adm-form">
      <p className="adm-hint">{t('prospect.dataHint')}</p>
      <div className="adm-row">
        <ConfirmButton
          label={t('prospect.erase')}
          question={t('prospect.eraseQuestion')}
          confirmLabel={t('prospect.eraseConfirm')}
          icon="shield"
          pending={action.pending}
          disabled={erased}
          onConfirm={() => action.run(() => eraseProspect(prospectId))}
        />
        <ConfirmButton
          label={t('prospect.delete')}
          question={t('prospect.deleteQuestion')}
          confirmLabel={t('prospect.deleteConfirm')}
          pending={action.pending}
          onConfirm={() =>
            action.run(
              () => deleteProspect(prospectId, locale),
              (r) => {
                if (r.ok) router.replace('/admin/prospects');
              },
            )
          }
        />
      </div>
      <ResultNote result={action.result} message={action.message} />
    </div>
  );
}

/** Ajout manuel d'un prospect (recommandation, salon…) : la fiche est créée avec son code de suivi, puis ouverte. */
export function NewProspectForm() {
  const t = useTranslations('admin');
  const tc = useTranslations('common');
  const uid = useId();
  const router = useRouter();
  const action = useAdminAction();
  const [open, setOpen] = useState(false);
  const [v, setV] = useState({ company: '', country: 'CH', segment: 'terrassement', email: '', website: '', postalCode: '', city: '', source: '' });
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((cur) => ({ ...cur, [k]: e.target.value }));

  if (!open) {
    return (
      <button type="button" className="btn btn-primary adm-btn-sm" onClick={() => setOpen(true)}>
        <Icon name="plus" />
        {t('prospects.new.open')}
      </button>
    );
  }

  return (
    <form
      className="adm-card adm-form"
      aria-labelledby={`${uid}-t`}
      onSubmit={(e) => {
        e.preventDefault();
        action.run(
          () => createProspect(v),
          (r) => {
            if (r.ok && r.id) router.push(`/admin/prospects/${r.id}`);
          },
        );
      }}
    >
      <h2 id={`${uid}-t`} className="adm-step-label">
        {t('prospects.new.open')}
      </h2>
      <p className="adm-hint">{t('prospects.new.lead')}</p>
      <div className="adm-grid3">
        <div className="field adm-span2">
          <label htmlFor={`${uid}-co`}>{t('fields.company')}</label>
          <input id={`${uid}-co`} value={v.company} maxLength={LIMITS.company} required autoFocus onChange={set('company')} />
        </div>
        <div className="field">
          <label htmlFor={`${uid}-cy`}>{t('fields.country')}</label>
          <select id={`${uid}-cy`} value={v.country} onChange={set('country')}>
            {MARKETS.map((c) => (
              <option key={c} value={c}>
                {isOneOf(COUNTRY_KEYS, c) ? tc(`countries.${c}`) : c}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${uid}-sg`}>{t('fields.segment')}</label>
          <select id={`${uid}-sg`} value={v.segment} onChange={set('segment')}>
            {SEGMENTS.map((s) => (
              <option key={s} value={s}>
                {t(`segment.${s}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${uid}-em`}>{t('fields.email')}</label>
          <input id={`${uid}-em`} type="email" value={v.email} maxLength={LIMITS.email} onChange={set('email')} />
        </div>
        <div className="field">
          <label htmlFor={`${uid}-ws`}>{t('fields.website')}</label>
          <input id={`${uid}-ws`} value={v.website} maxLength={LIMITS.website} onChange={set('website')} />
        </div>
        <div className="field">
          <label htmlFor={`${uid}-pc`}>{t('fields.postalCode')}</label>
          <input id={`${uid}-pc`} value={v.postalCode} maxLength={LIMITS.postalCode} onChange={set('postalCode')} />
        </div>
        <div className="field adm-span2">
          <label htmlFor={`${uid}-ci`}>{t('fields.city')}</label>
          <input id={`${uid}-ci`} value={v.city} maxLength={LIMITS.city} onChange={set('city')} />
        </div>
        <div className="field adm-span2">
          <label htmlFor={`${uid}-so`}>{t('fields.source')}</label>
          <input id={`${uid}-so`} value={v.source} maxLength={LIMITS.source} placeholder={t('prospects.new.sourcePlaceholder')} onChange={set('source')} />
        </div>
      </div>
      <div className="adm-row is-end">
        <ResultNote result={action.result} message={action.message} />
        <button type="button" className="btn btn-ghost adm-btn-sm" onClick={() => setOpen(false)}>
          {t('prospects.new.close')}
        </button>
        <button type="submit" className="btn btn-primary adm-btn-sm" disabled={action.pending || v.company.trim().length < 2}>
          <Icon name="check" />
          {action.pending ? t('prospects.new.creating') : t('prospects.new.create')}
        </button>
      </div>
    </form>
  );
}

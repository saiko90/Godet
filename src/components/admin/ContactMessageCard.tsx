'use client';

import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { saveContactMessage } from '@/app/[locale]/admin/actions';
import { Icon } from '@/components/Icons';
import { Link } from '@/i18n/navigation';
import {
  CONTACT_KINDS,
  CONTACT_STATUSES,
  CONTACT_TONE,
  COUNTRY_KEYS,
  isOneOf,
  LIMITS,
  LOCALES,
  pillClass,
  type ContactStatus,
} from './types';
import { ResultNote } from './ui';
import { useAdminAction } from './useAdminAction';

export interface ContactMessageView {
  id: string;
  /** Objet de la réponse par e-mail, dans la langue de la personne qui a écrit. */
  replySubject: string;
  kind: string;
  name: string | null;
  email: string;
  company: string | null;
  phone: string | null;
  country: string | null;
  locale: string | null;
  fleet: string | null;
  message: string;
  source: string | null;
  consent: boolean;
  status: ContactStatus;
  note: string | null;
  createdLabel: string;
  prospect: { id: string; company: string } | null;
}

/** Un message reçu par le formulaire de contact : lecture, statut et note interne. */
export function ContactMessageCard({ m }: { m: ContactMessageView }) {
  const t = useTranslations('admin');
  const tc = useTranslations('common');
  const id = useId();
  const [status, setStatus] = useState<ContactStatus>(m.status);
  const [note, setNote] = useState(m.note ?? '');
  const action = useAdminAction();
  const dirty = status !== m.status || note.trim() !== (m.note ?? '').trim();
  const kindLabel = isOneOf(CONTACT_KINDS, m.kind) ? t(`contactKind.${m.kind}`) : m.kind;
  const subject = m.replySubject || t('messages.replySubject');

  return (
    <article className={`adm-card${m.status === 'nouveau' ? ' is-new' : ''}`} aria-labelledby={`${id}-t`}>
      <div className="adm-card-head">
        <div className="adm-card-title">
          <span className="pill muted">{kindLabel}</span>
          <span className={pillClass(CONTACT_TONE[m.status])}>{t(`status.contact.${m.status}`)}</span>
          <h2 id={`${id}-t`}>
            {m.name || m.email}
            {m.company ? <span className="adm-dim"> · {m.company}</span> : null}
          </h2>
        </div>
        <span className="muted">{m.createdLabel}</span>
      </div>

      <ul className="adm-meta">
        <li>
          <a className="adm-link" href={`mailto:${m.email}?subject=${encodeURIComponent(subject)}`}>
            {m.email}
          </a>
        </li>
        {m.phone ? (
          <li>
            <a className="adm-link" href={`tel:${m.phone.replace(/[^\d+]/g, '')}`}>
              {m.phone}
            </a>
          </li>
        ) : null}
        {m.country ? <li>{isOneOf(COUNTRY_KEYS, m.country) ? tc(`countries.${m.country}`) : m.country}</li> : null}
        {isOneOf(LOCALES, m.locale) ? <li>{t(`locale.${m.locale}`)}</li> : null}
        {m.fleet ? (
          <li>
            {t('messages.fleet')} <b>{m.fleet}</b>
          </li>
        ) : null}
        <li>{m.consent ? t('messages.consentYes') : t('messages.consentNo')}</li>
        {m.source ? (
          <li>
            {t('messages.source')} <b>{m.source}</b>
          </li>
        ) : null}
        {m.prospect ? (
          <li>
            <Link className="adm-link" href={`/admin/prospects/${m.prospect.id}`}>
              {t('messages.prospect', { company: m.prospect.company })}
            </Link>
          </li>
        ) : null}
      </ul>

      <p className="adm-text">{m.message}</p>

      <form
        className="adm-form"
        onSubmit={(e) => {
          e.preventDefault();
          action.run(() => saveContactMessage(m.id, status, note));
        }}
      >
        <div className="adm-grid3">
          <div className="field">
            <label htmlFor={`${id}-s`}>{t('messages.statusLabel')}</label>
            <select id={`${id}-s`} value={status} onChange={(e) => setStatus(e.target.value as ContactStatus)}>
              {CONTACT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`status.contact.${s}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="field adm-span2">
            <label htmlFor={`${id}-n`}>{t('messages.noteLabel')}</label>
            <textarea
              id={`${id}-n`}
              value={note}
              maxLength={LIMITS.contactNote}
              rows={2}
              onChange={(e) => setNote(e.target.value)}
              aria-describedby={`${id}-h`}
            />
            <small id={`${id}-h`}>{t('messages.noteHint')}</small>
          </div>
        </div>
        <div className="adm-row is-end">
          <ResultNote result={action.result} message={action.message} />
          <a className="btn btn-soft adm-btn-sm" href={`mailto:${m.email}?subject=${encodeURIComponent(subject)}`}>
            <Icon name="mail" />
            {t('messages.reply')}
          </a>
          <button type="submit" className="btn btn-primary adm-btn-sm" disabled={action.pending || !dirty}>
            <Icon name="check" />
            {action.pending ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </form>
    </article>
  );
}

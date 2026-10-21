'use client';

import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { cancelDraft, markReply, markSent, reopenDraft, saveDraft, sendByEmail, validateDraft } from '@/app/[locale]/admin/actions';
import { Icon } from '@/components/Icons';
import { Link } from '@/i18n/navigation';
import { CHANNELS, channelRule, hasPlaceholder, isOneOf, LIMITS, OUTREACH_TONE, pillClass, type OutreachStatus } from './types';
import { ConfirmButton, CopyButton, ResultNote } from './ui';
import { useAdminAction } from './useAdminAction';

export interface OutreachView {
  id: string;
  step: number;
  channel: string;
  locale: string;
  subject: string | null;
  body: string;
  status: OutreachStatus;
  createdLabel: string;
  approvedLabel: string | null;
  sentLabel: string | null;
}

/**
 * Un message préparé (par un agent ou à la main). On valide le texte, puis on l'envoie : « Envoyer par e-mail » (pays où
 * c'est permis, adresse de l'entreprise connue ; l'envoi est enregistré tout seul), ou soi-même (lettre imprimée, appel,
 * LinkedIn) puis « Marquer comme envoyé ».
 */
export function OutreachCard({
  o,
  prospectId,
  country,
  blocked,
  email,
  emailAllowed,
}: {
  o: OutreachView;
  prospectId: string;
  country: string;
  blocked: boolean;
  /** Adresse e-mail de l'entreprise (fiche du prospect). */
  email: string | null;
  /** L'e-mail de prospection est-il permis dans ce pays (CH, FR) ? */
  emailAllowed: boolean;
}) {
  const t = useTranslations('admin');
  const uid = useId();
  const action = useAdminAction();
  const [editing, setEditing] = useState(false);
  const [subject, setSubject] = useState(o.subject ?? '');
  const [body, setBody] = useState(o.body);
  const rule = channelRule(country, o.channel);
  const holes = hasPlaceholder(o.subject) || hasPlaceholder(o.body);
  const channel = isOneOf(CHANNELS, o.channel) ? t(`channel.${o.channel}`) : o.channel;
  const open = o.status === 'brouillon' || o.status === 'valide';

  return (
    <article className="adm-card" aria-labelledby={`${uid}-t`}>
      <div className="adm-card-head">
        <div className="adm-card-title">
          <h3 id={`${uid}-t`} className="adm-step-label">
            {t('outreach.step', { step: o.step })}
          </h3>
          <span className="pill muted">{channel}</span>
          <span className="pill muted">{o.locale.toUpperCase()}</span>
          <span className={pillClass(OUTREACH_TONE[o.status])}>{t(`status.outreach.${o.status}`)}</span>
        </div>
        <ul className="adm-meta">
          <li>{t('outreach.created', { date: o.createdLabel })}</li>
          {o.approvedLabel ? <li>{t('outreach.approved', { date: o.approvedLabel })}</li> : null}
          {o.sentLabel ? <li>{t('outreach.sent', { date: o.sentLabel })}</li> : null}
        </ul>
      </div>

      {rule && open ? (
        <p className={`adm-alert ${rule.level === 'no' ? 'is-bad' : 'is-warn'}`}>
          <Icon name="alert" />
          <span>{t(rule.key)}</span>
        </p>
      ) : null}
      {holes && open ? (
        <p className="adm-alert is-warn">
          <Icon name="edit" />
          <span>{t('outreach.placeholderWarning')}</span>
        </p>
      ) : null}

      {editing ? (
        <form
          className="adm-form"
          onSubmit={(e) => {
            e.preventDefault();
            action.run(
              () => saveDraft(o.id, subject, body),
              (r) => {
                if (r.ok) setEditing(false);
              },
            );
          }}
        >
          <div className="field">
            <label htmlFor={`${uid}-s`}>{t('outreach.subject')}</label>
            <input id={`${uid}-s`} value={subject} maxLength={LIMITS.subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor={`${uid}-b`}>{t('outreach.body')}</label>
            <textarea
              id={`${uid}-b`}
              className="adm-tall"
              value={body}
              maxLength={LIMITS.body}
              required
              onChange={(e) => setBody(e.target.value)}
              aria-describedby={`${uid}-bh`}
            />
            <small id={`${uid}-bh`}>{t('outreach.bodyHint', { count: body.length, max: LIMITS.body })}</small>
          </div>
          <div className="adm-row is-end">
            <ResultNote result={action.result} message={action.message} />
            <button
              type="button"
              className="btn btn-ghost adm-btn-sm"
              onClick={() => {
                setEditing(false);
                setSubject(o.subject ?? '');
                setBody(o.body);
                action.clear();
              }}
            >
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn btn-primary adm-btn-sm" disabled={action.pending || !body.trim()}>
              <Icon name="check" />
              {action.pending ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      ) : (
        <>
          {o.subject ? <p className="adm-text is-subject">{o.subject}</p> : null}
          <p className="adm-text">{o.body}</p>
        </>
      )}

      {o.status === 'valide' && emailAllowed ? (
        <p className="adm-hint">{email ? t('outreach.emailTo', { email }) : t('outreach.noEmailHint')}</p>
      ) : null}

      {!editing ? (
        <div className="adm-row">
          {o.status === 'brouillon' ? (
            <>
              <button
                type="button"
                className="btn btn-primary adm-btn-sm"
                disabled={action.pending || blocked || holes}
                onClick={() => action.run(() => validateDraft(o.id))}
              >
                <Icon name="check" />
                {t('outreach.validate')}
              </button>
              <button type="button" className="btn btn-soft adm-btn-sm" disabled={action.pending || blocked} onClick={() => setEditing(true)}>
                <Icon name="edit" />
                {t('common.edit')}
              </button>
            </>
          ) : null}

          {o.status === 'valide' || o.status === 'envoye' || o.status === 'reponse' ? (
            o.channel === 'lettre' ? (
              <Link className="btn btn-soft adm-btn-sm" href={`/admin/prospects/${prospectId}/lettre/${o.id}`}>
                <Icon name="print" />
                {t('outreach.printLetter')}
              </Link>
            ) : (
              <>
                {o.subject && o.channel === 'email' ? <CopyButton text={o.subject} label={t('outreach.copySubject')} /> : null}
                <CopyButton text={o.body} label={t('outreach.copyText')} />
              </>
            )
          ) : null}

          {o.status === 'valide' && emailAllowed && email ? (
            <ConfirmButton
              label={t('outreach.sendEmail')}
              question={t('outreach.sendEmailQuestion', { email })}
              confirmLabel={t('outreach.sendEmailConfirm')}
              icon="mail"
              danger={false}
              pending={action.pending}
              disabled={blocked || !o.subject}
              onConfirm={() => action.run(() => sendByEmail(o.id))}
            />
          ) : null}

          {o.status === 'valide' ? (
            <>
              <ConfirmButton
                label={t('outreach.markSent')}
                question={t('outreach.markSentQuestion')}
                confirmLabel={t('outreach.markSentConfirm')}
                icon="check"
                danger={false}
                pending={action.pending}
                disabled={blocked}
                onConfirm={() => action.run(() => markSent(o.id))}
              />
              <button type="button" className="btn btn-ghost adm-btn-sm" disabled={action.pending} onClick={() => action.run(() => reopenDraft(o.id))}>
                <Icon name="edit" />
                {t('outreach.reopen')}
              </button>
            </>
          ) : null}

          {o.status === 'envoye' ? (
            <button type="button" className="btn btn-primary adm-btn-sm" disabled={action.pending} onClick={() => action.run(() => markReply(o.id))}>
              <Icon name="mail" />
              {t('outreach.markReply')}
            </button>
          ) : null}

          {open ? (
            <ConfirmButton
              label={t('outreach.cancel')}
              question={t('outreach.cancelQuestion')}
              confirmLabel={t('outreach.cancelConfirm')}
              icon="close"
              pending={action.pending}
              onConfirm={() => action.run(() => cancelDraft(o.id))}
            />
          ) : null}
          <ResultNote result={action.result} message={action.message} />
        </div>
      ) : null}
    </article>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { saveIdea } from '@/app/[locale]/admin/actions';
import { Icon } from '@/components/Icons';
import { IDEA_CATEGORIES, IDEA_STATUSES, IDEA_TONE, isOneOf, LIMITS, LOCALES, pillClass, type IdeaStatus } from './types';
import { ResultNote } from './ui';
import { useAdminAction } from './useAdminAction';

export interface IdeaView {
  id: string;
  title: string;
  details: string | null;
  category: string;
  email: string | null;
  locale: string | null;
  status: IdeaStatus;
  note: string | null;
  createdLabel: string;
  updatedLabel: string | null;
}

/** Une idée de la boîte à idées : statut et réponse (visible par la personne qui l'a proposée). */
export function IdeaCard({ idea }: { idea: IdeaView }) {
  const t = useTranslations('admin');
  const id = useId();
  const [status, setStatus] = useState<IdeaStatus>(idea.status);
  const [note, setNote] = useState(idea.note ?? '');
  const action = useAdminAction();
  const dirty = status !== idea.status || note.trim() !== (idea.note ?? '').trim();
  const category = isOneOf(IDEA_CATEGORIES, idea.category) ? t(`ideaCategory.${idea.category}`) : idea.category;

  return (
    <article className={`adm-card${idea.status === 'nouvelle' ? ' is-new' : ''}`} aria-labelledby={`${id}-t`}>
      <div className="adm-card-head">
        <div className="adm-card-title">
          <span className="pill muted">{category}</span>
          <span className={pillClass(IDEA_TONE[idea.status])}>{t(`status.idea.${idea.status}`)}</span>
          <h2 id={`${id}-t`}>{idea.title}</h2>
        </div>
        <span className="muted">{idea.createdLabel}</span>
      </div>

      <ul className="adm-meta">
        {idea.email ? (
          <li>
            <a className="adm-link" href={`mailto:${idea.email}`}>
              {idea.email}
            </a>
          </li>
        ) : (
          <li>{t('ideas.anonymous')}</li>
        )}
        {isOneOf(LOCALES, idea.locale) ? <li>{t(`locale.${idea.locale}`)}</li> : null}
        {idea.updatedLabel ? <li>{t('ideas.updated', { date: idea.updatedLabel })}</li> : null}
      </ul>

      {idea.details ? <p className="adm-text">{idea.details}</p> : <p className="muted">{t('ideas.noDetails')}</p>}

      <form
        className="adm-form"
        onSubmit={(e) => {
          e.preventDefault();
          action.run(() => saveIdea(idea.id, status, note));
        }}
      >
        <div className="adm-grid3">
          <div className="field">
            <label htmlFor={`${id}-s`}>{t('ideas.statusLabel')}</label>
            <select id={`${id}-s`} value={status} onChange={(e) => setStatus(e.target.value as IdeaStatus)}>
              {IDEA_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`status.idea.${s}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="field adm-span2">
            <label htmlFor={`${id}-n`}>{t('ideas.answerLabel')}</label>
            <textarea
              id={`${id}-n`}
              value={note}
              maxLength={LIMITS.ideaNote}
              rows={3}
              onChange={(e) => setNote(e.target.value)}
              aria-describedby={`${id}-h`}
            />
            <small id={`${id}-h`}>{t('ideas.answerHint', { count: note.length, max: LIMITS.ideaNote })}</small>
          </div>
        </div>
        <div className="adm-row is-end">
          <ResultNote result={action.result} message={action.message} />
          <button type="submit" className="btn btn-primary adm-btn-sm" disabled={action.pending || !dirty}>
            <Icon name="check" />
            {action.pending ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </form>
    </article>
  );
}

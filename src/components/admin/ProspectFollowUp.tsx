'use client';

import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { saveProspectPlan, setProspectStatus } from '@/app/[locale]/admin/actions';
import { Icon } from '@/components/Icons';
import { LIMITS, PROSPECT_STATUSES, type ProspectStatus } from './types';
import { ConfirmButton, ResultNote } from './ui';
import { useAdminAction } from './useAdminAction';

/** Étapes les plus fréquentes après un premier contact. */
const QUICK: ProspectStatus[] = ['demo', 'essai', 'client', 'refus'];

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Suivi d'un prospect : statut, prochaine action et notes. */
export function ProspectFollowUp({
  id,
  status,
  nextActionAt,
  notes,
  today,
}: {
  id: string;
  status: ProspectStatus;
  nextActionAt: string | null;
  notes: string | null;
  today: string;
}) {
  const t = useTranslations('admin');
  const uid = useId();
  const statusAction = useAdminAction();
  const planAction = useAdminAction();
  const [other, setOther] = useState<ProspectStatus>(status);
  const [date, setDate] = useState(nextActionAt ?? '');
  const [text, setText] = useState(notes ?? '');
  // Après une modification faite ailleurs (statut, envoi…), on reprend les valeurs enregistrées,
  // sans écraser une note en cours de saisie si elle n'a pas changé côté serveur.
  const [seen, setSeen] = useState({ status, nextActionAt, notes });
  if (seen.status !== status || seen.nextActionAt !== nextActionAt || seen.notes !== notes) {
    if (seen.status !== status) setOther(status);
    if (seen.nextActionAt !== nextActionAt) setDate(nextActionAt ?? '');
    if (seen.notes !== notes) setText(notes ?? '');
    setSeen({ status, nextActionAt, notes });
  }
  const blocked = status === 'ne_pas_contacter';
  const dirty = date !== (nextActionAt ?? '') || text.trim() !== (notes ?? '').trim();

  return (
    <section className="adm-panel" aria-labelledby={`${uid}-h`}>
      <h2 id={`${uid}-h`}>{t('prospect.followUp')}</h2>

      <div className="adm-form">
        <h3>{t('prospect.quickStatus')}</h3>
        <div className="adm-quick">
          {QUICK.map((s) => (
            <button
              key={s}
              type="button"
              className="btn btn-soft adm-btn-sm"
              aria-pressed={status === s}
              disabled={statusAction.pending || status === s || blocked}
              onClick={() => statusAction.run(() => setProspectStatus(id, s))}
            >
              {t(`status.prospect.${s}`)}
            </button>
          ))}
          <ConfirmButton
            label={t('prospect.doNotContact')}
            question={t('prospect.doNotContactQuestion')}
            confirmLabel={t('prospect.doNotContactConfirm')}
            icon="shield"
            pending={statusAction.pending}
            disabled={blocked}
            onConfirm={() => statusAction.run(() => setProspectStatus(id, 'ne_pas_contacter'))}
          />
        </div>
        <div className="adm-row">
          <div className="field adm-grow">
            <label htmlFor={`${uid}-st`}>{t('prospect.otherStatus')}</label>
            <select id={`${uid}-st`} value={other} onChange={(e) => setOther(e.target.value as ProspectStatus)}>
              {PROSPECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`status.prospect.${s}`)}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="btn btn-ghost adm-btn-sm adm-self-end"
            disabled={statusAction.pending || other === status}
            onClick={() => statusAction.run(() => setProspectStatus(id, other))}
          >
            {t('prospect.applyStatus')}
          </button>
        </div>
        <ResultNote result={statusAction.result} message={statusAction.message} />
        {blocked ? <p className="adm-hint">{t('prospect.blockedHint')}</p> : null}
      </div>

      <form
        className="adm-form adm-disclosure"
        onSubmit={(e) => {
          e.preventDefault();
          planAction.run(() => saveProspectPlan(id, date, text));
        }}
      >
        <div className="field">
          <label htmlFor={`${uid}-d`}>{t('prospect.nextAction')}</label>
          <input id={`${uid}-d`} type="date" value={date} disabled={blocked} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="adm-quick">
          {[7, 14, 30].map((n) => (
            <button key={n} type="button" className="btn btn-ghost adm-btn-sm" disabled={blocked} onClick={() => setDate(addDays(today, n))}>
              {t('prospect.inDays', { count: n })}
            </button>
          ))}
          <button type="button" className="btn btn-ghost adm-btn-sm" disabled={blocked || !date} onClick={() => setDate('')}>
            {t('prospect.noAction')}
          </button>
        </div>
        <div className="field">
          <label htmlFor={`${uid}-n`}>{t('prospect.notes')}</label>
          <textarea
            id={`${uid}-n`}
            rows={5}
            maxLength={LIMITS.prospectNotes}
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-describedby={`${uid}-nh`}
          />
          <small id={`${uid}-nh`}>{t('prospect.notesHint')}</small>
        </div>
        <div className="adm-row is-end">
          <ResultNote result={planAction.result} message={planAction.message} />
          <button type="submit" className="btn btn-primary adm-btn-sm" disabled={planAction.pending || !dirty}>
            <Icon name="check" />
            {planAction.pending ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </form>
    </section>
  );
}

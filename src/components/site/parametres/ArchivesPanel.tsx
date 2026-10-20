'use client';

import { useTranslations } from 'next-intl';
import { useId } from 'react';
import { useFormat } from '@/components/FormatProvider';
import { Icon } from '@/components/Icons';
import { restaurerMachine } from '@/app/[locale]/parametres/actions';
import { Link } from '@/i18n/navigation';
import type { ArchivedMachine } from '../types';
import { useServerAction } from './useServerAction';

function ArchiveRow({ machine, canRestore }: { machine: ArchivedMachine; canRestore: boolean }) {
  const t = useTranslations('settings.archives');
  const f = useFormat();
  const restore = useServerAction(restaurerMachine);
  return (
    <li className="s-archive">
      <div className="s-archive-main">
        <b className="s-archive-code">{machine.code}</b>
        <span>
          {machine.title}
          {machine.makeModel ? ` · ${machine.makeModel}` : ''}
        </span>
        <span>{t('archivedOn', { date: f.date(machine.archivedAt) })}</span>
      </div>
      <div className="s-archive-actions">
        <Link className="btn btn-ghost s-btn-sm" href={`/carnet/${machine.id}`}>
          <Icon name="print" />
          {t('log')}
        </Link>
        {canRestore && machine.codeFree ? (
          <button type="button" className="btn btn-soft s-btn-sm" onClick={() => restore.run(machine.id)} disabled={restore.pending}>
            <Icon name="garage" />
            {restore.pending ? t('restoring') : t('restore')}
          </button>
        ) : null}
        {canRestore && !machine.codeFree ? (
          <span className="pill warn" title={t('codeTakenTitle')}>
            {t('codeTaken')}
          </span>
        ) : null}
        {restore.result ? (
          <p className={`s-status${restore.result.ok ? '' : ' s-is-bad'}`} role="status">
            {restore.result.message}
          </p>
        ) : null}
      </div>
    </li>
  );
}

export function ArchivesPanel({
  machines,
  loadError,
  canRestore,
}: {
  machines: ArchivedMachine[];
  loadError: boolean;
  canRestore: boolean;
}) {
  const t = useTranslations('settings.archives');
  const uid = useId();
  return (
    <section id="archives" className="s-panel" aria-labelledby={`${uid}-titre`}>
      <div className="s-panel-head">
        <h2 id={`${uid}-titre`}>
          <Icon name="archive" />
          {t('title')}
        </h2>
        <p>{canRestore ? t('textRestore') : t('text')}</p>
      </div>
      {loadError ? (
        <p className="s-status s-is-bad">{t('loadError')}</p>
      ) : machines.length ? (
        <ul className="s-archives">
          {machines.map((m) => (
            <ArchiveRow key={m.id} machine={m} canRestore={canRestore} />
          ))}
        </ul>
      ) : (
        <div className="empty">
          <Icon name="archive" />
          <b>{t('emptyTitle')}</b>
          <span>{t('emptyText')}</span>
        </div>
      )}
    </section>
  );
}

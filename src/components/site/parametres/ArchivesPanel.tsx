'use client';

import Link from 'next/link';
import { useId } from 'react';
import { Icon } from '@/components/Icons';
import { restaurerMachine } from '@/app/parametres/actions';
import { dateCH } from '@/lib/format';
import type { ArchivedMachine } from '../types';
import { useServerAction } from './useServerAction';

function ArchiveRow({ machine, canRestore }: { machine: ArchivedMachine; canRestore: boolean }) {
  const restore = useServerAction(restaurerMachine);
  return (
    <li className="s-archive">
      <div className="s-archive-main">
        <b className="s-archive-code">{machine.code}</b>
        <span>
          {machine.title}
          {machine.makeModel ? ` · ${machine.makeModel}` : ''}
        </span>
        <span>Archivée le {dateCH(machine.archivedAt)}</span>
      </div>
      <div className="s-archive-actions">
        <Link className="btn btn-ghost s-btn-sm" href={`/carnet/${machine.id}`}>
          <Icon name="print" />
          Carnet
        </Link>
        {canRestore && machine.codeFree ? (
          <button type="button" className="btn btn-soft s-btn-sm" onClick={() => restore.run(machine.id)} disabled={restore.pending}>
            <Icon name="garage" />
            {restore.pending ? 'Restauration…' : 'Remettre au garage'}
          </button>
        ) : null}
        {canRestore && !machine.codeFree ? (
          <span className="pill warn" title="Une machine du garage porte déjà ce code.">
            Code déjà utilisé au garage
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
  const uid = useId();
  return (
    <section id="archives" className="s-panel" aria-labelledby={`${uid}-titre`}>
      <div className="s-panel-head">
        <h2 id={`${uid}-titre`}>
          <Icon name="archive" />
          Machines archivées
        </h2>
        <p>
          Une machine archivée quitte le showroom. Son carnet reste consultable et imprimable
          {canRestore ? ', et vous pouvez la remettre au garage.' : '.'}
        </p>
      </div>
      {loadError ? (
        <p className="s-status s-is-bad">Les machines archivées n’ont pas pu être chargées. Rechargez la page.</p>
      ) : machines.length ? (
        <ul className="s-archives">
          {machines.map((m) => (
            <ArchiveRow key={m.id} machine={m} canRestore={canRestore} />
          ))}
        </ul>
      ) : (
        <div className="empty">
          <Icon name="archive" />
          <b>Aucune machine archivée</b>
          <span>Les machines vendues ou hors service apparaîtront ici, avec leur carnet complet.</span>
        </div>
      )}
    </section>
  );
}

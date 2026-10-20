'use client';

// Liste d'un groupe du showroom (toutes les pelles sur chenilles, par exemple) : chaque machine avec son état et sa
// prochaine échéance ; un clic ouvre sa fiche.
import { useTranslations } from 'next-intl';
import { useFormat } from '@/components/FormatProvider';
import { Icon } from '@/components/Icons';
import { machineMakeModel } from '@/lib/domain';
import { useDomainText } from '@/lib/use-domain-text';
import { useGarage } from './context';
import { sortForList, type FleetView } from './groups';
import { nextDue } from './helpers';

export function GroupList({ group, onOpen }: { group: FleetView; onOpen: (machineId: string) => void }) {
  const t = useTranslations('garage');
  const f = useFormat();
  const dt = useDomainText();
  const g = useGarage();
  const list = sortForList(group.machines, g.health);

  return (
    <ul className="g-group-list" aria-label={t('groups.list', { kind: dt.kind(group.kind) })}>
      {list.map((m) => {
        const h = g.health.get(m.id);
        const state = h?.state ?? 'ok';
        const due = nextDue(h?.dues ?? []);
        const make = machineMakeModel(m);
        return (
          <li key={m.id}>
            <button type="button" className="g-group-row" data-fiche={m.id} onClick={() => onOpen(m.id)}>
              <i className={`dot ${state}`} aria-hidden="true" />
              <span className="g-group-main">
                <b>{m.code}</b>
                <span>{[make, f.hours(Number(m.hours))].filter(Boolean).join(' · ')}</span>
              </span>
              <span className={`g-group-due ${due ? due.state : ''}`}>
                {due ? t('sheet.duePill', { label: due.schedule.label, text: dt.dueText(due) }) : t('groups.noDue')}
              </span>
              <span className="g-sr">, {t(`state.${state}`)}</span>
              <Icon name="chevron-right" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

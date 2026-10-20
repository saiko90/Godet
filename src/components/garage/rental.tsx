'use client';

// Option Location dans le garage : statut de chaque machine (louée, réservée, disponible) calculé côté serveur,
// pastille cliquable vers l'état des lieux ou l'agenda. Sans l'option (ou en démo) : rien ne s'affiche.
import { useTranslations } from 'next-intl';
import { createContext, useContext } from 'react';
import { useFormat } from '@/components/FormatProvider';
import { Icon } from '@/components/Icons';
import { Link } from '@/i18n/navigation';

export interface RentalBadge {
  state: 'louee' | 'reservee' | 'disponible';
  late?: boolean;
  rentalId?: string;
  client?: string;
  /** Louée : retour prévu ; réservée : départ prévu ; disponible : prochaine réservation. */
  at?: string;
}

export interface RentalStatus {
  byMachine: Record<string, RentalBadge>;
}

export const RentalStatusContext = createContext<RentalStatus | null>(null);

export const useRentalStatus = () => useContext(RentalStatusContext);

/** Pastille de location d'une machine ; `detailed` : avec le client et la date (fiche machine). */
export function RentalPill({ machineId, detailed = false }: { machineId: string; detailed?: boolean }) {
  const status = useRentalStatus();
  const t = useTranslations('garage.rental');
  const f = useFormat();
  if (!status) return null;
  const b = status.byMachine[machineId] ?? { state: 'disponible' as const };
  const tone = b.state === 'louee' ? (b.late ? 'bad' : 'is-rent-out') : b.state === 'reservee' ? 'is-rent-booked' : 'is-rent-free';
  const href = b.state === 'louee' && b.rentalId ? `/location/${b.rentalId}/retour` : b.state === 'reservee' && b.rentalId ? `/location/${b.rentalId}/depart` : '/location';
  let label: string = b.late ? t('late') : t(b.state);
  if (detailed) {
    const date = b.at ? f.dateTime(b.at) : '';
    if (b.state === 'louee') label = b.late ? t('lateTo', { client: b.client ?? '', date }) : t('outTo', { client: b.client ?? '', date });
    else if (b.state === 'reservee') label = t('bookedBy', { client: b.client ?? '', date });
    else label = b.at ? t('nextFrom', { date }) : t('freeAction');
  }
  return (
    <Link href={href} className={`pill g-rent-pill ${tone}`}>
      <Icon name="calendar" className="g-pill-icon" />
      {label}
    </Link>
  );
}

'use client';

// Messages d'erreur du garage dans la langue de l'interface : erreurs du dépôt (codes GarageError, cloud ou démo),
// refus d'un fichier (UploadRejected), sinon un message de repli propre à l'action.
import { useLocale, useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { useFormat } from '@/components/FormatProvider';
import { UploadRejected } from '@/lib/media';
import { CHECK_CONSTRAINTS, isGarageError, type CheckConstraint, type GarageError } from '@/lib/repo/supabase';

/** Messages de repli de l'interface (garage.errors.ui.*), quand l'erreur n'a pas de cause connue. */
export type ErrorFallback =
  | 'loadFleet'
  | 'checkConnection'
  | 'refresh'
  | 'send'
  | 'status'
  | 'updateMachine'
  | 'addMachine'
  | 'reading'
  | 'schedule'
  | 'removeEntry'
  | 'action'
  | 'entry'
  | 'deleteFile';

/** Exceptions levées par les fonctions de la base (anciens messages ou codes) → message traduit. */
const SERVER_MESSAGES: Record<string, 'machineGone' | 'forbidden' | 'session' | 'subscriptionInactive' | 'planLimit'> = {
  'Machine introuvable': 'machineGone',
  'Action réservée aux responsables du parc': 'forbidden',
  forbidden: 'forbidden',
  auth_required: 'session',
  // Abonnement (déclencheurs de la base, migration billing_stripe)
  subscription_inactive: 'subscriptionInactive',
  plan_limit: 'planLimit',
};

const isCheck = (c: string | undefined): c is CheckConstraint => (CHECK_CONSTRAINTS as readonly (string | undefined)[]).includes(c);

/** Fonction qui transforme une erreur attrapée en message prêt à afficher. */
export function useErrorText(): (e: unknown, fallback: ErrorFallback) => string {
  const t = useTranslations('garage.errors');
  const f = useFormat();
  const locale = useLocale();

  return useCallback(
    (e: unknown, fallback: ErrorFallback): string => {
      if (e instanceof UploadRejected) {
        const name = e.fileName;
        if (e.reason === 'tooBig') return t('upload.tooBig', { kind: e.kind ?? 'photo', name, size: f.fileSize(e.size) });
        return t(`upload.${e.reason}`, { name });
      }
      if (!isGarageError(e)) return t(`ui.${fallback}`);
      const err: GarageError = e;
      const p = err.params;
      switch (err.code) {
        case 'failed':
          return p.action ? t(`failed.${p.action}`) : t(`ui.${fallback}`);
        case 'check':
          return isCheck(p.constraint) ? t(`checks.${p.constraint}`) : t('invalidValue');
        case 'codeTaken':
          return p.code ? t('codeTakenNamed', { code: p.code }) : t('codeTaken');
        case 'hoursBackwards':
          return t('hoursBackwards', { hours: f.hours(p.hours ?? null), date: f.date(p.at ?? null) });
        case 'server': {
          const known = p.message ? SERVER_MESSAGES[p.message] : undefined;
          if (known) return t(known);
          // Ancien message de la base, en français : affiché tel quel en français, sinon le message de repli.
          return locale === 'fr' && p.message ? p.message : t(`ui.${fallback}`);
        }
        default:
          return t(err.code);
      }
    },
    [t, f, locale],
  );
}

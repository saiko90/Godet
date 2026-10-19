'use client';

import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useFormat } from '@/components/FormatProvider';
import { buildDomainText, type DomainText, type TFn } from '@/lib/domain-text';

/** Textes du domaine dans la langue courante, avec les formats de l'entreprise (composants client). */
export function useDomainText(): DomainText {
  const t = useTranslations('domain');
  const f = useFormat();
  return useMemo(() => buildDomainText(t as unknown as TFn, f), [t, f]);
}

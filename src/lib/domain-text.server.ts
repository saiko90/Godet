import 'server-only';

import { getTranslations } from 'next-intl/server';
import { buildDomainText, type DomainText, type TFn } from '@/lib/domain-text';
import type { Format } from '@/lib/format';
import type { AppLocale } from '@/i18n/routing';

/** Textes du domaine pour un composant serveur (carnet imprimable, e-mails…). */
export async function getDomainText(locale: AppLocale, f: Format): Promise<DomainText> {
  const t = await getTranslations({ locale, namespace: 'domain' });
  return buildDomainText(t as unknown as TFn, f);
}

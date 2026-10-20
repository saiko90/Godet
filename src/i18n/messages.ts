import type { AppLocale } from './routing';

// Les textes sont rangés par zone (un fichier JSON par langue et par zone) : messages/<langue>/<zone>.json.
export const NAMESPACES = [
  'common',
  'domain',
  'site',
  'auth',
  'settings',
  'carnet',
  'contact',
  'ideas',
  'garage',
  'demo',
  'notifications',
  'emails',
  'admin',
  'legal',
  'excel',
] as const;

export type Namespace = (typeof NAMESPACES)[number];

/** Charge toutes les zones d'une langue. */
export async function loadMessages(locale: AppLocale) {
  const entries = await Promise.all(
    NAMESPACES.map(async (ns) => {
      const mod = (await import(`../../messages/${locale}/${ns}.json`)) as { default: Record<string, unknown> };
      return [ns, mod.default] as const;
    }),
  );
  return Object.fromEntries(entries) as unknown as AppMessages;
}

/** Ne garde que certaines zones (pour limiter ce qui est envoyé au navigateur). */
export function pickMessages(messages: AppMessages, namespaces: readonly Namespace[]): Partial<AppMessages> {
  const out: Partial<AppMessages> = {};
  for (const ns of namespaces) (out as Record<string, unknown>)[ns] = messages[ns];
  return out;
}

export type AppMessages = {
  common: typeof import('../../messages/fr/common.json');
  domain: typeof import('../../messages/fr/domain.json');
  site: typeof import('../../messages/fr/site.json');
  auth: typeof import('../../messages/fr/auth.json');
  settings: typeof import('../../messages/fr/settings.json');
  carnet: typeof import('../../messages/fr/carnet.json');
  contact: typeof import('../../messages/fr/contact.json');
  ideas: typeof import('../../messages/fr/ideas.json');
  garage: typeof import('../../messages/fr/garage.json');
  demo: typeof import('../../messages/fr/demo.json');
  notifications: typeof import('../../messages/fr/notifications.json');
  emails: typeof import('../../messages/fr/emails.json');
  admin: typeof import('../../messages/fr/admin.json');
  legal: typeof import('../../messages/fr/legal.json');
  excel: typeof import('../../messages/fr/excel.json');
};

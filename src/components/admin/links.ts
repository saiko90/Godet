// Liens de démo envoyés aux prospects et codes de suivi. Le code (?ref=) relie une visite de la démo, un message de
// contact ou une inscription au prospect qui l'a reçu.

import { routing } from '@/i18n/routing';
import { isOneOf, LOCALES, type ProspectLocale } from './types';

/** Préfixe de langue d'une adresse publique : rien pour le français (langue par défaut), « /de », « /it », « /en ». */
export function localePrefix(locale: string | null | undefined): string {
  return locale && locale !== routing.defaultLocale && isOneOf(LOCALES, locale) ? `/${locale}` : '';
}

/** Langue de contact par défaut d'un pays (en Suisse, elle dépend du canton : l'agent la renseigne). */
export function defaultLocaleFor(country: string | null | undefined): ProspectLocale {
  switch ((country || '').toUpperCase()) {
    case 'DE':
    case 'AT':
    case 'LI':
      return 'de';
    case 'IT':
      return 'it';
    case 'GB':
    case 'US':
      return 'en';
    default:
      return 'fr';
  }
}

/** Langue d'un prospect : la sienne si elle est renseignée, sinon celle de son pays. */
export function prospectLocale(locale: string | null | undefined, country: string | null | undefined): ProspectLocale {
  return isOneOf(LOCALES, locale) ? locale : defaultLocaleFor(country);
}

/** « /de/demo?ref=ch-2610-0042 » */
export function demoPath(locale: string, ref: string): string {
  return `${localePrefix(locale)}/demo?ref=${encodeURIComponent(ref)}`;
}

/** « /de/contact?sujet=demo&ref=ch-2610-0042 » */
export function contactPath(locale: string, ref: string): string {
  return `${localePrefix(locale)}/contact?sujet=demo&ref=${encodeURIComponent(ref)}`;
}

/** Adresse sans « https:// » (plus courte à recopier depuis une lettre). */
export function shortUrl(base: string, path: string): string {
  return `${base.replace(/^https?:\/\//, '').replace(/\/$/, '')}${path}`;
}

/** Préfixe des codes de suivi d'un mois : « ch-2610- » (pays, année sur deux chiffres, mois). */
export function refPrefix(country: string, date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich', year: '2-digit', month: '2-digit' }).formatToParts(date);
  const yy = parts.find((p) => p.type === 'year')?.value ?? '00';
  const mm = parts.find((p) => p.type === 'month')?.value ?? '00';
  const cc = /^[A-Za-z]{2}$/.test(country) ? country.toLowerCase() : 'xx';
  return `${cc}-${yy}${mm}-`;
}

/** Domaine d'un site web (« https://www.muster-bau.ch/kontakt » → « muster-bau.ch »), pour repérer les doublons. */
export function websiteDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, '').toLowerCase() || null;
  } catch {
    return null;
  }
}

/** Lien externe sûr (http ou https uniquement), sinon null. */
export function safeExternalUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const value = url.trim();
  try {
    const u = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : null;
  } catch {
    return null;
  }
}

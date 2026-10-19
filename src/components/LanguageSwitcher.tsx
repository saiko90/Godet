'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { saveProfileLocale } from '@/app/actions/locale';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing, type AppLocale } from '@/i18n/routing';

/**
 * Choix de la langue. « inline » : FR · DE · IT · EN (en-têtes) ; « select » : liste déroulante (paramètres).
 * Garde la page et les paramètres d'adresse, mémorise le choix (cookie + profil si connecté).
 */
export function LanguageSwitcher({ variant = 'inline', className }: { variant?: 'inline' | 'select'; className?: string }) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations('common');
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();

  const go = (next: AppLocale) => {
    if (next === locale) return;
    start(() => {
      const search = typeof window !== 'undefined' ? window.location.search : '';
      router.replace(`${pathname}${search}`, { locale: next });
      void saveProfileLocale(next).catch(() => undefined);
    });
  };

  if (variant === 'select') {
    return (
      <label className={`lang-select ${className ?? ''}`}>
        <span className="lang-label">{t('languageLabel')}</span>
        <select value={locale} onChange={(e) => go(e.target.value as AppLocale)} disabled={pending}>
          {routing.locales.map((l) => (
            <option key={l} value={l}>
              {t(`languages.${l}`)}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <nav className={`lang-inline ${className ?? ''}`} aria-label={t('languageLabel')}>
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          className={l === locale ? 'is-active' : undefined}
          aria-current={l === locale ? 'true' : undefined}
          aria-label={t(`languages.${l}`)}
          title={t(`languages.${l}`)}
          onClick={() => go(l)}
          disabled={pending}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </nav>
  );
}

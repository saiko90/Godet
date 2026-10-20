'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/Icons';
import { Wordmark } from '@/components/Logo';
import { Link } from '@/i18n/navigation';
import type { AppLocale } from '@/i18n/routing';
import '@/components/site/site.css';

type ErrorTexts = (typeof import('../../../messages/fr/site.json'))['error'];

// Le layout ne transmet au navigateur que les zones « common » et « domain » : les textes de cette page sont chargés
// à la demande, dans la seule langue utile. En attendant (ou hors ligne), les textes communs suffisent.
const LOADERS: Record<AppLocale, () => Promise<{ default: unknown }>> = {
  fr: () => import('../../../messages/fr/site.json'),
  de: () => import('../../../messages/de/site.json'),
  it: () => import('../../../messages/it/site.json'),
  en: () => import('../../../messages/en/site.json'),
};

/** Textes de la page d'erreur dans le fichier site.json chargé (vérifiés : une langue incomplète ne casse rien). */
function errorTexts(site: unknown): ErrorTexts | null {
  const error = typeof site === 'object' && site !== null ? (site as { error?: unknown }).error : null;
  if (typeof error !== 'object' || error === null) return null;
  const e = error as Record<string, unknown>;
  const keys: (keyof ErrorTexts)[] = ['metaTitle', 'title', 'text', 'home', 'reference'];
  return keys.every((k) => typeof e[k] === 'string') ? (e as ErrorTexts) : null;
}

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const locale = useLocale() as AppLocale;
  const tc = useTranslations('common');
  const [texts, setTexts] = useState<ErrorTexts | null>(null);

  useEffect(() => {
    console.error(error);
  }, [error]);

  useEffect(() => {
    let alive = true;
    (LOADERS[locale] ?? LOADERS.fr)()
      .then((mod) => {
        const texts = errorTexts(mod.default);
        if (alive && texts) setTexts(texts);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [locale]);

  return (
    <div className="s-page">
      <title>{texts ? `${texts.metaTitle} · Godet` : 'Godet'}</title>
      <header className="s-wrap s-auth-top">
        <Link href="/" className="s-logo" aria-label={texts?.home ?? tc('brand')}>
          <Wordmark />
        </Link>
      </header>
      <main id="contenu" className="s-oops">
        <div className="s-oops-inner" role="alert">
          <span className="s-big-icon s-bad" aria-hidden="true">
            <Icon name="alert" />
          </span>
          <h1>{texts?.title ?? tc('errors.generic')}</h1>
          {texts ? <p>{texts.text}</p> : null}
          <div className="s-cta">
            <button type="button" className="btn btn-primary" onClick={() => retry()}>
              {tc('actions.retry')}
            </button>
            {texts ? (
              <Link href="/" className="btn btn-ghost">
                {texts.home}
              </Link>
            ) : null}
          </div>
          {error.digest ? (
            <small>{texts ? texts.reference.replace('{digest}', error.digest) : error.digest}</small>
          ) : null}
        </div>
      </main>
    </div>
  );
}

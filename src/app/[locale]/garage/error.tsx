'use client';

// Le parc n'a pas pu être chargé côté serveur (réseau, base indisponible) : message clair et nouvel essai.
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { LogoMark } from '@/components/Logo';
import { Link } from '@/i18n/navigation';

export default function GarageError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const t = useTranslations('garage.error');
  const tc = useTranslations('common.actions');
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="fallback" role="alert">
      <div className="dialog">
        <LogoMark size={44} />
        <h1 style={{ margin: 0, fontSize: 'var(--t-xl)' }}>{t('title')}</h1>
        <p className="muted">{t('text')}</p>
        <div className="dialog-foot" style={{ justifyContent: 'flex-start' }}>
          <button type="button" className="btn btn-primary" onClick={() => retry()}>
            {tc('retry')}
          </button>
          <Link className="btn btn-ghost" href="/">
            {t('home')}
          </Link>
        </div>
      </div>
    </main>
  );
}

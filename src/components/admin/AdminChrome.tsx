import { getTranslations } from 'next-intl/server';
import { Icon, type IconName } from '@/components/Icons';
import { Wordmark } from '@/components/Logo';
import { Link } from '@/i18n/navigation';
import type { AppLocale } from '@/i18n/routing';
import './admin.css';

export type AdminSection = 'dashboard' | 'messages' | 'ideas' | 'prospects' | 'visits';

const NAV: { key: AdminSection; href: string; icon: IconName }[] = [
  { key: 'dashboard', href: '/admin', icon: 'gauge' },
  { key: 'messages', href: '/admin/messages', icon: 'mail' },
  { key: 'ideas', href: '/admin/idees', icon: 'note' },
  { key: 'prospects', href: '/admin/prospects', icon: 'users' },
  { key: 'visits', href: '/admin/visites', icon: 'cube' },
];

/** Cadre de la console : barre du haut avec la navigation et ce qui attend (pastilles), puis le contenu. */
export async function AdminChrome({
  locale,
  active,
  counts,
  children,
}: {
  locale: AppLocale;
  active: AdminSection | null;
  counts?: { messages: number; ideas: number; drafts: number };
  children: React.ReactNode;
}) {
  const t = await getTranslations({ locale, namespace: 'admin.chrome' });
  const badge: Partial<Record<AdminSection, number>> = {
    messages: counts?.messages ?? 0,
    ideas: counts?.ideas ?? 0,
    prospects: counts?.drafts ?? 0,
  };

  return (
    <div className="adm-page">
      <a className="adm-skip" href="#contenu">
        {t('skip')}
      </a>
      <header className="adm-bar">
        <div className="adm-wrap adm-bar-row">
          <Link href="/admin" className="adm-brand" aria-label={t('home')}>
            <Wordmark sub={t('console')} />
          </Link>
          <nav className="adm-nav" aria-label={t('navLabel')}>
            <ul>
              {NAV.map((item) => {
                const n = badge[item.key] ?? 0;
                return (
                  <li key={item.key}>
                    <Link href={item.href} aria-current={active === item.key ? 'page' : undefined}>
                      <Icon name={item.icon} />
                      <span>{t(`nav.${item.key}`)}</span>
                      {n > 0 ? (
                        <span className="adm-badge" aria-label={t(`badge.${item.key}`, { count: n })}>
                          {n > 99 ? '99+' : n}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="adm-bar-links">
            <Link href="/" title={t('site')}>
              <Icon name="link" />
              <span className="adm-bar-label">{t('site')}</span>
            </Link>
            <Link href="/garage" title={t('garage')}>
              <Icon name="garage" />
              <span className="adm-bar-label">{t('garage')}</span>
            </Link>
          </div>
        </div>
      </header>
      <main id="contenu" className="adm-wrap adm-main" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}

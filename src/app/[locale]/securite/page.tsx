import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Icon, type IconName } from '@/components/Icons';
import { checkLocale, metaLocale, ogLocale, type LocaleParams } from '@/components/site/seo';
import { SiteFooter, SiteHeader, SkipLink } from '@/components/site/SiteChrome';
import { localizedAlternates } from '@/i18n/metadata';
import { Link } from '@/i18n/navigation';

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = metaLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'legal.securityPage.meta' });
  const alternates = localizedAlternates('/securite', locale);
  return {
    title: t('title'),
    description: t('description'),
    alternates,
    openGraph: { title: t('title'), description: t('description'), url: alternates.canonical, locale: ogLocale(locale), type: 'article', siteName: 'Godet' },
  };
}

/** Garanties affichées, dans l'ordre (texte : legal.securityPage.<clé>). Chaque phrase doit rester vraie. */
const POINTS = [
  { key: 'hosting', icon: 'shield' },
  { key: 'encryption', icon: 'shield' },
  { key: 'isolation', icon: 'users' },
  { key: 'roles', icon: 'users' },
  { key: 'backups', icon: 'download' },
  { key: 'kept', icon: 'archive' },
  { key: 'yours', icon: 'table' },
  { key: 'ai', icon: 'spark' },
  { key: 'location', icon: 'pin' },
  { key: 'payments', icon: 'chf' },
  { key: 'devices', icon: 'offline' },
] as const satisfies readonly { key: string; icon: IconName }[];

export default async function SecuritePage({ params }: { params: LocaleParams }) {
  const locale = checkLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'legal.securityPage' });
  const tags = {
    contact: (chunks: React.ReactNode) => (
      <Link className="s-link" href="/contact">
        {chunks}
      </Link>
    ),
    privacy: (chunks: React.ReactNode) => (
      <Link className="s-link" href="/confidentialite">
        {chunks}
      </Link>
    ),
  };

  return (
    <div className="s-page">
      <SkipLink />
      <SiteHeader current="securite" />
      <main id="contenu" className="s-main s-legal">
        <div className="s-wrap">
          <article className="s-legal-inner">
            <p className="eyebrow">{t('eyebrow')}</p>
            <h1>{t('title')}</h1>
            <p className="s-legal-intro">{t('intro')}</p>
            <ul className="s-trust">
              {POINTS.map((p) => (
                <li key={p.key}>
                  <span className="s-trust-icon" aria-hidden="true">
                    <Icon name={p.icon} />
                  </span>
                  <div>
                    <h2>{t(`${p.key}.title`)}</h2>
                    <p>{t(`${p.key}.text`)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="s-legal-box">
              <p>{t.rich('report', tags)}</p>
            </div>
          </article>
        </div>
      </main>
      <SiteFooter current="securite" />
    </div>
  );
}

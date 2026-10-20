import { getTranslations } from 'next-intl/server';
import { Icon } from '@/components/Icons';
import { SiteFooter, SiteHeader, SkipLink } from '@/components/site/SiteChrome';
import { Link } from '@/i18n/navigation';

// Rendue dans la langue de la page demandée (la langue vient de l'adresse, via le proxy). Le titre et le « noindex »
// sont posés par la page qui appelle notFound() (voir [...rest]/page.tsx).
export default async function NotFound() {
  const t = await getTranslations('site.notFound');
  return (
    <div className="s-page">
      <SkipLink />
      <SiteHeader />
      <main id="contenu" className="s-oops">
        <div className="s-oops-inner">
          <p className="s-oops-code" aria-hidden="true">
            404
          </p>
          <h1>{t('title')}</h1>
          <p>{t('text')}</p>
          <div className="s-cta">
            <Link href="/" className="btn btn-primary">
              {t('home')}
            </Link>
            <Link href="/garage" className="btn btn-ghost">
              <Icon name="garage" />
              {t('garage')}
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

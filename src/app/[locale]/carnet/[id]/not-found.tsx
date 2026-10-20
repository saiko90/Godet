import { getTranslations } from 'next-intl/server';
import { Icon } from '@/components/Icons';
import { AuthShell } from '@/components/site/SiteChrome';
import { Link } from '@/i18n/navigation';

export default async function CarnetIntrouvable() {
  const t = await getTranslations('carnet.notFound');
  return (
    <AuthShell>
      <span className="s-big-icon s-bad" aria-hidden="true">
        <Icon name="file" />
      </span>
      <div className="s-auth-head">
        <h1>{t('title')}</h1>
        <p>{t('text')}</p>
      </div>
      <Link href="/garage" className="btn btn-primary btn-block">
        <Icon name="garage" />
        {t('open')}
      </Link>
    </AuthShell>
  );
}

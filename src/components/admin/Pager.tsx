import { getTranslations } from 'next-intl/server';
import { Icon } from '@/components/Icons';
import { Link } from '@/i18n/navigation';
import type { AppLocale } from '@/i18n/routing';

/** Pagination d'une liste de la console (liens qui gardent les filtres en cours). */
export async function Pager({
  locale,
  pathname,
  query,
  page,
  pageSize,
  total,
}: {
  locale: AppLocale;
  pathname: string;
  query: Record<string, string>;
  page: number;
  pageSize: number;
  total: number;
}) {
  const t = await getTranslations({ locale, namespace: 'admin.common' });
  if (total === 0) return null;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const href = (p: number) => {
    const q: Record<string, string> = {};
    for (const [k, v] of Object.entries(query)) if (v) q[k] = v;
    if (p > 1) q.page = String(p);
    return { pathname, query: q };
  };

  return (
    <nav className="adm-pager" aria-label={t('pagination')}>
      <span>{t('range', { from, to, total })}</span>
      {pages > 1 ? (
        <div>
          {page > 1 ? (
            <Link className="btn btn-ghost adm-btn-sm" href={href(page - 1)} rel="prev">
              <Icon name="chevron-left" />
              {t('previous')}
            </Link>
          ) : null}
          <span className="adm-row">{t('pageOf', { page, pages })}</span>
          {page < pages ? (
            <Link className="btn btn-ghost adm-btn-sm" href={href(page + 1)} rel="next">
              {t('next')}
              <Icon name="chevron-right" />
            </Link>
          ) : null}
        </div>
      ) : null}
    </nav>
  );
}

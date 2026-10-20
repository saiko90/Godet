import type { Metadata } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AdminChrome } from '@/components/admin/AdminChrome';
import { IdeaCard, type IdeaView } from '@/components/admin/IdeaCard';
import { Pager } from '@/components/admin/Pager';
import { IDEA_CATEGORIES, IDEA_STATUSES, isOneOf } from '@/components/admin/types';
import { Link } from '@/i18n/navigation';
import { pickMessages, type AppMessages } from '@/i18n/messages';
import { routing } from '@/i18n/routing';
import { makeFormat } from '@/lib/format';
import { navCounts, pageParam, param } from '../data';
import { adminPageTitle, requireAdmin } from '../guard';

type Params = Promise<{ locale: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

const PAGE_SIZE = 30;
/** « Ouvertes » (nouvelles, à l'étude, prévues) par défaut. */
const FILTERS = ['ouvertes', ...IDEA_STATUSES, 'toutes'] as const;
const OPEN = ['nouvelle', 'a_l_etude', 'prevue'];

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  return { title: await adminPageTitle(locale, 'ideas') };
}

export default async function AdminIdeasPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: 'admin' });
  const f = makeFormat({ locale, country: 'CH', currency: 'CHF' });

  const statusParam = param(sp.statut);
  const filter = isOneOf(FILTERS, statusParam) ? statusParam : 'ouvertes';
  const catParam = param(sp.categorie);
  const category = isOneOf(IDEA_CATEGORIES, catParam) ? catParam : '';
  const page = pageParam(sp.page);

  let query = supabase
    .from('ideas')
    .select('id, title, details, category, email, locale, status, admin_note, created_at, updated_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (filter === 'ouvertes') query = query.in('status', OPEN);
  else if (filter !== 'toutes') query = query.eq('status', filter);
  if (category) query = query.eq('category', category);

  const [counts, res, ...statusCounts] = await Promise.all([
    navCounts(supabase),
    query,
    ...IDEA_STATUSES.map((s) => supabase.from('ideas').select('id', { count: 'exact', head: true }).eq('status', s)),
  ]);
  if (res.error) console.error('[admin] idées :', res.error.code, res.error.message);
  const byStatus = Object.fromEntries(IDEA_STATUSES.map((s, i) => [s, statusCounts[i]?.count ?? 0])) as Record<string, number>;
  const chipCount = (key: (typeof FILTERS)[number]) =>
    key === 'ouvertes'
      ? OPEN.reduce((n, s) => n + byStatus[s], 0)
      : key === 'toutes'
        ? IDEA_STATUSES.reduce((n, s) => n + byStatus[s], 0)
        : byStatus[key];

  const views: IdeaView[] = (res.data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    details: r.details,
    category: r.category,
    email: r.email,
    locale: r.locale,
    status: isOneOf(IDEA_STATUSES, r.status) ? r.status : 'nouvelle',
    note: r.admin_note,
    createdLabel: f.dateTime(r.created_at),
    // « Modifiée le » seulement si la date diffère de la création (à la minute près).
    updatedLabel: r.updated_at.slice(0, 16) !== r.created_at.slice(0, 16) ? f.dateTime(r.updated_at) : null,
  }));

  const messages = (await getMessages()) as unknown as AppMessages;
  const chipHref = (key: string) => ({
    pathname: '/admin/idees',
    query: { ...(key !== 'ouvertes' ? { statut: key } : {}), ...(category ? { categorie: category } : {}) },
  });

  return (
    <NextIntlClientProvider locale={locale} messages={pickMessages(messages, ['common', 'domain', 'admin'])}>
      <AdminChrome locale={locale} active="ideas" counts={counts}>
        <div className="adm-head">
          <p className="eyebrow">{t('chrome.console')}</p>
          <h1>{t('ideas.title')}</h1>
          <p>{t('ideas.lead')}</p>
        </div>

        <div className="adm-section">
          <nav className="adm-chips" aria-label={t('ideas.filterLabel')}>
            {FILTERS.map((key) => (
              <Link key={key} className="adm-chip" href={chipHref(key)} aria-current={filter === key ? 'page' : undefined}>
                {key === 'ouvertes' ? t('ideas.open') : key === 'toutes' ? t('common.allFem') : t(`status.idea.${key}`)}
                <i>{f.num(chipCount(key))}</i>
              </Link>
            ))}
          </nav>
          <form className="adm-filters" method="get">
            {filter !== 'ouvertes' ? <input type="hidden" name="statut" value={filter} /> : null}
            <div className="field">
              <label htmlFor="categorie">{t('ideas.categoryLabel')}</label>
              <select id="categorie" name="categorie" defaultValue={category}>
                <option value="">{t('common.allFem')}</option>
                {IDEA_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t(`ideaCategory.${c}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="adm-filter-actions">
              <button type="submit" className="btn btn-soft adm-btn-sm">
                {t('common.filter')}
              </button>
            </div>
          </form>
        </div>

        {res.error ? (
          <p className="adm-alert is-bad" role="alert">
            {t('common.loadError')}
          </p>
        ) : null}

        {views.length ? (
          <div className="adm-cards">
            {views.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <b>{t('ideas.empty')}</b>
            <span>{t('ideas.emptyHint')}</span>
          </div>
        )}

        <Pager
          locale={locale}
          pathname="/admin/idees"
          query={{ statut: filter !== 'ouvertes' ? filter : '', categorie: category }}
          page={page}
          pageSize={PAGE_SIZE}
          total={res.count ?? 0}
        />
      </AdminChrome>
    </NextIntlClientProvider>
  );
}

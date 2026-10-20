import type { Metadata } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AdminChrome } from '@/components/admin/AdminChrome';
import { isOneOf, isRefCode, pillClass, PROSPECT_STATUSES, PROSPECT_TONE } from '@/components/admin/types';
import { Link } from '@/i18n/navigation';
import { pickMessages, type AppMessages } from '@/i18n/messages';
import { routing } from '@/i18n/routing';
import { makeFormat } from '@/lib/format';
import { navCounts, param } from '../data';
import { adminPageTitle, daysAgoIso, fetchAll, requireAdmin } from '../guard';

type Params = Promise<{ locale: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

const PERIODS = ['7', '30', '90', '365'] as const;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  return { title: await adminPageTitle(locale, 'visits') };
}

type Visit = { ref_code: string; path: string | null; locale: string | null; created_at: string };

export default async function AdminVisitsPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: 'admin' });
  const f = makeFormat({ locale, country: 'CH', currency: 'CHF' });

  const periodParam = param(sp.periode);
  const period = isOneOf(PERIODS, periodParam) ? periodParam : '30';
  const codeParam = param(sp.code).toLowerCase();
  const code = isRefCode(codeParam) ? codeParam : '';
  const since = daysAgoIso(Number(period));

  const [counts, visits] = await Promise.all([
    navCounts(supabase),
    fetchAll<Visit>((from, to) => {
      let q = supabase
        .from('demo_visits')
        .select('ref_code, path, locale, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(from, to);
      if (code) q = q.eq('ref_code', code);
      return q;
    }),
  ]);

  const groups = new Map<string, { count: number; first: string; last: string; paths: Set<string>; locales: Set<string> }>();
  for (const v of visits) {
    const g = groups.get(v.ref_code) ?? { count: 0, first: v.created_at, last: v.created_at, paths: new Set(), locales: new Set() };
    g.count += 1;
    if (v.created_at < g.first) g.first = v.created_at;
    if (v.created_at > g.last) g.last = v.created_at;
    if (v.path) g.paths.add(v.path.split('?')[0]);
    if (v.locale) g.locales.add(v.locale.toUpperCase());
    groups.set(v.ref_code, g);
  }
  const codes = [...groups.keys()];
  const prospects = new Map<string, { id: string; company: string; country: string; status: string }>();
  for (let i = 0; i < codes.length; i += 100) {
    const { data, error } = await supabase
      .from('prospects')
      .select('id, company, country, status, ref_code')
      .in('ref_code', codes.slice(i, i + 100));
    if (error) console.error('[admin] visites :', error.code, error.message);
    for (const p of data ?? []) if (p.ref_code) prospects.set(p.ref_code, p);
  }
  const rows = [...groups.entries()].sort((a, b) => b[1].last.localeCompare(a[1].last));
  const messages = (await getMessages()) as unknown as AppMessages;
  const periodHref = (p: string) => ({ pathname: '/admin/visites', query: { ...(p !== '30' ? { periode: p } : {}), ...(code ? { code } : {}) } });

  return (
    <NextIntlClientProvider locale={locale} messages={pickMessages(messages, ['common', 'domain', 'admin'])}>
      <AdminChrome locale={locale} active="visits" counts={counts}>
        <div className="adm-head">
          <p className="eyebrow">{t('chrome.console')}</p>
          <h1>{t('visits.title')}</h1>
          <p>{t('visits.lead')}</p>
        </div>

        <div className="adm-section">
          <nav className="adm-chips" aria-label={t('visits.periodLabel')}>
            {PERIODS.map((p) => (
              <Link key={p} className="adm-chip" href={periodHref(p)} aria-current={period === p ? 'page' : undefined}>
                {t('visits.period', { days: Number(p) })}
              </Link>
            ))}
          </nav>
          <form className="adm-filters" method="get" role="search" aria-label={t('visits.codeLabel')}>
            {period !== '30' ? <input type="hidden" name="periode" value={period} /> : null}
            <div className="field">
              <label htmlFor="code">{t('visits.codeLabel')}</label>
              <input id="code" name="code" type="search" defaultValue={code} placeholder="ch-2610-0042" maxLength={40} spellCheck={false} />
            </div>
            <div className="adm-filter-actions">
              <button type="submit" className="btn btn-soft adm-btn-sm">
                {t('common.filter')}
              </button>
              {code ? (
                <Link className="btn btn-ghost adm-btn-sm" href={periodHref(period)}>
                  {t('common.reset')}
                </Link>
              ) : null}
            </div>
          </form>
        </div>

        <div className="adm-kpis">
          <div className="adm-kpi">
            <span>{t('visits.total')}</span>
            <b>{f.num(visits.length)}</b>
          </div>
          <div className="adm-kpi">
            <span>{t('visits.codes')}</span>
            <b>{f.num(rows.length)}</b>
          </div>
          <div className="adm-kpi">
            <span>{t('visits.known')}</span>
            <b>{f.num(rows.filter(([c]) => prospects.has(c)).length)}</b>
          </div>
        </div>

        <section className="adm-section" aria-labelledby="par-code">
          <h2 id="par-code">{t('visits.byCode')}</h2>
          {rows.length ? (
            <div className="table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th scope="col">{t('visits.code')}</th>
                    <th scope="col">{t('visits.prospect')}</th>
                    <th scope="col" className="r">
                      {t('visits.count')}
                    </th>
                    <th scope="col">{t('visits.first')}</th>
                    <th scope="col">{t('visits.last')}</th>
                    <th scope="col">{t('visits.pages')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([c, g]) => {
                    const p = prospects.get(c);
                    const st = p && isOneOf(PROSPECT_STATUSES, p.status) ? p.status : null;
                    return (
                      <tr key={c}>
                        <td className="mono">{c}</td>
                        <td className="adm-wrap-cell">
                          {p ? (
                            <>
                              <Link className="adm-strong" href={`/admin/prospects/${p.id}`}>
                                {p.company}
                              </Link>{' '}
                              {st ? <span className={pillClass(PROSPECT_TONE[st])}>{t(`status.prospect.${st}`)}</span> : null}
                              <span className="adm-sub">{p.country}</span>
                            </>
                          ) : (
                            <span className="adm-dim">{t('visits.unknownCode')}</span>
                          )}
                        </td>
                        <td className="r num">{f.num(g.count)}</td>
                        <td>{f.dateTime(g.first)}</td>
                        <td>{f.dateTime(g.last)}</td>
                        <td className="mono">
                          {[...g.paths].join(', ') || '—'}
                          {g.locales.size ? <span className="adm-sub">{[...g.locales].join(' · ')}</span> : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty">
              <b>{t('visits.empty')}</b>
              <span>{t('visits.emptyHint')}</span>
            </div>
          )}
        </section>

        {visits.length ? (
          <section className="adm-section" aria-labelledby="dernieres">
            <h2 id="dernieres">{t('visits.latest')}</h2>
            <ul className="adm-visits adm-panel">
              {visits.slice(0, 40).map((v, i) => (
                <li key={`${v.created_at}-${i}`}>
                  <span>
                    <span className="mono">{v.ref_code}</span> <span className="adm-dim">{v.path ?? ''}</span>
                  </span>
                  <span className="muted">
                    {f.dateTime(v.created_at)}
                    {v.locale ? ` · ${v.locale.toUpperCase()}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="adm-foot-note">{t('visits.note')}</p>
      </AdminChrome>
    </NextIntlClientProvider>
  );
}

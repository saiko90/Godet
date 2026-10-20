import type { Metadata } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AdminChrome } from '@/components/admin/AdminChrome';
import { CLOSED_STATUSES, CONTACT_KINDS, COUNTRY_KEYS, isOneOf, MARKETS, pillClass, PROSPECT_STATUSES } from '@/components/admin/types';
import { Link } from '@/i18n/navigation';
import { pickMessages, type AppMessages } from '@/i18n/messages';
import { routing } from '@/i18n/routing';
import { makeFormat } from '@/lib/format';
import { navCounts } from './data';
import { adminPageTitle, daysAgoIso, fetchAll, requireAdmin, zurichDay } from './guard';

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  return { title: await adminPageTitle(locale, 'dashboard') };
}

type ProspectRow = { id: string; country: string; status: string; ref_code: string | null; next_action_at: string | null };
type OutreachRow = { prospect_id: string; status: string };
type VisitRow = { ref_code: string; created_at: string };

/** Pays dans l'ordre des marchés, puis les autres par ordre alphabétique. */
function sortCountries(list: Iterable<string>): string[] {
  const order = MARKETS as readonly string[];
  return [...new Set(list)].sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    return a.localeCompare(b);
  });
}

function rate(part: number, total: number): string {
  if (!total) return '—';
  return `${Math.round((part / total) * 1000) / 10}${' '}%`;
}

export default async function AdminDashboardPage({ params }: { params: Params }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const { supabase } = await requireAdmin();
  const t = await getTranslations({ locale, namespace: 'admin' });
  const tc = await getTranslations({ locale, namespace: 'common' });
  const f = makeFormat({ locale, country: 'CH', currency: 'CHF' });
  const today = zurichDay();
  const since30 = daysAgoIso(30);

  const [counts, prospects, outreach, visits30, visitCodes, latestMessages, latestIdeas, dueRes] = await Promise.all([
    navCounts(supabase),
    fetchAll<ProspectRow>((from, to) =>
      supabase.from('prospects').select('id, country, status, ref_code, next_action_at').order('id').range(from, to),
    ),
    fetchAll<OutreachRow>((from, to) => supabase.from('outreach').select('prospect_id, status').order('id').range(from, to)),
    fetchAll<VisitRow>((from, to) =>
      supabase.from('demo_visits').select('ref_code, created_at').gte('created_at', since30).order('id').range(from, to),
    ),
    fetchAll<{ ref_code: string }>((from, to) => supabase.from('demo_visits').select('ref_code').order('id').range(from, to)),
    supabase
      .from('contact_messages')
      .select('id, kind, name, email, company, created_at')
      .eq('status', 'nouveau')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('ideas').select('id, title, category, created_at').eq('status', 'nouvelle').order('created_at', { ascending: false }).limit(5),
    supabase
      .from('prospects')
      .select('id, company, city, country, status, next_action_at')
      .lte('next_action_at', zurichDay(7))
      .not('status', 'in', `(${CLOSED_STATUSES.join(',')})`)
      .order('next_action_at', { ascending: true })
      .limit(12),
  ]);
  for (const r of [latestMessages, latestIdeas, dueRes]) if (r.error) console.error('[admin] tableau de bord :', r.error.code, r.error.message);

  // ---- prospects par pays et statut
  const matrix = new Map<string, Map<string, number>>();
  for (const p of prospects) {
    const row = matrix.get(p.country) ?? new Map<string, number>();
    row.set(p.status, (row.get(p.status) ?? 0) + 1);
    matrix.set(p.country, row);
  }
  const countries = sortCountries(matrix.keys());
  const statusTotal = (s: string) => countries.reduce((n, c) => n + (matrix.get(c)?.get(s) ?? 0), 0);
  const countryTotal = (c: string) => [...(matrix.get(c)?.values() ?? [])].reduce((a, b) => a + b, 0);
  const toReview = prospects.filter((p) => p.status === 'a_valider').length;
  const due = prospects.filter(
    (p) => p.next_action_at && p.next_action_at <= today && !(CLOSED_STATUSES as readonly string[]).includes(p.status),
  ).length;

  // ---- indicateurs : contactés, réponses, visites, démos, clients
  const contacted = new Set<string>();
  const replied = new Set<string>();
  for (const o of outreach) {
    if (o.status === 'envoye' || o.status === 'reponse') contacted.add(o.prospect_id);
    if (o.status === 'reponse') replied.add(o.prospect_id);
  }
  const visitedCodes = new Set(visitCodes.map((v) => v.ref_code));
  const indicators = [...countries, 'ALL'].map((c) => {
    const list = prospects.filter((p) => (c === 'ALL' || p.country === c) && contacted.has(p.id));
    const n = list.length;
    return {
      country: c,
      contacted: n,
      reply: rate(list.filter((p) => replied.has(p.id)).length, n),
      visit: rate(list.filter((p) => p.ref_code && visitedCodes.has(p.ref_code)).length, n),
      demo: rate(list.filter((p) => ['demo', 'essai', 'client'].includes(p.status)).length, n),
      client: rate(list.filter((p) => p.status === 'client').length, n),
    };
  });

  // ---- visites de démo des 30 derniers jours, par code
  const byCode = new Map<string, { count: number; last: string }>();
  for (const v of visits30) {
    const cur = byCode.get(v.ref_code) ?? { count: 0, last: v.created_at };
    cur.count += 1;
    if (v.created_at > cur.last) cur.last = v.created_at;
    byCode.set(v.ref_code, cur);
  }
  const prospectByCode = new Map(prospects.filter((p) => p.ref_code).map((p) => [p.ref_code as string, p]));
  const visitRows = [...byCode.entries()].sort((a, b) => b[1].count - a[1].count || b[1].last.localeCompare(a[1].last)).slice(0, 15);
  const companies = new Map<string, string>();
  const linkedIds = visitRows.map(([code]) => prospectByCode.get(code)?.id).filter((v): v is string => Boolean(v));
  if (linkedIds.length) {
    const { data } = await supabase.from('prospects').select('id, company').in('id', linkedIds);
    for (const p of data ?? []) companies.set(p.id, p.company);
  }

  const countryName = (c: string) => (c === 'ALL' ? t('dashboard.allCountries') : isOneOf(COUNTRY_KEYS, c) ? tc(`countries.${c}`) : c);
  const messages = (await getMessages()) as unknown as AppMessages;

  const kpis: { key: 'messages' | 'ideas' | 'toReview' | 'drafts' | 'due' | 'visits'; value: number; href: string; hot: boolean }[] = [
    { key: 'messages', value: counts.messages, href: '/admin/messages', hot: counts.messages > 0 },
    { key: 'ideas', value: counts.ideas, href: '/admin/idees', hot: counts.ideas > 0 },
    { key: 'toReview', value: toReview, href: '/admin/prospects?statut=a_valider', hot: toReview > 0 },
    { key: 'drafts', value: counts.drafts, href: '/admin/prospects?brouillons=1', hot: counts.drafts > 0 },
    { key: 'due', value: due, href: '/admin/prospects?echeance=1&tri=action', hot: due > 0 },
    { key: 'visits', value: visits30.length, href: '/admin/visites', hot: false },
  ];

  return (
    <NextIntlClientProvider locale={locale} messages={pickMessages(messages, ['common', 'domain', 'admin'])}>
      <AdminChrome locale={locale} active="dashboard" counts={counts}>
        <div className="adm-head">
          <p className="eyebrow">{t('chrome.console')}</p>
          <h1>{t('dashboard.title')}</h1>
          <p>{t('dashboard.lead')}</p>
        </div>

        <section className="adm-section" aria-labelledby="kpis">
          <h2 id="kpis" className="adm-sr">
            {t('dashboard.kpisTitle')}
          </h2>
          <div className="adm-kpis">
            {kpis.map((k) => (
              <Link key={k.key} href={k.href} className={`adm-kpi${k.hot ? ' is-hot' : ''}`}>
                <span>{t(`dashboard.kpi.${k.key}`)}</span>
                <b>{f.num(k.value)}</b>
                <small>{t(`dashboard.kpiHint.${k.key}`)}</small>
              </Link>
            ))}
          </div>
        </section>

        <section className="adm-section" aria-labelledby="matrice">
          <div className="adm-section-head">
            <h2 id="matrice">{t('dashboard.byCountry')}</h2>
            <Link className="adm-link" href="/admin/prospects">
              {t('dashboard.allProspects')}
            </Link>
          </div>
          {countries.length ? (
            <div className="table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th scope="col">{t('dashboard.country')}</th>
                    {PROSPECT_STATUSES.map((s) => (
                      <th key={s} scope="col" className="r">
                        {t(`status.prospect.${s}`)}
                      </th>
                    ))}
                    <th scope="col" className="r">
                      {t('dashboard.total')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {countries.map((c) => (
                    <tr key={c}>
                      <th scope="row">
                        <Link className="adm-strong" href={`/admin/prospects?pays=${c}`}>
                          {countryName(c)}
                        </Link>
                      </th>
                      {PROSPECT_STATUSES.map((s) => {
                        const n = matrix.get(c)?.get(s) ?? 0;
                        return (
                          <td key={s} className={`r num${n ? '' : ' adm-zero'}`}>
                            {n ? (
                              <Link href={`/admin/prospects?pays=${c}&statut=${s}`}>{f.num(n)}</Link>
                            ) : (
                              '·'
                            )}
                          </td>
                        );
                      })}
                      <td className="r num">
                        <b>{f.num(countryTotal(c))}</b>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td>{t('dashboard.total')}</td>
                    {PROSPECT_STATUSES.map((s) => (
                      <td key={s} className="r num">
                        {f.num(statusTotal(s))}
                      </td>
                    ))}
                    <td className="r num">{f.num(prospects.length)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="empty">
              <b>{t('dashboard.noProspects')}</b>
              <span>{t('dashboard.noProspectsHint')}</span>
            </div>
          )}
        </section>

        {countries.length ? (
          <section className="adm-section" aria-labelledby="indicateurs">
            <div className="adm-section-head">
              <h2 id="indicateurs">{t('dashboard.indicators')}</h2>
              <p className="adm-foot-note">{t('dashboard.indicatorsHint')}</p>
            </div>
            <div className="table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th scope="col">{t('dashboard.country')}</th>
                    <th scope="col" className="r">
                      {t('dashboard.contacted')}
                    </th>
                    <th scope="col" className="r">
                      {t('dashboard.replyRate')}
                    </th>
                    <th scope="col" className="r">
                      {t('dashboard.visitRate')}
                    </th>
                    <th scope="col" className="r">
                      {t('dashboard.demoRate')}
                    </th>
                    <th scope="col" className="r">
                      {t('dashboard.clientRate')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {indicators.map((i) => (
                    <tr key={i.country}>
                      <th scope="row">{i.country === 'ALL' ? <b>{countryName(i.country)}</b> : countryName(i.country)}</th>
                      <td className="r num">{f.num(i.contacted)}</td>
                      <td className="r num">{i.reply}</td>
                      <td className="r num">{i.visit}</td>
                      <td className="r num">{i.demo}</td>
                      <td className="r num">{i.client}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        <div className="adm-detail">
          <section className="adm-panel" aria-labelledby="visites">
            <div className="adm-section-head">
              <h2 id="visites">{t('dashboard.visits30')}</h2>
              <Link className="adm-link" href="/admin/visites">
                {t('dashboard.allVisits')}
              </Link>
            </div>
            {visitRows.length ? (
              <div className="table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th scope="col">{t('visits.code')}</th>
                      <th scope="col">{t('visits.prospect')}</th>
                      <th scope="col" className="r">
                        {t('visits.count')}
                      </th>
                      <th scope="col">{t('visits.last')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visitRows.map(([code, v]) => {
                      const p = prospectByCode.get(code);
                      return (
                        <tr key={code}>
                          <td className="mono">{code}</td>
                          <td>
                            {p ? (
                              <Link className="adm-strong" href={`/admin/prospects/${p.id}`}>
                                {companies.get(p.id) ?? code}
                              </Link>
                            ) : (
                              <span className="adm-dim">{t('visits.unknownCode')}</span>
                            )}
                          </td>
                          <td className="r num">{f.num(v.count)}</td>
                          <td>{f.dateTime(v.last)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted">{t('dashboard.noVisits')}</p>
            )}
          </section>

          <div className="adm-stack">
            <section className="adm-panel" aria-labelledby="echeances">
              <div className="adm-section-head">
                <h2 id="echeances">{t('dashboard.nextActions')}</h2>
                <Link className="adm-link" href="/admin/prospects?tri=action">
                  {t('dashboard.seeAll')}
                </Link>
              </div>
              {dueRes.data?.length ? (
                <ul className="adm-visits">
                  {dueRes.data.map((p) => (
                    <li key={p.id}>
                      <Link className="adm-link" href={`/admin/prospects/${p.id}`}>
                        {p.company}
                      </Link>
                      <span className={p.next_action_at && p.next_action_at <= today ? 'adm-due' : 'muted'}>
                        {f.date(p.next_action_at)} · {isOneOf(PROSPECT_STATUSES, p.status) ? t(`status.prospect.${p.status}`) : p.status}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">{t('dashboard.noActions')}</p>
              )}
            </section>

            <section className="adm-panel" aria-labelledby="derniers-messages">
              <div className="adm-section-head">
                <h2 id="derniers-messages">{t('dashboard.latestMessages')}</h2>
                <Link className="adm-link" href="/admin/messages">
                  {t('dashboard.seeAll')}
                </Link>
              </div>
              {latestMessages.data?.length ? (
                <ul className="adm-visits">
                  {latestMessages.data.map((m) => (
                    <li key={m.id}>
                      <span>
                        <span className={pillClass('warn')}>{isOneOf(CONTACT_KINDS, m.kind) ? t(`contactKind.${m.kind}`) : m.kind}</span>{' '}
                        {m.name || m.email}
                        {m.company ? <span className="adm-dim"> · {m.company}</span> : null}
                      </span>
                      <span className="muted">{f.dateTime(m.created_at)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">{t('dashboard.noMessages')}</p>
              )}
            </section>

            <section className="adm-panel" aria-labelledby="dernieres-idees">
              <div className="adm-section-head">
                <h2 id="dernieres-idees">{t('dashboard.latestIdeas')}</h2>
                <Link className="adm-link" href="/admin/idees">
                  {t('dashboard.seeAll')}
                </Link>
              </div>
              {latestIdeas.data?.length ? (
                <ul className="adm-visits">
                  {latestIdeas.data.map((i) => (
                    <li key={i.id}>
                      <span>{i.title}</span>
                      <span className="muted">{f.date(i.created_at)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">{t('dashboard.noIdeas')}</p>
              )}
            </section>
          </div>
        </div>

        <p className="adm-foot-note">{t('chrome.privacy')}</p>
      </AdminChrome>
    </NextIntlClientProvider>
  );
}

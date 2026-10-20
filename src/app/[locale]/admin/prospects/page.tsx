import type { Metadata } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AdminChrome } from '@/components/admin/AdminChrome';
import { Pager } from '@/components/admin/Pager';
import {
  CHANNELS,
  CLOSED_STATUSES,
  COUNTRY_KEYS,
  FLEET_SIZES,
  isOneOf,
  MARKETS,
  pillClass,
  PROSPECT_STATUSES,
  PROSPECT_TONE,
  SEGMENTS,
  type ProspectStatus,
} from '@/components/admin/types';
import { Link } from '@/i18n/navigation';
import { pickMessages, type AppMessages } from '@/i18n/messages';
import { routing } from '@/i18n/routing';
import { makeFormat } from '@/lib/format';
import { likePattern, navCounts, pageParam, param } from '../data';
import { adminPageTitle, fetchAll, requireAdmin, zurichDay } from '../guard';

type Params = Promise<{ locale: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

const PAGE_SIZE = 50;
const SORTS = ['recent', 'action', 'entreprise'] as const;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  return { title: await adminPageTitle(locale, 'prospects') };
}

/** Valeur pour un filtre « or » de PostgREST, entre guillemets (virgules et parenthèses permises). */
function quoted(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

export default async function AdminProspectsPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: 'admin' });
  const tc = await getTranslations({ locale, namespace: 'common' });
  const f = makeFormat({ locale, country: 'CH', currency: 'CHF' });
  const today = zurichDay();

  const countryParam = param(sp.pays).toUpperCase();
  const country = /^[A-Z]{2}$/.test(countryParam) ? countryParam : '';
  const statusParam = param(sp.statut);
  const status = isOneOf(PROSPECT_STATUSES, statusParam) ? statusParam : '';
  const segmentParam = param(sp.segment);
  const segment = isOneOf(SEGMENTS, segmentParam) ? segmentParam : '';
  const search = param(sp.q).slice(0, 80);
  const dueOnly = param(sp.echeance) === '1';
  const draftsOnly = param(sp.brouillons) === '1';
  const sortParam = param(sp.tri);
  const sort = isOneOf(SORTS, sortParam) ? sortParam : dueOnly ? 'action' : 'recent';
  const page = pageParam(sp.page);

  let query = supabase
    .from('prospects')
    .select(
      'id, company, city, postal_code, country, region, segment, fleet_estimate, status, channel, next_action_at, ref_code, created_at, outreach(status)',
      { count: 'exact' },
    );
  if (country) query = query.eq('country', country);
  if (status) query = query.eq('status', status);
  if (segment) query = query.eq('segment', segment);
  if (search) {
    const p = quoted(likePattern(search));
    query = query.or(`company.ilike.${p},city.ilike.${p},postal_code.ilike.${p},ref_code.ilike.${p},legal_id.ilike.${p}`);
  }
  if (dueOnly) query = query.lte('next_action_at', today).not('status', 'in', `(${CLOSED_STATUSES.join(',')})`);
  // Prospects qui ont au moins un brouillon à relire (filtre sur la table liée).
  if (draftsOnly) query = query.eq('outreach.status', 'brouillon').not('outreach', 'is', null);
  if (sort === 'action') query = query.order('next_action_at', { ascending: true, nullsFirst: false }).order('company');
  else if (sort === 'entreprise') query = query.order('company', { ascending: true });
  else query = query.order('created_at', { ascending: false }).order('company');
  query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const [counts, res, statusRows, countryRows] = await Promise.all([
    navCounts(supabase),
    query,
    fetchAll<{ status: string }>((from, to) => {
      let q = supabase.from('prospects').select('status').order('id').range(from, to);
      if (country) q = q.eq('country', country);
      return q;
    }),
    fetchAll<{ country: string }>((from, to) => supabase.from('prospects').select('country').order('id').range(from, to)),
  ]);
  if (res.error) console.error('[admin] prospects :', res.error.code, res.error.message);
  const rows = res.data ?? [];
  const statusCount = new Map<string, number>();
  for (const r of statusRows) statusCount.set(r.status, (statusCount.get(r.status) ?? 0) + 1);
  const countries = [...new Set<string>([...MARKETS, ...countryRows.map((r) => r.country)])];

  const currentQuery: Record<string, string> = {
    pays: country,
    statut: status,
    segment,
    q: search,
    echeance: dueOnly ? '1' : '',
    brouillons: draftsOnly ? '1' : '',
    tri: sortParam && isOneOf(SORTS, sortParam) ? sortParam : '',
  };
  const chipHref = (s: string) => {
    const q: Record<string, string> = {};
    for (const [k, v] of Object.entries({ ...currentQuery, statut: s })) if (v) q[k] = v;
    return { pathname: '/admin/prospects', query: q };
  };
  const filtered = Boolean(country || status || segment || search || dueOnly || draftsOnly);
  const countryName = (c: string) => (isOneOf(COUNTRY_KEYS, c) ? tc(`countries.${c}`) : c);
  const messages = (await getMessages()) as unknown as AppMessages;

  return (
    <NextIntlClientProvider locale={locale} messages={pickMessages(messages, ['common', 'domain', 'admin'])}>
      <AdminChrome locale={locale} active="prospects" counts={counts}>
        <div className="adm-head">
          <p className="eyebrow">{t('chrome.console')}</p>
          <h1>{t('prospects.title')}</h1>
          <p>{t('prospects.lead')}</p>
        </div>

        <div className="adm-section">
          <nav className="adm-chips" aria-label={t('prospects.statusFilter')}>
            <Link className="adm-chip" href={chipHref('')} aria-current={!status ? 'page' : undefined}>
              {t('common.all')}
              <i>{f.num(statusRows.length)}</i>
            </Link>
            {PROSPECT_STATUSES.map((s) => (
              <Link key={s} className="adm-chip" href={chipHref(s)} aria-current={status === s ? 'page' : undefined}>
                {t(`status.prospect.${s}`)}
                <i>{f.num(statusCount.get(s) ?? 0)}</i>
              </Link>
            ))}
          </nav>

          <form className="adm-filters" method="get" role="search" aria-label={t('prospects.filters')}>
            {status ? <input type="hidden" name="statut" value={status} /> : null}
            <div className="field">
              <label htmlFor="q">{t('prospects.search')}</label>
              <input id="q" name="q" type="search" defaultValue={search} placeholder={t('prospects.searchPlaceholder')} maxLength={80} />
            </div>
            <div className="field">
              <label htmlFor="pays">{t('fields.country')}</label>
              <select id="pays" name="pays" defaultValue={country}>
                <option value="">{t('common.all')}</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {countryName(c)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="segment">{t('fields.segment')}</label>
              <select id="segment" name="segment" defaultValue={segment}>
                <option value="">{t('common.all')}</option>
                {SEGMENTS.map((s) => (
                  <option key={s} value={s}>
                    {t(`segment.${s}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="tri">{t('prospects.sort')}</label>
              <select id="tri" name="tri" defaultValue={sort}>
                {SORTS.map((s) => (
                  <option key={s} value={s}>
                    {t(`prospects.sortBy.${s}`)}
                  </option>
                ))}
              </select>
            </div>
            <label className="adm-check">
              <input type="checkbox" name="echeance" value="1" defaultChecked={dueOnly} />
              {t('prospects.dueOnly')}
            </label>
            <label className="adm-check">
              <input type="checkbox" name="brouillons" value="1" defaultChecked={draftsOnly} />
              {t('prospects.draftsOnly')}
            </label>
            <div className="adm-filter-actions">
              <button type="submit" className="btn btn-soft adm-btn-sm">
                {t('common.filter')}
              </button>
              {filtered ? (
                <Link className="btn btn-ghost adm-btn-sm" href="/admin/prospects">
                  {t('common.reset')}
                </Link>
              ) : null}
            </div>
          </form>
        </div>

        {res.error ? (
          <p className="adm-alert is-bad" role="alert">
            {t('common.loadError')}
          </p>
        ) : null}

        {rows.length ? (
          <div className="table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th scope="col">{t('prospects.company')}</th>
                  <th scope="col">{t('fields.country')}</th>
                  <th scope="col">{t('fields.segment')}</th>
                  <th scope="col">{t('fields.fleet')}</th>
                  <th scope="col">{t('prospects.status')}</th>
                  <th scope="col">{t('fields.channel')}</th>
                  <th scope="col">{t('prospect.nextAction')}</th>
                  <th scope="col">{t('prospects.code')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const st = (isOneOf(PROSPECT_STATUSES, p.status) ? p.status : 'nouveau') as ProspectStatus;
                  const drafts = (p.outreach ?? []).filter((o) => o.status === 'brouillon').length;
                  const due = p.next_action_at && p.next_action_at <= today && !(CLOSED_STATUSES as readonly string[]).includes(st);
                  return (
                    <tr key={p.id}>
                      <td className="adm-wrap-cell">
                        <Link className="adm-strong" href={`/admin/prospects/${p.id}`}>
                          {p.company}
                        </Link>
                        <span className="adm-sub">{[p.postal_code, p.city].filter(Boolean).join(' ') || '—'}</span>
                      </td>
                      <td>
                        {p.country}
                        {p.region ? <span className="adm-sub">{p.region}</span> : null}
                      </td>
                      <td>{isOneOf(SEGMENTS, p.segment) ? t(`segment.${p.segment}`) : p.segment}</td>
                      <td className="num">{isOneOf(FLEET_SIZES, p.fleet_estimate) ? t(`fleet.${p.fleet_estimate}`) : '—'}</td>
                      <td>
                        <span className={pillClass(PROSPECT_TONE[st])}>{t(`status.prospect.${st}`)}</span>
                        {drafts ? <span className="adm-sub">{t('prospects.draftCount', { count: drafts })}</span> : null}
                      </td>
                      <td>{isOneOf(CHANNELS, p.channel) ? t(`channel.${p.channel}`) : '—'}</td>
                      <td className={due ? 'adm-due' : undefined}>{p.next_action_at ? f.date(p.next_action_at) : '—'}</td>
                      <td className="mono">{p.ref_code ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            <b>{filtered ? t('prospects.noMatch') : t('dashboard.noProspects')}</b>
            <span>{filtered ? t('prospects.noMatchHint') : t('dashboard.noProspectsHint')}</span>
          </div>
        )}

        <Pager locale={locale} pathname="/admin/prospects" query={currentQuery} page={page} pageSize={PAGE_SIZE} total={res.count ?? 0} />
      </AdminChrome>
    </NextIntlClientProvider>
  );
}

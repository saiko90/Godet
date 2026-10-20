import type { Metadata } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AdminChrome } from '@/components/admin/AdminChrome';
import { ContactMessageCard, type ContactMessageView } from '@/components/admin/ContactMessageCard';
import { Pager } from '@/components/admin/Pager';
import { CONTACT_KINDS, CONTACT_STATUSES, isOneOf, isRefCode } from '@/components/admin/types';
import { Link } from '@/i18n/navigation';
import { pickMessages, type AppMessages } from '@/i18n/messages';
import { isAppLocale, routing } from '@/i18n/routing';
import { makeFormat } from '@/lib/format';
import { navCounts, pageParam, param } from '../data';
import { adminPageTitle, requireAdmin } from '../guard';

type Params = Promise<{ locale: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

const PAGE_SIZE = 30;
/** Filtres de statut : « à traiter » (nouveaux et en cours) par défaut. */
const FILTERS = ['a_traiter', ...CONTACT_STATUSES, 'tous'] as const;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  return { title: await adminPageTitle(locale, 'messages') };
}

/** Code de suivi mentionné dans la provenance d'un message (« /de/demo?ref=ch-2610-0042 », ou le code seul). */
function refFromSource(source: string | null): string | null {
  if (!source) return null;
  const m = /(?:^|[?&\s])ref=([a-z0-9-]{4,40})(?:$|[&\s#])/.exec(source);
  if (m) return m[1];
  const s = source.trim();
  return isRefCode(s) ? s : null;
}

export default async function AdminMessagesPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: 'admin' });
  const f = makeFormat({ locale, country: 'CH', currency: 'CHF' });

  const statusParam = param(sp.statut);
  const filter = isOneOf(FILTERS, statusParam) ? statusParam : 'a_traiter';
  const kindParam = param(sp.type);
  const kind = isOneOf(CONTACT_KINDS, kindParam) ? kindParam : '';
  const page = pageParam(sp.page);

  let query = supabase
    .from('contact_messages')
    .select('id, kind, name, email, company, phone, country, locale, fleet_size, message, source, consent, status, admin_note, created_at', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (filter === 'a_traiter') query = query.in('status', ['nouveau', 'en_cours']);
  else if (filter !== 'tous') query = query.eq('status', filter);
  if (kind) query = query.eq('kind', kind);

  const [counts, res, ...statusCounts] = await Promise.all([
    navCounts(supabase),
    query,
    ...CONTACT_STATUSES.map((s) => supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', s)),
  ]);
  if (res.error) console.error('[admin] messages :', res.error.code, res.error.message);
  const rows = res.data ?? [];
  const byStatus = Object.fromEntries(CONTACT_STATUSES.map((s, i) => [s, statusCounts[i]?.count ?? 0])) as Record<string, number>;
  const chipCount = (key: (typeof FILTERS)[number]) =>
    key === 'a_traiter'
      ? byStatus.nouveau + byStatus.en_cours
      : key === 'tous'
        ? CONTACT_STATUSES.reduce((n, s) => n + byStatus[s], 0)
        : byStatus[key];

  // Prospects liés par le code de suivi de la provenance.
  const refs = [...new Set(rows.map((r) => refFromSource(r.source)).filter((v): v is string => Boolean(v)))];
  const prospectsByRef = new Map<string, { id: string; company: string }>();
  if (refs.length) {
    const { data } = await supabase.from('prospects').select('id, company, ref_code').in('ref_code', refs);
    for (const p of data ?? []) if (p.ref_code) prospectsByRef.set(p.ref_code, { id: p.id, company: p.company });
  }

  // Objet de la réponse dans la langue de la personne qui a écrit (sinon celle de la console).
  const replySubjects = new Map<string, string>();
  for (const l of new Set(rows.map((r) => (isAppLocale(r.locale) ? r.locale : locale)))) {
    const tl = await getTranslations({ locale: l, namespace: 'admin.messages' });
    replySubjects.set(l, tl('replySubject'));
  }

  const views: ContactMessageView[] = rows.map((r) => {
    const ref = refFromSource(r.source);
    return {
      replySubject: replySubjects.get(isAppLocale(r.locale) ? r.locale : locale) ?? '',
      id: r.id,
      kind: r.kind,
      name: r.name,
      email: r.email,
      company: r.company,
      phone: r.phone,
      country: r.country,
      locale: r.locale,
      fleet: r.fleet_size,
      message: r.message,
      source: r.source,
      consent: r.consent,
      status: isOneOf(CONTACT_STATUSES, r.status) ? r.status : 'nouveau',
      note: r.admin_note,
      createdLabel: f.dateTime(r.created_at),
      prospect: ref ? (prospectsByRef.get(ref) ?? null) : null,
    };
  });

  const messages = (await getMessages()) as unknown as AppMessages;
  const chipHref = (key: string) => ({ pathname: '/admin/messages', query: { ...(key !== 'a_traiter' ? { statut: key } : {}), ...(kind ? { type: kind } : {}) } });

  return (
    <NextIntlClientProvider locale={locale} messages={pickMessages(messages, ['common', 'domain', 'admin'])}>
      <AdminChrome locale={locale} active="messages" counts={counts}>
        <div className="adm-head">
          <p className="eyebrow">{t('chrome.console')}</p>
          <h1>{t('messages.title')}</h1>
          <p>{t('messages.lead')}</p>
        </div>

        <div className="adm-section">
          <nav className="adm-chips" aria-label={t('messages.filterLabel')}>
            {FILTERS.map((key) => (
              <Link key={key} className="adm-chip" href={chipHref(key)} aria-current={filter === key ? 'page' : undefined}>
                {key === 'a_traiter' ? t('messages.toHandle') : key === 'tous' ? t('common.all') : t(`status.contact.${key}`)}
                <i>{f.num(chipCount(key))}</i>
              </Link>
            ))}
          </nav>
          <form className="adm-filters" method="get">
            {filter !== 'a_traiter' ? <input type="hidden" name="statut" value={filter} /> : null}
            <div className="field">
              <label htmlFor="type">{t('messages.kindLabel')}</label>
              <select id="type" name="type" defaultValue={kind}>
                <option value="">{t('common.all')}</option>
                {CONTACT_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {t(`contactKind.${k}`)}
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
            {views.map((m) => (
              <ContactMessageCard key={m.id} m={m} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <b>{t('messages.empty')}</b>
            <span>{t('messages.emptyHint')}</span>
          </div>
        )}

        <Pager
          locale={locale}
          pathname="/admin/messages"
          query={{ statut: filter !== 'a_traiter' ? filter : '', type: kind }}
          page={page}
          pageSize={PAGE_SIZE}
          total={res.count ?? 0}
        />
      </AdminChrome>
    </NextIntlClientProvider>
  );
}

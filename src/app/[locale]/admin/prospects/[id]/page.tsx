import type { Metadata } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { AdminChrome } from '@/components/admin/AdminChrome';
import { contactPath, demoPath, prospectLocale, safeExternalUrl } from '@/components/admin/links';
import { OutreachCard, type OutreachView } from '@/components/admin/OutreachCard';
import { ProspectEditForm } from '@/components/admin/ProspectEditForm';
import { ProspectFollowUp } from '@/components/admin/ProspectFollowUp';
import { DataControls, NewDraftForm, RefCodeButton } from '@/components/admin/ProspectTools';
import {
  CHANNELS,
  CONTACT_KINDS,
  CONTACT_STATUSES,
  CONTACT_TONE,
  COUNTRY_KEYS,
  FLEET_SIZES,
  isOneOf,
  isUuid,
  OUTREACH_STATUSES,
  pillClass,
  PROSPECT_STATUSES,
  PROSPECT_TONE,
  SEGMENTS,
  type Channel,
  type ProspectStatus,
} from '@/components/admin/types';
import { CopyField } from '@/components/admin/ui';
import { Icon } from '@/components/Icons';
import { Link } from '@/i18n/navigation';
import { pickMessages, type AppMessages } from '@/i18n/messages';
import { routing } from '@/i18n/routing';
import { makeFormat } from '@/lib/format';
import { navCounts } from '../../data';
import { adminPageTitle, getAdmin, publicBaseUrl, requireAdmin, zurichDay, type AdminSupabase } from '../../guard';

type Params = Promise<{ locale: string; id: string }>;

/** Fiche lue une fois par requête (métadonnées et page). */
const loadProspect = cache(async (supabase: AdminSupabase, id: string) => {
  const { data, error } = await supabase.from('prospects').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`Administration : prospect illisible (${error.code})`);
  return data;
});

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, id } = await params;
  // Le nom de l'entreprise n'apparaît dans le titre que pour l'administration (sinon la page sera une 404).
  const admin = await getAdmin().catch(() => null);
  const p = admin && isUuid(id) ? await loadProspect(admin.supabase, id).catch(() => null) : null;
  return { title: await adminPageTitle(locale, 'prospects', p?.company) };
}

export default async function AdminProspectPage({ params }: { params: Params }) {
  const { locale, id } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const { supabase } = await requireAdmin();
  if (!isUuid(id)) notFound();
  const p = await loadProspect(supabase, id);
  if (!p) notFound();

  const t = await getTranslations({ locale, namespace: 'admin' });
  const tc = await getTranslations({ locale, namespace: 'common' });
  const f = makeFormat({ locale, country: 'CH', currency: 'CHF' });
  const base = await publicBaseUrl();
  const lang = prospectLocale(p.locale, p.country);

  const [counts, outreachRes, visitsRes, inboundRes] = await Promise.all([
    navCounts(supabase),
    supabase
      .from('outreach')
      .select('id, step, channel, locale, subject, body, status, created_at, approved_at, sent_at')
      .eq('prospect_id', p.id)
      .order('step', { ascending: true })
      .order('created_at', { ascending: true }),
    p.ref_code
      ? supabase
          .from('demo_visits')
          .select('created_at, path, locale', { count: 'exact' })
          .eq('ref_code', p.ref_code)
          .order('created_at', { ascending: false })
          .limit(20)
      : Promise.resolve(null),
    p.ref_code
      ? supabase
          .from('contact_messages')
          .select('id, kind, status, created_at')
          .ilike('source', `%${p.ref_code}%`)
          .order('created_at', { ascending: false })
          .limit(10)
      : Promise.resolve(null),
  ]);
  if (outreachRes.error) console.error('[admin] messages préparés :', outreachRes.error.code, outreachRes.error.message);

  const status = (isOneOf(PROSPECT_STATUSES, p.status) ? p.status : 'nouveau') as ProspectStatus;
  const blocked = status === 'ne_pas_contacter';
  const outreach: OutreachView[] = (outreachRes.data ?? []).map((o) => ({
    id: o.id,
    step: o.step,
    channel: o.channel,
    locale: o.locale,
    subject: o.subject,
    body: o.body,
    status: isOneOf(OUTREACH_STATUSES, o.status) ? o.status : 'brouillon',
    createdLabel: f.dateTime(o.created_at),
    approvedLabel: o.approved_at ? f.dateTime(o.approved_at) : null,
    sentLabel: o.sent_at ? f.dateTime(o.sent_at) : null,
  }));
  const defaultChannel: Channel = isOneOf(CHANNELS, p.channel) ? p.channel : (outreach.at(-1)?.channel as Channel | undefined) ?? 'lettre';
  const website = safeExternalUrl(p.website);
  const sourceUrl = /^https?:\/\//i.test(p.source.trim()) ? safeExternalUrl(p.source) : null;
  const countryName = isOneOf(COUNTRY_KEYS, p.country) ? tc(`countries.${p.country}`) : p.country;
  const segmentName = isOneOf(SEGMENTS, p.segment) ? t(`segment.${p.segment}`) : p.segment;
  const messages = (await getMessages()) as unknown as AppMessages;

  return (
    <NextIntlClientProvider locale={locale} messages={pickMessages(messages, ['common', 'domain', 'admin'])}>
      <AdminChrome locale={locale} active="prospects" counts={counts}>
        <div className="adm-head">
          <Link className="adm-back" href="/admin/prospects">
            <Icon name="chevron-left" />
            {t('prospect.back')}
          </Link>
          <p className="eyebrow">
            {countryName}
            {p.region ? ` · ${p.region}` : ''} · {segmentName}
          </p>
          <div className="adm-head-row">
            <h1>{p.company}</h1>
            <span className={pillClass(PROSPECT_TONE[status])}>{t(`status.prospect.${status}`)}</span>
          </div>
          <p>
            {t('prospect.createdBy', { by: p.created_by, date: f.dateTime(p.created_at) })}
            {p.updated_at !== p.created_at ? ` · ${t('prospect.updated', { date: f.dateTime(p.updated_at) })}` : ''}
          </p>
        </div>

        {blocked ? (
          <p className="adm-alert is-bad" role="note">
            <Icon name="shield" />
            <span>{t('prospect.blockedBanner')}</span>
          </p>
        ) : null}

        <div className="adm-detail">
          <div className="adm-stack">
            <section className="adm-panel" aria-labelledby="coordonnees">
              <h2 id="coordonnees">{t('prospect.details')}</h2>
              <dl className="adm-dl">
                <dt>{t('fields.address')}</dt>
                <dd>
                  {p.address || '—'}
                  <br />
                  {[p.postal_code, p.city].filter(Boolean).join(' ') || '—'}
                  <br />
                  {countryName}
                </dd>
                <dt>{t('fields.phone')}</dt>
                <dd>
                  {p.phone ? (
                    <a className="adm-link" href={`tel:${p.phone.replace(/[^\d+]/g, '')}`}>
                      {p.phone}
                    </a>
                  ) : (
                    '—'
                  )}
                </dd>
                <dt>{t('fields.email')}</dt>
                <dd>{p.email || '—'}</dd>
                <dt>{t('fields.website')}</dt>
                <dd>
                  {website ? (
                    <a className="adm-link" href={website} target="_blank" rel="noopener noreferrer">
                      {p.website}
                    </a>
                  ) : (
                    p.website || '—'
                  )}
                </dd>
                <dt>{t('fields.legalId')}</dt>
                <dd className="mono">{p.legal_id || '—'}</dd>
                <dt>{t('fields.locale')}</dt>
                <dd>{t(`locale.${lang}`)}</dd>
                <dt>{t('fields.fleet')}</dt>
                <dd>{isOneOf(FLEET_SIZES, p.fleet_estimate) ? t(`fleet.${p.fleet_estimate}`) : '—'}</dd>
                <dt>{t('fields.channel')}</dt>
                <dd>{isOneOf(CHANNELS, p.channel) ? t(`channel.${p.channel}`) : '—'}</dd>
                <dt>{t('fields.source')}</dt>
                <dd>
                  {sourceUrl ? (
                    <a className="adm-link" href={sourceUrl} target="_blank" rel="noopener noreferrer">
                      {p.source}
                    </a>
                  ) : (
                    p.source
                  )}
                </dd>
              </dl>
              {p.signals ? (
                <>
                  <h3>{t('fields.signals')}</h3>
                  <p className="adm-text">{p.signals}</p>
                </>
              ) : null}
              <details className="adm-disclosure">
                <summary>
                  <Icon name="chevron-right" />
                  {t('prospect.edit')}
                </summary>
                <ProspectEditForm
                  id={p.id}
                  initial={{
                    company: p.company,
                    country: p.country,
                    region: p.region ?? '',
                    locale: p.locale ?? '',
                    legalId: p.legal_id ?? '',
                    website: p.website ?? '',
                    email: p.email ?? '',
                    phone: p.phone ?? '',
                    address: p.address ?? '',
                    postalCode: p.postal_code ?? '',
                    city: p.city ?? '',
                    segment: p.segment,
                    fleet: p.fleet_estimate ?? '',
                    channel: p.channel ?? '',
                    signals: p.signals ?? '',
                    source: p.source,
                  }}
                />
              </details>
            </section>

            <section className="adm-section" aria-labelledby="messages-prepares">
              <div className="adm-section-head">
                <h2 id="messages-prepares">{t('prospect.outreach')}</h2>
                <span className="muted">{t('prospect.outreachHint')}</span>
              </div>
              {outreach.length ? (
                <div className="adm-steps">
                  {outreach.map((o) => (
                    <OutreachCard key={o.id} o={o} prospectId={p.id} country={p.country} blocked={blocked} />
                  ))}
                </div>
              ) : (
                <div className="empty">
                  <b>{t('prospect.noOutreach')}</b>
                </div>
              )}
              {!blocked ? (
                <details className="adm-panel adm-disclosure">
                  <summary>
                    <Icon name="chevron-right" />
                    {t('prospect.newDraft')}
                  </summary>
                  <NewDraftForm prospectId={p.id} country={p.country} defaultChannel={defaultChannel} disabled={blocked} />
                </details>
              ) : null}
            </section>
          </div>

          <div className="adm-stack">
            <ProspectFollowUp id={p.id} status={status} nextActionAt={p.next_action_at} notes={p.notes} today={zurichDay()} />

            {!blocked ? (
              <section className="adm-panel" aria-labelledby="liens">
                <h2 id="liens">{t('prospect.links')}</h2>
                {p.ref_code ? (
                  <>
                    <p className="adm-hint">{t('prospect.linksHint', { code: p.ref_code, language: t(`locale.${lang}`) })}</p>
                    <CopyField label={t('prospect.demoLink')} value={`${base}${demoPath(lang, p.ref_code)}`} />
                    <CopyField label={t('prospect.contactLink')} value={`${base}${contactPath(lang, p.ref_code)}`} />
                  </>
                ) : (
                  <>
                    <p className="adm-hint">{t('prospect.noRef')}</p>
                    <RefCodeButton prospectId={p.id} />
                  </>
                )}
              </section>
            ) : null}

            {p.ref_code ? (
              <section className="adm-panel" aria-labelledby="visites">
                <h2 id="visites">{t('prospect.visits', { count: visitsRes?.count ?? 0 })}</h2>
                {visitsRes?.data?.length ? (
                  <ul className="adm-visits">
                    {visitsRes.data.map((v, i) => (
                      <li key={`${v.created_at}-${i}`}>
                        <span className="mono">{v.path ?? '—'}</span>
                        <span className="muted">
                          {f.dateTime(v.created_at)}
                          {v.locale ? ` · ${v.locale.toUpperCase()}` : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">{t('prospect.noVisits')}</p>
                )}
                {inboundRes?.data?.length ? (
                  <>
                    <h3>{t('prospect.inbound')}</h3>
                    <ul className="adm-visits">
                      {inboundRes.data.map((m) => (
                        <li key={m.id}>
                          <Link className="adm-link" href="/admin/messages?statut=tous">
                            {isOneOf(CONTACT_KINDS, m.kind) ? t(`contactKind.${m.kind}`) : m.kind}
                          </Link>
                          <span>
                            <span className={pillClass(isOneOf(CONTACT_STATUSES, m.status) ? CONTACT_TONE[m.status] : 'muted')}>
                              {isOneOf(CONTACT_STATUSES, m.status) ? t(`status.contact.${m.status}`) : m.status}
                            </span>{' '}
                            <span className="muted">{f.dateTime(m.created_at)}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </section>
            ) : null}

            <section className="adm-panel" aria-labelledby="donnees">
              <h2 id="donnees">{t('prospect.data')}</h2>
              <DataControls prospectId={p.id} erased={blocked && !p.address && !p.phone && !p.email && !p.website} />
            </section>
          </div>
        </div>
      </AdminChrome>
    </NextIntlClientProvider>
  );
}

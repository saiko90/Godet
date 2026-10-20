import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { headers } from 'next/headers';
import { FormatProvider } from '@/components/FormatProvider';
import { Icon } from '@/components/Icons';
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel';
import { cantonLabel, cantonOptions, type CantonCode } from '@/components/site/cantons';
import { countryName, countryOptions, type MainCountry } from '@/components/site/countries';
import { localizePath } from '@/components/site/nav';
import { ArchivesPanel } from '@/components/site/parametres/ArchivesPanel';
import { ComptePanel } from '@/components/site/parametres/ComptePanel';
import { EntreprisePanel } from '@/components/site/parametres/EntreprisePanel';
import { EquipePanel } from '@/components/site/parametres/EquipePanel';
import { checkLocale, metaLocale, NO_INDEX, type LocaleParams } from '@/components/site/seo';
import { AppHeader, SkipLink } from '@/components/site/SiteChrome';
import type { ArchivedMachine, PendingInvitation } from '@/components/site/types';
import { pickMessages, type AppMessages } from '@/i18n/messages';
import { Link, redirect } from '@/i18n/navigation';
import { htmlLang } from '@/i18n/routing';
import { can, machineMakeModel } from '@/lib/domain';
import { getDomainText } from '@/lib/domain-text.server';
import { isEmailConfigured } from '@/lib/email';
import { siteUrl } from '@/lib/env';
import { makeFormat, type Format } from '@/lib/format';
import { getSession } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import type { Member, MemberRole, Org } from '@/lib/types';

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = metaLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'settings.meta' });
  return { title: t('title'), robots: NO_INDEX };
}

const ROLE_ORDER: Record<MemberRole, number> = { owner: 0, admin: 1, mechanic: 2, operator: 3 };

/** Adresse publique telle que vue par le navigateur (liens d'invitation). */
async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  if (!host) return siteUrl();
  const proto = h.get('x-forwarded-proto') ?? (/^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? 'http' : 'https');
  return `${proto.split(',')[0].trim()}://${host}`;
}

export default async function ParametresPage({ params }: { params: LocaleParams }) {
  const locale = checkLocale((await params).locale);
  setRequestLocale(locale);
  const session = await getSession();
  if (session.status === 'anon') {
    return redirect({ href: { pathname: '/connexion', query: { suite: localizePath('/parametres', locale) } }, locale });
  }
  if (session.status === 'no-org') return redirect({ href: '/bienvenue', locale });
  const { ctx } = session;
  const orgId = ctx.org.id;
  const supabase = await supabaseServer();
  // Dates et montants selon la langue de la page et le pays de l'entreprise.
  const f = makeFormat({ locale, country: ctx.org.country, currency: ctx.org.currency });

  const [membersRes, invitesRes, archivedRes, activeRes, origin, t, tc, ts, dt, messages] = await Promise.all([
    supabase.from('memberships').select('user_id, role, created_at, profiles(full_name, email)').eq('org_id', orgId),
    // Réservé au propriétaire et aux administrateurs (la RLS renvoie une liste vide aux autres).
    supabase
      .from('invitations')
      .select('id, email, role, token, created_at, expires_at')
      .eq('org_id', orgId)
      .is('accepted_at', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('machines')
      .select('id, code, kind, brand, model, year, weight_t, archived_at')
      .eq('org_id', orgId)
      .not('archived_at', 'is', null)
      .order('archived_at', { ascending: false }),
    supabase.from('machines').select('code').eq('org_id', orgId).is('archived_at', null),
    requestOrigin(),
    getTranslations({ locale, namespace: 'settings' }),
    getTranslations({ locale, namespace: 'common' }),
    getTranslations({ locale, namespace: 'site' }),
    getDomainText(locale, f),
    getMessages({ locale }),
  ]);

  if (membersRes.error) console.error('[parametres] membres :', membersRes.error.code, membersRes.error.message);
  if (invitesRes.error) console.error('[parametres] invitations :', invitesRes.error.code, invitesRes.error.message);
  if (archivedRes.error) console.error('[parametres] archives :', archivedRes.error.code, archivedRes.error.message);

  const collator = new Intl.Collator(htmlLang(locale));
  const members: Member[] = (membersRes.data ?? [])
    .map((m) => ({
      userId: m.user_id,
      role: m.role,
      fullName: m.profiles?.full_name ?? null,
      email: m.profiles?.email ?? null,
      since: m.created_at,
    }))
    .sort(
      (a, b) =>
        ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || collator.compare(a.fullName || a.email || '', b.fullName || b.email || ''),
    );

  const invitations: PendingInvitation[] = (invitesRes.data ?? []).map((i) => ({
    id: i.id,
    email: i.email,
    role: i.role,
    token: i.token,
    createdAt: i.created_at,
    expiresAt: i.expires_at,
  }));

  const activeCodes = new Set((activeRes.data ?? []).map((m) => m.code.trim().toLowerCase()));
  const archived: ArchivedMachine[] = (archivedRes.data ?? []).map((m) => ({
    id: m.id,
    code: m.code,
    title: dt.machineTitle(m),
    makeModel: machineMakeModel(m),
    archivedAt: m.archived_at ?? '',
    codeFree: !activeCodes.has(m.code.trim().toLowerCase()),
  }));

  const nowIso = new Date().toISOString();
  const myName = ctx.fullName?.trim() || members.find((m) => m.userId === ctx.userId)?.fullName || '';
  const mainCountry = (code: MainCountry) => tc(`countries.${code}`);
  const cantonName = (code: CantonCode) => ts(`cantons.${code}`);

  const planLabel = (org: Org, fmt: Format, now: number): string => {
    if (org.plan === 'actif') return t('plan.active');
    if (org.plan === 'suspendu') return t('plan.suspended');
    const end = Date.parse(org.trial_ends_at);
    return end < now ? t('plan.trialEnded', { date: fmt.date(org.trial_ends_at) }) : t('plan.trialUntil', { date: fmt.date(org.trial_ends_at) });
  };

  const sections = [
    { href: '#entreprise', icon: 'garage', label: t('page.sections.company') },
    { href: '#equipe', icon: 'users', label: t('page.sections.team') },
    { href: '#compte', icon: 'edit', label: t('page.sections.account') },
    { href: '#rappels', icon: 'calendar', label: t('page.sections.reminders') },
    { href: '#archives', icon: 'archive', label: t('page.sections.archives') },
    { href: '#idees', icon: 'note', label: t('page.sections.ideas') },
  ] as const;

  return (
    <div className="s-page">
      <SkipLink />
      <AppHeader orgName={ctx.org.name} />
      <main id="contenu" className="s-wrap s-settings">
        <div className="s-settings-title">
          <p className="eyebrow">{ctx.org.name}</p>
          <h1>{t('page.title')}</h1>
          <p>
            {t.rich('page.role', {
              role: dt.role(ctx.role),
              hint: dt.roleHint(ctx.role),
              b: (chunks) => <b>{chunks}</b>,
            })}
          </p>
        </div>
        <div className="s-settings-layout">
          <nav className="s-settings-nav" aria-label={t('page.nav')}>
            <ul>
              {sections.map((s) => (
                <li key={s.href}>
                  <a href={s.href}>
                    <Icon name={s.icon} />
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <NextIntlClientProvider
            locale={locale}
            messages={pickMessages(messages as unknown as AppMessages, ['common', 'domain', 'settings', 'notifications'])}
          >
            <FormatProvider locale={locale} country={ctx.org.country} currency={ctx.org.currency}>
              <div className="s-panels">
                <EntreprisePanel
                  org={{
                    id: ctx.org.id,
                    name: ctx.org.name,
                    country: ctx.org.country,
                    canton: ctx.org.canton,
                    currency: ctx.org.currency,
                  }}
                  planLabel={planLabel(ctx.org, f, Date.parse(nowIso))}
                  createdLabel={f.date(ctx.org.created_at)}
                  countryLabel={countryName(locale, ctx.org.country, mainCountry)}
                  cantonLabel={cantonLabel(ctx.org.canton, cantonName)}
                  canEdit={can.manageTeam(ctx.role)}
                  orgs={ctx.orgs}
                  countries={countryOptions(locale, mainCountry)}
                  cantons={cantonOptions(cantonName, htmlLang(locale))}
                />
                <EquipePanel
                  members={members}
                  membersError={Boolean(membersRes.error)}
                  invitations={invitations}
                  meId={ctx.userId}
                  canManage={can.manageTeam(ctx.role)}
                  orgName={ctx.org.name}
                  myName={myName}
                  origin={origin}
                  nowIso={nowIso}
                  emailEnabled={isEmailConfigured()}
                  locale={locale}
                />
                <ComptePanel
                  fullName={ctx.fullName}
                  email={ctx.email}
                  orgName={ctx.org.name}
                  canLeave={ctx.role !== 'owner'}
                />
                <section id="rappels" className="s-panel" aria-labelledby="titre-rappels">
                  <div className="s-panel-head">
                    <h2 id="titre-rappels">
                      <Icon name="calendar" />
                      {t('reminders.title')}
                    </h2>
                    <p>{t('reminders.text')}</p>
                  </div>
                  <NotificationsPanel />
                </section>
                <ArchivesPanel machines={archived} loadError={Boolean(archivedRes.error)} canRestore={can.manageFleet(ctx.role)} />
                <section id="idees" className="s-panel" aria-labelledby="titre-idees">
                  <div className="s-panel-head">
                    <h2 id="titre-idees">
                      <Icon name="note" />
                      {t('ideas.title')}
                    </h2>
                    <p>{t('ideas.text')}</p>
                  </div>
                  <div>
                    <Link href="/idees" className="btn btn-soft s-btn-sm">
                      <Icon name="note" />
                      {t('ideas.open')}
                    </Link>
                  </div>
                </section>
              </div>
            </FormatProvider>
          </NextIntlClientProvider>
        </div>
      </main>
    </div>
  );
}

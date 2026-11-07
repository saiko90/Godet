import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { IdeaForm } from '@/components/site/IdeaForm';
import { localizePath } from '@/components/site/nav';
import { checkLocale, metaLocale, ogImages, ogLocale, type LocaleParams } from '@/components/site/seo';
import { SiteFooter, SiteHeader, SkipLink } from '@/components/site/SiteChrome';
import { pickMessages, type AppMessages } from '@/i18n/messages';
import { localizedAlternates } from '@/i18n/metadata';
import { Link } from '@/i18n/navigation';
import { makeFormat } from '@/lib/format';
import { getSession } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = metaLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'ideas.meta' });
  const alternates = localizedAlternates('/idees', locale);
  return {
    title: t('title'),
    description: t('description'),
    alternates,
    openGraph: { title: t('title'), description: t('description'), url: alternates.canonical, locale: ogLocale(locale), type: 'website', siteName: 'Godet', images: await ogImages(locale) },
  };
}

const STATUSES = ['nouvelle', 'a_l_etude', 'prevue', 'faite', 'refusee'] as const;
type IdeaStatus = (typeof STATUSES)[number];
const CATEGORIES = ['3d', 'carnet', 'echeances', 'couts', 'medias', 'equipe', 'notifications', 'mobile', 'autre'] as const;
type IdeaCategory = (typeof CATEGORIES)[number];

/** Pastille du statut : reçue (neutre), à l'étude (jaune), prévue (contour), réalisée (vert), écartée (neutre). */
const STATUS_TONE: Record<IdeaStatus, string> = {
  nouvelle: 'pill muted',
  a_l_etude: 'pill s-pill-paint',
  prevue: 'pill s-pill-line',
  faite: 'pill',
  refusee: 'pill muted',
};

interface MyIdea {
  id: string;
  title: string;
  category: IdeaCategory;
  status: IdeaStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export default async function IdeesPage({ params }: { params: LocaleParams }) {
  const locale = checkLocale((await params).locale);
  setRequestLocale(locale);
  const [t, messages, session] = await Promise.all([
    getTranslations({ locale, namespace: 'ideas' }),
    getMessages({ locale }),
    getSession(),
  ]);
  const ctx = session.status === 'ok' ? session.ctx : null;
  const userId = ctx?.userId ?? (session.status === 'no-org' ? session.userId : null);
  const accountEmail = ctx?.email ?? (session.status === 'no-org' ? session.email : null);
  const f = makeFormat({ locale, country: ctx?.org.country, currency: ctx?.org.currency });
  const loginHref = { pathname: '/connexion', query: { suite: localizePath('/idees', locale) } };

  // Mes idées (la RLS ne renvoie que les siennes ; le filtre explicite écarte la vue d'administration).
  let mine: MyIdea[] = [];
  let loadError = false;
  if (userId) {
    const supabase = await supabaseServer();
    const { data, error } = await supabase
      .from('ideas')
      .select('id, title, category, status, admin_note, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) {
      console.error('[idees] liste :', error.code, error.message);
      loadError = true;
    }
    mine = (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      category: (CATEGORIES as readonly string[]).includes(row.category) ? (row.category as IdeaCategory) : 'autre',
      status: (STATUSES as readonly string[]).includes(row.status) ? (row.status as IdeaStatus) : 'nouvelle',
      adminNote: row.admin_note,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  return (
    <div className="s-page">
      <SkipLink />
      <SiteHeader current="idees" />
      <main id="contenu" className="s-main s-public">
        <div className="s-wrap s-public-grid">
          <div className="s-public-intro">
            <p className="eyebrow">{t('eyebrow')}</p>
            <h1>{t('title')}</h1>
            <p className="s-public-lead">{t('lead')}</p>
            <h2 className="s-public-sub">{t('how.title')}</h2>
            <ol className="s-steps">
              <li>{t('how.send')}</li>
              <li>{t('how.review')}</li>
              <li>{t('how.follow')}</li>
            </ol>
          </div>
          <section className="s-public-card" aria-labelledby="titre-idee">
            <h2 id="titre-idee" className="s-public-card-title">
              {t('form.title')}
            </h2>
            <NextIntlClientProvider locale={locale} messages={pickMessages(messages as unknown as AppMessages, ['common', 'ideas'])}>
              <IdeaForm accountEmail={accountEmail} loginHref={loginHref} />
            </NextIntlClientProvider>
          </section>
        </div>

        <section className="s-wrap s-ideas" aria-labelledby="titre-mes-idees">
          <div className="s-ideas-head">
            <h2 id="titre-mes-idees">{t('mine.title')}</h2>
            {userId && !loadError ? <span className="s-muted">{t('mine.count', { count: mine.length })}</span> : null}
          </div>
          {!userId ? (
            <p className="s-muted">
              {t.rich('mine.anonymous', {
                link: (chunks) => (
                  <Link className="s-link" href={loginHref}>
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          ) : loadError ? (
            <p className="s-status s-is-bad">{t('mine.loadError')}</p>
          ) : mine.length ? (
            <ul className="s-idea-list">
              {mine.map((idea) => (
                <li key={idea.id} className="s-idea">
                  <div className="s-idea-top">
                    <h3>{idea.title}</h3>
                    <span className={STATUS_TONE[idea.status]}>{t(`status.${idea.status}`)}</span>
                  </div>
                  <p className="s-idea-meta">
                    {t(`form.categories.${idea.category}`)} · {t('mine.sentOn', { date: f.date(idea.createdAt) })}
                    {idea.updatedAt.slice(0, 10) !== idea.createdAt.slice(0, 10)
                      ? ` · ${t('mine.updatedOn', { date: f.date(idea.updatedAt) })}`
                      : ''}
                  </p>
                  {idea.adminNote?.trim() ? (
                    <div className="s-idea-answer">
                      <b>{t('mine.answer')}</b>
                      <p>{idea.adminNote}</p>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="s-muted">{t('mine.empty')}</p>
          )}
        </section>
      </main>
      <SiteFooter current="idees" />
    </div>
  );
}

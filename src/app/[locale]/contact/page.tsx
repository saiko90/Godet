import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { cookies } from 'next/headers';
import { Icon, type IconName } from '@/components/Icons';
import { ContactForm, type ContactInitial } from '@/components/site/ContactForm';
import { countryOptions, isCountryCode } from '@/components/site/countries';
import { firstParam, isRefCode, REF_COOKIE } from '@/components/site/nav';
import { checkLocale, metaLocale, ogImages, ogLocale, type LocaleParams } from '@/components/site/seo';
import { SiteFooter, SiteHeader, SkipLink, STUDIO_URL } from '@/components/site/SiteChrome';
import { SiteIcon } from '@/components/site/SiteIcons';
import { pickMessages, type AppMessages } from '@/i18n/messages';
import { localizedAlternates } from '@/i18n/metadata';
import { Link } from '@/i18n/navigation';
import { getSession } from '@/lib/session';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const SUBJECTS: readonly ContactInitial['sujet'][] = ['demo', 'contact', 'partenaire', 'support'];

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = metaLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'contact.meta' });
  const alternates = localizedAlternates('/contact', locale);
  return {
    title: t('title'),
    description: t('description'),
    alternates,
    openGraph: { title: t('title'), description: t('description'), url: alternates.canonical, locale: ogLocale(locale), type: 'website', siteName: 'Godet', images: await ogImages(locale) },
  };
}

const POINTS = [
  { key: 'demo', icon: 'cube' },
  { key: 'languages', icon: 'language' },
  { key: 'ideas', icon: 'note' },
] as const satisfies readonly { key: string; icon: IconName | 'language' }[];

export default async function ContactPage({ params, searchParams }: { params: LocaleParams; searchParams: SearchParams }) {
  const locale = checkLocale((await params).locale);
  setRequestLocale(locale);
  const query = await searchParams;
  const [t, tc, messages, session, store] = await Promise.all([
    getTranslations({ locale, namespace: 'contact' }),
    getTranslations({ locale, namespace: 'common' }),
    getMessages({ locale }),
    getSession(),
    cookies(),
  ]);

  // Préremplissage : ?sujet=demo&ref=code (liens des agents) et, si la personne est connectée, ses coordonnées.
  const sujet = firstParam(query.sujet);
  const refParam = firstParam(query.ref)?.trim().toLowerCase();
  const refCookie = store.get(REF_COOKIE)?.value;
  const refCode = isRefCode(refParam) ? refParam : isRefCode(refCookie) ? refCookie : null;
  const ctx = session.status === 'ok' ? session.ctx : null;
  const initial: ContactInitial = {
    sujet: SUBJECTS.find((s) => s === sujet) ?? 'contact',
    nom: ctx?.fullName ?? (session.status === 'no-org' ? (session.fullName ?? '') : ''),
    email: ctx?.email ?? (session.status === 'no-org' ? session.email : ''),
    entreprise: ctx?.org.name ?? '',
    pays: ctx && isCountryCode(ctx.org.country) ? ctx.org.country : '',
  };
  const countries = countryOptions(locale, (code) => tc(`countries.${code}`));

  return (
    <div className="s-page">
      <SkipLink />
      <SiteHeader current="contact" />
      <main id="contenu" className="s-main s-public">
        <div className="s-wrap s-public-grid">
          <div className="s-public-intro">
            <p className="eyebrow">{t('eyebrow')}</p>
            <h1>{t('title')}</h1>
            <p className="s-public-lead">{t('lead')}</p>
            <ul className="s-points">
              {POINTS.map((p) => (
                <li key={p.key}>
                  <span className="s-ico">{p.icon === 'language' ? <SiteIcon name="language" /> : <Icon name={p.icon} />}</span>
                  <div>
                    <h2>{t(`points.${p.key}.title`)}</h2>
                    <p>
                      {t.rich(`points.${p.key}.text`, {
                        link: (chunks) => (
                          <Link className="s-link" href="/idees">
                            {chunks}
                          </Link>
                        ),
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="s-public-note">
              {t.rich('studio', {
                link: (chunks) => (
                  <a className="s-link" href={STUDIO_URL}>
                    {chunks}
                  </a>
                ),
              })}
            </p>
          </div>
          <section className="s-public-card" aria-labelledby="titre-formulaire">
            <h2 id="titre-formulaire" className="s-public-card-title">
              {t('form.title')}
            </h2>
            <NextIntlClientProvider locale={locale} messages={pickMessages(messages as unknown as AppMessages, ['common', 'contact'])}>
              <ContactForm initial={initial} refCode={refCode} countries={countries} />
            </NextIntlClientProvider>
          </section>
        </div>
      </main>
      <SiteFooter current="contact" />
    </div>
  );
}

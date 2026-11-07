import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { checkLocale, metaLocale, ogImages, ogLocale, type LocaleParams } from '@/components/site/seo';
import { SiteFooter, SiteHeader, SkipLink, STUDIO_URL } from '@/components/site/SiteChrome';
import { localizedAlternates } from '@/i18n/metadata';
import { Link } from '@/i18n/navigation';
import { htmlLang } from '@/i18n/routing';

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = metaLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'legal.meta' });
  const alternates = localizedAlternates('/confidentialite', locale);
  return {
    title: t('title'),
    description: t('description'),
    alternates,
    openGraph: { title: t('title'), description: t('description'), url: alternates.canonical, locale: ogLocale(locale), type: 'article', siteName: 'Godet', images: await ogImages(locale) },
  };
}

/** Date de la dernière mise à jour de la politique (à changer avec le texte). */
const UPDATED = '2026-10-20';

const DATA = ['account', 'fleet', 'media', 'location', 'journal', 'contact', 'ideas', 'reminders', 'ai', 'prospects', 'technical'] as const;
const PURPOSES = ['service', 'emails', 'contact', 'prospecting', 'security'] as const;
const PROCESSORS = ['supabase', 'vercel', 'email', 'stripe', 'anthropic'] as const;
const RIGHTS = ['access', 'rectify', 'erase', 'portability', 'restrict', 'consent'] as const;

export default async function ConfidentialitePage({ params }: { params: LocaleParams }) {
  const locale = checkLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'legal' });
  const updated = new Intl.DateTimeFormat(htmlLang(locale), { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${UPDATED}T12:00:00Z`),
  );

  // Balises des textes : mise en valeur et liens (formulaire de contact, site du studio, paramètres).
  const tags = {
    strong: (chunks: React.ReactNode) => <strong>{chunks}</strong>,
    contact: (chunks: React.ReactNode) => (
      <Link className="s-link" href="/contact">
        {chunks}
      </Link>
    ),
    studio: (chunks: React.ReactNode) => (
      <a className="s-link" href={STUDIO_URL}>
        {chunks}
      </a>
    ),
    reminders: (chunks: React.ReactNode) => (
      <Link className="s-link" href="/parametres#rappels">
        {chunks}
      </Link>
    ),
    account: (chunks: React.ReactNode) => (
      <Link className="s-link" href="/parametres#compte">
        {chunks}
      </Link>
    ),
  };

  let n = 0;
  const num = () => String(++n).padStart(2, '0');

  return (
    <div className="s-page">
      <SkipLink />
      <SiteHeader current="confidentialite" />
      <main id="contenu" className="s-main s-legal">
        <div className="s-wrap">
          <article className="s-legal-inner">
            <p className="eyebrow">{t('eyebrow')}</p>
            <h1>{t('title')}</h1>
            <p className="s-legal-date">{t('updated', { date: updated })}</p>
            <p className="s-legal-intro">{t('intro')}</p>

            <h2>
              <span>{num()}</span> {t('controller.title')}
            </h2>
            <p>{t.rich('controller.text', tags)}</p>
            <p>{t('controller.customer')}</p>

            <h2>
              <span>{num()}</span> {t('data.title')}
            </h2>
            <ul>
              {DATA.map((key) => (
                <li key={key}>{t.rich(`data.items.${key}`, tags)}</li>
              ))}
            </ul>
            <p>{t('data.demo')}</p>

            <h2>
              <span>{num()}</span> {t('purposes.title')}
            </h2>
            <ul>
              {PURPOSES.map((key) => (
                <li key={key}>{t(`purposes.items.${key}`)}</li>
              ))}
            </ul>
            <p>{t('purposes.basis')}</p>
            <p>{t('purposes.noSale')}</p>

            <h2 id="prospection">
              <span>{num()}</span> {t('prospecting.title')}
            </h2>
            <p>{t('prospecting.text')}</p>
            <div className="s-legal-box">
              <p>{t.rich('prospecting.object', tags)}</p>
            </div>

            <h2>
              <span>{num()}</span> {t('reminders.title')}
            </h2>
            <p>{t.rich('reminders.text', tags)}</p>

            <h2>
              <span>{num()}</span> {t('cookies.title')}
            </h2>
            <p>{t('cookies.text')}</p>

            <h2>
              <span>{num()}</span> {t('processors.title')}
            </h2>
            <ul>
              {PROCESSORS.map((key) => (
                <li key={key}>{t.rich(`processors.items.${key}`, tags)}</li>
              ))}
            </ul>
            <p>{t('processors.transfers')}</p>

            <h2>
              <span>{num()}</span> {t('security.title')}
            </h2>
            <p>{t('security.text')}</p>
            <p>
              <Link className="s-link" href="/securite">
                {t('securityPage.title')}
              </Link>
            </p>

            <h2>
              <span>{num()}</span> {t('retention.title')}
            </h2>
            <p>{t('retention.account')}</p>
            <p>{t('retention.messages')}</p>

            <h2>
              <span>{num()}</span> {t('rights.title')}
            </h2>
            <p>{t('rights.intro')}</p>
            <ul>
              {RIGHTS.map((key) => (
                <li key={key}>{t(`rights.items.${key}`)}</li>
              ))}
            </ul>
            <div className="s-legal-box">
              <p>{t.rich('rights.box', tags)}</p>
            </div>

            <h2>
              <span>{num()}</span> {t('changes.title')}
            </h2>
            <p>{t('changes.text')}</p>
          </article>
        </div>
      </main>
      <SiteFooter current="confidentialite" />
    </div>
  );
}

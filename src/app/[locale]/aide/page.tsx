import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { Icon } from '@/components/Icons';
import { RENTAL_STEPS, START_STEPS, TASKS, guidePdf } from '@/components/site/aide/content';
import { InstallGuide } from '@/components/site/aide/InstallGuide';
import { checkLocale, metaLocale, ogImages, ogLocale, type LocaleParams } from '@/components/site/seo';
import { SiteFooter, SiteHeader, SkipLink } from '@/components/site/SiteChrome';
import { localizedAlternates } from '@/i18n/metadata';
import { pickMessages, type AppMessages } from '@/i18n/messages';
import { Link } from '@/i18n/navigation';

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = metaLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'help.meta' });
  const alternates = localizedAlternates('/aide', locale);
  return {
    title: t('title'),
    description: t('description'),
    alternates,
    openGraph: { title: t('title'), description: t('description'), url: alternates.canonical, locale: ogLocale(locale), type: 'article', siteName: 'Godet', images: await ogImages(locale) },
  };
}

export default async function AidePage({ params }: { params: LocaleParams }) {
  const locale = checkLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'help' });
  const messages = (await getMessages()) as unknown as AppMessages;
  const tags = {
    contact: (chunks: React.ReactNode) => (
      <Link className="s-link" href="/contact">
        {chunks}
      </Link>
    ),
    ideas: (chunks: React.ReactNode) => (
      <Link className="s-link" href="/idees">
        {chunks}
      </Link>
    ),
  };

  return (
    <div className="s-page">
      <SkipLink />
      <SiteHeader current="aide" />
      <main id="contenu" className="s-main s-legal s-help">
        <div className="s-wrap">
          <article className="s-legal-inner">
            <p className="eyebrow">{t('eyebrow')}</p>
            <h1>{t('title')}</h1>
            <p className="s-legal-intro">{t('intro')}</p>

            <nav className="s-help-toc" aria-label={t('toc.label')}>
              <a href="#demarrer">{t('toc.start')}</a>
              <a href="#installer">{t('toc.install')}</a>
              <a href="#quotidien">{t('toc.tasks')}</a>
              <a href="#location">{t('toc.rental')}</a>
              <a href="#contact">{t('toc.contact')}</a>
            </nav>

            <div className="s-help-pdf">
              <Icon name="file" />
              <div>
                <b>{t('pdf.title')}</b>
                <p>{t('pdf.text')}</p>
              </div>
              <a className="btn btn-soft s-btn-sm" href={guidePdf(locale)} download>
                <Icon name="download" />
                {t('pdf.button')}
              </a>
            </div>

            <h2 id="demarrer">{t('start.title')}</h2>
            <ol className="s-help-steps">
              {START_STEPS.map((key, i) => (
                <li key={key}>
                  <span className="s-help-num" aria-hidden="true">
                    {i + 1}
                  </span>
                  <div>
                    <h3>{t(`start.steps.${key}.title`)}</h3>
                    <p>{t(`start.steps.${key}.text`)}</p>
                  </div>
                </li>
              ))}
            </ol>

            <h2 id="installer">{t('install.title')}</h2>
            <p>{t('install.intro')}</p>
            <NextIntlClientProvider locale={locale} messages={pickMessages(messages, ['help'])}>
              <InstallGuide />
            </NextIntlClientProvider>

            <h2 id="quotidien">{t('tasks.title')}</h2>
            <div className="s-help-faq">
              {TASKS.map((key) => (
                <details key={key}>
                  <summary>{t(`tasks.items.${key}.q`)}</summary>
                  <p>{t(`tasks.items.${key}.a`)}</p>
                </details>
              ))}
            </div>

            <h2 id="location">{t('rental.title')}</h2>
            <p>{t('rental.intro')}</p>
            <ol className="s-help-steps">
              {RENTAL_STEPS.map((key, i) => (
                <li key={key}>
                  <span className="s-help-num" aria-hidden="true">
                    {i + 1}
                  </span>
                  <div>
                    <h3>{t(`rental.steps.${key}.title`)}</h3>
                    <p>{t(`rental.steps.${key}.text`)}</p>
                  </div>
                </li>
              ))}
            </ol>

            <h2 id="contact">{t('contact.title')}</h2>
            <div className="s-legal-box">
              <p>{t.rich('contact.text', tags)}</p>
            </div>
          </article>
        </div>
      </main>
      <SiteFooter current="aide" />
    </div>
  );
}

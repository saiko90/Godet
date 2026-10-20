import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Icon, type IconName } from '@/components/Icons';
import { currencyFor } from '@/components/site/countries';
import { HeroStage } from '@/components/site/HeroStage';
import { HERO_IMAGE, heroImageAvailable } from '@/components/site/hero-image';
import { RefTracker } from '@/components/site/RefTracker';
import { checkLocale, metaLocale, ogLocale, type LocaleParams } from '@/components/site/seo';
import { SiteFooter, SiteHeader, SkipLink } from '@/components/site/SiteChrome';
import { SiteIcon, type SiteIconName } from '@/components/site/SiteIcons';
import { Link } from '@/i18n/navigation';
import { localizedAlternates } from '@/i18n/metadata';
import type { AppLocale } from '@/i18n/routing';
import { makeFormat } from '@/lib/format';

// Page générée au déploiement (une par langue) : rapide, et la présence de l'image du héros y est vérifiée une fois.
// Le code de suivi ?ref= est traité dans le navigateur (RefTracker) pour que la page reste statique.
export const dynamic = 'force-static';

const hasHero = heroImageAvailable();

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = metaLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'site.meta' });
  const alternates = localizedAlternates('/', locale);
  return {
    title: { absolute: t('title') },
    description: t('description'),
    alternates,
    openGraph: {
      title: t('title'),
      description: t('ogDescription'),
      url: alternates.canonical,
      locale: ogLocale(locale),
      type: 'website',
      siteName: 'Godet',
      ...(hasHero ? { images: [{ url: HERO_IMAGE, width: 1600, height: 900, alt: t('ogImageAlt') }] } : {}),
    },
  };
}

const PAINS = [
  { key: 'paper', icon: 'file' },
  { key: 'invoices', icon: 'search' },
  { key: 'checks', icon: 'calendar' },
  { key: 'costs', icon: 'chf' },
] as const satisfies readonly { key: string; icon: IconName }[];

const FEATURES = [
  { key: 'log', icon: 'list' },
  { key: 'dues', icon: 'clock' },
  { key: 'costs', icon: 'chf' },
  { key: 'media', icon: 'camera' },
  { key: 'team', icon: 'users' },
  { key: 'workshop', icon: 'wrench' },
  { key: 'print', icon: 'print' },
  { key: 'showroom', icon: 'cube' },
] as const satisfies readonly { key: string; icon: IconName }[];

const PROOFS = [
  { key: 'kept', icon: 'archive' },
  { key: 'journal', icon: 'list' },
  { key: 'archive', icon: 'shield' },
] as const satisfies readonly { key: string; icon: IconName }[];

const LOCAL = [
  { key: 'formats', icon: 'pin' },
  { key: 'language', icon: 'language' },
  { key: 'hosting', icon: 'database' },
  { key: 'access', icon: 'lock' },
] as const satisfies readonly { key: string; icon: SiteIconName }[];

const FAQ = ['install', 'threeD', 'data', 'erase', 'export', 'languages', 'trial'] as const;

/** Pays dont les formats sont montrés en exemple, selon le public de chaque langue. */
const MARKETS: Record<AppLocale, readonly ('CH' | 'FR' | 'DE' | 'IT' | 'GB')[]> = {
  fr: ['CH', 'FR'],
  de: ['CH', 'DE'],
  it: ['CH', 'IT'],
  en: ['CH', 'GB'],
};

export default async function HomePage({ params }: { params: LocaleParams }) {
  const locale = checkLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'site.home' });
  const tc = await getTranslations({ locale, namespace: 'common' });

  // Exemples de formats calculés avec les règles de l'application (6’842 h, CHF 1’240, 1.240 €…).
  const formats = MARKETS[locale].map((country) => {
    const f = makeFormat({ locale, country, currency: currencyFor(country) });
    return { country, label: tc(`countries.${country}`), values: [f.hours(6842), f.money(1240), f.date('2026-08-14')] };
  });

  return (
    <div className="s-page">
      <SkipLink />
      <RefTracker path="/" />
      <SiteHeader anchors />
      <main id="contenu" className="s-main">
        {/* ---------- héros ---------- */}
        <section className="s-hero" aria-labelledby="titre">
          <div className="s-wrap">
            <p className="s-kicker">
              <i aria-hidden="true" />
              {t('hero.kicker')}
            </p>
            <h1 id="titre">{t.rich('hero.title', { em: (chunks) => <em>{chunks}</em> })}</h1>
            <p className="s-lead">{t('hero.lead')}</p>
            <div className="s-cta">
              <Link href="/demo" className="btn btn-primary">
                <Icon name="cube" />
                {t('hero.demo')}
              </Link>
              <Link href={{ pathname: '/connexion', query: { mode: 'inscription' } }} className="btn btn-ghost">
                {t('hero.signup')}
                <SiteIcon name="arrow-right" />
              </Link>
            </div>
            <p className="s-hero-login">
              {t('hero.hasAccount')}{' '}
              <Link href="/connexion" className="s-link">
                {t('hero.login')}
              </Link>
            </p>
            <ul className="s-assure">
              <li>
                <Icon name="check" />
                {t('hero.assure.trial')}
              </li>
              <li>
                <Icon name="check" />
                {t('hero.assure.card')}
              </li>
              <li>
                <Icon name="check" />
                {t('hero.assure.hosting')}
              </li>
            </ul>
            <HeroStage image={hasHero ? HERO_IMAGE : null} />
          </div>
        </section>

        {/* ---------- le problème ---------- */}
        <section className="s-section" aria-labelledby="titre-probleme" id="probleme">
          <div className="s-wrap">
            <div className="s-head">
              <p className="eyebrow">{t('problem.eyebrow')}</p>
              <h2 className="s-h2" id="titre-probleme">
                {t('problem.title')}
              </h2>
              <p>{t('problem.text')}</p>
            </div>
            <div className="s-grid s-grid-4">
              {PAINS.map((p) => (
                <article key={p.key} className="s-card s-pain">
                  <span className="s-ico s-ico-dim">
                    <Icon name={p.icon} />
                  </span>
                  <h3>{t(`problem.items.${p.key}.title`)}</h3>
                  <p>{t(`problem.items.${p.key}.text`)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- ce que fait Godet ---------- */}
        <section className="s-section s-section-line" aria-labelledby="titre-fonctions" id="fonctions">
          <div className="s-wrap">
            <div className="s-head">
              <p className="eyebrow">{t('features.eyebrow')}</p>
              <h2 className="s-h2" id="titre-fonctions">
                {t('features.title')}
              </h2>
              <p>{t('features.text')}</p>
            </div>
            <div className="s-grid s-grid-4">
              {FEATURES.map((f) => (
                <article key={f.key} className="s-card">
                  <span className="s-ico">
                    <Icon name={f.icon} />
                  </span>
                  <h3>{t(`features.items.${f.key}.title`)}</h3>
                  <p>{t(`features.items.${f.key}.text`)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- conformité ---------- */}
        <section className="s-section s-section-line" aria-labelledby="titre-conformite" id="conformite">
          <div className="s-wrap">
            <div className="s-head">
              <p className="eyebrow">{t('compliance.eyebrow')}</p>
              <h2 className="s-h2" id="titre-conformite">
                {t('compliance.title')}
              </h2>
            </div>
            <div className="s-split">
              <figure className="s-quote">
                <span className="s-law-mark">{t('compliance.lawMark')}</span>
                <blockquote>
                  <span aria-hidden="true">{t('compliance.quoteOpen')}</span>
                  {t('compliance.quote')}
                  <span aria-hidden="true">{t('compliance.quoteClose')}</span>
                </blockquote>
                <figcaption>{t('compliance.caption')}</figcaption>
              </figure>
              <div>
                <ul className="s-checks">
                  {PROOFS.map((p) => (
                    <li key={p.key}>
                      <span className="s-ico">
                        <Icon name={p.icon} />
                      </span>
                      <div>
                        <h3>{t(`compliance.proofs.${p.key}.title`)}</h3>
                        <p>{t(`compliance.proofs.${p.key}.text`)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="s-note">{t('compliance.note')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- pensé pour la Suisse (et adapté à chaque public) ---------- */}
        <section className="s-section s-section-line" aria-labelledby="titre-suisse" id="suisse">
          <div className="s-wrap">
            <div className="s-head">
              <p className="eyebrow">{t('local.eyebrow')}</p>
              <h2 className="s-h2" id="titre-suisse">
                {t('local.title')}
              </h2>
              <p>{t('local.text')}</p>
            </div>
            <div className="s-grid s-grid-4">
              {LOCAL.map((s) => (
                <article key={s.key} className="s-card">
                  <span className="s-ico">
                    <SiteIcon name={s.icon} />
                  </span>
                  <h3>{t(`local.items.${s.key}.title`)}</h3>
                  {s.key === 'formats' ? (
                    <dl className="s-format-rows" aria-label={t('local.formatsLabel')}>
                      {formats.map((row) => (
                        <div key={row.country}>
                          <dt>{row.label}</dt>
                          <dd>
                            <ul className="s-formats">
                              {row.values.map((v) => (
                                <li key={v}>{v}</li>
                              ))}
                            </ul>
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                  <p>{t(`local.items.${s.key}.text`)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- tarif ---------- */}
        <section className="s-section s-section-line" aria-labelledby="titre-tarif" id="tarif">
          <div className="s-wrap">
            <div className="s-price">
              <p className="eyebrow">{t('pricing.eyebrow')}</p>
              <h2 className="s-price-big" id="titre-tarif">
                {t('pricing.title')}
              </h2>
              <p>{t('pricing.text')}</p>
              <div className="s-cta">
                <Link href={{ pathname: '/connexion', query: { mode: 'inscription' } }} className="btn btn-primary">
                  {t('hero.signup')}
                  <SiteIcon name="arrow-right" />
                </Link>
                <Link href="/demo" className="btn btn-ghost">
                  <Icon name="cube" />
                  {t('hero.demo')}
                </Link>
              </div>
              <small>{t('pricing.small')}</small>
            </div>
          </div>
        </section>

        {/* ---------- questions ---------- */}
        <section className="s-section s-section-line" aria-labelledby="titre-faq" id="questions">
          <div className="s-wrap">
            <div className="s-head s-head-center">
              <p className="eyebrow">{t('faq.eyebrow')}</p>
              <h2 className="s-h2" id="titre-faq">
                {t('faq.title')}
              </h2>
            </div>
            <div className="s-faq">
              {FAQ.map((key) => (
                <details key={key}>
                  <summary>
                    {t(`faq.items.${key}.q`)}
                    <Icon name="plus" />
                  </summary>
                  <p className="s-faq-a">{t(`faq.items.${key}.a`)}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- appel final ---------- */}
        <section className="s-section s-section-line s-final-section" aria-labelledby="titre-final">
          <div className="s-wrap s-final">
            <h2 className="s-h2" id="titre-final">
              {t('final.title')}
            </h2>
            <p>{t('final.text')}</p>
            <div className="s-cta">
              <Link href="/demo" className="btn btn-primary">
                <Icon name="cube" />
                {t('hero.demo')}
              </Link>
              <Link href={{ pathname: '/connexion', query: { mode: 'inscription' } }} className="btn btn-ghost">
                {t('hero.signup')}
              </Link>
            </div>
            <p className="s-final-contact">
              {t.rich('final.contact', {
                link: (chunks) => (
                  <Link href={{ pathname: '/contact', query: { sujet: 'demo' } }} className="s-link">
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

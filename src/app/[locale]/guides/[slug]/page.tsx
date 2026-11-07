// Guide (page de contenu pour le référencement) : sujet du métier, réponse claire, liens vers la démo et l'essai.
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Icon } from '@/components/Icons';
import { JsonLd } from '@/components/site/JsonLd';
import { plainText, RichText } from '@/components/site/guides/RichText';
import { localizePath } from '@/components/site/nav';
import { checkLocale, metaLocale, ogImages, ogLocale } from '@/components/site/seo';
import { SiteFooter, SiteHeader, SkipLink, STUDIO_ORG_ID, STUDIO_URL } from '@/components/site/SiteChrome';
import { GUIDES, guideBySlug, guideParams, guidePath } from '@/content/guides';
import { Link } from '@/i18n/navigation';
import { routing, type AppLocale } from '@/i18n/routing';
import { siteUrl } from '@/lib/env';
import { makeFormat } from '@/lib/format';

type Params = Promise<{ locale: string; slug: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return guideParams();
}

function alternatesFor(id: string, locale: AppLocale) {
  const guide = GUIDES.find((g) => g.id === id)!;
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = localizePath(guidePath(guide, l), l);
  languages['x-default'] = localizePath(guidePath(guide, routing.defaultLocale), routing.defaultLocale);
  return { canonical: localizePath(guidePath(guide, locale), locale), languages };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = metaLocale(raw);
  const guide = guideBySlug(locale, slug);
  if (!guide) return {};
  const c = guide.content[locale];
  const alternates = alternatesFor(guide.id, locale);
  return {
    title: { absolute: c.metaTitle },
    description: c.description,
    alternates,
    openGraph: {
      title: c.metaTitle,
      description: c.description,
      url: alternates.canonical,
      locale: ogLocale(locale),
      type: 'article',
      siteName: 'Godet',
      images: await ogImages(locale),
      publishedTime: guide.published ?? guide.updated,
      modifiedTime: guide.updated,
    },
  };
}

const anchor = (i: number) => `partie-${i + 1}`;

export default async function GuidePage({ params }: { params: Params }) {
  const { locale: raw, slug } = await params;
  const locale = checkLocale(raw);
  setRequestLocale(locale);
  const guide = guideBySlug(locale, slug);
  if (!guide) notFound();
  const c = guide.content[locale];
  const t = await getTranslations({ locale, namespace: 'site.guides' });
  const f = makeFormat({ locale, country: 'CH', currency: 'CHF' });
  const base = siteUrl();
  const url = `${base}${localizePath(guidePath(guide, locale), locale)}`;
  const related = GUIDES.filter((g) => g.id !== guide.id);
  const half = Math.ceil(c.sections.length / 2);
  const images = (await ogImages(locale)).map((i) => `${base}${i.url}`);

  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: c.h1,
      description: c.description,
      inLanguage: locale,
      datePublished: guide.published ?? guide.updated,
      dateModified: guide.updated,
      image: images,
      mainEntityOfPage: url,
      author: { '@type': 'Organization', '@id': STUDIO_ORG_ID, name: 'Swiss Digital Studio', url: STUDIO_URL },
      publisher: { '@type': 'Organization', name: 'Godet', url: base, logo: { '@type': 'ImageObject', url: `${base}/icons/icon-512.png` } },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: t('home'), item: `${base}${localizePath('/', locale)}` },
        { '@type': 'ListItem', position: 2, name: t('guides'), item: `${base}${localizePath('/guides', locale)}` },
        { '@type': 'ListItem', position: 3, name: c.h1, item: url },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: c.faq.map((q) => ({ '@type': 'Question', name: q.q, acceptedAnswer: { '@type': 'Answer', text: plainText(q.a) } })),
    },
  ];

  const cta = (
    <aside className="s-legal-box s-guide-cta" aria-label={t('ctaTitle')}>
      <p>
        <strong>{t('ctaTitle')}</strong> {t('ctaText')}
      </p>
      <div className="s-guide-cta-row">
        <Link href="/demo" className="btn btn-primary">
          <Icon name="cube" />
          {t('ctaDemo')}
        </Link>
        <Link href={{ pathname: '/connexion', query: { mode: 'inscription' } }} className="btn btn-ghost">
          {t('ctaSignup')}
        </Link>
      </div>
    </aside>
  );

  return (
    <div className="s-page">
      <SkipLink />
      <SiteHeader paths={Object.fromEntries(routing.locales.map((l) => [l, guidePath(guide, l)]))} />
      <JsonLd data={ld} />
      <main id="contenu" className="s-main s-legal s-gd">
        <div className="s-wrap">
          <article className="s-legal-inner">
            <nav className="s-crumbs" aria-label={t('breadcrumb')}>
              <Link href="/">{t('home')}</Link>
              <span aria-hidden="true">›</span>
              <Link href="/guides">{t('guides')}</Link>
            </nav>
            <p className="eyebrow">{t('eyebrow')}</p>
            <h1>{c.h1}</h1>
            <p className="s-legal-date">{t('updated', { date: f.date(guide.updated) })}</p>
            <p className="s-legal-intro">
              <RichText text={c.lead} />
            </p>

            <nav className="s-help-toc s-guide-toc" aria-label={t('toc')}>
              {c.sections.map((s, i) => (
                <a key={i} href={`#${anchor(i)}`}>
                  {s.h2}
                </a>
              ))}
              <a href="#questions">{t('faqTitle')}</a>
            </nav>

            {c.sections.map((s, i) => (
              <section key={i} aria-labelledby={anchor(i)}>
                <h2 id={anchor(i)}>{s.h2}</h2>
                {s.paragraphs.map((p, j) => (
                  <p key={j}>
                    <RichText text={p} />
                  </p>
                ))}
                {s.table ? (
                  <div className="s-table-wrap">
                    <table>
                      <caption>{s.table.caption}</caption>
                      <thead>
                        <tr>
                          {s.table.head.map((h, j) => (
                            <th key={j} scope="col">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {s.table.rows.map((row, j) => (
                          <tr key={j}>
                            {row.map((cell, k) =>
                              k === 0 ? (
                                <th key={k} scope="row">
                                  <RichText text={cell} />
                                </th>
                              ) : (
                                <td key={k}>
                                  <RichText text={cell} />
                                </td>
                              ),
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
                {s.bullets?.length ? (
                  <ul>
                    {s.bullets.map((b, j) => (
                      <li key={j}>
                        <RichText text={b} />
                      </li>
                    ))}
                  </ul>
                ) : null}
                {i === half - 1 ? cta : null}
              </section>
            ))}

            <section aria-labelledby="questions">
              <h2 id="questions">{t('faqTitle')}</h2>
              <div className="s-faq s-guide-faq">
                {c.faq.map((q, i) => (
                  <details key={i}>
                    <summary>
                      {q.q}
                      <Icon name="plus" />
                    </summary>
                    <p className="s-faq-a">
                      <RichText text={q.a} />
                    </p>
                  </details>
                ))}
              </div>
            </section>

            {cta}

            <section aria-labelledby="a-lire">
              <h2 id="a-lire">{t('related')}</h2>
              <ul className="s-guide-list">
                {related.map((g) => (
                  <li key={g.id}>
                    <Link href={guidePath(g, locale)}>{g.content[locale].h1}</Link>
                  </li>
                ))}
              </ul>
            </section>
          </article>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

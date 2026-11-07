// Page des guides : tous les sujets, avec un lien par guide (maillage interne).
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { JsonLd } from '@/components/site/JsonLd';
import { RichText } from '@/components/site/guides/RichText';
import { localizePath } from '@/components/site/nav';
import { checkLocale, metaLocale, ogImages, ogLocale, type LocaleParams } from '@/components/site/seo';
import { SiteFooter, SiteHeader, SkipLink } from '@/components/site/SiteChrome';
import { GUIDES, guidePath } from '@/content/guides';
import { localizedAlternates } from '@/i18n/metadata';
import { Link } from '@/i18n/navigation';
import { siteUrl } from '@/lib/env';

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = metaLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'site.guides' });
  const alternates = localizedAlternates('/guides', locale);
  return {
    title: t('hubMetaTitle'),
    description: t('hubDescription'),
    alternates,
    openGraph: {
      title: t('hubMetaTitle'),
      description: t('hubDescription'),
      url: alternates.canonical,
      locale: ogLocale(locale),
      type: 'website',
      siteName: 'Godet',
      images: await ogImages(locale),
    },
  };
}

export default async function GuidesPage({ params }: { params: LocaleParams }) {
  const locale = checkLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'site.guides' });
  const base = siteUrl();
  const url = `${base}${localizePath('/guides', locale)}`;
  // Données structurées : page de collection, liste des guides (un élément par guide) et fil d'Ariane.
  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: t('hubTitle'),
      description: t('hubDescription'),
      url,
      inLanguage: locale,
      isPartOf: { '@type': 'WebSite', name: 'Godet', url: base },
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: GUIDES.map((g, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${base}${localizePath(guidePath(g, locale), locale)}`,
          name: g.content[locale].h1,
        })),
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: t('home'), item: `${base}${localizePath('/', locale)}` },
        { '@type': 'ListItem', position: 2, name: t('guides'), item: url },
      ],
    },
  ];
  return (
    <div className="s-page">
      <SkipLink />
      <SiteHeader />
      <JsonLd data={ld} />
      <main id="contenu" className="s-main s-legal s-gd">
        <div className="s-wrap">
          <article className="s-legal-inner">
            <p className="eyebrow">{t('guides')}</p>
            <h1>{t('hubTitle')}</h1>
            <p className="s-legal-intro">{t('hubLead')}</p>
            <p>{t('hubIntro')}</p>
            <ul className="s-guide-cards">
              {GUIDES.map((g) => {
                const c = g.content[locale];
                return (
                  <li key={g.id}>
                    <Link href={guidePath(g, locale)} className="s-guide-card">
                      <b>{c.h1}</b>
                      <span>
                        <RichText text={c.description} />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </article>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

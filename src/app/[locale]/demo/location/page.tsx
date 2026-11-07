// Démonstration de l'option Location : agenda du parc d'exemple (rien n'est envoyé).
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { FormatProvider } from '@/components/FormatProvider';
import { DemoAgenda } from '@/components/site/location/demo';
import { RefTracker } from '@/components/site/RefTracker';
import { checkLocale, metaLocale, ogImages, ogLocale } from '@/components/site/seo';
import { localizedAlternates } from '@/i18n/metadata';
import { SiteHeader, SkipLink } from '@/components/site/SiteChrome';
import { nowMs } from '@/lib/clock';

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const locale = metaLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'rental' });
  const tm = await getTranslations({ locale, namespace: 'demo.meta' });
  const alternates = localizedAlternates('/demo/location', locale);
  const title = tm('locationTitle');
  return {
    title,
    description: t('demo.metaDescription'),
    alternates,
    openGraph: { title, description: t('demo.metaDescription'), url: alternates.canonical, locale: ogLocale(locale), type: 'website', siteName: 'Godet', images: await ogImages(locale) },
  };
}

export default async function DemoLocationPage({ params }: { params: Params }) {
  const locale = checkLocale((await params).locale);
  setRequestLocale(locale);
  const tm = await getTranslations({ locale, namespace: 'demo.meta' });
  return (
    <div className="s-page">
      <SkipLink />
      <SiteHeader />
      <main id="contenu" className="s-wrap s-rent">
        {/* Titre de la page pour Google et les lecteurs d'écran ; l'agenda (rendu dans le navigateur) garde son titre visible en h2. */}
        <h1 className="s-sr">{tm('locationTitle')}</h1>
        <FormatProvider locale={locale} country="CH" currency="CHF">
          <DemoAgenda nowIso={new Date(nowMs()).toISOString()} />
        </FormatProvider>
      </main>
      <RefTracker path="/demo/location" />
    </div>
  );
}

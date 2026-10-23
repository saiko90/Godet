// Démonstration de l'option Location : agenda du parc d'exemple (rien n'est envoyé).
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { FormatProvider } from '@/components/FormatProvider';
import { DemoAgenda } from '@/components/site/location/demo';
import { RefTracker } from '@/components/site/RefTracker';
import { checkLocale, metaLocale, ogLocale } from '@/components/site/seo';
import { localizedAlternates } from '@/i18n/metadata';
import { SiteHeader, SkipLink } from '@/components/site/SiteChrome';
import { nowMs } from '@/lib/clock';

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const locale = metaLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'rental' });
  const alternates = localizedAlternates('/demo/location', locale);
  const title = `${t('title')} · ${t('demo.label')}`;
  return {
    title,
    description: t('demo.metaDescription'),
    alternates,
    openGraph: { title, description: t('demo.metaDescription'), url: alternates.canonical, locale: ogLocale(locale), type: 'website', siteName: 'Godet' },
  };
}

export default async function DemoLocationPage({ params }: { params: Params }) {
  const locale = checkLocale((await params).locale);
  setRequestLocale(locale);
  return (
    <div className="s-page">
      <SkipLink />
      <SiteHeader />
      <main id="contenu" className="s-wrap s-rent">
        <FormatProvider locale={locale} country="CH" currency="CHF">
          <DemoAgenda nowIso={new Date(nowMs()).toISOString()} />
        </FormatProvider>
      </main>
      <RefTracker path="/demo/location" />
    </div>
  );
}

// Démonstration de l'option Location : agenda du parc d'exemple (rien n'est envoyé).
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { FormatProvider } from '@/components/FormatProvider';
import { DemoAgenda } from '@/components/site/location/demo';
import { RefTracker } from '@/components/site/RefTracker';
import { checkLocale, metaLocale, NO_INDEX } from '@/components/site/seo';
import { SiteHeader, SkipLink } from '@/components/site/SiteChrome';
import { nowMs } from '@/lib/clock';

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: metaLocale(locale), namespace: 'rental' });
  return { title: `${t('title')} · ${t('demo.label')}`, robots: NO_INDEX };
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

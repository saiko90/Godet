// Démonstration : état des lieux de départ ou de retour d'une location d'exemple.
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { FormatProvider } from '@/components/FormatProvider';
import { DemoCheck } from '@/components/site/location/demo';
import { checkLocale, metaLocale, NO_INDEX } from '@/components/site/seo';
import { SiteHeader, SkipLink } from '@/components/site/SiteChrome';

type Params = Promise<{ locale: string; id: string; kind: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, kind } = await params;
  const t = await getTranslations({ locale: metaLocale(locale), namespace: 'rental' });
  return { title: `${kind === 'retour' ? t('check.titleIn') : t('check.titleOut')} · ${t('demo.label')}`, robots: NO_INDEX };
}

export default async function DemoCheckPage({ params }: { params: Params }) {
  const { locale: raw, id, kind } = await params;
  const locale = checkLocale(raw);
  setRequestLocale(locale);
  if (!/^demo-loc-[\w-]{1,40}$/.test(id) || (kind !== 'depart' && kind !== 'retour')) notFound();
  return (
    <div className="s-page">
      <SkipLink />
      <SiteHeader />
      <main id="contenu" className="s-wrap s-rent s-check-page">
        <FormatProvider locale={locale} country="CH" currency="CHF">
          <DemoCheck id={id} kind={kind} />
        </FormatProvider>
      </main>
    </div>
  );
}
